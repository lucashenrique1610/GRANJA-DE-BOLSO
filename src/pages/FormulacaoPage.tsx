import React, { useMemo, useState } from 'react';
import { 
  Calculator, 
  Wheat, 
  FileText, 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Info, 
  Search,
  Copy,
  Zap,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  AnimalRecord, 
  IngredientRecord, 
  FormulationRecord, 
  FormulatedFeedStockRecord, 
  NutritionalPhase, 
  FormulationIngredient 
} from '@/types';
import {
  NUTRITIONAL_TARGETS,
  getBirdAgeInDays,
  getPhaseByAge,
} from '@/lib/manejo';
import { DEFAULT_INGREDIENTS } from '@/lib/defaultIngredients';

interface FormulacaoPageProps {
  animals: AnimalRecord[];
  ingredients: IngredientRecord[];
  formulations: FormulationRecord[];
  formulatedFeedStock: FormulatedFeedStockRecord[];
  onSaveIngredient: (ingredient: IngredientRecord) => Promise<void> | void;
  onDeleteIngredient: (id: string) => Promise<void> | void;
  onSaveFormulation: (formulation: FormulationRecord) => Promise<void> | void;
  onDeleteFormulation: (id: string) => Promise<void> | void;
  onSaveFormulatedFeed: (feed: FormulatedFeedStockRecord) => Promise<void> | void;
}

const PHASE_LABELS: Record<NutritionalPhase, string> = {
  inicial_1_21: 'Inicial (1-21 dias)',
  crescimento_1_22_42: 'Crescimento 1 (22-42 dias)',
  crescimento_2_43_105: 'Crescimento 2 / Recria (43-105 dias)',
  pre_postura_106_126: 'Pré-postura (106-126 dias)',
  postura: 'Postura (127+ dias)'
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const emptyIngredient = (): Omit<IngredientRecord, 'id' | 'createdAt'> => ({
  name: '',
  dryMatter: 88,
  protein: 0,
  energy: 0,
  calcium: 0,
  phosphorusTotal: 0,
  phosphorusAvailable: 0,
  sodium: 0,
  potassium: 0,
  methionine: 0,
  metCis: 0,
  lysine: 0,
  threonine: 0,
  tryptophan: 0,
  fiber: 0,
  etherExtract: 0,
  price: 0,
  stock: 0,
  dataSource: '',
  referenceYear: new Date().getFullYear(),
  lastUpdated: new Date().toISOString(),
  technicalNotes: '',
  userEditable: true,
});

const emptyFormulation = (phase: NutritionalPhase = 'inicial_1_21'): Omit<FormulationRecord, 'id' | 'createdAt'> => ({
  name: '',
  phase,
  animalId: '',
  ingredients: [],
  isActive: true
});

function isInRange(value: number, { min, max }: { min: number; max: number }): boolean {
  return value >= min && value <= max;
}

function getStatusBadge(value: number, range: { min: number; max: number }) {
  const inRange = isInRange(value, range);
  if (inRange) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
        <CheckCircle className="w-3 h-3" /> Adequado
      </span>
    );
  }
  const isLow = value < range.min;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
      <XCircle className="w-3 h-3" /> {isLow ? 'Baixo' : 'Alto'}
    </span>
  );
}

export default function FormulacaoPage({
  animals,
  ingredients,
  formulations,
  formulatedFeedStock,
  onSaveIngredient,
  onDeleteIngredient,
  onSaveFormulation,
  onDeleteFormulation,
  onSaveFormulatedFeed
}: FormulacaoPageProps) {
  const [activeTab, setActiveTab] = useState<'criar' | 'ingredientes' | 'formulacoes' | 'estoque'>('criar');

  // Tab 1: Criar Formulacao state
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [formulationDraft, setFormulationDraft] = useState<Omit<FormulationRecord, 'id' | 'createdAt'>>(emptyFormulation());
  const [editingFormulationId, setEditingFormulationId] = useState<string | null>(null);
  const [batchQuantityKg, setBatchQuantityKg] = useState<number>(0);
  const [weatherFactor, setWeatherFactor] = useState<'normal' | 'frio' | 'quente'>('normal');
  const [foragingFactor, setForagingFactor] = useState<number>(0);

  // Tab 2: Ingredientes state
  const [searchIngredients, setSearchIngredients] = useState('');
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [ingredientDraft, setIngredientDraft] = useState<Omit<IngredientRecord, 'id' | 'createdAt'>>(emptyIngredient());

  // Tab 3: Formulacoes state
  const [searchFormulations, setSearchFormulations] = useState('');

  // Tab 4: Estoque state
  const [searchStock, setSearchStock] = useState('');

  const selectedLot = useMemo(() => animals.find(a => a.id === selectedLotId), [animals, selectedLotId]);
  
  const currentPhase = useMemo(() => {
    if (selectedLot) {
      const age = getBirdAgeInDays(selectedLot.birthDate);
      return getPhaseByAge(age);
    }
    return formulationDraft.phase;
  }, [selectedLot, formulationDraft.phase]);

  const targets = NUTRITIONAL_TARGETS[currentPhase];

  const formulationTotals = useMemo(() => {
    const totals = {
      protein: 0,
      energy: 0,
      calcium: 0,
      phosphorusAvailable: 0,
      methionine: 0,
      metCis: 0,
      lysine: 0,
      threonine: 0,
      tryptophan: 0,
      fiber: 0,
      costPerKg: 0,
      totalPercentage: 0
    };

    formulationDraft.ingredients.forEach((fi) => {
      const ingredient = ingredients.find(i => i.id === fi.ingredientId);
      if (ingredient) {
        totals.protein += (ingredient.protein * fi.percentage) / 100;
        totals.energy += (ingredient.energy * fi.percentage) / 100;
        totals.calcium += (ingredient.calcium * fi.percentage) / 100;
        totals.phosphorusAvailable += (ingredient.phosphorusAvailable * fi.percentage) / 100;
        totals.methionine += (ingredient.methionine * fi.percentage) / 100;
        totals.metCis += ((ingredient.metCis || 0) * fi.percentage) / 100;
        totals.lysine += (ingredient.lysine * fi.percentage) / 100;
        totals.threonine += (ingredient.threonine * fi.percentage) / 100;
        totals.tryptophan += (ingredient.tryptophan * fi.percentage) / 100;
        totals.fiber += (ingredient.fiber * fi.percentage) / 100;
        totals.costPerKg += (ingredient.price * fi.percentage) / 100;
        totals.totalPercentage += fi.percentage;
      }
    });

    return totals;
  }, [formulationDraft.ingredients, ingredients]);

  const durationEstimate = useMemo(() => {
    if (!selectedLot || batchQuantityKg <= 0) return null;
    
    const birdCount = selectedLot.currentQuantity ?? selectedLot.quantity;
    let dailyConsumptionPerBird = targets.consumption;
    
    // Apply weather factor
    if (weatherFactor === 'frio') dailyConsumptionPerBird *= 1.15;
    if (weatherFactor === 'quente') dailyConsumptionPerBird *= 0.9;
    
    // Apply foraging factor
    dailyConsumptionPerBird *= (1 - foragingFactor / 100);
    
    const totalDailyConsumptionKg = (dailyConsumptionPerBird * birdCount) / 1000;
    const days = batchQuantityKg / totalDailyConsumptionKg;
    
    return {
      dailyConsumptionKg: totalDailyConsumptionKg,
      days: Math.floor(days),
      birdCount
    };
  }, [selectedLot, batchQuantityKg, targets.consumption, weatherFactor, foragingFactor]);

  // Improved Least-Cost Formulation optimization
  const handleOptimize = () => {
    if (ingredients.length < 3) {
      alert('Adicione pelo menos 3 ingredientes para otimizar!');
      return;
    }

    const sortedByPrice = [...ingredients].sort((a, b) => a.price - b.price);
    
    // Separate ingredients by type
    const energySources = sortedByPrice.filter(i => i.energy > 2600 && i.protein < 15); // Milho, sorgo, etc.
    const proteinSources = sortedByPrice.filter(i => i.protein >= 15); // Farelo de soja, etc.
    const mineralSources = sortedByPrice.filter(i => i.calcium > 5); // Calcário, fosfato, etc.
    const fillerSources = sortedByPrice.filter(i => 
      !energySources.some(e => e.id === i.id) && 
      !proteinSources.some(p => p.id === i.id) && 
      !mineralSources.some(m => m.id === i.id)
    );

    const newIngredients: FormulationIngredient[] = [];
    let remaining = 100;

    // 1. Add mineral source first if in postura or pre-postura
    if ((currentPhase === 'postura' || currentPhase === 'pre_postura_106_126') && mineralSources.length > 0) {
      const mineralAmount = currentPhase === 'postura' ? 8 : 5;
      if (mineralAmount <= remaining) {
        newIngredients.push({ ingredientId: mineralSources[0].id, percentage: mineralAmount });
        remaining -= mineralAmount;
      }
    }

    // 2. Add protein source (cheapest one)
    if (proteinSources.length > 0) {
      let proteinTarget = targets.protein.min;
      let currentProtein = 0;
      let proteinAmount = 0;
      
      // Estimate how much protein source we need
      const mainProtein = proteinSources[0];
      while (currentProtein < proteinTarget && proteinAmount < remaining - 30) {
        proteinAmount += 5;
        currentProtein = (mainProtein.protein * proteinAmount) / 100;
      }
      
      if (proteinAmount > 0 && proteinAmount <= remaining) {
        newIngredients.push({ ingredientId: mainProtein.id, percentage: proteinAmount });
        remaining -= proteinAmount;
      }
    }

    // 3. Add energy source (cheapest one) - fill most of the rest
    if (energySources.length > 0) {
      const energyAmount = Math.max(40, remaining - 10);
      if (energyAmount > 0 && energyAmount <= remaining) {
        newIngredients.push({ ingredientId: energySources[0].id, percentage: energyAmount });
        remaining -= energyAmount;
      }
    }

    // 4. Fill the rest with filler/cheapest available
    const cheapestAvailable = sortedByPrice.find(s => !newIngredients.some(ni => ni.ingredientId === s.id));
    if (cheapestAvailable && remaining > 0) {
      newIngredients.push({ ingredientId: cheapestAvailable.id, percentage: remaining });
    }

    setFormulationDraft(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const handleSaveFormulation = () => {
    if (!formulationDraft.name.trim()) {
      alert('Informe o nome da formulação.');
      return;
    }
    if (formulationTotals.totalPercentage !== 100) {
      alert('A soma dos ingredientes deve ser exatamente 100%.');
      return;
    }
    const payload: FormulationRecord = {
      ...formulationDraft,
      phase: currentPhase,
      animalId: selectedLotId,
      id: editingFormulationId ?? crypto.randomUUID(),
      createdAt: editingFormulationId 
        ? formulations.find(f => f.id === editingFormulationId)?.createdAt ?? new Date().toISOString() 
        : new Date().toISOString()
    };
    
    onSaveFormulation(payload);
    
    if (batchQuantityKg > 0) {
      // Also add to formulated feed stock
      const feedStock: FormulatedFeedStockRecord = {
        id: crypto.randomUUID(),
        formulationId: payload.id,
        quantityKg: batchQuantityKg,
        producedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      onSaveFormulatedFeed(feedStock);
    }
    
    setFormulationDraft(emptyFormulation(currentPhase));
    setEditingFormulationId(null);
    setBatchQuantityKg(0);
  };

  const handleEditFormulation = (formulation: FormulationRecord) => {
    setFormulationDraft(formulation);
    setEditingFormulationId(formulation.id);
    if (formulation.animalId) {
      setSelectedLotId(formulation.animalId);
    }
    setActiveTab('criar');
  };

  const handleDuplicateFormulation = (formulation: FormulationRecord) => {
    const newFormulation: FormulationRecord = {
      ...formulation,
      id: crypto.randomUUID(),
      name: `${formulation.name} (cópia)`,
      createdAt: new Date().toISOString()
    };
    onSaveFormulation(newFormulation);
  };

  const handleSaveIngredient = async () => {
    const trimmedName = ingredientDraft.name.trim();
    if (!trimmedName) {
      alert('Informe o nome do ingrediente.');
      return;
    }

    const isDuplicate = ingredients.some(
      (i) => i.name.toLowerCase().trim() === trimmedName.toLowerCase() && i.id !== editingIngredientId
    );
    if (isDuplicate) {
      alert('Já existe um ingrediente cadastrado com este nome.');
      return;
    }

    try {
      const payload: IngredientRecord = {
        ...ingredientDraft,
        id: editingIngredientId ?? crypto.randomUUID(),
        createdAt: editingIngredientId 
          ? ingredients.find(i => i.id === editingIngredientId)?.createdAt ?? new Date().toISOString() 
          : new Date().toISOString()
      };
      
      await onSaveIngredient(payload);
      setIngredientDraft(emptyIngredient());
      setEditingIngredientId(null);
    } catch (error) {
      console.error('Erro ao salvar ingrediente:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Erro ao salvar ingrediente:\n${errorMsg}`);
    }
  };

  const handleEditIngredient = (ingredient: IngredientRecord) => {
    setIngredientDraft(ingredient);
    setEditingIngredientId(ingredient.id);
  };

  const handleDeleteIngredient = (id: string) => {
    const isUsed = formulations.some(f => f.ingredients.some(fi => fi.ingredientId === id));
    if (isUsed) {
      alert('Não é possível excluir este ingrediente porque ele está sendo usado em uma formulação.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este ingrediente?')) {
      onDeleteIngredient(id);
    }
  };

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => 
      i.name.toLowerCase().includes(searchIngredients.toLowerCase())
    );
  }, [ingredients, searchIngredients]);

  const filteredFormulations = useMemo(() => {
    return formulations.filter(f => 
      f.name.toLowerCase().includes(searchFormulations.toLowerCase())
    );
  }, [formulations, searchFormulations]);

  return (
    <div className="app-section space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-2">
        {[
          { id: 'criar', label: 'Criar Formulação', icon: Calculator },
          { id: 'ingredientes', label: 'Ingredientes', icon: Wheat },
          { id: 'formulacoes', label: 'Formulações Salvas', icon: FileText },
          { id: 'estoque', label: 'Estoque', icon: Package }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'criar' && (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="app-section-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#0f1c2b]">
                  {editingFormulationId ? 'Editar Formulação' : 'Nova Formulação'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione um lote para detectar a fase automaticamente e crie rações balanceadas.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Lote Selection */}
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lote</span>
                <select
                  value={selectedLotId}
                  onChange={(e) => {
                    setSelectedLotId(e.target.value);
                    if (e.target.value) {
                      const lot = animals.find(a => a.id === e.target.value);
                      if (lot) {
                        const age = getBirdAgeInDays(lot.birthDate);
                        setFormulationDraft(prev => ({ ...prev, phase: getPhaseByAge(age) }));
                      }
                    }
                  }}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Selecione um lote (opcional)</option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.tag} - {animal.species} ({animal.quantity} aves)
                    </option>
                  ))}
                </select>
              </label>

              {/* Formulação Name */}
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Nome da Formulação</span>
                <input
                  type="text"
                  value={formulationDraft.name}
                  onChange={(e) => setFormulationDraft(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Ração inicial econômica"
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>

              {/* Phase */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Fase Nutricional</span>
                <select
                  value={formulationDraft.phase}
                  onChange={(e) => setFormulationDraft(prev => ({ ...prev, phase: e.target.value as NutritionalPhase }))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  {Object.entries(PHASE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              {/* Batch Quantity */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Quantidade a produzir (kg)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={batchQuantityKg}
                  onChange={(e) => setBatchQuantityKg(Number(e.target.value || 0))}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>

              {/* Weather Factor */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Clima</span>
                <select
                  value={weatherFactor}
                  onChange={(e) => setWeatherFactor(e.target.value as any)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="normal">Normal</option>
                  <option value="frio">Frio (+15% consumo)</option>
                  <option value="quente">Quente (-10% consumo)</option>
                </select>
              </label>

              {/* Foraging Factor */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">
                  Forrageamento/Piquete: {foragingFactor}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={foragingFactor}
                  onChange={(e) => setForagingFactor(Number(e.target.value))}
                  className="w-full"
                />
              </label>
            </div>

            {/* Ingredients Selection */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-[#0f1c2b]">Ingredientes</h3>
                <button
                  type="button"
                  onClick={handleOptimize}
                  disabled={ingredients.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Otimizar
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {ingredients.map((ingredient) => {
                  const fi = formulationDraft.ingredients.find(i => i.ingredientId === ingredient.id);
                  const percentage = fi?.percentage || 0;
                  
                  return (
                    <div key={ingredient.id} className="grid gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-4 md:grid-cols-[2fr_1fr]">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-[#0f1c2b]">{ingredient.name}</div>
                        <div className="text-xs text-gray-500">
                          {ingredient.protein}% proteína, {ingredient.energy} kcal/kg, {currencyFormatter.format(ingredient.price)}/kg
                        </div>
                        <div className="text-xs text-gray-400">
                          Estoque: {ingredient.stock} kg
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={percentage}
                          onChange={(e) => {
                            const value = Number(e.target.value || 0);
                            setFormulationDraft(prev => {
                              const exists = prev.ingredients.some(i => i.ingredientId === ingredient.id);
                              if (value > 0) {
                                if (exists) {
                                  return {
                                    ...prev,
                                    ingredients: prev.ingredients.map(i => 
                                      i.ingredientId === ingredient.id ? { ...i, percentage: value } : i
                                    )
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    ingredients: [...prev.ingredients, { ingredientId: ingredient.id, percentage: value }]
                                  };
                                }
                              } else {
                                return {
                                  ...prev,
                                  ingredients: prev.ingredients.filter(i => i.ingredientId !== ingredient.id)
                                };
                              }
                            });
                          }}
                          placeholder="%"
                          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                        <span className="text-sm font-bold text-gray-500">%</span>
                      </div>
                    </div>
                  );
                })}

                {ingredients.length === 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                    <p className="text-sm text-gray-500">
                      Nenhum ingrediente cadastrado. Vá para a aba "Ingredientes" para começar.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveFormulation}
                disabled={formulationTotals.totalPercentage !== 100 || !formulationDraft.name.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {editingFormulationId ? 'Atualizar Formulação' : 'Salvar Formulação'}
                {batchQuantityKg > 0 && ' e Produzir'}
              </button>
              {editingFormulationId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingFormulationId(null);
                    setFormulationDraft(emptyFormulation(currentPhase));
                    setBatchQuantityKg(0);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Nutritional Summary */}
          <div className="space-y-6">
            <div className="app-section-card">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-[#0f1c2b]">Resumo Nutricional</h3>
                <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                  formulationTotals.totalPercentage === 100 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {formulationTotals.totalPercentage.toFixed(1)}%
                </div>
              </div>

              <div className="mt-4 space-y-3">
              {[
                { label: 'Proteína Bruta', value: formulationTotals.protein, unit: '%', target: targets.protein },
                { label: 'Energia Metabolizável', value: formulationTotals.energy, unit: 'kcal/kg', target: targets.energy },
                { label: 'Cálcio', value: formulationTotals.calcium, unit: '%', target: targets.calcium },
                { label: 'Fósforo Disponível', value: formulationTotals.phosphorusAvailable, unit: '%', target: targets.phosphorus },
                { label: 'Metionina', value: formulationTotals.methionine, unit: '%', target: targets.methionine },
                { label: 'Metionina + Cistina', value: formulationTotals.metCis, unit: '%', target: targets.metCis },
                { label: 'Lisina', value: formulationTotals.lysine, unit: '%', target: targets.lysine },
                { label: 'Treonina', value: formulationTotals.threonine, unit: '%', target: { min: 0, max: 100 } },
                { label: 'Triptofano', value: formulationTotals.tryptophan, unit: '%', target: { min: 0, max: 100 } },
                { label: 'Fibra Bruta', value: formulationTotals.fiber, unit: '%', target: targets.fiber },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-gray-600">{item.label}</div>
                    <div className="text-sm font-extrabold text-[#0f1c2b]">
                      {item.value.toFixed(2)} {item.unit}
                    </div>
                    {item.target.min !== 0 || item.target.max !== 100 ? (
                      <div className="text-xs text-gray-400">
                        Alvo: {item.target.min} - {item.target.max}
                      </div>
                    ) : null}
                  </div>
                  {item.target.min !== 0 || item.target.max !== 100 ? getStatusBadge(item.value, item.target) : null}
                </div>
              ))}

                <div className="mt-4 rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">Custo</div>
                  <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">
                    {currencyFormatter.format(formulationTotals.costPerKg)}/kg
                  </div>
                </div>
              </div>
            </div>

            {durationEstimate && (
              <div className="app-section-card">
                <h3 className="text-sm font-extrabold text-[#0f1c2b]">Previsão de Duração</h3>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">Aves no lote</span>
                    <span className="text-sm font-bold text-[#0f1c2b]">{durationEstimate.birdCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">Consumo diário</span>
                    <span className="text-sm font-bold text-[#0f1c2b]">{durationEstimate.dailyConsumptionKg.toFixed(2)} kg</span>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Duração estimada</div>
                    <div className="mt-1 text-3xl font-extrabold text-emerald-800">
                      {durationEstimate.days} dias
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'ingredientes' && (
        <section className="grid gap-6">
          {/* Informative banner */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-800">Aviso sobre valores nutricionais</p>
                <p className="text-sm text-amber-700">
                  Os valores nutricionais apresentados pelo sistema são referências técnicas utilizadas para formulação de rações. 
                  Os valores reais dos ingredientes podem variar. Sempre que possível utilize análises laboratoriais ou informações fornecidas pelo fabricante.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="app-section-card">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-extrabold text-[#0f1c2b]">
                    {editingIngredientId ? 'Editar Ingrediente' : 'Novo Ingrediente'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Cadastre matérias-primas com valores nutricionais e preços.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja importar os ingredientes padrão? Isso não sobrescreverá os ingredientes existentes.')) {
                      const existingNames = new Set(ingredients.map(i => i.name.toLowerCase().trim()));
                      DEFAULT_INGREDIENTS.forEach(defaultIng => {
                        if (!existingNames.has(defaultIng.name.toLowerCase().trim())) {
                          onSaveIngredient({
                            ...defaultIng,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString()
                          });
                        }
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Importar Padrão
                </button>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); handleSaveIngredient(); }}>
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Nome do Ingrediente</span>
                  <input
                    type="text"
                    value={ingredientDraft.name}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Milho moído"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Matéria Seca (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ingredientDraft.dryMatter}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, dryMatter: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Proteína Bruta (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ingredientDraft.protein}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, protein: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Energia Metabolizável (kcal/kg)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={ingredientDraft.energy}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, energy: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Cálcio (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.calcium}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, calcium: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Fósforo Total (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.phosphorusTotal}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, phosphorusTotal: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Fósforo Disponível (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.phosphorusAvailable}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, phosphorusAvailable: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Sódio (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.sodium}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, sodium: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Potássio (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.potassium}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, potassium: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Metionina (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.methionine}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, methionine: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Metionina + Cistina (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.metCis}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, metCis: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Lisina (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.lysine}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, lysine: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Treonina (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.threonine}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, threonine: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Triptofano (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={ingredientDraft.tryptophan}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, tryptophan: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Fibra Bruta (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ingredientDraft.fiber}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, fiber: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Extrato Etéreo (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ingredientDraft.etherExtract}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, etherExtract: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Preço (R$/kg)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingredientDraft.price}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, price: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Estoque (kg)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={ingredientDraft.stock}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, stock: Number(e.target.value || 0) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Fonte dos Dados</span>
                  <input
                    type="text"
                    value={ingredientDraft.dataSource}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, dataSource: e.target.value }))}
                    placeholder="Ex: Tabelas Brasileiras para Aves e Suínos"
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Ano da Referência</span>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={ingredientDraft.referenceYear}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, referenceYear: Number(e.target.value || new Date().getFullYear()) }))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    checked={ingredientDraft.userEditable}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, userEditable: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Permitir Edição pelo Usuário</span>
                </label>

                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">Observações Técnicas</span>
                  <textarea
                    value={ingredientDraft.technicalNotes}
                    onChange={(e) => setIngredientDraft(prev => ({ ...prev, technicalNotes: e.target.value }))}
                    placeholder="Adicione observações importantes sobre este ingrediente"
                    rows={3}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
                  />
                </label>

                <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover"
                  >
                    <Plus className="w-4 h-4" />
                    {editingIngredientId ? 'Atualizar Ingrediente' : 'Salvar Ingrediente'}
                  </button>
                  {editingIngredientId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIngredientId(null);
                        setIngredientDraft(emptyIngredient());
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

          <div className="app-section-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Ingredientes Cadastrados</h2>
              <div className="text-sm font-bold text-gray-500">{filteredIngredients.length}</div>
            </div>

            <div className="mt-4">
              <label className="relative w-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchIngredients}
                  onChange={(e) => setSearchIngredients(e.target.value)}
                  placeholder="Buscar ingredientes..."
                  className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </label>
            </div>

            <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
              {filteredIngredients.map((ingredient) => (
                <div key={ingredient.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-[#0f1c2b]">{ingredient.name}</div>
                      <div className="text-xs text-gray-500">
                        {ingredient.protein}% proteína • {ingredient.energy} kcal/kg • {currencyFormatter.format(ingredient.price)}/kg
                      </div>
                      <div className="text-xs text-gray-400">
                        Estoque: {ingredient.stock} kg
                      </div>
                      {ingredient.dataSource && (
                        <div className="text-xs text-blue-600">
                          Fonte: {ingredient.dataSource} {ingredient.referenceYear ? `(${ingredient.referenceYear})` : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditIngredient(ingredient)}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIngredient(ingredient.id)}
                        className="rounded-full p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredIngredients.length === 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Nenhum ingrediente encontrado.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Referências Nutricionais */}
          <div className="app-section-card xl:col-span-2">
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Referências Nutricionais</h2>
            <p className="mt-2 text-sm text-gray-600">
              Os valores cadastrados são valores médios de referência e podem variar conforme: fornecedor, safra, processamento, análise laboratorial, região do país.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-bold text-[#0f1c2b]">Empresa Brasileira de Pesquisa Agropecuária (EMBRAPA)</h3>
                <p className="mt-1 text-xs text-gray-500">Instituição pública com referência em agricultura e nutrição animal.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-bold text-[#0f1c2b]">Universidade Federal de Viçosa (UFV)</h3>
                <p className="mt-1 text-xs text-gray-500">Centro de excelência em ciências agrárias e nutrição.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-bold text-[#0f1c2b]">Tabelas Brasileiras para Aves e Suínos – Rostagno et al.</h3>
                <p className="mt-1 text-xs text-gray-500">Publicação oficial com valores nutricionais padrão para rações.</p>
              </div>
            </div>
          </div>
          </div>
        </section>
      )}

      {activeTab === 'formulacoes' && (
        <section className="app-section-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Formulações Salvas</h2>
              <p className="mt-1 text-sm text-gray-500">
                Biblioteca de rações criadas.
              </p>
            </div>
            <div className="text-sm font-bold text-gray-500">{filteredFormulations.length}</div>
          </div>

          <div className="mt-4">
            <label className="relative w-full xl:max-w-sm">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchFormulations}
                onChange={(e) => setSearchFormulations(e.target.value)}
                placeholder="Buscar formulações..."
                className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-[#0f1c2b] outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredFormulations.map((formulation) => {
              const ingredientCount = formulation.ingredients.length;
              return (
                <div key={formulation.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-[#0f1c2b]">{formulation.name}</h3>
                        {formulation.isActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                            <CheckCircle className="w-3 h-3" /> Ativa
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {PHASE_LABELS[formulation.phase]} • {ingredientCount} ingredientes
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditFormulation(formulation)}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateFormulation(formulation)}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta formulação?')) {
                            onDeleteFormulation(formulation.id);
                          }
                        }}
                        className="rounded-full p-2 text-red-500 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {formulation.ingredients.map((fi) => {
                      const ingredient = ingredients.find(i => i.id === fi.ingredientId);
                      return (
                        <span key={fi.ingredientId} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-gray-600">
                          {ingredient?.name || '?'}: {fi.percentage}%
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredFormulations.length === 0 && (
              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-500">
                  Nenhuma formulação salva. Vá para "Criar Formulação" para começar.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'estoque' && (
        <section className="app-section-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Estoque de Ração Pronta</h2>
              <p className="mt-1 text-sm text-gray-500">
                Histórico de ração produzida e estoque disponível.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {formulatedFeedStock.length > 0 ? (
              formulatedFeedStock
                .slice()
                .sort((a, b) => new Date(b.producedAt).getTime() - new Date(a.producedAt).getTime())
                .map((stock) => {
                  const formulation = formulations.find(f => f.id === stock.formulationId);
                  return (
                    <div key={stock.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-[#0f1c2b]">
                            {formulation?.name || 'Formulação'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Produzido em: {new Date(stock.producedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-extrabold text-[#0f1c2b]">{stock.quantityKg} kg</div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-500">
                  Nenhuma ração produzida ainda.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}