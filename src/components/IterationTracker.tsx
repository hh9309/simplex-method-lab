import React from 'react';
import { Calculator, ArrowRight, Sigma, Trophy, CheckCircle2 } from 'lucide-react';
import { TableauState, SimplexStatus } from '../types';
import { toFraction } from '../utils/mathUtils';

interface IterationTrackerProps {
  currentStep: TableauState;
  previousStep: TableauState | null;
}

export const IterationTracker: React.FC<IterationTrackerProps> = ({ currentStep, previousStep }) => {
  // 1. Logic for Initial State
  if (!previousStep) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 mb-6">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
          <Calculator size={18} className="text-blue-500" />
          迭代过程跟踪
        </h3>
        <p className="text-slate-600 text-sm">
          <span className="font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">初始化</span> 
          构建初始单纯形表。所有约束转化为等式形式（引入松弛变量）。
        </p>
      </div>
    );
  }

  // 2. Logic for Optimal Solution Summary
  if (currentStep.status === SimplexStatus.OPTIMAL) {
    // Extract variable values from the final tableau
    // Basic variables take the value of the RHS in their row. Non-basic are 0.
    const solutionMap: Record<string, string> = {};
    const { variableNames, basicVariables, tableau } = currentStep;
    const rhsColIdx = tableau[0].length - 1;

    // Initialize all to 0
    variableNames.slice(0, rhsColIdx).forEach(name => {
        solutionMap[name] = "0";
    });

    // Update basic variables
    basicVariables.forEach((varIdx, rowIdx) => {
        const varName = variableNames[varIdx];
        const val = tableau[rowIdx][rhsColIdx];
        solutionMap[varName] = toFraction(val);
    });

    return (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 mb-6 bg-emerald-50/30">
            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-4 border-b border-emerald-100 pb-2">
                <Trophy size={18} className="text-emerald-600" />
                最优解达成
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                     <div className="text-sm text-emerald-900 font-medium mb-2">最终目标函数值:</div>
                     <div className="text-3xl font-bold text-emerald-600 flex items-baseline gap-2">
                        <span className="text-lg text-emerald-500">Z =</span>
                        {toFraction(currentStep.zValue)}
                     </div>
                     <p className="text-xs text-emerald-700 mt-2 opacity-80">
                        经过 {currentStep.stepIndex} 次迭代，目标函数无法进一步优化。
                     </p>
                </div>
                
                <div className="flex-1 w-full bg-white/60 rounded-lg border border-emerald-100 p-3">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 size={12}/> 变量最优值
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(solutionMap).map(([name, val]) => (
                             // Only show x variables or non-zero slack variables to keep it clean, 
                             // or show all. Let's show variables starting with 'x' prominently.
                             name.startsWith('x') && (
                                <div key={name} className="flex justify-between items-center bg-white p-2 rounded border border-emerald-50 text-sm">
                                    <span className="font-mono font-semibold text-emerald-700">{name}</span>
                                    <span className="font-mono font-bold text-slate-700">{val}</span>
                                </div>
                             )
                        ))}
                         {/* Show Slacks if they are non-zero (optional, good for advanced users) */}
                         {Object.entries(solutionMap).filter(([n, v]) => n.startsWith('s') && v !== '0').map(([name, val]) => (
                                <div key={name} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm opacity-80">
                                    <span className="font-mono text-slate-500">{name}</span>
                                    <span className="font-mono text-slate-600">{val}</span>
                                </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // 3. Logic for Step-by-Step Calculation (Existing Logic)
  const pivotRowIdx = previousStep.pivotRow!;
  const pivotColIdx = previousStep.pivotCol!;
  const pivotElement = previousStep.tableau[pivotRowIdx][pivotColIdx];
  const enteringVar = previousStep.variableNames[pivotColIdx];
  const leavingVar = previousStep.leavingVar;
  
  const pivotRowDisplay = (
    <div className="flex items-center gap-2 text-sm font-mono text-slate-700 bg-amber-50 p-2 rounded border border-amber-100">
      <span className="font-bold">R{pivotRowIdx + 1}'</span>
      <ArrowRight size={14} />
      <span>R{pivotRowIdx + 1} / ({toFraction(pivotElement)})</span>
    </div>
  );

  const otherRowsDisplay = previousStep.tableau.map((row, idx) => {
    if (idx === pivotRowIdx) return null;
    const valInCol = row[pivotColIdx];
    if (Math.abs(valInCol) < 1e-10) return null;

    const rowName = idx === previousStep.tableau.length - 1 ? 'Z' : `R${idx + 1}`;
    
    return (
      <div key={idx} className="flex items-center gap-2 text-sm font-mono text-slate-600">
         <span className="font-bold">{rowName}'</span>
         <span>=</span>
         <span>{rowName}</span>
         <span className="font-bold text-red-500">{valInCol > 0 ? '-' : '+'}</span>
         <span>{toFraction(Math.abs(valInCol))} × <span className="text-amber-600 font-bold">R{pivotRowIdx + 1}'</span></span>
      </div>
    );
  }).filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 mb-6">
      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4 border-b border-surface-100 pb-2">
        <Sigma size={18} className="text-blue-500" />
        步骤 {currentStep.stepIndex} 计算逻辑
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">基变量变更</h4>
          <div className="flex items-center gap-4 text-sm">
             <div className="flex flex-col items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100 min-w-[80px]">
                <span className="text-xs text-emerald-600 font-bold mb-1">入基</span>
                <span className="text-lg font-mono font-bold text-emerald-700">{enteringVar}</span>
             </div>
             <ArrowRight size={20} className="text-slate-300" />
             <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg border border-red-100 min-w-[80px]">
                <span className="text-xs text-red-600 font-bold mb-1">出基</span>
                <span className="text-lg font-mono font-bold text-red-700">{leavingVar}</span>
             </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            由于 <strong>{enteringVar}</strong> 在Z行系数为负且绝对值最大，选择其入基。
            通过最小比值检验，选择 <strong>{leavingVar}</strong> 所在的行作为主元行。
          </p>
        </div>

        <div>
           <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">行变换公式 (高斯消元)</h4>
           <div className="space-y-2">
              <div className="mb-2">
                <span className="text-xs text-amber-600 font-bold mb-1 block">1. 归一化主元行:</span>
                {pivotRowDisplay}
              </div>
              
              {otherRowsDisplay.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 font-bold mb-1 block">2. 消去其他行对应列:</span>
                    <div className="bg-surface-50 p-2 rounded border border-surface-100 space-y-1">
                        {otherRowsDisplay}
                    </div>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};