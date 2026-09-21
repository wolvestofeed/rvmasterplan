import type { SectionKind } from './types';

export const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const MONTHS_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Categories for cash-flow lines. Broader than ExpenseCategory because a
 *  statement covers the whole household, not only RV purchases. */
export const CF_CATEGORIES = [
    'Income',
    'Retirement & Savings',
    'Housing',
    'Utilities',
    'Phone & Internet',
    'Insurance',
    'Food',
    'Fuel & Vehicle',
    'Health',
    'Subscriptions',
    'Debt',
    'Taxes & Fees',
    'Campground',
    'Propane',
    'Maintenance',
    'Recreation',
    'Work',
    'Other',
] as const;
export type CfCategory = typeof CF_CATEGORIES[number];

export const RECURRENCE_LABELS: Record<string, string> = {
    monthly: 'Monthly',
    annual: 'Annual (one month)',
    seasonal: 'Seasonal (varies)',
    calculated: 'From calculator',
};

/** Sections every new scenario starts with, mirroring the spreadsheet. */
export const DEFAULT_SECTIONS: { kind: SectionKind; name: string; sortOrder: number }[] = [
    { kind: 'receipts', name: 'Cash Receipts', sortOrder: 0 },
    { kind: 'outflow', name: 'Cash Paid Out', sortOrder: 1 },
    { kind: 'outflow', name: 'Additional Expenses', sortOrder: 2 },
];
