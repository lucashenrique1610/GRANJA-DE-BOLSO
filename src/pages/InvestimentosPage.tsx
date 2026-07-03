import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calculator, 
  Wallet, 
  Save, 
  X, 
  PieChart, 
  DollarSign, 
  Hammer, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { InvestmentCategory, InvestmentItem, InvestmentProject } from '@/types';

type CalcFase = 'postura' | 'corte';
type CalcSistema = 'caipira' | 'intensivo';
type CalcPiquete = 'recomendado' | 'minimo' | 'extensivo';

type EstimateModules = {
  infraestrutura: boolean;
  equipamentos: boolean;
  alimentacao_sanidade: boolean;
  aves: boolean;
};

type EstimateItemDraft = Pick<InvestmentItem, 'categoria' | 'descricao' | 'quantidade' | 'precoUnitario'>;

type OfficialEstimateOptions = {
  aves: number;
  fase: CalcFase;
  sistema: CalcSistema;
  piquete: CalcPiquete;
  incluirMaoDeObra: boolean;
  incluirLegalizacao: boolean;
  modulos: EstimateModules;
};

const getDensity = (fase: CalcFase, sistema: CalcSistema) =>
  sistema === 'caipira'
    ? fase === 'postura'
      ? 6
      : 10
    : fase === 'postura'
    ? 10
    : 14;

const getStructureDimensions = (aves: number, fase: CalcFase, sistema: CalcSistema) => {
  const densidade = getDensity(fase, sistema);
  const areaM2 = Math.max(0, Math.ceil(aves / densidade));
  const largura = areaM2 === 0 ? 0 : areaM2 <= 50 ? 5 : areaM2 <= 100 ? 8 : 10;
  const comprimento = largura === 0 ? 0 : Math.ceil(areaM2 / largura);

  return {
    densidade,
    areaM2,
    largura,
    comprimento,
    areaConstruidaM2: largura * comprimento,
  };
};

const buildOfficialEstimate = ({
  aves,
  fase,
  sistema,
  piquete,
  incluirMaoDeObra,
  incluirLegalizacao,
  modulos,
}: OfficialEstimateOptions) => {
  const dimensions = getStructureDimensions(aves, fase, sistema);
  const baseDimensions = getStructureDimensions(100, fase, sistema);
  const areaPiquete = sistema === 'caipira' ? aves * (piquete === 'minimo' ? 0.5 : piquete === 'recomendado' ? 2 : 10) : 0;
  const proporcaoArea =
    baseDimensions.areaConstruidaM2 > 0 ? dimensions.areaConstruidaM2 / baseDimensions.areaConstruidaM2 : 0;
  const f = aves / 100;
  const fatorCercaPiquete = sistema !== 'caipira' ? 0 : piquete === 'extensivo' ? f * 1.5 : f;
  const comedouros = Math.ceil(aves / 35);
  const bebedouros = Math.ceil(aves / 50);
  const ninhos = fase === 'postura' ? Math.ceil(aves / 7) : 0;
  const poleiros = fase === 'postura' ? Math.ceil(aves * 0.15) : 0;
  const kgRacaoPorAve = fase === 'postura' ? 8 : 4.5;
  const precoSacoRacao = fase === 'postura' ? 170 : 185;
  const precoAve = fase === 'postura' ? 6.5 : 3.5;
  const racaoSacos = Math.ceil((aves * kgRacaoPorAve) / 50);
  const apoioHidraulico = aves > 0 ? Math.max(1, Math.ceil(aves / 200)) : 0;
  const items: EstimateItemDraft[] = [];

  const addItem = (item: EstimateItemDraft) => {
    if (item.quantidade > 0) {
      items.push(item);
    }
  };

  if (modulos.infraestrutura) {
    addItem({ categoria: 'infraestrutura', descricao: 'Pilares de eucalipto tratado (5,5 m, bitola 18)', precoUnitario: 265, quantidade: Math.ceil(4 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Pilares centrais de eucalipto tratado (6 m, bitola 18)', precoUnitario: 290, quantidade: Math.ceil(2 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Travessas de eucalipto tratado (6 m, bitola 10-12)', precoUnitario: 100, quantidade: Math.ceil(4 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Caibros de eucalipto tratado (5 m, bitola 8-10)', precoUnitario: 57.5, quantidade: Math.ceil(10 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Ripas de madeira para telhado (metros)', precoUnitario: 7.5, quantidade: Math.ceil(20 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Telhas de fibrocimento (2,44 m, 6 mm)', precoUnitario: 77.5, quantidade: Math.ceil(10 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Telhas de fibrocimento (1,53 m, 6 mm)', precoUnitario: 57.5, quantidade: Math.ceil(10 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Cumeeiras de fibrocimento', precoUnitario: 45, quantidade: Math.ceil(2 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Parafusos para telha com vedação (pct)', precoUnitario: 40, quantidade: Math.ceil(1 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Manta térmica ou pintura refletiva simples', precoUnitario: 275, quantidade: Math.ceil(1 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Blocos de concreto (14 x 19 x 39 cm)', precoUnitario: 4.25, quantidade: Math.ceil(104 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Cimento (saco 50 kg)', precoUnitario: 37.5, quantidade: Math.ceil(8 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Areia (m³)', precoUnitario: 140, quantidade: Math.ceil(1 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Brita (m³)', precoUnitario: 140, quantidade: Math.ceil(2 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Calha de PVC para água da chuva (m)', precoUnitario: 22.5, quantidade: Math.ceil(6 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Rufos e acabamentos (m)', precoUnitario: 17.5, quantidade: Math.ceil(6 * proporcaoArea) });
    addItem({ categoria: 'outros', descricao: 'Cama aviária inicial (maravalha/casca de arroz)', precoUnitario: 375, quantidade: Math.ceil(1 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Fiação cabos 2,5 mm e 1,5 mm (m)', precoUnitario: 4.5, quantidade: Math.ceil(50 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Disjuntores', precoUnitario: 25, quantidade: Math.ceil(2 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Tomadas simples', precoUnitario: 15, quantidade: Math.ceil(2 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Lâmpadas LED para iluminação geral', precoUnitario: 30, quantidade: Math.ceil(2 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Interruptores', precoUnitario: 15, quantidade: Math.ceil(1 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Eletrodutos e acessórios (kit)', precoUnitario: 100, quantidade: Math.ceil(1 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Tubulação PVC 25 mm (m)', precoUnitario: 11.5, quantidade: Math.ceil(20 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Conexões PVC (kit)', precoUnitario: 50, quantidade: Math.ceil(1 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Caixa d’água (500 L)', precoUnitario: 350, quantidade: apoioHidraulico });
    addItem({ categoria: 'infraestrutura', descricao: 'Registros de esfera', precoUnitario: 30, quantidade: Math.ceil(2 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Boia para caixa d’água', precoUnitario: 30, quantidade: apoioHidraulico });
    addItem({ categoria: 'infraestrutura', descricao: 'Filtro simples de entrada', precoUnitario: 140, quantidade: apoioHidraulico });
    addItem({ categoria: 'infraestrutura', descricao: 'Tela galvanizada fio 14 (1,5m altura) (m)', precoUnitario: 14, quantidade: Math.ceil(16 * proporcaoArea) });
    addItem({ categoria: 'infraestrutura', descricao: 'Portão de tela simples para galpão', precoUnitario: 150, quantidade: 1 });
    addItem({ categoria: 'infraestrutura', descricao: 'Cortinas/lonas laterais contra chuva/vento', precoUnitario: 275, quantidade: Math.ceil(1 * proporcaoArea) });

    if (sistema === 'caipira') {
      addItem({ categoria: 'infraestrutura', descricao: 'Postes de eucalipto para piquete', precoUnitario: 22.5, quantidade: Math.ceil(35 * fatorCercaPiquete) });
      addItem({ categoria: 'infraestrutura', descricao: 'Tela para piquete (1,0m altura) (m)', precoUnitario: 11.5, quantidade: Math.ceil(120 * fatorCercaPiquete) });
      addItem({ categoria: 'infraestrutura', descricao: 'Arame e grampos para cerca (kit)', precoUnitario: 145, quantidade: Math.ceil(1 * fatorCercaPiquete) });
      addItem({ categoria: 'infraestrutura', descricao: 'Portões para piquetes', precoUnitario: 225, quantidade: Math.ceil(2 * (fatorCercaPiquete < 1 ? 1 : fatorCercaPiquete)) });
    }

    if (incluirMaoDeObra) {
      addItem({ categoria: 'mao_de_obra', descricao: 'Mão de obra básica da estrutura', precoUnitario: 1750, quantidade: Math.ceil(1 * proporcaoArea) });
      addItem({ categoria: 'mao_de_obra', descricao: 'Serviço de eletricista', precoUnitario: 550, quantidade: Math.ceil(1 * proporcaoArea) });
      addItem({ categoria: 'mao_de_obra', descricao: 'Serviço hidráulico', precoUnitario: 475, quantidade: Math.ceil(1 * proporcaoArea) });
    }
  }

  if (modulos.equipamentos) {
    addItem({ categoria: 'equipamentos', descricao: 'Lâmpada/campânula de aquecimento', precoUnitario: 115, quantidade: Math.ceil(1 * f) });
    addItem({ categoria: 'equipamentos', descricao: 'Temporizador para programa de luz', precoUnitario: 105, quantidade: 1 });
    addItem({ categoria: 'equipamentos', descricao: 'Bebedouros pendulares automáticos', precoUnitario: 105, quantidade: bebedouros });
    addItem({ categoria: 'equipamentos', descricao: 'Comedouros tubulares de 20 kg', precoUnitario: 95, quantidade: comedouros });
    addItem({ categoria: 'equipamentos', descricao: 'Círculo de proteção/pinteiro', precoUnitario: 225, quantidade: Math.ceil(1 * f) });
    addItem({ categoria: 'equipamentos', descricao: 'Ovoscópio simples', precoUnitario: 200, quantidade: 1 });
    addItem({ categoria: 'equipamentos', descricao: 'Balança digital para ovos e ração', precoUnitario: 175, quantidade: 1 });
    addItem({ categoria: 'equipamentos', descricao: 'Ferramentas (pá, vassoura, carrinho, etc)', precoUnitario: 455, quantidade: 1 });

    if (ninhos > 0) {
      addItem({ categoria: 'equipamentos', descricao: 'Ninhos individuais', precoUnitario: 50, quantidade: ninhos });
    }

    if (poleiros > 0) {
      addItem({ categoria: 'equipamentos', descricao: 'Poleiros de madeira (m lineares)', precoUnitario: 17.5, quantidade: poleiros });
    }
  }

  if (modulos.alimentacao_sanidade) {
    addItem({ categoria: 'outros', descricao: `Ração ${fase === 'postura' ? 'até a postura' : 'até o abate'} (sacos 50kg)`, precoUnitario: precoSacoRacao, quantidade: racaoSacos });
    addItem({ categoria: 'outros', descricao: 'Vacinas (Newcastle, Bronquite, Bouba, etc)', precoUnitario: 350, quantidade: Math.ceil(1 * f) });
    addItem({ categoria: 'outros', descricao: 'Vitaminas, vermífugos e antissépticos', precoUnitario: 235, quantidade: Math.ceil(1 * f) });
    addItem({ categoria: 'outros', descricao: 'Produtos de Limpeza (Desinfetante, Cal, Detergente)', precoUnitario: 185, quantidade: Math.ceil(1 * f) });
    addItem({ categoria: 'outros', descricao: 'EPIs (Botas, Luvas, Máscaras)', precoUnitario: 170, quantidade: Math.ceil(1 * (f < 1 ? 1 : f)) });

    if (incluirMaoDeObra) {
      addItem({ categoria: 'mao_de_obra', descricao: 'Consultoria veterinária inicial', precoUnitario: 550, quantidade: 1 });
    }
  }

  if (incluirLegalizacao) {
    addItem({ categoria: 'licencas', descricao: 'Embalagens e Bandejas (Lotes)', precoUnitario: 260, quantidade: Math.ceil(1 * f) });
    addItem({ categoria: 'licencas', descricao: 'Rótulos, carimbos e etiquetas', precoUnitario: 525, quantidade: 1 });
    addItem({ categoria: 'licencas', descricao: 'Taxas, registros e adequações sanitárias', precoUnitario: 1750, quantidade: 1 });
  }

  if (modulos.aves) {
    addItem({ categoria: 'outros', descricao: `Pintainhos de 1 dia (${fase === 'postura' ? 'Postura' : 'Corte'})`, precoUnitario: precoAve, quantidade: Math.ceil(aves * 1.05) });
  }

  const custoBase = items.reduce((sum, item) => sum + item.precoUnitario * item.quantidade, 0);

  return {
    items,
    metrics: {
      densidade: dimensions.densidade,
      areaM2: dimensions.areaM2,
      areaConstruidaM2: dimensions.areaConstruidaM2,
      largura: dimensions.largura,
      comprimento: dimensions.comprimento,
      areaPiquete,
      comedouros,
      bebedouros,
      ninhos,
      custoBase,
      custoMinimo: custoBase * 0.9,
      custoMaximo: custoBase * 1.3,
    },
  };
};

export default function InvestimentosPage() {
  const [activeTab, setActiveTab] = useState<'projetos' | 'calculadora'>('calculadora');
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
  
  // New Project/Item Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemCategory, setNewItemCategory] = useState<InvestmentCategory>('infraestrutura');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQtd, setNewItemQtd] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);

  // Calculadora State
  const [calcAves, setCalcAves] = useState<number>(100);
  const [calcFase, setCalcFase] = useState<CalcFase>('postura');
  const [calcSistema, setCalcSistema] = useState<CalcSistema>('caipira');
  const [calcPiquete, setCalcPiquete] = useState<CalcPiquete>('recomendado');
  const [calcMaoDeObra, setCalcMaoDeObra] = useState<boolean>(true);
  const [calcLegalizacao, setCalcLegalizacao] = useState<boolean>(true);
  const [calcModulos, setCalcModulos] = useState({
    infraestrutura: true,
    equipamentos: true,
    alimentacao_sanidade: true,
    aves: true
  });

  useEffect(() => {
    const saved = localStorage.getItem('granja-investments');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse investments', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('granja-investments', JSON.stringify(projects));
  }, [projects]);

  // --- Calculadora Logic ---
  const calcResults = useMemo(
    () =>
      buildOfficialEstimate({
        aves: calcAves,
        fase: calcFase,
        sistema: calcSistema,
        piquete: calcPiquete,
        incluirMaoDeObra: calcMaoDeObra,
        incluirLegalizacao: calcLegalizacao,
        modulos: calcModulos,
      }).metrics,
    [calcAves, calcFase, calcSistema, calcPiquete, calcMaoDeObra, calcLegalizacao, calcModulos]
  );

  const estimateSummary = useMemo(() => {
    const blocos: string[] = [];

    if (calcModulos.infraestrutura) blocos.push('infraestrutura');
    if (calcModulos.equipamentos) blocos.push('equipamentos');
    if (calcModulos.alimentacao_sanidade) blocos.push('alimentação e sanidade');
    if (calcModulos.aves) blocos.push('lote de aves');
    if (calcMaoDeObra && (calcModulos.infraestrutura || calcModulos.alimentacao_sanidade)) blocos.push('mão de obra');
    if (calcLegalizacao) blocos.push('legalização');

    const base = blocos.length > 0 ? blocos.join(', ') : 'nenhum módulo selecionado';
    const piqueteResumo =
      calcSistema === 'caipira'
        ? ` Piquete configurado em ${calcPiquete}.`
        : ' Sistema intensivo sem piquete.';

    return `Faixa calculada com base nas opções selecionadas: ${base}.${piqueteResumo}`;
  }, [calcLegalizacao, calcMaoDeObra, calcModulos, calcPiquete, calcSistema]);

  const createProjectFromDrafts = (nome: string, drafts: Partial<InvestmentItem>[], isCustomized = false) => {
    const newProject: InvestmentProject = {
      id: crypto.randomUUID(),
      nome,
      status: 'planejamento',
      dataInicio: new Date().toISOString(),
      isCustomized,
      items: drafts.map((item) => ({
        id: crypto.randomUUID(),
        projectId: 'pending',
        categoria: item.categoria!,
        descricao: item.descricao!,
        quantidade: item.quantidade || 1,
        precoUnitario: item.precoUnitario || 0,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newProject.items.forEach((item) => {
      item.projectId = newProject.id;
    });

    setProjects((prev) => [newProject, ...prev]);
    setViewingProjectId(newProject.id);
  };

  const handleCreateProjectFromCurrentEstimate = () => {
    const officialEstimate = buildOfficialEstimate({
      aves: calcAves,
      fase: calcFase,
      sistema: calcSistema,
      piquete: calcPiquete,
      incluirMaoDeObra: calcMaoDeObra,
      incluirLegalizacao: calcLegalizacao,
      modulos: calcModulos,
    });

    createProjectFromDrafts(
      `Projeto Calculado ${calcFase === 'postura' ? 'Poedeiras' : 'Corte'} (${calcAves} aves)`,
      officialEstimate.items,
      false
    );
  };

  // --- Templates Dinâmicos Baseados no Conhecimento ---
  const handleGenerateTemplate = (templateId: string, aves: number, fase: CalcFase, sistema: CalcSistema) => {
    const { largura, comprimento } = getStructureDimensions(aves, fase, sistema);
    const kgRacaoPorAve = fase === 'postura' ? 8 : 4.5;
    const precoSacoRacao = fase === 'postura' ? 170 : 185;
    const precoAve = fase === 'postura' ? 6.5 : 3.5;
    
    const items: Partial<InvestmentItem>[] = [];

    if (templateId === 'galpao-completo') {
      const officialEstimate = buildOfficialEstimate({
        aves,
        fase,
        sistema,
        piquete: sistema === 'caipira' ? 'recomendado' : 'minimo',
        incluirMaoDeObra: true,
        incluirLegalizacao: true,
        modulos: {
          infraestrutura: true,
          equipamentos: true,
          alimentacao_sanidade: true,
          aves: true,
        },
      });

      return { nome: `Projeto Completo ${fase === 'postura' ? 'Poedeiras' : 'Corte'} (${aves} aves)`, items: officialEstimate.items };
    }

    if (templateId === 'baixo-custo') {
      const f = aves / 100;
      const comedouros = Math.ceil(aves / 35);
      const bebedouros = Math.ceil(aves / 50);
      const ninhos = fase === 'postura' ? Math.ceil(aves / 7) : 0;
      const racao_sacos = Math.ceil((aves * kgRacaoPorAve) / 50);
      
      items.push(
        // 1. Infraestrutura (Mínimo viável)
        { categoria: 'infraestrutura', descricao: 'Madeira/Bambu rústico (Pilares e estrutura)', precoUnitario: 350, quantidade: Math.ceil(1 * f) },
        { categoria: 'infraestrutura', descricao: 'Cobertura Alternativa (Telhas ecológicas, palha ou zinco usado)', precoUnitario: 450, quantidade: Math.ceil(1 * f) },
        { categoria: 'infraestrutura', descricao: 'Piso de chão batido com Cama aviária grossa (maravalha)', precoUnitario: 250, quantidade: Math.ceil(1 * f) },
        { categoria: 'infraestrutura', descricao: 'Cortinas simples (Lonas de ráfia ou sacos reciclados)', precoUnitario: 120, quantidade: Math.ceil(1 * f) },
        
        // 2. Instalações
        { categoria: 'infraestrutura', descricao: 'Elétrica básica (Fiação, bocal e lâmpadas comuns)', precoUnitario: 150, quantidade: Math.ceil(1 * f) },
        { categoria: 'infraestrutura', descricao: 'Hidráulica básica (Mangueira, cano simples e boia)', precoUnitario: 120, quantidade: Math.ceil(1 * f) },
        
        // 3. Cercamento
        { categoria: 'infraestrutura', descricao: 'Tela hexagonal simples (galinheiro)', precoUnitario: 9, quantidade: Math.ceil(120 * f) },
        { categoria: 'infraestrutura', descricao: 'Postes/Mourões rústicos para cercado', precoUnitario: 12, quantidade: Math.ceil(25 * f) },
        
        // 4. Equipamentos Alternativos
        { categoria: 'equipamentos', descricao: 'Bebedouros tipo copinho/PET (Baixo custo)', precoUnitario: 18, quantidade: bebedouros * 2 },
        { categoria: 'equipamentos', descricao: 'Comedouros tubulares simples', precoUnitario: 55, quantidade: comedouros },
        { categoria: 'equipamentos', descricao: 'Lâmpada incandescente para aquecimento (Pinteiro)', precoUnitario: 15, quantidade: 2 },
        ...(ninhos > 0 ? [{ categoria: 'equipamentos' as InvestmentCategory, descricao: 'Ninhos adaptados (Baldes, caixas de feira ou madeira reciclada)', precoUnitario: 8, quantidade: ninhos }] : []),
        
        // 5. Alimentação e Manejo
        { categoria: 'outros', descricao: 'Ração inicial e crescimento', precoUnitario: precoSacoRacao, quantidade: racao_sacos },
        { categoria: 'outros', descricao: 'Vacinas principais e polivitamínico (Kit básico)', precoUnitario: 180, quantidade: Math.ceil(1 * f) },
        
        // 6. Aves
        { categoria: 'outros', descricao: `Pintainhos de 1 dia (${fase === 'postura' ? 'Postura Caipira' : 'Corte Caipira'})`, precoUnitario: precoAve, quantidade: Math.ceil(aves * 1.05) }
      );
      
      return { nome: `Projeto Iniciante / MVP (${aves} aves)`, items };
    }

    if (templateId === 'automacao-agua') {
      items.push(
        { categoria: 'equipamentos', descricao: 'Linha de Nipple (Metros)', precoUnitario: 35, quantidade: comprimento },
        { categoria: 'equipamentos', descricao: 'Regulador de Pressão', precoUnitario: 250, quantidade: 1 },
        { categoria: 'equipamentos', descricao: 'Filtro de Água', precoUnitario: 120, quantidade: 1 },
        { categoria: 'infraestrutura', descricao: 'Canos PVC 25mm e Conexões', precoUnitario: 15, quantidade: Math.ceil(comprimento / 3) },
        { categoria: 'mao_de_obra', descricao: 'Instalação Hidráulica (Diárias)', precoUnitario: 250, quantidade: Math.ceil(comprimento / 20) }
      );
      return { nome: `Automação de Bebedouros (${aves} aves)`, items };
    }

    return { nome: 'Projeto Personalizado', items: [] };
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplateId) return;

    const { nome, items } = handleGenerateTemplate(selectedTemplateId, paramAves, paramFase, paramSistema);
    createProjectFromDrafts(nome, items, false);
    setShowTemplateModal(false);
  };

  // State for template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [paramAves, setParamAves] = useState(500);
  const [paramFase, setParamFase] = useState<CalcFase>('postura');
  const [paramSistema, setParamSistema] = useState<CalcSistema>('caipira');

  const currentProjectView = useMemo(() => {
    return projects.find(p => p.id === viewingProjectId);
  }, [projects, viewingProjectId]);

  const handleAddItem = () => {
    if (!currentProjectView) return;
    
    setProjects(prev => prev.map(p => {
      if (p.id === currentProjectView.id) {
        if (editingItemId) {
          return {
            ...p,
            isCustomized: true,
            items: p.items.map(i => i.id === editingItemId ? {
              ...i,
              categoria: newItemCategory,
              descricao: newItemDesc,
              quantidade: newItemQtd,
              precoUnitario: newItemPrice,
            } : i),
            updatedAt: new Date().toISOString()
          };
        } else {
          const item: InvestmentItem = {
            id: crypto.randomUUID(),
            projectId: currentProjectView.id,
            categoria: newItemCategory,
            descricao: newItemDesc,
            quantidade: newItemQtd,
            precoUnitario: newItemPrice,
          };
          return {
            ...p,
            isCustomized: true,
            items: [item, ...p.items],
            updatedAt: new Date().toISOString()
          };
        }
      }
      return p;
    }));

    setShowNewItemModal(false);
    setEditingItemId(null);
    setNewItemDesc('');
    setNewItemQtd(1);
    setNewItemPrice(0);
  };

  const openEditModal = (item: InvestmentItem) => {
    setEditingItemId(item.id);
    setNewItemCategory(item.categoria);
    setNewItemDesc(item.descricao);
    setNewItemQtd(item.quantidade);
    setNewItemPrice(item.precoUnitario);
    setShowNewItemModal(true);
  };

  const handleDeleteItem = (projectId: string, itemId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          isCustomized: true,
          items: p.items.filter(i => i.id !== itemId)
        };
      }
      return p;
    }));
  };

  // --- Render ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-primary to-brand-active text-white shadow-lg shadow-brand-primary/30 shrink-0">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[#0f1c2b] leading-tight">Planejamento e Investimentos</h1>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-gray-500">
              Orçamentos, custos de infraestrutura e engenharia de galpões
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <section className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('calculadora')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'calculadora'
              ? 'bg-brand-primary text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-slate-50'
          }`}
        >
          <Calculator className="h-4 w-4" />
          Calculadora de Galpões
        </button>
        <button
          onClick={() => setActiveTab('projetos')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'projetos'
              ? 'bg-brand-primary text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-slate-50'
          }`}
        >
          <Hammer className="h-4 w-4" />
          Meus Projetos
        </button>
      </section>

      {activeTab === 'calculadora' && (
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Controls */}
          <div className="app-section-card space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Calculator className="h-5 w-5 text-brand-primary" />
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Parâmetros do Galpão</h2>
            </div>
            
            <div className="space-y-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Quantidade de Aves Desejada</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={calcAves}
                  onChange={(e) => setCalcAves(Number(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-700">Fase</span>
                  <select
                    value={calcFase}
                    onChange={(e) => setCalcFase(e.target.value as 'postura' | 'corte')}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="postura">Postura (Ovos)</option>
                    <option value="corte">Corte (Carne)</option>
                  </select>
                </label>
                
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-700">Sistema</span>
                  <select
                    value={calcSistema}
                    onChange={(e) => setCalcSistema(e.target.value as 'caipira' | 'intensivo')}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="caipira">Caipira / Orgânico</option>
                    <option value="intensivo">Intensivo / Confinado</option>
                  </select>
                </label>
              </div>

              {calcSistema === 'caipira' && (
                <div className="space-y-2">
                  <span className="text-sm font-bold text-gray-700">Tipo de Piquete (Pasto)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'minimo', label: 'Mínimo (0,5m²/ave)', desc: 'Menor custo, exige mais manejo' },
                      { id: 'recomendado', label: 'Recomendado (2m²/ave)', desc: 'Equilíbrio ideal' },
                      { id: 'extensivo', label: 'Extensivo (10m²/ave)', desc: 'Mais espaço, maior custo de cerca' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCalcPiquete(opt.id as any)}
                        className={`p-3 text-left rounded-xl border text-sm transition-all ${
                          calcPiquete === opt.id 
                            ? 'border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary' 
                            : 'border-gray-200 bg-white hover:border-brand-primary/50'
                        }`}
                      >
                        <div className={`font-bold ${calcPiquete === opt.id ? 'text-brand-primary' : 'text-gray-700'}`}>{opt.label.split(' ')[0]}</div>
                        <div className={`text-[10px] mt-1 line-clamp-2 ${calcPiquete === opt.id ? 'text-brand-primary/80' : 'text-gray-500'}`}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-brand-primary" />
                  Módulos a Orçar
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'infraestrutura', label: 'Infraestrutura', desc: 'Galpão, elétrica, cerca' },
                    { key: 'equipamentos', label: 'Equipamentos', desc: 'Bebedouros, ninhos' },
                    { key: 'alimentacao_sanidade', label: 'Alim. e Sanidade', desc: 'Ração, vacinas' },
                    { key: 'aves', label: 'Lote de Aves', desc: 'Pintainhas (1 dia)' },
                  ].map((mod) => (
                    <label key={mod.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-brand-primary/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={(calcModulos as any)[mod.key]}
                        onChange={(e) => setCalcModulos(prev => ({ ...prev, [mod.key]: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">{mod.label}</span>
                        <span className="text-[10px] text-gray-500">{mod.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-brand-primary/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={calcMaoDeObra}
                    onChange={(e) => setCalcMaoDeObra(e.target.checked)}
                    disabled={!calcModulos.infraestrutura && !calcModulos.alimentacao_sanidade}
                    className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary disabled:opacity-50"
                  />
                  <div className={`flex flex-col ${(!calcModulos.infraestrutura && !calcModulos.alimentacao_sanidade) ? 'opacity-50' : ''}`}>
                    <span className="text-sm font-bold text-gray-700">Incluir Mão de Obra</span>
                    <span className="text-[10px] text-gray-500">Pedreiros, eletricista, vet.</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-brand-primary/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={calcLegalizacao}
                    onChange={(e) => setCalcLegalizacao(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">Legalização / Licenças</span>
                    <span className="text-[10px] text-gray-500">Taxas, rótulos, sanitário</span>
                  </div>
                </label>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-900 leading-relaxed">
                  Os cálculos utilizam referências padrão da zootecnia moderna. Ajuste as medidas para garantir que o galpão encaixe na topografia do seu terreno.
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-[1.5rem] p-6 sm:p-8 bg-gradient-to-br from-[#0f1c2b] to-slate-800 text-white shadow-2xl relative overflow-hidden border-0 flex flex-col h-full">
            {/* Glowing orb effect */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand-primary opacity-20 blur-3xl pointer-events-none" />
            
            <div className="relative flex-1">
              <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-primary" />
                Projeto Estimado
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Estrutura Principal</div>
                  <div className="grid grid-cols-2 gap-3 min-w-0">
                    <div className="rounded-xl bg-white/5 p-4 border border-white/10 min-w-0">
                      <div className="text-2xl font-black text-white truncate">{calcResults.areaConstruidaM2} <span className="text-sm font-medium text-slate-400">m²</span></div>
                      <div className="text-xs text-slate-400 mt-1 truncate">Área do Galpão</div>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4 border border-white/10 min-w-0">
                      <div className="text-2xl font-black text-white truncate">{calcResults.largura}x{calcResults.comprimento} <span className="text-sm font-medium text-slate-400">m</span></div>
                      <div className="text-xs text-slate-400 mt-1 truncate">Medidas Ideais</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Área útil mínima calculada: {calcResults.areaM2} m²
                  </div>
                </div>

                {calcResults.areaPiquete > 0 && (
                  <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                    <div className="text-2xl font-black text-emerald-400">{calcResults.areaPiquete} <span className="text-sm font-medium text-emerald-600/60">m²</span></div>
                    <div className="text-xs text-emerald-500 mt-1">Área Mínima de Pasto (Piquete)</div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Equipamentos Base</div>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm text-slate-300">Comedouros Tubulares</span>
                      <span className="font-bold text-white">{calcResults.comedouros} unid.</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm text-slate-300">Bebedouros Pendulares</span>
                      <span className="font-bold text-white">{calcResults.bebedouros} unid.</span>
                    </li>
                    {calcFase === 'postura' && (
                      <li className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-sm text-slate-300">Bocas de Ninho</span>
                        <span className="font-bold text-white">{calcResults.ninhos} unid.</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 mt-4">Investimento Total Estimado (Com Reserva)</div>
                  <div className="rounded-xl bg-brand-primary/20 p-4 border border-brand-primary/30 min-w-0">
                    <div className="text-xl md:text-2xl font-black text-white truncate">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcResults.custoMinimo)}
                      <span className="text-base font-bold text-slate-300 mx-2">a</span>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcResults.custoMaximo)}
                    </div>
                    <div className="text-xs text-slate-300 mt-2">
                      {estimateSummary}
                    </div>
                  </div>
                  
                  <div className="mt-4 rounded-xl bg-amber-500/10 p-4 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-400">Começando com pouco dinheiro?</h4>
                      <p className="text-xs text-amber-500/80 leading-relaxed mt-1">
                        O orçamento acima reflete uma estrutura comercial de ponta feita do zero. Para iniciar gastando até <b>70% menos</b>, reaproveite estruturas, use madeiras rústicas e equipamentos alternativos. Crie um projeto usando nosso modelo <b>Projeto Iniciante (Baixo Custo)</b> logo abaixo!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-6 pt-6 border-t border-white/10 mt-auto">
              <button 
                className="w-full rounded-xl bg-white text-[#0f1c2b] py-3 px-4 font-black flex items-center justify-center gap-2 hover:bg-brand-primary hover:text-white transition-colors shadow-xl"
                onClick={handleCreateProjectFromCurrentEstimate}
              >
                <Hammer className="h-5 w-5" />
                Criar Orçamento deste Projeto
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'projetos' && !viewingProjectId && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Hammer className="h-5 w-5 text-brand-primary" />
              <h2 className="text-xl font-extrabold text-[#0f1c2b]">Meus Orçamentos e Projetos</h2>
            </div>
            <button 
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover" 
              onClick={() => {
                const newProject: InvestmentProject = {
                  id: crypto.randomUUID(),
                  nome: 'Novo Projeto Personalizado',
                  status: 'planejamento',
                  dataInicio: new Date().toISOString(),
                  isCustomized: true,
                  items: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setProjects(prev => [newProject, ...prev]);
                setViewingProjectId(newProject.id);
              }}
            >
              <Plus className="h-4 w-4" />
              Criar do Zero
            </button>
          </div>

          {/* Templates Section (For Beginners) */}
          <div className="rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-transparent p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-brand-primary" />
              <h3 className="text-lg font-bold text-[#0f1c2b]">Modelos Inteligentes (Conhecimento Granja de Bolso)</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">Nossos modelos utilizam a base de conhecimento de zootecnia. Você informa a quantidade de aves e nós geramos a lista completa de materiais com as quantidades e estimativas exatas!</p>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-100 min-w-0 flex flex-col h-full" onClick={() => { setSelectedTemplateId('baixo-custo'); setShowTemplateModal(true); }}>
                <h4 className="font-bold text-[#0f1c2b] text-base truncate">Projeto Iniciante (Baixo Custo)</h4>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 mb-4">Focado no mínimo viável. Substitui infraestrutura cara por materiais alternativos e rústicos para começar com o orçamento apertado.</p>
                <div className="mt-auto flex items-center justify-between text-xs font-bold text-amber-600">
                  <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">Configurar Projeto →</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-100 min-w-0 flex flex-col h-full" onClick={() => { setSelectedTemplateId('galpao-completo'); setShowTemplateModal(true); }}>
                <h4 className="font-bold text-[#0f1c2b] text-base truncate">Projeto Completo (Oficial)</h4>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 mb-4">Orçamento comercial baseado nas diretrizes oficiais (infraestrutura reforçada, alvenaria, legalização completa).</p>
                <div className="mt-auto flex items-center justify-between text-xs font-bold text-brand-primary">
                  <span className="flex items-center gap-1 bg-brand-primary/10 px-2 py-1 rounded-md">Configurar Projeto →</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-100 min-w-0 flex flex-col h-full" onClick={() => { setSelectedTemplateId('automacao-agua'); setShowTemplateModal(true); }}>
                <h4 className="font-bold text-[#0f1c2b] text-base truncate">Automação de Bebedouros</h4>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 mb-4">Calcula os metros de canos, niples e reguladores com base no tamanho do seu lote atual.</p>
                <div className="mt-auto flex items-center justify-between text-xs font-bold text-brand-primary">
                  <span className="flex items-center gap-1 bg-brand-primary/10 px-2 py-1 rounded-md">Configurar Projeto →</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Projects List */}
          {projects.length > 0 && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map(proj => {
                const total = proj.items.reduce((sum, item) => sum + (item.precoUnitario * item.quantidade), 0);
                return (
                  <div key={proj.id} className="app-section-card cursor-pointer hover:shadow-md transition-shadow min-w-0" onClick={() => setViewingProjectId(proj.id)}>
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h4 className="font-bold text-[#0f1c2b] truncate">{proj.nome}</h4>
                      <span className={`flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        proj.status === 'planejamento' ? 'bg-amber-100 text-amber-700' :
                        proj.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {proj.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="text-2xl font-black text-gray-900 mb-1">
                      {!proj.isCustomized ? (
                        <>
                          <span className="text-sm font-bold text-gray-500 mr-1">De</span>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total * 0.9)}
                          <span className="text-sm font-bold text-gray-500 mx-1">a</span>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total * 1.3)}
                        </>
                      ) : (
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-4">{proj.items.length} itens no orçamento</div>
                    
                    <div className="text-xs text-brand-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Abrir detalhamento →
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Project Detail View */}
      {activeTab === 'projetos' && viewingProjectId && currentProjectView && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button 
              className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 w-fit"
              onClick={() => setViewingProjectId(null)}
            >
              ← Voltar
            </button>
            <button 
              className="text-sm font-bold text-red-500 hover:text-red-700 w-fit"
              onClick={() => {
                if (confirm('Excluir este projeto inteiro?')) {
                  setProjects(prev => prev.filter(p => p.id !== currentProjectView.id));
                  setViewingProjectId(null);
                }
              }}
            >
              Excluir Projeto
            </button>
          </div>

          <div className="app-section-card border-t-4 border-t-brand-primary min-w-0">
            <h2 className="text-2xl font-black text-[#0f1c2b] mb-1 truncate">{currentProjectView.nome}</h2>
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
              Status: 
              <select 
                className="text-sm bg-gray-50 border border-gray-200 rounded-md py-1 px-2 font-bold"
                value={currentProjectView.status}
                onChange={(e) => {
                  setProjects(prev => prev.map(p => p.id === currentProjectView.id ? {...p, status: e.target.value as any} : p));
                }}
              >
                <option value="planejamento">Em Planejamento</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </p>

            {/* Dashboard & Chart */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <div className="md:col-span-1 rounded-2xl bg-gradient-to-br from-[#0f1c2b] to-slate-800 p-5 text-white">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {currentProjectView.isCustomized ? 'Custo Total Estimado' : 'Faixa de Investimento Estimada'}
                </div>
                <div className="text-3xl font-black">
                  {currentProjectView.isCustomized ? (
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      currentProjectView.items.reduce((sum, i) => sum + (i.precoUnitario * i.quantidade), 0)
                    )
                  ) : (
                    <div className="flex flex-col">
                      <div className="text-2xl">
                        <span className="text-sm font-medium text-slate-400 mr-1">Min:</span>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          currentProjectView.items.reduce((sum, i) => sum + (i.precoUnitario * i.quantidade), 0) * 0.9
                        )}
                      </div>
                      <div className="text-2xl border-t border-white/10 pt-2 mt-2">
                        <span className="text-sm font-medium text-slate-400 mr-1">Max:</span>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          currentProjectView.items.reduce((sum, i) => sum + (i.precoUnitario * i.quantidade), 0) * 1.3
                        )}
                      </div>
                      <div className="text-[10px] text-brand-primary mt-3 leading-tight">
                        *Edite os itens ou preços para obter um orçamento exato.
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Calculate Categories */}
                {['infraestrutura', 'equipamentos', 'mao_de_obra', 'licencas', 'outros'].map(cat => {
                  const catTotal = currentProjectView.items.filter(i => i.categoria === cat).reduce((s, i) => s + (i.precoUnitario * i.quantidade), 0);
                  const colors: any = {
                    infraestrutura: 'text-orange-600 bg-orange-50 border-orange-100',
                    equipamentos: 'text-blue-600 bg-blue-50 border-blue-100',
                    mao_de_obra: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                    licencas: 'text-violet-600 bg-violet-50 border-violet-100',
                    outros: 'text-gray-600 bg-gray-50 border-gray-100'
                  };
                  return (
                    <div key={cat} className={`rounded-xl p-4 border ${colors[cat]}`}>
                      <div className="text-xs font-bold uppercase mb-1 opacity-70">{cat.replace(/_/g, ' ')}</div>
                      <div className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(catTotal)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Itens List */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0f1c2b] text-lg">Itens do Orçamento</h3>
              <button 
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-hover" 
                onClick={() => {
                  setEditingItemId(null);
                  setNewItemDesc('');
                  setNewItemQtd(1);
                  setNewItemPrice(0);
                  setShowNewItemModal(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            <div className="space-y-6">
              {['infraestrutura', 'equipamentos', 'mao_de_obra', 'licencas', 'outros'].map(categoriaKey => {
                const itensCategoria = currentProjectView.items.filter(i => i.categoria === categoriaKey);
                if (itensCategoria.length === 0) return null;

                const catTotal = itensCategoria.reduce((s, i) => s + (i.precoUnitario * i.quantidade), 0);

                return (
                  <div key={categoriaKey} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="font-bold text-gray-800 capitalize flex items-center gap-2">
                        {categoriaKey.replace(/_/g, ' ')}
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{itensCategoria.length} itens</span>
                      </h4>
                      <div className="font-bold text-brand-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(catTotal)}
                      </div>
                    </div>
                    <div className="w-full">
                      <table className="w-full text-left border-collapse">
                        <thead className="hidden sm:table-header-group">
                          <tr className="border-b border-gray-100 bg-white">
                            <th className="py-2 px-4 text-xs font-bold uppercase text-gray-400 w-1/2">Descrição / Material</th>
                            <th className="py-2 px-4 text-xs font-bold uppercase text-gray-400">Qtd</th>
                            <th className="py-2 px-4 text-xs font-bold uppercase text-gray-400">Valor Unit.</th>
                            <th className="py-2 px-4 text-xs font-bold uppercase text-gray-400">Subtotal</th>
                            <th className="py-2 px-4 text-xs font-bold uppercase text-gray-400 w-16">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="block sm:table-row-group">
                          {itensCategoria.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors block sm:table-row border-b border-gray-100 sm:border-0 last:border-0">
                              <td className="pt-3 pb-1 px-4 sm:py-3 font-semibold text-gray-800 text-sm block sm:table-cell">{item.descricao}</td>
                              <td className="py-1 px-4 sm:py-3 text-sm font-medium text-gray-600 flex sm:table-cell justify-between items-center">
                                <span className="sm:hidden text-[10px] uppercase font-bold text-gray-400">Qtd</span>
                                <span>{item.quantidade}</span>
                              </td>
                              <td className="py-1 px-4 sm:py-3 text-sm text-gray-500 flex sm:table-cell justify-between items-center">
                                <span className="sm:hidden text-[10px] uppercase font-bold text-gray-400">Unitário</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoUnitario)}</span>
                              </td>
                              <td className="py-1 px-4 sm:py-3 font-bold text-gray-900 text-sm flex sm:table-cell justify-between items-center">
                                <span className="sm:hidden text-[10px] uppercase font-bold text-gray-400">Subtotal</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantidade * item.precoUnitario)}</span>
                              </td>
                              <td className="py-2 px-4 sm:py-3 flex sm:table-cell justify-end items-center bg-gray-50/50 sm:bg-transparent mt-2 sm:mt-0">
                                <div className="flex items-center gap-2">
                                  <button 
                                    className="text-brand-primary hover:text-brand-active p-1.5 rounded-md hover:bg-brand-primary/10 transition-colors"
                                    onClick={() => openEditModal(item as InvestmentItem)}
                                    title="Editar item"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button 
                                    className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                    onClick={() => handleDeleteItem(currentProjectView.id, item.id)}
                                    title="Excluir item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {currentProjectView.items.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                  Nenhum item adicionado ao projeto ainda. Comece adicionando ou gere um projeto a partir de um modelo.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* New Item Modal */}
      {showNewItemModal && currentProjectView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900">{editingItemId ? 'Editar Item / Custo' : 'Adicionar Item / Custo'}</h3>
              <button onClick={() => setShowNewItemModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700">Descrição (Ex: Saco de Cimento)</span>
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  autoFocus
                />
              </label>
              
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700">Categoria</span>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                >
                  <option value="infraestrutura">Infraestrutura / Materiais</option>
                  <option value="equipamentos">Equipamentos (Bebedouros, etc)</option>
                  <option value="mao_de_obra">Mão de Obra</option>
                  <option value="licencas">Licenças / Legalização</option>
                  <option value="outros">Outros</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-gray-700">Quantidade</span>
                  <input
                    type="number"
                    min="1"
                    value={newItemQtd}
                    onChange={(e) => setNewItemQtd(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-gray-700">Valor Unitário (R$)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                </label>
              </div>

              <button 
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover mt-4"
                onClick={handleAddItem}
                disabled={!newItemDesc.trim()}
              >
                Salvar Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Config Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900">Dimensione seu Projeto</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">Nossa inteligência vai calcular as quantidades exatas baseadas nas configurações do seu lote.</p>

            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-700">Quantidade Prevista de Aves</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={paramAves}
                  onChange={(e) => setParamAves(Number(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  autoFocus
                />
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-gray-700">Fase</span>
                  <select
                    value={paramFase}
                    onChange={(e) => setParamFase(e.target.value as 'postura' | 'corte')}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="postura">Postura (Ovos)</option>
                    <option value="corte">Corte (Carne)</option>
                  </select>
                </label>
                
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-gray-700">Sistema</span>
                  <select
                    value={paramSistema}
                    onChange={(e) => setParamSistema(e.target.value as 'caipira' | 'intensivo')}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#0f1c2b] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="caipira">Caipira</option>
                    <option value="intensivo">Intensivo</option>
                  </select>
                </label>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 flex gap-3 mt-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-900 leading-relaxed font-medium">
                  Os preços gerados são uma média de mercado atual. Você poderá editar cada item, alterar preços e incluir novos materiais após a criação.
                </p>
              </div>

              <button 
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-hover mt-4"
                onClick={handleCreateFromTemplate}
              >
                Gerar Projeto e Orçamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
