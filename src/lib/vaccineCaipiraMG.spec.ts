import { describe, expect, it } from 'vitest';
import type { AnimalRecord, HealthRecord } from '@/types';
import {
  buildCaipiraHealthRules,
  determineLTIRegionMG,
  generateVaccineReminders,
  generateTakeTestReminders,
  generateVermifugacaoReminders,
  buildProtocolErroZeroChecklist,
  addDaysToDate,
  VACCINE_SCHEDULE_CAIPIRA_MG,
} from '@/lib/vaccineCaipiraMG';

function createAnimal(partial: Partial<AnimalRecord> & { birthDate: string }): AnimalRecord {
  return {
    id: partial.id ?? 'animal-1',
    tag: partial.tag ?? 'Lote A',
    supplierId: partial.supplierId ?? '',
    lot: partial.lot ?? '',
    species: partial.species ?? 'Postura',
    purpose: partial.purpose ?? 'postura',
    breed: partial.breed ?? 'Isa Brown',
    quantity: partial.quantity ?? 100,
    currentQuantity: partial.currentQuantity ?? 100,
    totalPurchasePrice: partial.totalPurchasePrice ?? 1000,
    averageWeightKg: partial.averageWeightKg ?? 1.8,
    birthDate: partial.birthDate,
    status: partial.status ?? 'ativo',
    notes: partial.notes ?? '',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

describe('vaccineCaipiraMG', () => {
  describe('determineLTIRegionMG', () => {
    it('retorna terras_altas_mantiqueira para Itamonte/MG', () => {
      expect(determineLTIRegionMG('Itamonte', 'MG')).toBe('terras_altas_mantiqueira');
    });
    it('retorna terras_altas_mantiqueira para cidades acentuadas normalizadas', () => {
      expect(determineLTIRegionMG('Pouso Alto', 'Minas Gerais')).toBe('terras_altas_mantiqueira');
    });
    it('retorna sul_minas para Varginha', () => {
      expect(determineLTIRegionMG('Varginha', 'MG')).toBe('sul_minas');
    });
    it('retorna demais_regioes para cidade fora do mapping', () => {
      expect(determineLTIRegionMG('Belo Horizonte', 'MG')).toBe('demais_regioes');
    });
    it('retorna demais_regioes quando estado não é MG', () => {
      expect(determineLTIRegionMG('Itamonte', 'SP')).toBe('demais_regioes');
    });
    it('retorna demais_regioes quando cidade faltar', () => {
      expect(determineLTIRegionMG(undefined, 'MG')).toBe('demais_regioes');
    });
  });

  describe('buildCaipiraHealthRules', () => {
    it('ativa Bouba antecipada, Coccidiose, TakeTest e vermifugacao a cada 3 meses para pasto', () => {
      const rules = buildCaipiraHealthRules({ state: 'MG', city: 'Belo Horizonte', isPastureAccess: true });
      expect(rules.boubaAnticipada).toBe(true);
      expect(rules.coccidioseIncubatorio).toBe(true);
      expect(rules.takeTestObrigatorio).toBe(true);
      expect(rules.vermifugacaoIntervaloMeses).toBe(3);
      expect(rules.biosseguridadePiqueteDrenagem).toBe(true);
      expect(rules.ltiRecombinanteObrigatorio).toBe(false);
    });

    it('marca LTI obrigatório para região Terras Altas Mantiqueira em MG', () => {
      const rules = buildCaipiraHealthRules({ state: 'MG', city: 'Itanhandu', isPastureAccess: true });
      expect(rules.ltiRecombinanteObrigatorio).toBe(true);
      expect(rules.regiaoLTI).toBe('terras_altas_mantiqueira');
    });

    it('sem pasto: sem TakeTest e vermifugação a cada 4 meses', () => {
      const rules = buildCaipiraHealthRules({ state: 'SP', city: 'São Paulo', isPastureAccess: false });
      expect(rules.boubaAnticipada).toBe(false);
      expect(rules.takeTestObrigatorio).toBe(false);
      expect(rules.vermifugacaoIntervaloMeses).toBe(4);
      expect(rules.biosseguridadePiqueteDrenagem).toBe(false);
      expect(rules.ltiRecombinanteObrigatorio).toBe(false);
    });
  });

  describe('addDaysToDate', () => {
    it('adiciona dias corretamente', () => {
      expect(addDaysToDate('2026-01-01', 10)).toBe('2026-01-11');
    });
    it('suporta virada de mês', () => {
      expect(addDaysToDate('2026-01-25', 10)).toBe('2026-02-04');
    });
  });

  describe('VACCINE_SCHEDULE_CAIPIRA_MG', () => {
    it('contém ajuste Bouba antecipada para pasto (15-21 dias)', () => {
      const boubaForte = VACCINE_SCHEDULE_CAIPIRA_MG.find((v) => v.id === 'vac-day21-bouba-forte');
      expect(boubaForte).toBeDefined();
      expect(boubaForte!.ageMinDays).toBe(15);
      expect(boubaForte!.ageMaxDays).toBe(21);
      expect(boubaForte!.pastureCritical).toBe(true);
      expect(boubaForte!.adjustmentForCaipira).toMatch(/35 dias.*15-21/);
    });
    it('contém Bouba Suave no 1º dia (obrigatória para pasto)', () => {
      const d1 = VACCINE_SCHEDULE_CAIPIRA_MG.find((v) => v.id === 'vac-day1-marek-bouba-cocc');
      expect(d1!.vaccines).toContain('Bouba Aviária Suave');
      expect(d1!.targetAgeDays).toBe(1);
    });
    it('contém Coriza Aquosa 50 dias + Oleosa 120 dias', () => {
      expect(VACCINE_SCHEDULE_CAIPIRA_MG.find((v) => v.id === 'vac-day50-coriza-aquosa')).toBeDefined();
      expect(VACCINE_SCHEDULE_CAIPIRA_MG.find((v) => v.id === 'vac-day120-coriza-oleosa')).toBeDefined();
    });
    it('contém entrada LTI com flag de ajuste regional', () => {
      const lti = VACCINE_SCHEDULE_CAIPIRA_MG.find((v) => v.id === 'vac-day1-lti-terras-altas');
      expect(lti!.source).toBe('ima');
    });
  });

  describe('generateVaccineReminders', () => {
    it('gera lembretes para lote D-0 (hoje nascido) e regras pasto', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birth = today.toISOString().slice(0, 10);
      const animal = createAnimal({ id: 'a1', tag: 'Lote Novo', birthDate: birth });
      const rules = buildCaipiraHealthRules({ state: 'MG', city: 'Belo Horizonte', isPastureAccess: true });
      const reminders = generateVaccineReminders([animal], [], rules);
      expect(reminders.length).toBeGreaterThan(0);
      const boubaSuave = reminders.find((r) => r.scheduleEntryId === 'vac-day1-marek-bouba-cocc');
      expect(boubaSuave).toBeDefined();
      expect(boubaSuave!.vaccines).toContain('Bouba Aviária Suave');
    });

    it('inclui LTI obrigatório apenas em região de risco', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birth = today.toISOString().slice(0, 10);
      const animal = createAnimal({ id: 'a1', birthDate: birth });
      const rulesRisco = buildCaipiraHealthRules({ state: 'MG', city: 'Passa Quatro', isPastureAccess: true });
      const rulesNormal = buildCaipiraHealthRules({ state: 'MG', city: 'Belo Horizonte', isPastureAccess: true });
      const remRisco = generateVaccineReminders([animal], [], rulesRisco);
      const remNormal = generateVaccineReminders([animal], [], rulesNormal);
      expect(remRisco.some((r) => r.scheduleEntryId === 'vac-day1-lti-terras-altas')).toBe(true);
      expect(remNormal.some((r) => r.scheduleEntryId === 'vac-day1-lti-terras-altas')).toBe(false);
    });

    it('não duplica vacina já aplicada (ex: Bouba Suave D-1)', () => {
      const birth = '2026-01-01';
      const animal = createAnimal({ id: 'a1', birthDate: birth });
      const record: HealthRecord = {
        id: 'r1',
        occurredAt: '2026-01-01T08:00:00.000Z',
        procedureType: 'tratamento',
        animalId: 'a1',
        title: 'Vacina D-1',
        productName: 'Marek + Bouba Aviária Suave',
        treatmentType: 'vacina',
        notes: 'OK',
        recoveryStatus: 'recuperado',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const rules = buildCaipiraHealthRules({ isPastureAccess: true });
      const rems = generateVaccineReminders([animal], [record], rules);
      expect(rems.some((r) => r.scheduleEntryId === 'vac-day1-marek-bouba-cocc')).toBe(false);
    });

    it('marca vacinas atrasadas como status=atrasado priority=urgent para critico pasto', () => {
      const birth = '2025-01-01';
      const animal = createAnimal({ id: 'a1', birthDate: birth });
      const rules = buildCaipiraHealthRules({ isPastureAccess: true });
      const rems = generateVaccineReminders([animal], [], rules);
      const boubaForte = rems.find((r) => r.scheduleEntryId === 'vac-day21-bouba-forte');
      expect(boubaForte!.status).toBe('atrasado');
      expect(boubaForte!.priority).toBe('urgent');
    });
  });

  describe('generateTakeTestReminders', () => {
    it('gera lembrete Take 7 dias após Bouba aplicada na asa', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const applied = new Date(today);
      applied.setDate(applied.getDate() - 6);
      const birth = new Date(today);
      birth.setDate(birth.getDate() - 21);
      const animal = createAnimal({ id: 'a1', birthDate: birth.toISOString().slice(0, 10) });
      const record: HealthRecord = {
        id: 'r1',
        occurredAt: applied.toISOString(),
        procedureType: 'tratamento',
        animalId: 'a1',
        title: 'Bouba na asa',
        productName: 'Bouba Aviária Forte (punção na asa)',
        treatmentType: 'vacina',
        notes: '',
        recoveryStatus: 'recuperado',
        createdAt: applied.toISOString(),
      };
      const rules = buildCaipiraHealthRules({ isPastureAccess: true });
      const rems = generateTakeTestReminders([animal], [record], rules);
      expect(rems.length).toBe(1);
      expect(rems[0].daysUntil).toBe(1);
      expect(rems[0].status).toBe('pendente');
    });

    it('não gera TakeTest quando sistema não é pasto', () => {
      const today = new Date();
      const animal = createAnimal({ id: 'a1', birthDate: '2025-01-01' });
      const record: HealthRecord = {
        id: 'r1',
        occurredAt: today.toISOString(),
        procedureType: 'tratamento',
        animalId: 'a1',
        title: 'Bouba Forte',
        productName: 'Bouba Aviária Forte',
        treatmentType: 'vacina',
        notes: '',
        recoveryStatus: 'recuperado',
        createdAt: today.toISOString(),
      };
      const rules = buildCaipiraHealthRules({ isPastureAccess: false });
      expect(generateTakeTestReminders([animal], [record], rules)).toHaveLength(0);
    });
  });

  describe('generateVermifugacaoReminders', () => {
    it('gera vermifugação baseada no nascimento quando sem última aplicação, pasto a cada 3 meses, marca como proximo quando <=14 dias', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birth = new Date(today);
      birth.setMonth(birth.getMonth() - 2);
      birth.setDate(birth.getDate() - 20);
      const animal = createAnimal({ id: 'a1', birthDate: birth.toISOString().slice(0, 10) });
      const rules = buildCaipiraHealthRules({ isPastureAccess: true });
      const rems = generateVermifugacaoReminders([animal], [], rules);
      expect(rems.length).toBe(1);
      expect(rems[0].intervalMonths).toBe(3);
      expect(rems[0].status).toBe('proximo');
    });

    it('considera última vermifugação registrada', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const last = new Date(today);
      last.setMonth(last.getMonth() - 2);
      const animal = createAnimal({ id: 'a1', birthDate: '2025-01-01' });
      const vermifugo: HealthRecord = {
        id: 'v1',
        occurredAt: last.toISOString(),
        procedureType: 'tratamento',
        animalId: 'a1',
        title: 'Vermifugação',
        productName: 'Vermífugo XYZ',
        treatmentType: 'medicamento',
        notes: 'Aplicado na água',
        recoveryStatus: 'recuperado',
        createdAt: last.toISOString(),
      };
      const rules = buildCaipiraHealthRules({ isPastureAccess: true });
      const rems = generateVermifugacaoReminders([animal], [vermifugo], rules);
      expect(rems[0].daysUntil).toBeCloseTo(30, -1);
    });
  });

  describe('buildProtocolErroZeroChecklist', () => {
    it('marca items críticos para lote novo em pasto', () => {
      const today = new Date();
      const birth = new Date(today);
      birth.setDate(birth.getDate() - 10);
      const animal = createAnimal({ id: 'a1', birthDate: birth.toISOString().slice(0, 10) });
      const rules = buildCaipiraHealthRules({ state: 'MG', city: 'Itamonte', isPastureAccess: true });
      const checklist = buildProtocolErroZeroChecklist(animal, rules);
      expect(checklist.some((c) => c.id === 'p1-bouba-suave' && c.obrigatorio)).toBe(true);
      expect(checklist.some((c) => c.id === 'p3-coccidiose' && c.critico)).toBe(true);
      expect(checklist.some((c) => c.id === 'p4-lti' && c.obrigatorio)).toBe(true);
    });

    it('não marca LTI obrigatório fora de região', () => {
      const animal = createAnimal({ id: 'a1', birthDate: '2026-01-01' });
      const rules = buildCaipiraHealthRules({ state: 'MG', city: 'Belo Horizonte', isPastureAccess: true });
      const checklist = buildProtocolErroZeroChecklist(animal, rules);
      const lti = checklist.find((c) => c.id === 'p4-lti');
      expect(lti?.obrigatorio).toBe(false);
    });
  });
});
