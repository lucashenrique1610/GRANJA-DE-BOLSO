import React, { useState, useCallback } from 'react';
import { KnowledgeModule, KnowledgeCategory } from '@/types';
import { getKnowledgeCategories, loadKnowledgeModule } from '@/data/knowledge';
import KnowledgeModulePage from '@/components/KnowledgeModulePage';

export default function ConhecimentoPage() {
  const [selectedModule, setSelectedModule] = useState<KnowledgeModule | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const categories = getKnowledgeCategories();

  const handleModuleSelect = useCallback(async (moduleId: string) => {
    setIsLoading(true);
    try {
      const module = await loadKnowledgeModule(moduleId);
      setSelectedModule(module);
    } catch (error) {
      console.error('Erro ao carregar módulo:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (selectedModule) {
    return (
      <KnowledgeModulePage
        module={selectedModule}
        onBack={() => setSelectedModule(null)}
      />
    );
  }

  return (
    <div className="app-section">
      <div className="space-y-6">
        <div className="app-section-card">
          <div className="app-section-badge">Seção de Conhecimento</div>
          <h1 className="app-section-title">Biblioteca de Conhecimento</h1>
          <p className="app-section-description">
            Acesse todos os módulos organizados por categorias para gerenciar sua granja com sucesso.
          </p>
        </div>

        {isLoading && (
          <div className="app-section-card flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Carregando módulo...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="app-section-card">
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{category.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{category.summary}</p>
                  </div>
                  <div className="text-[var(--brand-primary)]">
                    {expandedCategory === category.id ? '▼' : '▶'}
                  </div>
                </button>

                {expandedCategory === category.id && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {category.modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => handleModuleSelect(module.id)}
                        className="group rounded-xl border border-gray-200 bg-white p-5 text-left hover:border-[var(--brand-primary)] hover:shadow-md transition-all duration-200"
                      >
                        <h3 className="font-semibold text-gray-800 group-hover:text-[var(--brand-primary)]">
                          {module.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">{module.summary}</p>
                        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                          Acessar →
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

