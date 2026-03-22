import { useState, useEffect, useRef, useCallback } from 'react';
import { LPProblem, SimplexResult, AIConfig } from '../types';
import { solveSimplex } from '../services/simplexEngine';
import { generateExplanation, generateRandomProblem, askAIQuestion } from '../services/geminiService';

export const useSimplex = (initialProblem: LPProblem) => {
  const [problem, setProblem] = useState<LPProblem>(initialProblem);
  const [result, setResult] = useState<SimplexResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // AI State
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'gemini',
    deepSeekKey: '',
    geminiKey: ''
  });

  const timerRef = useRef<number | null>(null);

  const handleSolve = useCallback((p: LPProblem) => {
    const res = solveSimplex(p);
    setProblem(p);
    setResult(res);
    setStepIndex(0);
    setIsPlaying(false);
    setAiExplanation("");
  }, []);

  const handleAIError = useCallback(async (error: any) => {
    console.error("AI Error detected:", error);
    const errorMsg = error.toString();
    
    if (
        errorMsg.includes("API_KEY_MISSING") ||
        errorMsg.includes("403") ||
        errorMsg.includes("401")
    ) {
        setAiExplanation("API Key 无效或过期，请在设置中检查您的密钥。");
    } else {
        setAiExplanation(`AI 错误: ${error.message || "未知错误"}`);
    }
  }, []);

  const checkKeyReady = useCallback(async (): Promise<boolean> => {
    if (aiConfig.provider === 'gemini') {
        if (!aiConfig.geminiKey) {
             setAiExplanation("请在设置中输入 Google Gemini API Key。");
             return false;
        }
        return true;
    } else {
        if (!aiConfig.deepSeekKey) {
            setAiExplanation("请在 AI 洞察面板中点击齿轮图标，输入 DeepSeek API Key。");
            return false;
        }
        return true;
    }
  }, [aiConfig]);

  const handleRandom = useCallback(async () => {
    setLoadingAi(true);
    const ready = await checkKeyReady();
    if (!ready) {
        setLoadingAi(false);
        return;
    }

    try {
        const newProb = await generateRandomProblem(aiConfig);
        if (newProb) {
            handleSolve(newProb);
            setAiExplanation("已生成新的随机问题。");
        }
    } catch (e) {
        await handleAIError(e);
    } finally {
        setLoadingAi(false);
    }
  }, [aiConfig, checkKeyReady, handleSolve, handleAIError]);

  const fetchExplanation = useCallback(async () => {
    const state = result?.steps[stepIndex];
    if (!state) return;

    setLoadingAi(true);
    const ready = await checkKeyReady();
    if (!ready) {
        setLoadingAi(false);
        return;
    }

    try {
        const text = await generateExplanation(state, aiConfig);
        setAiExplanation(text);
    } catch (e) {
        await handleAIError(e);
    } finally {
        setLoadingAi(false);
    }
  }, [result, stepIndex, aiConfig, checkKeyReady, handleAIError]);

  const handleAskQuestion = useCallback(async (question: string) => {
    const state = result?.steps[stepIndex];
    if (!state) return;

    setLoadingAi(true);
    const ready = await checkKeyReady();
    if (!ready) {
        setLoadingAi(false);
        return;
    }

    try {
        const text = await askAIQuestion(question, state, aiConfig);
        setAiExplanation(text);
    } catch (e) {
        await handleAIError(e);
    } finally {
        setLoadingAi(false);
    }
  }, [result, stepIndex, aiConfig, checkKeyReady, handleAIError]);

  const stepForward = useCallback(() => {
    if (result && stepIndex < result.steps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }, [result, stepIndex]);

  const stepBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }, [stepIndex]);

  const jumpToOptimal = useCallback(() => {
    if (result && result.steps.length > 0) {
        setStepIndex(result.steps.length - 1);
        setIsPlaying(false);
    }
  }, [result]);

  // Auto-play Logic
  useEffect(() => {
    if (isPlaying && result) {
      timerRef.current = window.setInterval(() => {
        setStepIndex(prev => {
          if (prev < result.steps.length - 1) {
             return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1500); 
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, result]);

  return {
    problem,
    result,
    stepIndex,
    isPlaying,
    setIsPlaying,
    aiExplanation,
    loadingAi,
    aiConfig,
    setAiConfig,
    handleSolve,
    handleRandom,
    fetchExplanation,
    handleAskQuestion,
    stepForward,
    stepBack,
    jumpToOptimal,
    setStepIndex
  };
};
