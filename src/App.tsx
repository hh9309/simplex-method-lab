import React, { useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, 
  CheckCircle, AlertCircle, TrendingUp, FastForward
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { Tableau } from './components/Tableau';
import { ProblemInput } from './components/ProblemInput';
import { AIInsightPanel } from './components/AIInsightPanel';
import { IterationTracker } from './components/IterationTracker';
import { useSimplex } from './hooks/useSimplex';
import { LPProblem, SimplexStatus } from './types';

// Default Problem
const DEFAULT_PROBLEM: LPProblem = {
  numVariables: 2,
  numConstraints: 2,
  objective: [3, 4],
  constraints: [
    [1, 2],
    [2, 1]
  ],
  rhs: [10, 8]
};

const Header: React.FC = () => (
  <header className="bg-white border-b border-surface-200 sticky top-0 z-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30">
          S
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          单纯形<span className="text-primary">可视化</span> (SimplexFlow)
        </h1>
      </div>
      <div className="hidden md:flex text-sm text-slate-500 gap-4 font-medium">
         <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 入基变量</span>
         <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> 出基变量</span>
         <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 主元</span>
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const {
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
  } = useSimplex(DEFAULT_PROBLEM);

  useEffect(() => {
    handleSolve(DEFAULT_PROBLEM);
  }, [handleSolve]);

  const currentStep = result?.steps[stepIndex];
  const previousStep = stepIndex > 0 && result ? result.steps[stepIndex - 1] : null;

  const chartData = result?.steps.map((s, i) => {
    const solution: string[] = [];
    const numVars = problem.numVariables;
    const rhsCol = s.tableau[0].length - 1;
    
    for (let j = 0; j < numVars; j++) {
      const basicRowIdx = s.basicVariables.indexOf(j);
      const val = basicRowIdx !== -1 ? s.tableau[basicRowIdx][rhsCol] : 0;
      solution.push(`x${j+1}=${val.toFixed(1)}`);
    }

    return { 
      step: i, 
      z: s.zValue,
      solution: `(${solution.join(', ')})`
    };
  }) || [];

  return (
    <div className="min-h-screen bg-surface-50 text-slate-800 font-sans pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Controls & Charts */}
          <div className="lg:col-span-1 space-y-6">
             <ProblemInput 
                initialProblem={problem} 
                onSolve={handleSolve}
                onRandom={handleRandom}
             />
             
             {/* Progress Chart */}
             <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary"/> 优化路径 (Objective Z)
                </h3>
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="step" hide />
                            <YAxis width={30} stroke="#94a3b8" fontSize={10} tickFormatter={(v) => v.toFixed(1)}/>
                            <Tooltip 
                                contentStyle={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                itemStyle={{color: '#3b82f6', fontWeight: 600}}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length && payload[0].payload) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-2 border border-surface-200 rounded-lg shadow-lg text-xs">
                                                <p className="font-bold text-slate-500 mb-1">步骤 {data.step + 1}</p>
                                                <p className="text-primary font-bold">Z = {data.z.toFixed(2)}</p>
                                                <p className="text-slate-400 font-mono mt-1">{data.solution}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="z" 
                                stroke="#3b82f6" 
                                strokeWidth={3} 
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    const isCurrent = payload.step === stepIndex;
                                    return (
                                        <circle 
                                            key={`dot-${payload.step}`}
                                            cx={cx} cy={cy} r={isCurrent ? 5 : 3} 
                                            fill={isCurrent ? "#10b981" : "#3b82f6"} 
                                            stroke="#fff"
                                            strokeWidth={isCurrent ? 2 : 1}
                                        />
                                    );
                                }}
                                activeDot={{r: 6, stroke: '#fff', strokeWidth: 2}} 
                                label={(props: any) => {
                                    const { x, y, value, index, payload } = props;
                                    const isCurrent = index === stepIndex;
                                    const isLast = result && index === result.steps.length - 1;
                                    
                                    if (!payload) return null;

                                    return (
                                        <g>
                                            <text 
                                                x={x} y={y} dy={-10} 
                                                fill={isCurrent ? "#10b981" : "#64748b"} 
                                                fontSize={10} 
                                                fontWeight={isCurrent ? 700 : 400}
                                                textAnchor="middle"
                                            >
                                                {value.toFixed(1)}
                                            </text>
                                            {(isCurrent || isLast) && payload.solution && (
                                                <text 
                                                    x={x} y={y} dy={-22} 
                                                    fill={isCurrent ? "#059669" : "#94a3b8"} 
                                                    fontSize={9} 
                                                    fontWeight={isCurrent ? 600 : 400}
                                                    textAnchor="middle"
                                                    className="font-mono"
                                                >
                                                    {payload.solution}
                                                </text>
                                            )}
                                        </g>
                                    );
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* Right Column: Visualization & AI */}
          <div className="lg:col-span-2 space-y-6 flex flex-col">
            
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-surface-200 shadow-sm">
               <div className="flex items-center gap-3">
                 <span className="text-sm font-mono font-semibold text-slate-500 bg-surface-100 px-3 py-1 rounded-md">步骤 {stepIndex + 1} / {result?.steps.length || 0}</span>
                 {currentStep?.status === SimplexStatus.OPTIMAL && 
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold flex items-center gap-1.5 border border-emerald-200">
                        <CheckCircle size={14}/> 最优解
                    </span>
                 }
                 {currentStep?.status === SimplexStatus.UNBOUNDED && 
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold flex items-center gap-1.5 border border-red-200">
                        <AlertCircle size={14}/> 解无界
                    </span>
                 }
               </div>

               {/* Playback Controls */}
               <div className="flex items-center gap-2">
                 <button onClick={() => { setIsPlaying(false); setStepIndex(0); }} className="p-2 hover:bg-surface-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="重置">
                    <RotateCcw size={20} />
                 </button>
                 <button onClick={stepBack} disabled={stepIndex === 0} className="p-2 hover:bg-surface-100 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors" title="上一步">
                    <SkipBack size={20} />
                 </button>
                 <button 
                    onClick={() => setIsPlaying(!isPlaying)} 
                    className={`p-2.5 rounded-lg transition-all text-white shadow-md active:scale-95 ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-blue-600'}`}
                    title={isPlaying ? "暂停" : "自动播放"}
                 >
                    {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
                 </button>
                 <button onClick={stepForward} disabled={!result || stepIndex === (result?.steps.length || 0) - 1} className="p-2 hover:bg-surface-100 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors" title="下一步">
                    <SkipForward size={20} />
                 </button>
                 <div className="w-px h-6 bg-surface-200 mx-1"></div>
                 <button 
                    onClick={jumpToOptimal} 
                    disabled={!result || stepIndex === (result?.steps.length || 0) - 1} 
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:bg-surface-50 disabled:text-slate-400"
                    title="直接跳转到最优解"
                 >
                    <FastForward size={16} /> 直接求最优解
                 </button>
               </div>
            </div>

            {/* The Tableau */}
            {currentStep && <Tableau state={currentStep} />}
            
            {/* Iteration Formula Tracker */}
            {currentStep && (
                <IterationTracker 
                    currentStep={currentStep} 
                    previousStep={previousStep} 
                />
            )}

            {/* AI Insight Panel */}
            <div className="flex-1">
                <AIInsightPanel 
                    state={currentStep || null}
                    config={aiConfig}
                    onConfigChange={setAiConfig}
                    explanation={aiExplanation}
                    loading={loadingAi}
                    onGenerateExplanation={fetchExplanation}
                    onAskQuestion={handleAskQuestion}
                />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
