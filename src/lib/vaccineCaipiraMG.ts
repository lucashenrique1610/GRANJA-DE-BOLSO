import {
  AnimalRecord,
  HealthRecord,
  VaccineScheduleEntry,
  CaipiraHealthRules,
  LtiRiskRegionMG,
  LTI_RISK_MUNICIPIOS_MG,
  ScheduledVaccineReminder,
  TakeTestReminder,
  VermifugacaoReminder,
  VaccineApplicationMethod,
} from '@/types';
import { getBirdAgeInDays } from './manejo';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const APPLICATION_METHOD_LABELS: Record<VaccineApplicationMethod, string> = {
  subcutanea: 'Subcutânea',
  spray: 'Spray',
  ocular: 'Gota no olho (Ocular)',
  agua_bebida: 'Água de bebida',
  puncao_asa: 'Punção na membrana da asa',
  intramuscular: 'Intramuscular',
};

export const CATEGORY_LABELS: Record<VaccineScheduleEntry['category'], string> = {
  incubatorio: 'Incubatório (1º dia)',
  cria: 'Cria (1 a 42 dias)',
  recria: 'Recria (43 a 119 dias)',
  pre_postura: 'Pré-postura (120 a 140 dias)',
  postura_adulta: 'Postura / Aves Adultas',
};

export const DOSE_LABELS: Record<string, string> = {
  unica: 'Dose única',
  primeira: '1ª dose',
  segunda: '2ª dose',
  reforco: 'Reforço',
  reforco_adulto: 'Reforço adulto (contínuo)',
};

export const VACCINE_SCHEDULE_CAIPIRA_MG: VaccineScheduleEntry[] = [
  {
    id: 'vac-day1-marek-bouba-cocc',
    ageMinDays: 1,
    ageMaxDays: 1,
    targetAgeDays: 1,
    vaccines: ['Marek', 'Bouba Aviária Suave'],
    applicationMethod: 'subcutanea',
    dose: 'unica',
    isObligatory: true,
    pastureCritical: true,
    notes: 'Exija do incubatório. Bouba Suave obrigatória no 1º dia para sistema caipira com pasto.',
    category: 'incubatorio',
    source: 'embrapa',
    adjustmentForCaipira: 'Bouba Suave antecipada do incubatório em vez de industrial aos 35 dias.',
  },
  {
    id: 'vac-day1-coccidiose-opt',
    ageMinDays: 1,
    ageMaxDays: 1,
    targetAgeDays: 1,
    vaccines: ['Coccidiose'],
    applicationMethod: 'spray',
    dose: 'unica',
    isObligatory: false,
    pastureCritical: true,
    notes: 'Recomendada para pasto. Se vacinada no 1º dia, NÃO usar ração com anticoccidiano na fase inicial.',
    category: 'incubatorio',
    source: 'embrapa',
    adjustmentForCaipira: 'Maior ameaça do pasto — ciscagem ingere oocistos no solo.',
  },
  {
    id: 'vac-day1-lti-terras-altas',
    ageMinDays: 1,
    ageMaxDays: 1,
    targetAgeDays: 1,
    vaccines: ['Laringotraqueíte Infecciosa (LTI) - recombinante HVT-LT'],
    applicationMethod: 'subcutanea',
    dose: 'unica',
    isObligatory: false,
    pastureCritical: false,
    notes: 'Obrigatória apenas na região das Terras Altas da Mantiqueira (IMA-MG). Verificar portaria local.',
    category: 'incubatorio',
    source: 'ima',
    adjustmentForCaipira: 'Portaria IMA específica para região sul de MG (Itamonte, Itanhandu, Passa Quatro, Pouso Alto).',
  },
  {
    id: 'vac-day7-10-newcastle-bronquite',
    ageMinDays: 7,
    ageMaxDays: 10,
    targetAgeDays: 8,
    vaccines: ['Newcastle', 'Bronquite Infecciosa'],
    applicationMethod: 'ocular',
    dose: 'primeira',
    isObligatory: true,
    pastureCritical: false,
    notes: 'Proteção respiratória inicial essencial.',
    category: 'cria',
    source: 'mapa',
  },
  {
    id: 'vac-day14-18-gumboro',
    ageMinDays: 14,
    ageMaxDays: 18,
    targetAgeDays: 16,
    vaccines: ['Gumboro'],
    applicationMethod: 'agua_bebida',
    dose: 'unica',
    isObligatory: true,
    pastureCritical: false,
    notes: 'Protege o sistema imunológico da ave.',
    category: 'cria',
    source: 'programa_nacional_sanidade_aviaria',
  },
  {
    id: 'vac-day21-bouba-forte',
    ageMinDays: 15,
    ageMaxDays: 21,
    targetAgeDays: 21,
    vaccines: ['Bouba Aviária Forte'],
    applicationMethod: 'puncao_asa',
    dose: 'reforco',
    isObligatory: true,
    pastureCritical: true,
    notes: 'Crucial para o pasto. Não espere até os 35 dias. Realizar teste "Take" 7 dias após aplicação.',
    category: 'cria',
    source: 'embrapa',
    adjustmentForCaipira: 'Antecipado de 35 dias para 15-21 dias devido à exposição a pernilongos no pasto.',
  },
  {
    id: 'vac-day35-newcastle-bronquite-2',
    ageMinDays: 33,
    ageMaxDays: 37,
    targetAgeDays: 35,
    vaccines: ['Newcastle', 'Bronquite Infecciosa'],
    applicationMethod: 'agua_bebida',
    dose: 'segunda',
    isObligatory: true,
    pastureCritical: false,
    notes: 'Reforço imunitário.',
    category: 'cria',
    source: 'programa_nacional_sanidade_aviaria',
  },
  {
    id: 'vac-day50-coriza-aquosa',
    ageMinDays: 48,
    ageMaxDays: 52,
    targetAgeDays: 50,
    vaccines: ['Coriza Infecciosa (Aquosa)'],
    applicationMethod: 'intramuscular',
    dose: 'primeira',
    isObligatory: true,
    pastureCritical: false,
    notes: 'Previne o "gogo" — comum no frio/umidade.',
    category: 'recria',
    source: 'mapa',
  },
  {
    id: 'vac-day70-newcastle-bronquite-3',
    ageMinDays: 68,
    ageMaxDays: 72,
    targetAgeDays: 70,
    vaccines: ['Newcastle', 'Bronquite Infecciosa'],
    applicationMethod: 'agua_bebida',
    dose: 'reforco',
    isObligatory: true,
    pastureCritical: false,
    notes: 'Consolidação da imunidade antes da postura.',
    category: 'recria',
    source: 'programa_nacional_sanidade_aviaria',
  },
  {
    id: 'vac-day100-encefalo-salmonela',
    ageMinDays: 98,
    ageMaxDays: 102,
    targetAgeDays: 100,
    vaccines: ['Encefalomielite Aviária', 'Salmonela'],
    applicationMethod: 'agua_bebida',
    dose: 'unica',
    isObligatory: true,
    pastureCritical: false,
    notes: 'Evita quedas súbitas de ovos no pico de postura.',
    category: 'pre_postura',
    source: 'mapa',
  },
  {
    id: 'vac-day120-coriza-oleosa',
    ageMinDays: 118,
    ageMaxDays: 122,
    targetAgeDays: 120,
    vaccines: ['Coriza Infecciosa (Oleosa)'],
    applicationMethod: 'intramuscular',
    dose: 'segunda',
    isObligatory: true,
    pastureCritical: false,
    notes: 'Garante imunidade duradoura para o ciclo longo.',
    category: 'pre_postura',
    source: 'mapa',
  },
];

export function determineLTIRegionMG(city?: string, state?: string): LtiRiskRegionMG {
  if (state && state.toUpperCase() !== 'MG' && state.toUpperCase() !== 'MINAS GERAIS') {
    return 'demais_regioes';
  }
  if (!city) return 'demais_regioes';
  const cidadeNormalizada = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matchRegiao = (municipios: string[]) =>
    municipios.some((m) =>
      m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === cidadeNormalizada
    );
  if (matchRegiao(LTI_RISK_MUNICIPIOS_MG.terras_altas_mantiqueira)) return 'terras_altas_mantiqueira';
  if (matchRegiao(LTI_RISK_MUNICIPIOS_MG.sul_minas)) return 'sul_minas';
  return 'demais_regioes';
}

export function buildCaipiraHealthRules(params: {
  state?: string;
  city?: string;
  isPastureAccess: boolean;
}): CaipiraHealthRules {
  const regiaoLTI = determineLTIRegionMG(params.city, params.state);
  const isMG =
    params.state &&
    (params.state.toUpperCase() === 'MG' || params.state.toUpperCase() === 'MINAS GERAIS');
  return {
    boubaAnticipada: params.isPastureAccess,
    ltiRecombinanteObrigatorio: isMG && regiaoLTI === 'terras_altas_mantiqueira',
    coccidioseIncubatorio: params.isPastureAccess,
    vermifugacaoIntervaloMeses: params.isPastureAccess ? 3 : 4,
    takeTestObrigatorio: params.isPastureAccess,
    biosseguridadePiqueteDrenagem: params.isPastureAccess,
    regiaoLTI,
  };
}

export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return dateStr;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  let d: Date;
  if (match) {
    d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0);
  } else {
    d = new Date(dateStr);
  }
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysUntilDate(targetDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(targetDate);
  let target: Date;
  if (match) {
    target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0);
  } else {
    target = new Date(targetDate);
  }
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY_IN_MS);
}

function isVaccineAlreadyApplied(
  animalId: string,
  entry: VaccineScheduleEntry,
  healthRecords: HealthRecord[],
): boolean {
  return healthRecords.some((r) => {
    if (r.animalId !== animalId) return false;
    if (r.procedureType !== 'tratamento' && r.procedureType !== 'vacina') return false;
    if (r.treatmentType && r.treatmentType !== 'vacina') return false;
    const recordName = (r.productName || r.vaccineName || r.title || '').toLowerCase();
    return entry.vaccines.some((v) => {
      const vLow = v.toLowerCase();
      if (vLow.includes('bouba') && vLow.includes('forte') && entry.id === 'vac-day21-bouba-forte') {
        return /bouba.*(forte|refor[cç]o)/i.test(recordName) || /bouba av[ií]ria (forte|2)/i.test(recordName);
      }
      if (vLow.includes('bouba') && entry.id === 'vac-day1-marek-bouba-cocc') {
        return /bouba.*suave/i.test(recordName);
      }
      if (vLow.includes('coriza') && /aquosa|1[aã]/.test(vLow) && entry.id === 'vac-day50-coriza-aquosa') {
        return /coriza.*(1|aquosa|primeira)/i.test(recordName);
      }
      if (vLow.includes('coriza') && /oleosa|2[aã]/.test(vLow) && entry.id === 'vac-day120-coriza-oleosa') {
        return /coriza.*(2|oleosa|segunda)/i.test(recordName);
      }
      if (vLow.includes('newcastle') || vLow.includes('bronquite')) {
        const patternMap: Record<string, RegExp> = {
          'vac-day7-10-newcastle-bronquite': /(1[aã]|primeira|1ª)/i,
          'vac-day35-newcastle-bronquite-2': /(2[aã]|segunda|2ª)/i,
          'vac-day70-newcastle-bronquite-3': /(3[aã]|terceira|3ª|refor[cç]o)/i,
        };
        const pat = patternMap[entry.id];
        if (pat) {
          if (!pat.test(recordName) && !/(newcastle|bronquite).{0,20}(1|2|3|1ª|2ª|3ª|primeira|segunda|terceira)/i.test(recordName)) {
            return false;
          }
        }
      }
      return recordName.includes(vLow.split(' ')[0]) || vLow.includes(recordName.split(' ')[0]);
    });
  });
}

export function generateVaccineReminders(
  animals: AnimalRecord[],
  healthRecords: HealthRecord[],
  rules: CaipiraHealthRules,
): ScheduledVaccineReminder[] {
  const reminders: ScheduledVaccineReminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  animals
    .filter((a) => a.status === 'ativo' || a.status === 'quarentena')
    .forEach((animal) => {
      const ageDays = getBirdAgeInDays(animal.birthDate);

      VACCINE_SCHEDULE_CAIPIRA_MG.forEach((entry) => {
        if (entry.id === 'vac-day1-lti-terras-altas' && !rules.ltiRecombinanteObrigatorio) return;

        if (isVaccineAlreadyApplied(animal.id, entry, healthRecords)) return;

        const scheduledDate = addDaysToDate(animal.birthDate, entry.targetAgeDays);
        const daysUntil = daysUntilDate(scheduledDate);

        let status: ScheduledVaccineReminder['status'] = 'pendente';
        let priority: ScheduledVaccineReminder['priority'] = 'low';

        if (daysUntil < 0) {
          status = 'atrasado';
          priority = entry.pastureCritical ? 'urgent' : 'high';
        } else if (daysUntil === 0) {
          status = 'hoje';
          priority = entry.pastureCritical ? 'urgent' : 'high';
        } else if (daysUntil <= 3) {
          status = 'proximo';
          priority = entry.pastureCritical ? 'high' : 'medium';
        } else if (daysUntil <= 14) {
          status = 'proximo';
          priority = 'medium';
        } else if (ageDays > entry.ageMaxDays + 30) {
          status = 'atrasado';
          priority = entry.pastureCritical ? 'urgent' : 'high';
        }

        if (daysUntil > 45 && status === 'pendente') return;
        if (ageDays < entry.ageMinDays - 30 && status === 'pendente') return;

        reminders.push({
          id: `rem-vac-${animal.id}-${entry.id}`,
          animalId: animal.id,
          animalTag: animal.tag,
          scheduleEntryId: entry.id,
          vaccines: entry.vaccines,
          applicationMethod: entry.applicationMethod,
          scheduledDate,
          ageAtScheduledDateDays: entry.targetAgeDays,
          currentAgeDays: ageDays,
          daysUntil,
          status,
          pastureCritical: entry.pastureCritical,
          category: entry.category,
          notes: entry.notes,
          adjustmentNote: entry.adjustmentForCaipira,
          priority,
        });
      });
    });

  return reminders.sort((a, b) => {
    const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    return a.daysUntil - b.daysUntil;
  });
}

export function generateAdultVaccineReminders(
  animals: AnimalRecord[],
  healthRecords: HealthRecord[],
): ScheduledVaccineReminder[] {
  const reminders: ScheduledVaccineReminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  animals
    .filter((a) => {
      if (a.status !== 'ativo' && a.status !== 'quarentena') return false;
      return getBirdAgeInDays(a.birthDate) >= 140;
    })
    .forEach((animal) => {
      const ageDays = getBirdAgeInDays(animal.birthDate);
      const lastAdultRecord = [...healthRecords]
        .filter((r) => {
          if (r.animalId !== animal.id) return false;
          if (r.procedureType !== 'tratamento' && r.procedureType !== 'vacina') return false;
          const name = (r.productName || r.vaccineName || r.title || '').toLowerCase();
          return /(newcastle|bronquite|refor[cç]o).*(adulto|3|4|m[eê]s)/i.test(name) ||
            /refor[cç]o.*newcastle/i.test(name);
        })
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];

      const baseDate = lastAdultRecord ? lastAdultRecord.occurredAt : animal.birthDate;
      const intervalDays = 105;
      const scheduledDate = addDaysToDate(baseDate.slice(0, 10), intervalDays);
      const daysUntil = daysUntilDate(scheduledDate);

      let status: ScheduledVaccineReminder['status'] = 'pendente';
      let priority: ScheduledVaccineReminder['priority'] = 'low';
      if (daysUntil < 0) {
        status = 'atrasado';
        priority = 'high';
      } else if (daysUntil === 0) {
        status = 'hoje';
        priority = 'high';
      } else if (daysUntil <= 7) {
        status = 'proximo';
        priority = 'medium';
      } else if (daysUntil > 45) {
        return;
      }

      reminders.push({
        id: `rem-vac-adult-${animal.id}`,
        animalId: animal.id,
        animalTag: animal.tag,
        scheduleEntryId: 'adult-newcastle-bronquite-reforco',
        vaccines: ['Newcastle', 'Bronquite Infecciosa'],
        applicationMethod: 'agua_bebida',
        scheduledDate,
        ageAtScheduledDateDays: ageDays + Math.max(0, daysUntil),
        currentAgeDays: ageDays,
        daysUntil,
        status,
        pastureCritical: false,
        category: 'postura_adulta',
        notes: 'Reforço contínuo a cada 3 ou 4 meses em aves adultas na água de bebida.',
        priority,
      });
    });

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function generateTakeTestReminders(
  animals: AnimalRecord[],
  healthRecords: HealthRecord[],
  rules: CaipiraHealthRules,
): TakeTestReminder[] {
  if (!rules.takeTestObrigatorio) return [];
  const reminders: TakeTestReminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  healthRecords
    .filter((r) => {
      if (r.procedureType !== 'tratamento' && r.procedureType !== 'vacina') return false;
      const name = (r.productName || r.vaccineName || r.title || '').toLowerCase();
      return /bouba.*(forte|asa|pun[cç][aã]o)/i.test(name) || /bouba av[ií]ria forte/i.test(name);
    })
    .forEach((record) => {
      const animal = animals.find((a) => a.id === record.animalId);
      if (!animal) return;
      const testDate = addDaysToDate(record.occurredAt.slice(0, 10), 7);
      const alreadyConfirmed = healthRecords.some((r) => {
        if (r.animalId !== animal.id) return false;
        const n = (r.title || r.notes || '').toLowerCase();
        return /(take|teste.*asa|n[oó]dulo.*asa|crostinha.*asa)/i.test(n) &&
          new Date(r.occurredAt) >= new Date(testDate);
      });
      if (alreadyConfirmed) return;

      const daysUntil = daysUntilDate(testDate);
      let status: TakeTestReminder['status'] = 'pendente';
      if (daysUntil < 0) status = 'atrasado';
      else if (daysUntil === 0) status = 'hoje';

      if (daysUntil < -30) return;

      reminders.push({
        id: `rem-take-${record.id}`,
        animalId: animal.id,
        animalTag: animal.tag,
        boubaAppliedDate: record.occurredAt.slice(0, 10),
        testDate,
        daysUntil,
        status,
      });
    });

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function generateVermifugacaoReminders(
  animals: AnimalRecord[],
  healthRecords: HealthRecord[],
  rules: CaipiraHealthRules,
): VermifugacaoReminder[] {
  const reminders: VermifugacaoReminder[] = [];
  const intervalMonths = rules.vermifugacaoIntervaloMeses;
  const intervalDays = intervalMonths * 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  animals
    .filter((a) => a.status === 'ativo' || a.status === 'quarentena')
    .forEach((animal) => {
      const lastVermifugo = [...healthRecords]
        .filter((r) => {
          if (r.animalId !== animal.id) return false;
          const title = (r.title || r.productName || r.medicationName || '').toLowerCase();
          return /(vermifug|vermifuga[cç][aã]o|desparasita|anti.*(parasita|verme))/i.test(title);
        })
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];

      const baseDate = lastVermifugo?.occurredAt || animal.birthDate;
      const scheduledDate = addDaysToDate(baseDate.slice(0, 10), intervalDays);
      const daysUntil = daysUntilDate(scheduledDate);

      let status: VermifugacaoReminder['status'] = 'pendente';
      if (daysUntil < 0) status = 'atrasado';
      else if (daysUntil === 0) status = 'hoje';
      else if (daysUntil <= 14) status = 'proximo';

      if (daysUntil > 45 && status === 'pendente') return;

      const observation = rules.biosseguridadePiqueteDrenagem
        ? 'Acesso diário ao pasto: intercalar com reforço de Newcastle. Evitar poças no piquete (drenagem).'
        : 'Recomendado intercalar com reforço de Newcastle.';

      reminders.push({
        id: `rem-verm-${animal.id}`,
        animalId: animal.id,
        animalTag: animal.tag,
        lastDewormingDate: lastVermifugo?.occurredAt.slice(0, 10) ?? null,
        scheduledDate,
        daysUntil,
        intervalMonths,
        status,
        observation,
      });
    });

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function buildProtocolErroZeroChecklist(animal: AnimalRecord, rules: CaipiraHealthRules) {
  const ageDays = getBirdAgeInDays(animal.birthDate);
  return [
    {
      id: 'p1-bouba-suave',
      label: 'Bouba Suave no 1º dia (incubatório)',
      obrigatorio: rules.boubaAnticipada,
      critico: rules.boubaAnticipada && ageDays <= 60,
      detalhe: rules.boubaAnticipada
        ? 'Sistema caipira com pasto: Bouba Suave D-1 + Bouba Forte 15-21 dias.'
        : 'Seguir calendário industrial (Bouba aos 35 dias).',
    },
    {
      id: 'p2-teste-take',
      label: 'Teste "Take" na asa (7 dias após Bouba Forte)',
      obrigatorio: rules.takeTestObrigatorio,
      critico: rules.takeTestObrigatorio && ageDays >= 21 && ageDays <= 35,
      detalhe: 'Amostrar 10% das aves. Se não houve nódulo/crostinha, revacinar imediatamente.',
    },
    {
      id: 'p3-coccidiose',
      label: 'Coccidiose: Vacina D-1 OU manejo anticoccidiano correto',
      obrigatorio: rules.coccidioseIncubatorio,
      critico: rules.coccidioseIncubatorio && ageDays <= 21,
      detalhe: rules.coccidioseIncubatorio
        ? 'Se vacinado no 1º dia, NÃO usar anticoccidiano na ração inicial.'
        : 'Monitorar diarreia sanguinolenta no pasto.',
    },
    {
      id: 'p4-lti',
      label: 'LTI (HVT-LT recombinante) — região Terras Altas Mantiqueira',
      obrigatorio: rules.ltiRecombinanteObrigatorio,
      critico: rules.ltiRecombinanteObrigatorio && ageDays <= 30,
      detalhe: rules.ltiRecombinanteObrigatorio
        ? 'Exigir do incubatório. Confirmar portaria IMA local.'
        : 'Verificar status epidemiológico com escritório IMA.',
    },
    {
      id: 'p5-vermifugacao',
      label: `Vermifugação a cada ${rules.vermifugacaoIntervaloMeses} meses na água`,
      obrigatorio: rules.biosseguridadePiqueteDrenagem,
      critico: ageDays >= 60,
      detalhe: 'Alta carga parasitária no pasto destrói a imunidade → vacinas falham.',
    },
    {
      id: 'p6-drenagem',
      label: 'Biosseguridade: sem poças d’água no piquete',
      obrigatorio: rules.biosseguridadePiqueteDrenagem,
      critico: rules.biosseguridadePiqueteDrenagem,
      detalhe: 'Poças acumulam larvas de pernilongos e contaminação bacteriana.',
    },
  ];
}

// ---------------------------------------------------------------------------
// SISTEMA DE VALIDAÇÃO CONTÍNUA — Erros de cadastro / sobreposição / inconsistências
// ---------------------------------------------------------------------------

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface HealthValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  title: string;
  detail: string;
  animalId?: string;
  animalTag?: string;
  healthRecordId?: string;
}

export function validateHealthConsistency(
  animals: AnimalRecord[],
  healthRecords: HealthRecord[],
  rules: CaipiraHealthRules,
): HealthValidationIssue[] {
  const issues: HealthValidationIssue[] = [];
  const animalMap = new Map(animals.map((a) => [a.id, a]));

  // 1. Vacina duplicada no mesmo lote no mesmo período de janela
  const appliedVaccineKeys: Record<string, HealthRecord[]> = {};
  healthRecords
    .filter((r) => {
      if (r.procedureType !== 'tratamento' && r.procedureType !== 'vacina') return false;
      if (r.treatmentType && r.treatmentType !== 'vacina') return false;
      return true;
    })
    .forEach((r) => {
      const name = (r.productName || r.vaccineName || r.title || '').toLowerCase();
      VACCINE_SCHEDULE_CAIPIRA_MG.forEach((entry) => {
        const matches = entry.vaccines.some((v) => {
          const vLow = v.toLowerCase();
          return name.includes(vLow.split(' ')[0]) || vLow.includes(name.split(' ')[0]);
        });
        if (matches) {
          const key = `${r.animalId}||${entry.id}`;
          if (!appliedVaccineKeys[key]) appliedVaccineKeys[key] = [];
          appliedVaccineKeys[key].push(r);
        }
      });
    });

  Object.entries(appliedVaccineKeys).forEach(([key, recs]) => {
    if (recs.length <= 1) return;
    const [animalId, entryId] = key.split('||');
    const entry = VACCINE_SCHEDULE_CAIPIRA_MG.find((e) => e.id === entryId);
    const animal = animalMap.get(animalId);
    const sorted = [...recs].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = new Date(sorted[i - 1].occurredAt).getTime();
      const curr = new Date(sorted[i].occurredAt).getTime();
      const diffDays = Math.round((curr - prev) / DAY_IN_MS);
      if (diffDays < 3 && entry) {
        issues.push({
          id: `val-dup-${sorted[i].id}`,
          severity: 'warning',
          code: 'VACCINE_DUPLICATE_SHORT_INTERVAL',
          title: `Aplicação duplicada em intervalo curto: ${entry.vaccines.join(' + ')}`,
          detail: `Aplicado em intervalo de ${diffDays} dias (sugerido: respeitar janela D${entry.ageMinDays}-D${entry.ageMaxDays}). Verificar segunda aplicação.`,
          animalId,
          animalTag: animal?.tag,
          healthRecordId: sorted[i].id,
        });
      }
    }
  });

  // 2. Vacina aplicada fora da janela etária recomendada
  healthRecords
    .filter((r) => {
      if (r.procedureType !== 'tratamento' && r.procedureType !== 'vacina') return false;
      if (r.treatmentType && r.treatmentType !== 'vacina') return false;
      return true;
    })
    .forEach((r) => {
      const animal = animalMap.get(r.animalId);
      if (!animal) return;
      const ageAtApp = Math.round(
        (new Date(r.occurredAt).getTime() - new Date(animal.birthDate).getTime()) / DAY_IN_MS,
      );
      const name = (r.productName || r.vaccineName || r.title || '').toLowerCase();
      VACCINE_SCHEDULE_CAIPIRA_MG.forEach((entry) => {
        const matches = entry.vaccines.some((v) => {
          const vLow = v.toLowerCase();
          return name.includes(vLow.split(' ')[0]) || vLow.includes(name.split(' ')[0]);
        });
        if (!matches) return;
        if (ageAtApp < entry.ageMinDays - 2 || ageAtApp > entry.ageMaxDays + 30) {
          issues.push({
            id: `val-window-${r.id}-${entry.id}`,
            severity: ageAtApp > entry.ageMaxDays + 60 ? 'error' : 'warning',
            code: 'VACCINE_OUTSIDE_AGE_WINDOW',
            title: `${entry.vaccines.join(' + ')} aplicado D${ageAtApp} (fora da janela)`,
            detail: `Janela recomendada: D${entry.ageMinDays} a D${entry.ageMaxDays}. ${
              ageAtApp > entry.ageMaxDays
                ? `Atraso de ${ageAtApp - entry.ageMaxDays} dias.`
                : `Aplicação antecipada em ${entry.ageMinDays - ageAtApp} dias.`
            } Resposta imunológica pode ser comprometida.`,
            animalId: r.animalId,
            animalTag: animal.tag,
            healthRecordId: r.id,
          });
        }
      });
    });

  // 3. Conflito: Coccidiose vacinada D-1 + anticoccidiano em registro
  if (rules.coccidioseIncubatorio) {
    const coccidioseVacinada = new Set<string>();
    healthRecords.forEach((r) => {
      const name = (r.productName || r.vaccineName || r.title || '').toLowerCase();
      if (/coccidiose/.test(name) && /(vacina|imuniza|spray)/i.test(name)) {
        coccidioseVacinada.add(r.animalId);
      }
    });
    healthRecords.forEach((r) => {
      if (!coccidioseVacinada.has(r.animalId)) return;
      const name = (r.productName || r.medicationName || r.title || r.notes || '').toLowerCase();
      if (/anticoccidiano|amprol|salinomicina|lasalocid|maduramicina|diclazuril|toltrazuril/i.test(name)) {
        const animal = animalMap.get(r.animalId);
        issues.push({
          id: `val-cocc-conflict-${r.id}`,
          severity: 'error',
          code: 'COCCIDIOSE_VACINA_VS_ANTICOCCIDIANO',
          title: 'Conflito sanitário: anticoccidiano em lote vacinado contra Coccidiose',
          detail: 'Lote recebeu vacina de Coccidiose no 1º dia. NÃO administrar anticoccidianos na fase inicial — eles anulam a imunidade gerada pela vacina.',
          animalId: r.animalId,
          animalTag: animal?.tag,
          healthRecordId: r.id,
        });
      }
    });
  }

  // 4. Próxima dose no passado / dados inconsistentes
  healthRecords.forEach((r) => {
    if (r.nextDoseDate) {
      const next = new Date(r.nextDoseDate).getTime();
      const now = Date.now();
      if (next < now - 30 * DAY_IN_MS) {
        const animal = animalMap.get(r.animalId);
        issues.push({
          id: `val-next-dose-${r.id}`,
          severity: 'warning',
          code: 'NEXT_DOSE_LONG_OVERDUE',
          title: `Próxima dose de "${r.productName || r.title}" está > 30 dias atrasada`,
          detail: 'Aplicar dose imediatamente e registrar. Intervalos longos entre doses comprometem o protocolo.',
          animalId: r.animalId,
          animalTag: animal?.tag,
          healthRecordId: r.id,
        });
      }
    }
    if (r.occurredAt && new Date(r.occurredAt).getTime() > Date.now() + DAY_IN_MS) {
      const animal = animalMap.get(r.animalId);
      issues.push({
        id: `val-future-${r.id}`,
        severity: 'error',
        code: 'RECORD_FUTURE_DATE',
        title: 'Registro de saúde com data futura',
        detail: 'Data da intervenção está no futuro. Verifique data/hora do cadastro.',
        animalId: r.animalId,
        animalTag: animal?.tag,
        healthRecordId: r.id,
      });
    }
  });

  // 5. Lote ativo sem Bouba Forte registrada após D35 em sistema caipira
  if (rules.boubaAnticipada) {
    animals
      .filter((a) => a.status === 'ativo' || a.status === 'quarentena')
      .forEach((animal) => {
        const age = getBirdAgeInDays(animal.birthDate);
        if (age < 38) return;
        const hasBoubaForte = healthRecords.some((r) => {
          if (r.animalId !== animal.id) return false;
          const name = (r.productName || r.vaccineName || r.title || '').toLowerCase();
          return /bouba.*(forte|2|refor[cç]o)/i.test(name);
        });
        if (!hasBoubaForte) {
          issues.push({
            id: `val-bouba-faltante-${animal.id}`,
            severity: 'error',
            code: 'BOUBA_FORTE_MISSING_IN_PASTURE',
            title: `Bouba Forte não registrada — lote ${animal.tag} (D${age})`,
            detail: 'Em sistema caipira com pasto, Bouba Forte deve ser aplicada de D15 a D21 (antecipada do calendário industrial D35). Expor ao pasto sem Bouba é risco crítico.',
            animalId: animal.id,
            animalTag: animal.tag,
          });
        }
      });
  }

  // 6. Profissional de saúde sem acesso de gestão em consulta/tratamento
  // (Esta validação é feita na camada de UI através de validateHealthRecord)

  return issues.sort((a, b) => {
    const order: Record<ValidationSeverity, number> = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

// ---------------------------------------------------------------------------
// RECOMENDAÇÃO AUTOMÁTICA — Próxima vacina recomendada após cadastro de lote
// ---------------------------------------------------------------------------

export interface NextVaccineRecommendation {
  entry: VaccineScheduleEntry;
  scheduledDate: string;
  daysUntil: number;
  ageAtScheduledDays: number;
  currentAgeDays: number;
  status: 'urgente' | 'proximo' | 'agendado' | 'concluido';
  notes: string;
  applicationMethodLabel: string;
  categoryLabel: string;
}

export function getNextVaccineRecommendation(
  birthDate: string,
  registrationDate: string,
  rules: CaipiraHealthRules,
  healthRecords: HealthRecord[] = [],
  animalId?: string,
): NextVaccineRecommendation | null {
  if (!birthDate) return null;
  const regDate = registrationDate || new Date().toISOString().slice(0, 10);
  const ageAtRegistration = Math.max(
    0,
    Math.round(
      (new Date(regDate.slice(0, 10)).getTime() - new Date(birthDate.slice(0, 10)).getTime()) /
        DAY_IN_MS,
    ),
  );

  const candidates = VACCINE_SCHEDULE_CAIPIRA_MG.filter((entry) => {
    if (entry.id === 'vac-day1-lti-terras-altas' && !rules.ltiRecombinanteObrigatorio) return false;
    if (animalId && isVaccineAlreadyApplied(animalId, entry, healthRecords)) return false;
    // Entradas em que a idade alvo é >= idade no cadastro (ou ainda no período de janela)
    return entry.targetAgeDays >= ageAtRegistration - 5;
  });

  if (candidates.length === 0) return null;

  const next = candidates.reduce((best, entry) =>
    Math.abs(entry.targetAgeDays - ageAtRegistration) <
    Math.abs(best.targetAgeDays - ageAtRegistration)
      ? entry
      : best,
  );

  const scheduledDate = addDaysToDate(birthDate.slice(0, 10), next.targetAgeDays);
  const daysUntil = daysUntilDate(scheduledDate);
  const currentAge = ageAtRegistration;

  let status: NextVaccineRecommendation['status'] = 'agendado';
  if (daysUntil < 0) status = 'urgente';
  else if (daysUntil === 0) status = 'urgente';
  else if (daysUntil <= 7) status = 'proximo';
  else if (next.targetAgeDays <= currentAge + 2) status = 'proximo';

  return {
    entry: next,
    scheduledDate,
    daysUntil,
    ageAtScheduledDays: next.targetAgeDays,
    currentAgeDays: currentAge,
    status,
    notes: next.notes,
    applicationMethodLabel: APPLICATION_METHOD_LABELS[next.applicationMethod],
    categoryLabel: CATEGORY_LABELS[next.category],
  };
}

// ---------------------------------------------------------------------------
// AGREGADOR UNIFICADO DE ALERTAS DE SAÚDE — Consumido por Início e Manejo
// ---------------------------------------------------------------------------

export type UnifiedHealthAlertSource =
  | 'next_dose'
  | 'return_visit'
  | 'vaccine_schedule'
  | 'take_test'
  | 'vermifugacao'
  | 'protocol_validation';

export interface UnifiedHealthAlert {
  id: string;
  source: UnifiedHealthAlertSource;
  title: string;
  description: string;
  scheduledDate: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  animalId?: string;
  animalTag?: string;
  healthRecordId?: string;
  actionLabel?: string;
}

export function aggregateUnifiedHealthAlerts(params: {
  animals: AnimalRecord[];
  healthRecords: HealthRecord[];
  rules: CaipiraHealthRules;
  includeSources?: UnifiedHealthAlertSource[];
  maxDaysWindow?: number;
}): UnifiedHealthAlert[] {
  const {
    animals,
    healthRecords,
    rules,
    includeSources,
    maxDaysWindow = 45,
  } = params;
  const sources = includeSources ?? [
    'next_dose',
    'return_visit',
    'vaccine_schedule',
    'take_test',
    'vermifugacao',
    'protocol_validation',
  ];
  const alerts: UnifiedHealthAlert[] = [];
  const animalMap = new Map(animals.map((a) => [a.id, a]));

  // 1. Próximas doses de tratamento
  if (sources.includes('next_dose')) {
    healthRecords
      .filter((r) => r.nextDoseDate)
      .forEach((record) => {
        const daysLeft = daysUntilDate(record.nextDoseDate!);
        if (daysLeft > maxDaysWindow) return;
        const animal = animalMap.get(record.animalId);
        let priority: UnifiedHealthAlert['priority'] = 'low';
        let title = '';
        let description = '';
        if (daysLeft < 0) {
          priority = 'urgent';
          title = `[ATRASADO] ${Math.abs(daysLeft)}d — ${record.productName || 'Dose programada'}`;
          description = `Próxima dose em atraso para ${animal?.tag || 'lote'}. Aplicar imediatamente.`;
        } else if (daysLeft === 0) {
          priority = 'urgent';
          title = `[HOJE] ${record.productName || 'Dose programada'}`;
          description = `Aplicar dose hoje para ${animal?.tag || 'lote'}.`;
        } else if (daysLeft <= 3) {
          priority = 'high';
          title = `Próxima dose em ${daysLeft}d`;
          description = `${record.productName || 'Tratamento'} para ${animal?.tag || 'lote'}.`;
        } else if (daysLeft <= 14) {
          priority = 'medium';
          title = `Próxima dose em ${daysLeft}d`;
          description = `${record.productName || 'Tratamento'} para ${animal?.tag || 'lote'}.`;
        } else {
          priority = 'low';
          title = `Próxima dose em ${daysLeft}d`;
          description = `${record.productName || 'Tratamento'} para ${animal?.tag || 'lote'}.`;
        }
        if (title) {
          alerts.push({
            id: `unified-dose-${record.id}`,
            source: 'next_dose',
            title,
            description,
            scheduledDate: record.nextDoseDate!,
            priority,
            animalId: record.animalId,
            animalTag: animal?.tag,
            healthRecordId: record.id,
            actionLabel: 'Aplicar dose',
          });
        }
      });
  }

  // 2. Retornos de consulta
  if (sources.includes('return_visit')) {
    healthRecords
      .filter((r) => r.procedureType === 'consulta' && r.returnDate)
      .forEach((record) => {
        const daysLeft = daysUntilDate(record.returnDate!);
        if (daysLeft > maxDaysWindow) return;
        const animal = animalMap.get(record.animalId);
        let priority: UnifiedHealthAlert['priority'] = 'low';
        let title = '';
        let description = '';
        if (daysLeft < 0) {
          priority = 'urgent';
          title = `[ATRASADO] Retorno veterinário — ${Math.abs(daysLeft)}d`;
          description = `Retorno de consulta em atraso para ${animal?.tag || 'lote'}.`;
        } else if (daysLeft === 0) {
          priority = 'high';
          title = '[HOJE] Retorno veterinário';
          description = `Consulta de retorno agendada para ${animal?.tag || 'lote'}.`;
        } else if (daysLeft <= 7) {
          priority = 'medium';
          title = `Retorno veterinário em ${daysLeft}d`;
          description = `Agendado para ${animal?.tag || 'lote'}.`;
        }
        if (title) {
          alerts.push({
            id: `unified-return-${record.id}`,
            source: 'return_visit',
            title,
            description,
            scheduledDate: record.returnDate!,
            priority,
            animalId: record.animalId,
            animalTag: animal?.tag,
            healthRecordId: record.id,
            actionLabel: 'Agendar retorno',
          });
        }
      });
  }

  // 3. Vacinas programadas do calendário caipira
  if (sources.includes('vaccine_schedule')) {
    const vac = generateVaccineReminders(animals, healthRecords, rules);
    const adult = generateAdultVaccineReminders(animals, healthRecords);
    [...vac, ...adult]
      .filter((v) => v.daysUntil <= maxDaysWindow)
      .forEach((v) => {
        const pMap: Record<string, UnifiedHealthAlert['priority']> = {
          urgent: 'urgent',
          high: 'high',
          medium: 'medium',
          low: 'low',
        };
        let title = '';
        if (v.status === 'atrasado') title = `[ATRASADO] Vacina: ${v.vaccines.join(' + ')} (${v.animalTag})`;
        else if (v.status === 'hoje') title = `[HOJE] Vacina: ${v.vaccines.join(' + ')} (${v.animalTag})`;
        else title = `Vacina em ${v.daysUntil}d: ${v.vaccines.join(' + ')} (${v.animalTag})`;
        alerts.push({
          id: `unified-vac-${v.id}`,
          source: 'vaccine_schedule',
          title,
          description: `${APPLICATION_METHOD_LABELS[v.applicationMethod]} • ${
            v.pastureCritical ? 'Crítico pasto. ' : ''
          }${v.notes}`,
          scheduledDate: v.scheduledDate,
          priority: pMap[v.priority],
          animalId: v.animalId,
          animalTag: v.animalTag,
          actionLabel: 'Registrar vacina',
        });
      });
  }

  // 4. Teste Take (Bouba)
  if (sources.includes('take_test') && rules.takeTestObrigatorio) {
    generateTakeTestReminders(animals, healthRecords, rules)
      .filter((t) => t.daysUntil <= 60)
      .forEach((t) => {
        const priority: UnifiedHealthAlert['priority'] =
          t.status === 'atrasado' ? 'high' : t.status === 'hoje' ? 'high' : 'medium';
        let title = '';
        if (t.status === 'atrasado') title = `[ATRASADO] Teste "Take" Bouba — ${t.animalTag}`;
        else if (t.status === 'hoje') title = `[HOJE] Teste "Take" Bouba — ${t.animalTag}`;
        else title = `Teste "Take" em ${t.daysUntil}d — ${t.animalTag}`;
        alerts.push({
          id: `unified-take-${t.id}`,
          source: 'take_test',
          title,
          description:
            '7 dias após Bouba na asa: verificar nódulo/crostinha em 10% das aves. Se ausente → revacinar.',
          scheduledDate: t.testDate,
          priority,
          animalId: t.animalId,
          animalTag: t.animalTag,
          actionLabel: 'Conferir amostragem',
        });
      });
  }

  // 5. Vermifugação
  if (sources.includes('vermifugacao')) {
    generateVermifugacaoReminders(animals, healthRecords, rules)
      .filter((v) => v.daysUntil <= 60)
      .forEach((v) => {
        const priority: UnifiedHealthAlert['priority'] =
          v.status === 'atrasado' ? 'high' : v.status === 'hoje' ? 'high' : 'medium';
        let title = '';
        if (v.status === 'atrasado') title = `[ATRASADO] Vermifugação — ${v.animalTag}`;
        else if (v.status === 'hoje') title = `[HOJE] Vermifugação — ${v.animalTag}`;
        else title = `Vermifugação em ${v.daysUntil}d — ${v.animalTag}`;
        alerts.push({
          id: `unified-verm-${v.id}`,
          source: 'vermifugacao',
          title,
          description: v.observation,
          scheduledDate: v.scheduledDate,
          priority,
          animalId: v.animalId,
          animalTag: v.animalTag,
          actionLabel: 'Aplicar vermífugo',
        });
      });
  }

  // 6. Validação de protocolo (erros críticos)
  if (sources.includes('protocol_validation')) {
    validateHealthConsistency(animals, healthRecords, rules)
      .filter((i) => i.severity !== 'info')
      .forEach((issue) => {
        const priority: UnifiedHealthAlert['priority'] =
          issue.severity === 'error' ? 'urgent' : 'high';
        alerts.push({
          id: `unified-val-${issue.id}`,
          source: 'protocol_validation',
          title: issue.title,
          description: issue.detail,
          scheduledDate: new Date().toISOString().slice(0, 10),
          priority,
          animalId: issue.animalId,
          animalTag: issue.animalTag,
          healthRecordId: issue.healthRecordId,
          actionLabel: 'Revisar cadastro',
        });
      });
  }

  const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => {
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    return (
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  });
}

// ---------------------------------------------------------------------------
// HELPERS PÚBLICOS ADICIONAIS
// ---------------------------------------------------------------------------

export function getVaccineProgressSummary(
  animal: AnimalRecord,
  healthRecords: HealthRecord[],
  rules: CaipiraHealthRules,
): { total: number; applied: number; pending: number; overdue: number; percent: number } {
  const ageDays = getBirdAgeInDays(animal.birthDate);
  const relevantEntries = VACCINE_SCHEDULE_CAIPIRA_MG.filter((e) => {
    if (e.id === 'vac-day1-lti-terras-altas' && !rules.ltiRecombinanteObrigatorio) return false;
    return e.targetAgeDays <= ageDays + 60;
  });
  let applied = 0;
  let overdue = 0;
  relevantEntries.forEach((entry) => {
    if (isVaccineAlreadyApplied(animal.id, entry, healthRecords)) {
      applied += 1;
      return;
    }
    if (ageDays > entry.ageMaxDays + 7) overdue += 1;
  });
  const total = relevantEntries.length;
  const pending = total - applied;
  const percent = total > 0 ? Math.round((applied / total) * 100) : 100;
  return { total, applied, pending, overdue, percent };
}
