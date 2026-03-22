import { LPProblem, SimplexResult, SimplexStatus, TableauState } from '../types';

/**
 * Solves a Maximization LP problem using the Simplex Method.
 * Converts to standard form by adding slack variables automatically.
 */
export const solveSimplex = (problem: LPProblem): SimplexResult => {
  const { numVariables, numConstraints, objective, constraints, rhs } = problem;
  
  const steps: TableauState[] = [];
  
  // 1. Setup Initial Tableau
  // Total columns = numVariables + numConstraints (slacks) + 1 (RHS)
  const totalCols = numVariables + numConstraints + 1;
  const variableNames: string[] = [];
  for (let i = 0; i < numVariables; i++) variableNames.push(`x${i + 1}`);
  for (let i = 0; i < numConstraints; i++) variableNames.push(`s${i + 1}`);
  variableNames.push('RHS');

  // Initialize matrix
  // Rows = numConstraints + 1 (Objective Row at bottom)
  const tableau: number[][] = [];
  const basicVariables: number[] = [];

  // Build Constraint Rows
  for (let i = 0; i < numConstraints; i++) {
    const row: number[] = [];
    // Regular variables
    for (let j = 0; j < numVariables; j++) {
      row.push(constraints[i][j] || 0);
    }
    // Slack variables (Identity matrix part)
    for (let k = 0; k < numConstraints; k++) {
      row.push(i === k ? 1 : 0);
    }
    // RHS
    row.push(rhs[i] || 0);
    tableau.push(row);
    // Initially, slack variables are basic. 
    // Variable indices: 0..numVars-1 are x, numVars..totalCols-2 are s
    basicVariables.push(numVariables + i);
  }

  // Build Objective Row (Z row)
  // In standard form: Z - c1x1 - c2x2... = 0
  // So coefficients are -c1, -c2...
  const zRow: number[] = [];
  for (let j = 0; j < numVariables; j++) {
    zRow.push(-(objective[j] || 0));
  }
  for (let k = 0; k < numConstraints; k++) zRow.push(0); // Slacks in Z are 0
  zRow.push(0); // Initial Z value
  tableau.push(zRow);

  // Initial State Record
  let currentState: TableauState = {
    stepIndex: 0,
    tableau: JSON.parse(JSON.stringify(tableau)),
    basicVariables: [...basicVariables],
    variableNames,
    zValue: tableau[tableau.length - 1][totalCols - 1],
    description: "构建初始单纯形表。正在检查最优性。",
    status: SimplexStatus.IN_PROGRESS
  };
  
  // Iteration Loop
  let iteration = 0;
  const MAX_ITERATIONS = 50; // Safety break

  while (iteration < MAX_ITERATIONS) {
    const currentTableau = currentState.tableau;
    const zRowIndex = currentTableau.length - 1;
    const zRowData = currentTableau[zRowIndex];

    // 1. Check Optimality: Are there any negative coefficients in the Z row (excluding RHS)?
    // (For maximization problem converted to Z - Cx = 0 form)
    let minVal = 0;
    let pivotCol = -1;

    for (let j = 0; j < totalCols - 1; j++) {
      if (zRowData[j] < minVal) {
        minVal = zRowData[j];
        pivotCol = j;
      }
    }

    if (pivotCol === -1) {
      // Optimal found
      currentState.status = SimplexStatus.OPTIMAL;
      currentState.description = "Z行所有系数均为非负，已找到最优解。";
      steps.push(currentState);
      break;
    }

    // 2. Determine Pivot Row (Minimum Ratio Test)
    let pivotRow = -1;
    let minRatio = Infinity;

    for (let i = 0; i < numConstraints; i++) {
      const valInPivotCol = currentTableau[i][pivotCol];
      const rhsVal = currentTableau[i][totalCols - 1];

      if (valInPivotCol > 0) {
        const ratio = rhsVal / valInPivotCol;
        if (ratio < minRatio) {
          minRatio = ratio;
          pivotRow = i;
        }
      }
    }

    if (pivotRow === -1) {
      // Unbounded
      currentState.status = SimplexStatus.UNBOUNDED;
      currentState.description = "入基变量列中没有正数，解无界。";
      // Mark the entering var for visualization even if we stop
      currentState.pivotCol = pivotCol;
      currentState.enteringVar = variableNames[pivotCol];
      steps.push(currentState);
      break;
    }

    // Record the pivot decision in the CURRENT state before moving to next
    currentState.pivotRow = pivotRow;
    currentState.pivotCol = pivotCol;
    currentState.enteringVar = variableNames[pivotCol];
    currentState.leavingVar = variableNames[currentState.basicVariables[pivotRow]];
    currentState.description = `主元位置: [行 ${pivotRow + 1}, 列 ${variableNames[pivotCol]}]. 入基: ${currentState.enteringVar}, 出基: ${currentState.leavingVar}.`;
    steps.push(currentState);

    // 3. Perform Gaussian Elimination to create next state
    const nextTableau = currentTableau.map(row => [...row]); // Deep copy
    const pivotVal = currentTableau[pivotRow][pivotCol];

    // Normalize Pivot Row
    for (let j = 0; j < totalCols; j++) {
      nextTableau[pivotRow][j] = currentTableau[pivotRow][j] / pivotVal;
    }

    // Eliminate other rows
    for (let i = 0; i < currentTableau.length; i++) {
      if (i !== pivotRow) {
        const factor = currentTableau[i][pivotCol];
        for (let j = 0; j < totalCols; j++) {
          nextTableau[i][j] = currentTableau[i][j] - factor * nextTableau[pivotRow][j];
        }
      }
    }

    // Update Basic Variables
    const nextBasicVars = [...currentState.basicVariables];
    nextBasicVars[pivotRow] = pivotCol;

    // Create New State
    iteration++;
    currentState = {
      stepIndex: iteration,
      tableau: nextTableau,
      basicVariables: nextBasicVars,
      variableNames,
      zValue: nextTableau[nextTableau.length - 1][totalCols - 1],
      description: "行变换后的新单纯形表。",
      status: SimplexStatus.IN_PROGRESS
    };
  }
  
  if (iteration === MAX_ITERATIONS) {
     currentState.status = SimplexStatus.UNBOUNDED; // Likely cycling or unbounded
     steps.push(currentState);
  }

  return {
    steps,
    finalStatus: steps[steps.length - 1].status
  };
};