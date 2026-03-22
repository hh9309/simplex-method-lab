import React, { useState } from 'react';
import { Plus, Minus, RefreshCw, Shuffle } from 'lucide-react';
import { LPProblem } from '../types';

interface ProblemInputProps {
  initialProblem: LPProblem;
  onSolve: (problem: LPProblem) => void;
  onRandom: () => void;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ initialProblem, onSolve, onRandom }) => {
  const [numVars, setNumVars] = useState(initialProblem.numVariables);
  const [numConstraints, setNumConstraints] = useState(initialProblem.numConstraints);
  const [objective, setObjective] = useState<number[]>(initialProblem.objective);
  const [constraints, setConstraints] = useState<number[][]>(initialProblem.constraints);
  const [rhs, setRhs] = useState<number[]>(initialProblem.rhs);

  // Helper: Get random integer between 1 and 10
  const getRandomInt = () => Math.floor(Math.random() * 10) + 1;

  // Helper to safely update array state
  const updateObjective = (idx: number, val: string) => {
    const newObj = [...objective];
    newObj[idx] = Number(val) || 0;
    setObjective(newObj);
  };

  const updateConstraint = (row: number, col: number, val: string) => {
    const newConst = [...constraints];
    if (!newConst[row]) newConst[row] = [];
    newConst[row][col] = Number(val) || 0;
    setConstraints(newConst);
  };

  const updateRhs = (idx: number, val: string) => {
    const newRhs = [...rhs];
    newRhs[idx] = Number(val) || 0;
    setRhs(newRhs);
  };

  // When dimensions change, fill new slots with RANDOM numbers instead of 0
  const adjustDimensions = (v: number, c: number) => {
    // Preserve existing data where possible, but if expanding, use random
    const newObj = Array(v).fill(0).map((_, i) => (i < objective.length ? objective[i] : getRandomInt()));
    
    const newCons = Array(c).fill(0).map((_, i) => 
        Array(v).fill(0).map((__, j) => {
            if (constraints[i] && constraints[i][j] !== undefined) return constraints[i][j];
            return getRandomInt();
        })
    );
    
    const newRhs = Array(c).fill(0).map((_, i) => (i < rhs.length ? rhs[i] : getRandomInt() * 5)); // RHS slightly larger

    setNumVars(v);
    setNumConstraints(c);
    setObjective(newObj);
    setConstraints(newCons);
    setRhs(newRhs);
  };

  // Randomize all coefficients for current size
  const randomizeValues = () => {
      const newObj = objective.map(() => getRandomInt());
      const newCons = constraints.map(row => row.map(() => getRandomInt()));
      const newRhs = rhs.map(() => getRandomInt() * 5 + 10);
      setObjective(newObj);
      setConstraints(newCons);
      setRhs(newRhs);
  };

  const handleSolve = () => {
    onSolve({
      numVariables: numVars,
      numConstraints,
      objective,
      constraints,
      rhs
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm mb-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            线性规划设置
            </h2>
            
            <div className="flex gap-2">
                <button 
                    onClick={randomizeValues}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-slate-600 rounded-lg transition-colors text-sm font-medium"
                    title="保留当前行列数，随机生成数据"
                >
                    <Shuffle size={14} />
                    重置数据
                </button>
                <button 
                    onClick={onRandom}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-slate-600 rounded-lg transition-colors text-sm font-medium"
                    title="完全随机生成新的问题"
                >
                    <RefreshCw size={14} />
                    随机题目
                </button>
            </div>
        </div>
        
        {/* Dimensions Controls */}
        <div className="flex flex-wrap gap-4 p-4 bg-surface-50 rounded-lg border border-surface-100">
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide text-xs">变量数 (Variables)</span>
                <div className="flex items-center bg-white rounded-md border border-surface-200 shadow-sm">
                    <button onClick={() => adjustDimensions(Math.max(2, numVars - 1), numConstraints)} className="p-2 hover:bg-surface-50 text-slate-600"><Minus size={14} /></button>
                    <span className="w-8 text-center font-mono font-bold text-slate-800">{numVars}</span>
                    <button onClick={() => adjustDimensions(Math.min(6, numVars + 1), numConstraints)} className="p-2 hover:bg-surface-50 text-slate-600"><Plus size={14} /></button>
                </div>
            </div>
            <div className="w-px h-8 bg-surface-200 hidden sm:block"></div>
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide text-xs">约束数 (Constraints)</span>
                <div className="flex items-center bg-white rounded-md border border-surface-200 shadow-sm">
                    <button onClick={() => adjustDimensions(numVars, Math.max(1, numConstraints - 1))} className="p-2 hover:bg-surface-50 text-slate-600"><Minus size={14} /></button>
                    <span className="w-8 text-center font-mono font-bold text-slate-800">{numConstraints}</span>
                    <button onClick={() => adjustDimensions(numVars, Math.min(6, numConstraints + 1))} className="p-2 hover:bg-surface-50 text-slate-600"><Plus size={14} /></button>
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Objective Function */}
        <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
            <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-primary font-bold text-lg">目标函数 Max Z = </span>
            {Array.from({ length: numVars }).map((_, i) => (
                <React.Fragment key={i}>
                <input
                    type="number"
                    value={objective[i]}
                    onChange={(e) => updateObjective(i, e.target.value)}
                    className="w-16 bg-white border border-surface-200 rounded p-2 text-center text-slate-800 font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm transition-all"
                />
                <span className="font-mono text-slate-400 font-bold">x{i + 1}</span>
                {i < numVars - 1 && <span className="text-slate-400 font-bold">+</span>}
                </React.Fragment>
            ))}
            </div>
        </div>

        {/* Constraints */}
        <div className="space-y-3 pl-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">约束条件 (Subject to):</p>
          {Array.from({ length: numConstraints }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: numVars }).map((__, j) => (
                <React.Fragment key={j}>
                  <input
                    type="number"
                    value={constraints[i]?.[j] ?? 0}
                    onChange={(e) => updateConstraint(i, j, e.target.value)}
                    className="w-16 bg-white border border-surface-200 rounded p-2 text-center text-slate-700 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none shadow-sm"
                  />
                  <span className="font-mono text-slate-400">x{j + 1}</span>
                  {j < numVars - 1 && <span className="text-slate-300">+</span>}
                </React.Fragment>
              ))}
              <span className="font-mono text-slate-400 mx-2">≤</span>
              <input
                type="number"
                value={rhs[i] ?? 0}
                onChange={(e) => updateRhs(i, e.target.value)}
                className="w-20 bg-white border border-surface-200 rounded p-2 text-center text-slate-700 font-medium focus:ring-2 focus:ring-secondary focus:border-secondary outline-none shadow-sm"
              />
            </div>
          ))}
        </div>

        <button 
          onClick={handleSolve}
          className="w-full py-3 mt-4 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
        >
          生成单纯形表并求解
        </button>
      </div>
    </div>
  );
};