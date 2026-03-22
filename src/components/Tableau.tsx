import React from 'react';
import { TableauState } from '../types';
import { toFraction } from '../utils/mathUtils';

interface TableauProps {
  state: TableauState;
}

export const Tableau: React.FC<TableauProps> = ({ state }) => {
  const { tableau, variableNames, basicVariables, pivotRow, pivotCol } = state;
  const numRows = tableau.length;

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-200 bg-white shadow-lg">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs uppercase bg-surface-50 text-slate-500 font-semibold tracking-wider">
          <tr>
            <th className="px-4 py-3 border-b border-surface-200">基变量 (Basic)</th>
            {variableNames.map((name, idx) => (
              <th 
                key={name} 
                className={`px-4 py-3 border-b border-surface-200 text-center ${idx === pivotCol ? 'bg-emerald-50 text-emerald-600' : ''}`}
              >
                {name === 'RHS' ? '右端项 (RHS)' : name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableau.map((row, rowIndex) => {
            const isZRow = rowIndex === numRows - 1;
            const isLeaving = rowIndex === pivotRow;
            const basicVarIndex = isZRow ? -1 : basicVariables[rowIndex];
            const basicVarName = isZRow ? 'Z' : variableNames[basicVarIndex];

            return (
              <tr 
                key={rowIndex} 
                className={`
                  border-b border-surface-100 last:border-0 transition-colors duration-300
                  ${isZRow ? 'bg-surface-50 font-bold text-slate-800 border-t-2 border-t-surface-200' : ''}
                  ${isLeaving ? 'bg-red-50' : ''}
                `}
              >
                <td className="px-4 py-3 font-medium border-r border-surface-100 bg-surface-50/50">
                  {basicVarName}
                </td>
                {row.map((cell, colIndex) => {
                  const isPivot = rowIndex === pivotRow && colIndex === pivotCol;
                  const isPivotCol = colIndex === pivotCol;
                  
                  return (
                    <td 
                      key={colIndex} 
                      className={`
                        px-4 py-3 text-center tabular-nums
                        ${isPivot ? 'bg-amber-100 text-amber-700 font-bold ring-2 ring-inset ring-amber-200' : ''}
                        ${!isPivot && isPivotCol ? 'bg-emerald-50/50' : ''}
                        ${isZRow && !isPivot ? 'text-slate-900' : ''}
                      `}
                    >
                      {toFraction(cell)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};