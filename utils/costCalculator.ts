export function estimateGenerationCredits(words: number) { return Math.max(4, Math.ceil(words / 180)); }
export function estimateMonthlyCost(credits: number, pricePerCredit = 0.025) { return Number((credits * pricePerCredit).toFixed(2)); }
