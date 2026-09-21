/**
 * Paycheck calculator, mirroring the side-calc on the spreadsheet:
 *   hourly × hours/yr = gross annual → ÷ pay periods = gross per check
 *   × tax rate = withheld → net per check; net monthly = gross annual × (1 − tax) ÷ 12
 */

export interface PaycheckParams {
    mode: 'hourly' | 'salary';
    hourlyRate: number;
    hoursPerYear: number;        // 2080 for full time
    annualSalary: number;
    payPeriodsPerYear: number;   // 26 biweekly, 24 semi-monthly, 12 monthly, 52 weekly
    taxRate: number;             // 0.264 = 26.4% combined withholding
    /** Per-period pre-tax deductions (e.g. 401k). Reduces net pay only; they are also
     *  shown as their own negative receipt lines on the statement if you want them there. */
    preTaxDeductionsPerPeriod: number;
}

export interface PaycheckResult {
    grossAnnual: number;
    grossPerPeriod: number;
    taxPerPeriod: number;
    netPerPeriod: number;
    netAnnual: number;
    /** grossAnnual × (1 − taxRate) ÷ 12: what the sheet's "Net Monthly" cell does. */
    netMonthly: number;
}

export const DEFAULT_PAYCHECK: PaycheckParams = {
    mode: 'hourly',
    hourlyRate: 0,
    hoursPerYear: 2080,
    annualSalary: 0,
    payPeriodsPerYear: 26,
    taxRate: 0.264,
    preTaxDeductionsPerPeriod: 0,
};

export function computePaycheck(p: PaycheckParams): PaycheckResult {
    const grossAnnual = p.mode === 'hourly' ? p.hourlyRate * p.hoursPerYear : p.annualSalary;
    const periods = Math.max(1, p.payPeriodsPerYear);
    const grossPerPeriod = grossAnnual / periods;
    const taxable = Math.max(0, grossPerPeriod - (p.preTaxDeductionsPerPeriod || 0));
    const taxPerPeriod = taxable * p.taxRate;
    const netPerPeriod = grossPerPeriod - (p.preTaxDeductionsPerPeriod || 0) - taxPerPeriod;
    const netAnnual = netPerPeriod * periods;
    const netMonthly = (grossAnnual * (1 - p.taxRate)) / 12;
    return { grossAnnual, grossPerPeriod, taxPerPeriod, netPerPeriod, netAnnual, netMonthly };
}

export function paycheckParamsFrom(raw: Record<string, unknown> | undefined): PaycheckParams {
    const r = raw || {};
    const num = (k: keyof PaycheckParams) => {
        const v = Number(r[k]);
        return Number.isFinite(v) ? v : (DEFAULT_PAYCHECK[k] as number);
    };
    return {
        mode: r.mode === 'salary' ? 'salary' : 'hourly',
        hourlyRate: num('hourlyRate'),
        hoursPerYear: num('hoursPerYear'),
        annualSalary: num('annualSalary'),
        payPeriodsPerYear: num('payPeriodsPerYear'),
        taxRate: num('taxRate'),
        preTaxDeductionsPerPeriod: num('preTaxDeductionsPerPeriod'),
    };
}
