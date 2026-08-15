import {
  RecommendationFlow,
  HeaterType,
  IntelligentRecommendationContext,
  PersonalizedTip,
  Question,
} from '@/types';
import { getPhaseByAge } from '@/lib/manejo';

export const heaterTypeQuestion: Question = {
  id: 'heaterType',
  text: 'Qual tipo de aquecedor você está usando para este lote?',
  type: 'single_choice',
  options: [
    { value: 'campainha_eletrica', label: 'Campainha Elétrica' },
    { value: 'campainha_gas', label: 'Campainha a Gás' },
    { value: 'aquecedor_infravermelho', label: 'Aquecedor Infravermelho' },
    { value: 'radiador_oleo', label: 'Radiador a Óleo' },
    { value: 'nenhum', label: 'Nenhum (ainda não instalado)' },
    { value: 'outro', label: 'Outro' },
  ],
};

export const criaRecommendationFlow: RecommendationFlow = {
  id: 'cria',
  name: 'Manejo de Pintinhos Recém-chegados',
  triggers: (ctx) => {
    const phase = getPhaseByAge(ctx.ageDays);
    return phase === 'inicial_1_21';
  },
  questions: [heaterTypeQuestion],
  getRecommendations: (ctx, answers): PersonalizedTip[] => {
    const tips: PersonalizedTip[] = [];
    const heaterType = answers.heaterType as HeaterType | undefined;
    const temp = ctx.weatherData?.temperature;
    const age = ctx.ageDays;

    // Base tip: temperature guidelines based on age
    const getTargetTemp = (days: number) => {
      if (days <= 3) return 32;
      if (days <= 7) return 30;
      if (days <= 14) return 28;
      if (days <= 21) return 26;
      return 24;
    };
    const targetTemp = getTargetTemp(age);

    tips.push({
      id: 'temp-alvo',
      title: `Temperatura Alvo: ${targetTemp}°C`,
      content: `Para pintinhos com ${age} dias de idade, mantenha a temperatura de conforto térmico em aproximadamente ${targetTemp}°C. Verifique o comportamento das aves: se estiverem amontoadas, está frio; se estiverem distantes da fonte de calor, está quente.`,
      priority: 'alta',
      category: 'aquecimento',
      sourceModule: 'cria',
    });

    // Heater-specific tips
    if (heaterType === 'campainha_eletrica') {
      tips.push({
        id: 'campainha-eletrica',
        title: 'Dicas para Campainha Elétrica',
        content:
          '1. Verifique regularmente se todas as lâmpadas estão acesas.\n2. Mantenha a campainha a uma altura de 40-50cm do nível da cama.\n3. Instale termostato para controle automático.\n4. Sempre tenha campainhas reserva ou sistema alternativo.',
        priority: 'alta',
        category: 'aquecimento',
        sourceModule: 'instalacoes',
      });
    } else if (heaterType === 'campainha_gas') {
      tips.push({
        id: 'campainha-gas',
        title: 'Dicas para Campainha a Gás',
        content:
          '1. Garanta ventilação adequada para evitar acumulação de CO2 e umidade excessiva.\n2. Verifique conexões de gás regularmente para evitar vazamentos.\n3. Instale detector de gás no galpão.\n4. Mantenha cilindros em área segura e ventilada.',
        priority: 'alta',
        category: 'aquecimento',
        sourceModule: 'instalacoes',
      });
    } else if (heaterType === 'aquecedor_infravermelho') {
      tips.push({
        id: 'infravermelho',
        title: 'Dicas para Aquecedor Infravermelho',
        content:
          '1. Distribua uniformemente os aquecedores para evitar pontos frios.\n2. Limpe regularmente os refletores para manter a eficiência.\n3. Verifique a temperatura no nível das aves, não no teto.',
        priority: 'media',
        category: 'aquecimento',
        sourceModule: 'instalacoes',
      });
    } else if (heaterType === 'nenhum') {
      tips.push({
        id: 'sem-aquecedor',
        title: 'Atenção: Sem Sistema de Aquecimento',
        content:
          'É fundamental instalar um sistema de aquecimento para pintinhos recém-chegados! Eles não regulam sua própria temperatura e morrerão rapidamente sem aquecimento adequado.',
        priority: 'alta',
        category: 'aquecimento',
        sourceModule: 'cria',
      });
    }

    // Weather-based tips
    if (temp !== undefined) {
      if (temp < 25) {
        tips.push({
          id: 'temp-baixa',
          title: 'Alerta: Temperatura Ambiente Baixa',
          content: `A temperatura ambiente é ${Math.round(temp)}°C. Aumente a potência dos aquecedores e verifique se as cortinas estão fechadas corretamente.`,
          priority: 'alta',
          category: 'aquecimento',
        });
      } else if (temp > 35) {
        tips.push({
          id: 'temp-alta',
          title: 'Atenção: Temperatura Ambiente Alta',
          content: `A temperatura ambiente é ${Math.round(temp)}°C. Reduza a potência dos aquecedores e aumente a ventilação gradual para evitar estresse térmico.`,
          priority: 'media',
          category: 'aquecimento',
        });
      }
    }

    // General cria tips
    tips.push({
      id: 'agua-pintinhos',
      title: 'Hidratação Prioritária',
      content: 'Garanta que as aves encontrem água facilmente nas primeiras 24h. Mergulhe os bicos das pintinhas na bebedouro para ensiná-las a beber.',
      priority: 'alta',
      category: 'nutricao',
      sourceModule: 'manejo-da-agua',
    });

    tips.push({
      id: 'cama-cria',
      title: 'Cama de Qualidade',
      content: 'Mantenha a cama sempre seca e fofa. Troque áreas úmidas regularmente para evitar problemas de perna e doenças.',
      priority: 'media',
      category: 'instalacoes',
    });

    return tips.sort((a, b) => {
      const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },
};

// Add more flows for other phases later!
export const recommendationFlows: RecommendationFlow[] = [criaRecommendationFlow];

export const findApplicableFlows = (ctx: IntelligentRecommendationContext): RecommendationFlow[] => {
  return recommendationFlows.filter((flow) => flow.triggers(ctx));
};
