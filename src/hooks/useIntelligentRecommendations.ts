import { useState, useCallback, useMemo } from 'react';
import {
  IntelligentRecommendationContext,
  RecommendationFlow,
  PersonalizedTip,
  Question,
} from '@/types';
import { findApplicableFlows } from '@/data/intelligent-recommendations';

export interface UseIntelligentRecommendationsReturn {
  context: IntelligentRecommendationContext;
  activeFlow: RecommendationFlow | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  answers: Record<string, any>;
  tips: PersonalizedTip[];
  isQuestionnaireComplete: boolean;
  setContext: (ctx: Partial<IntelligentRecommendationContext>) => void;
  answerQuestion: (questionId: string, value: any) => void;
  resetQuestionnaire: () => void;
}

export function useIntelligentRecommendations(
  initialContext?: Partial<IntelligentRecommendationContext>
): UseIntelligentRecommendationsReturn {
  const [context, setContextState] = useState<IntelligentRecommendationContext>({
    ageDays: 0,
    birdCount: 0,
    ...initialContext,
  });

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Find the first applicable flow
  const activeFlow = useMemo(() => {
    const applicable = findApplicableFlows(context);
    return applicable[0] || null;
  }, [context]);

  const currentQuestion = useMemo(() => {
    if (!activeFlow) return null;
    return activeFlow.questions[currentQuestionIndex] || null;
  }, [activeFlow, currentQuestionIndex]);

  const isQuestionnaireComplete = useMemo(() => {
    if (!activeFlow) return true;
    return currentQuestionIndex >= activeFlow.questions.length;
  }, [activeFlow, currentQuestionIndex]);

  // Generate personalized tips
  const tips = useMemo(() => {
    if (!activeFlow || !isQuestionnaireComplete) return [];
    return activeFlow.getRecommendations(context, answers);
  }, [activeFlow, context, answers, isQuestionnaireComplete]);

  const setContext = useCallback((newCtx: Partial<IntelligentRecommendationContext>) => {
    setContextState((prev) => {
      const updated = { ...prev, ...newCtx };
      // If context changes, reset questionnaire if the flow changes
      const oldApplicable = findApplicableFlows(prev)[0];
      const newApplicable = findApplicableFlows(updated)[0];
      if (oldApplicable?.id !== newApplicable?.id) {
        setCurrentQuestionIndex(0);
        setAnswers({});
      }
      return updated;
    });
  }, []);

  const answerQuestion = useCallback((questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setCurrentQuestionIndex((prev) => prev + 1);
  }, []);

  const resetQuestionnaire = useCallback(() => {
    setAnswers({});
    setCurrentQuestionIndex(0);
  }, []);

  return {
    context,
    activeFlow,
    currentQuestionIndex,
    currentQuestion,
    answers,
    tips,
    isQuestionnaireComplete,
    setContext,
    answerQuestion,
    resetQuestionnaire,
  };
}
