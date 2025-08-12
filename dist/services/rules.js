export const defaultRules = [
    { whenCategory: 'analgesico', thenGTIN: '7890000000035', weight: 0.2 },
    { whenCategory: 'analgesico', thenGTIN: '7890000000042', weight: 0.3 }
];
export function ruleBoost(categoriesOfBasket, candidateGTIN) {
    let boost = 0;
    for (const cat of categoriesOfBasket) {
        for (const r of defaultRules) {
            if (r.whenCategory === cat && r.thenGTIN === candidateGTIN)
                boost += r.weight;
        }
    }
    return boost;
}
