import { describe, expect, it } from 'vitest';
import type { AnimalRecord, GalpaoRecord, HealthProfessionalRecord, HealthRecord, MortalityRecord, VeterinaryStockRecord } from '@/types';
import {
  adjustAnimalPopulation,
  buildHealthReport,
  buildMortalityReport,
  calculateMortalityRate,
  canProfessionalManageHealth,
  getVeterinaryStockStatus,
} from '@/lib/manejo';

function createAnimal(partial: Partial<AnimalRecord>): AnimalRecord {
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
    birthDate: partial.birthDate ?? '2026-01-01',
    status: partial.status ?? 'ativo',
    notes: partial.notes ?? '',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

function createGalpao(partial: Partial<GalpaoRecord>): GalpaoRecord {
  return {
    id: partial.id ?? 'galpao-1',
    name: partial.name ?? 'Galpão Central',
    code: partial.code ?? 'GP-01',
    capacity: partial.capacity ?? 120,
    currentBirdCount: partial.currentBirdCount ?? 100,
    mortalityThresholdPercent: partial.mortalityThresholdPercent ?? 5,
    location: partial.location ?? 'Ala norte',
    notes: partial.notes ?? '',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

function createProfessional(partial: Partial<HealthProfessionalRecord>): HealthProfessionalRecord {
  return {
    id: partial.id ?? 'prof-1',
    name: partial.name ?? 'Dra. Ana',
    role: partial.role ?? 'Médica veterinária',
    councilNumber: partial.councilNumber ?? 'CRMV 1',
    phone: partial.phone ?? '',
    email: partial.email ?? '',
    accessLevel: partial.accessLevel ?? 'registro',
    isActive: partial.isActive ?? true,
    notes: partial.notes ?? '',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

function createHealthRecord(partial: Partial<HealthRecord>): HealthRecord {
  return {
    id: partial.id ?? 'health-1',
    occurredAt: partial.occurredAt ?? '2026-06-10T08:00',
    procedureType: partial.procedureType ?? 'tratamento',
    animalId: partial.animalId ?? 'animal-1',
    galpaoId: partial.galpaoId ?? 'galpao-1',
    professionalId: partial.professionalId ?? 'prof-1',
    title: partial.title ?? 'Tratamento respiratório',
    diseaseName: partial.diseaseName ?? 'Doença respiratória',
    affectedBirdCount: partial.affectedBirdCount ?? 15,
    estimatedCost: partial.estimatedCost ?? 120,
    recoveryStatus: partial.recoveryStatus ?? 'em_tratamento',
    notes: partial.notes ?? '',
    createdAt: partial.createdAt ?? '2026-06-10T08:00:00.000Z',
  };
}

function createMortalityRecord(partial: Partial<MortalityRecord>): MortalityRecord {
  return {
    id: partial.id ?? 'mort-1',
    date: partial.date ?? (partial.occurredAt ? partial.occurredAt.slice(0, 10) : '2026-06-11'),
    occurredAt: partial.occurredAt ?? '2026-06-11T07:30',
    galpaoId: partial.galpaoId ?? 'galpao-1',
    animalId: partial.animalId ?? 'animal-1',
    responsibleProfessionalId: partial.responsibleProfessionalId ?? 'prof-1',
    deadCount: partial.deadCount ?? 8,
    causeStatus: partial.causeStatus ?? 'suspeita',
    cause: partial.cause ?? 'Síndrome respiratória',
    notes: partial.notes ?? '',
    attachments: partial.attachments ?? [],
    createdAt: partial.createdAt ?? '2026-06-11T07:30:00.000Z',
  };
}

describe('manejo unit', () => {
  it('ajusta a população do lote sem permitir valores negativos', () => {
    const animal = createAnimal({ currentQuantity: 12 });
    const updated = adjustAnimalPopulation(animal, -20);

    expect(updated.currentQuantity).toBe(0);
  });

  it('calcula o status do estoque veterinário com vencimento e estoque mínimo', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const item: VeterinaryStockRecord = {
      id: 'stock-1',
      name: 'Vacina',
      category: 'vacina',
      supplierId: '',
      batchNumber: 'L1',
      quantity: 5,
      unit: 'dose',
      minimumStock: 10,
      expirationDate: tomorrow.toISOString().slice(0, 10),
      storageLocation: 'Câmara fria',
      costPerUnit: 2,
      notes: '',
      createdAt: '2026-06-01T00:00:00.000Z',
    };

    const status = getVeterinaryStockStatus(item);

    expect(status.isLowStock).toBe(true);
    expect(status.isExpiringSoon).toBe(true);
    expect(status.isExpired).toBe(false);
  });

  it('respeita permissões sanitárias do profissional', () => {
    expect(canProfessionalManageHealth(createProfessional({ accessLevel: 'gestao', isActive: true }))).toBe(true);
    expect(canProfessionalManageHealth(createProfessional({ accessLevel: 'visualizacao', isActive: true }))).toBe(false);
    expect(canProfessionalManageHealth(createProfessional({ accessLevel: 'registro', isActive: false }))).toBe(false);
  });
});

describe('manejo integration', () => {
  it('gera relatório de saúde por lote e galpão com taxa de recuperação e custos', () => {
    const animals = [createAnimal({ id: 'animal-1', tag: 'Lote A', currentQuantity: 80 })];
    const galpoes = [createGalpao({ id: 'galpao-1', name: 'Galpão A', currentBirdCount: 80 })];
    const records = [
      createHealthRecord({ id: 'health-1', recoveryStatus: 'recuperado', estimatedCost: 90, affectedBirdCount: 10 }),
      createHealthRecord({ id: 'health-2', recoveryStatus: 'em_tratamento', estimatedCost: 60, affectedBirdCount: 5, occurredAt: '2026-06-12T08:00' }),
    ];

    const report = buildHealthReport(records, animals, galpoes);

    expect(report.totalInterventions).toBe(2);
    expect(report.totalCost).toBe(150);
    expect(report.recoveryRatePercent).toBe(50);
    expect(report.byAnimal[0]?.label).toBe('Lote A');
    expect(report.byAnimal[0]?.incidencePercent).toBeCloseTo(18.75, 2);
    expect(report.byGalpao[0]?.recoveryRatePercent).toBe(50);
  });

  it('gera alertas de mortalidade e cruza ocorrências com registros de saúde', () => {
    const animals = [createAnimal({ id: 'animal-1', tag: 'Lote A', quantity: 100, currentQuantity: 92 })];
    const mortalityRecords = [
      createMortalityRecord({ id: 'mort-1', deadCount: 8, date: '2026-06-11', occurredAt: '2026-06-11T07:30', cause: 'Síndrome respiratória' }),
    ];

    const report = buildMortalityReport(mortalityRecords, animals);

    expect(report.totalDeadBirds).toBe(8);
    expect(report.totalOccurrences).toBe(1);
    expect(report.byAnimal).toHaveLength(1);
    expect(report.byAnimal[0]?.label).toBe('Lote A');
    expect(report.byAnimal[0]?.mortalityRatePercent).toBeCloseTo(calculateMortalityRate(8, 100), 2);
    expect(report.dailyTrend).toEqual([{ date: '2026-06-11', deadBirds: 8 }]);
  });
});
