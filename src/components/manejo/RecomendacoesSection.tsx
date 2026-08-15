
import React from 'react';
import {
  CloudLightning,
  Leaf,
  ShieldAlert,
  Egg,
  Lightbulb,
  Activity,
  X,
  Sun,
  Droplets,
  Thermometer,
  Wind,
} from 'lucide-react';
import { KNOWLEDGE_MODULES } from '@/data/knowledge';
import { Recommendation as RecommendationRecord, AnimalRecord, GalpaoRecord } from '@/types';
import { currencyFormatter, numberFormatter } from './ManejoSection.constants';

interface RecomendacoesSectionProps {
  recommendations: RecommendationRecord[];
  animals: AnimalRecord[];
  galpoes: GalpaoRecord[];
  selectedKnowledgeModule: (typeof KNOWLEDGE_MODULES)[0] | null;
  setSelectedKnowledgeModule: (module: (typeof KNOWLEDGE_MODULES)[0] | null) => void;
  weatherData: any;
}

export const RecomendacoesSection: React.FC<RecomendacoesSectionProps> = ({
  recommendations,
  animals,
  galpoes,
  selectedKnowledgeModule,
  setSelectedKnowledgeModule,
  weatherData,
}) => {
  return (
    <div className="grid gap-6">
      {/* Weather Widget */}
      {weatherData && (
        <section className="app-section-card">
          <div className="flex items-center gap-3">
            <Sun className="h-6 w-6 text-amber-500" />
            <div>
              <h2 className="text-lg font-extrabold text-[#0f1c2b]">Condições Climáticas (Sugestão)</h2>
              <p className="text-xs text-gray-500">Dados de temperatura e umidade para orientação</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                <Thermometer className="h-3 w-3" />
                Temperatura
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">
                {weatherData.temperature}°C
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                <Droplets className="h-3 w-3" />
                Umidade
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">
                {weatherData.humidity}%
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                <Wind className="h-3 w-3" />
                Vento
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">
                {weatherData.windSpeed} km/h
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                <CloudLightning className="h-3 w-3" />
                Precipitação
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#0f1c2b]">
                {weatherData.precipitation} mm
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <Lightbulb className="h-5 w-5 text-brand-primary" />
          <div>
            <h2 className="text-lg font-extrabold text-[#0f1c2b]">Recomendações Inteligentes</h2>
            <p className="text-xs text-gray-500">Baseadas no seu lote e condições atuais</p>
          </div>
        </div>

        <div className="grid gap-4">
          {recommendations.map((rec) => {
            let bgClass = 'bg-brand-main';
            let borderClass = 'border-brand-primary/20';
            let textClass = 'text-brand-active';
            let iconColor = 'text-brand-primary';
            let Icon = Lightbulb;

            if (rec.tipo === 'alerta') {
              if (rec.prioridade === 'alta') {
                bgClass = 'bg-red-50/80';
                borderClass = 'border-red-200';
                textClass = 'text-red-700';
                iconColor = 'text-red-600';
              } else {
                bgClass = 'bg-amber-50/80';
                borderClass = 'border-amber-200';
                textClass = 'text-amber-700';
                iconColor = 'text-amber-600';
              }
            } else if (rec.tipo === 'sucesso') {
              bgClass = 'bg-green-50/80';
              borderClass = 'border-green-200';
              textClass = 'text-green-700';
              iconColor = 'text-green-600';
            }

            if (rec.categoria === 'clima') Icon = CloudLightning;
            else if (rec.categoria === 'nutricao') Icon = Leaf;
            else if (rec.categoria === 'sanidade') Icon = ShieldAlert;
            else if (rec.categoria === 'producao') Icon = Egg;

            return (
              <div
                key={rec.id}
                className={`group flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start transition-all hover:shadow-md ${bgClass} ${borderClass}`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-extrabold ${textClass}`}>{rec.titulo}</h3>
                    {rec.prioridade === 'alta' && (
                      <span className="inline-flex animate-pulse items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                        Urgente
                      </span>
                    )}
                  </div>
                  <p className={`mt-1.5 text-sm font-medium leading-relaxed opacity-90 ${textClass}`}>
                    {rec.descricao}
                  </p>

                  {rec.knowledgeModuleId && (
                    <button
                      onClick={() => {
                        const module = KNOWLEDGE_MODULES.find((m) => m.id === rec.knowledgeModuleId);
                        if (module) setSelectedKnowledgeModule(module);
                      }}
                      className={`mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/60 px-4 py-2 text-xs font-bold shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:shadow ${iconColor}`}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      Aprender como lidar com isso
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Knowledge Modal */}
      {selectedKnowledgeModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-extrabold text-[#0f1c2b]">{selectedKnowledgeModule.title}</h2>
              <button onClick={() => setSelectedKnowledgeModule(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: selectedKnowledgeModule.content }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
