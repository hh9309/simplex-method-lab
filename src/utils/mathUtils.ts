/**
 * Converts a decimal number to a fraction string.
 * Examples: 0.5 -> "1/2", -1.5 -> "-3/2", 3 -> "3", 0.333333 -> "1/3"
 */
export const toFraction = (value: number, tolerance: number = 1.0E-6): string => {
    if (Math.abs(value) < tolerance) return "0";
    if (Number.isInteger(value)) return value.toString();
    
    const sign = value < 0 ? "-" : "";
    const x = Math.abs(value);
    
    // Maximum denominator to check
    const maxDenominator = 100;
    
    let bestNumerator = 1;
    let bestDenominator = 1;
    let bestError = Math.abs(x - bestNumerator / bestDenominator);

    for (let d = 1; d <= maxDenominator; d++) {
        const n = Math.round(x * d);
        const error = Math.abs(x - n / d);
        
        if (error < bestError) {
            bestNumerator = n;
            bestDenominator = d;
            bestError = error;
        }
        
        if (error < tolerance) break;
    }

    if (bestDenominator === 1) return sign + bestNumerator.toString();
    
    // Fallback if no good fraction found or denominator too large
    if (bestDenominator > 100 && bestError > 1e-3) {
        return sign + x.toFixed(2);
    }

    return `${sign}${bestNumerator}/${bestDenominator}`;
};