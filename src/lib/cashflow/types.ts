/**
 * Cash Flow Statement domain types.
 * These are the plain-number shapes used by the UI and compute module.
 * Server actions convert Drizzle's string numerics into these.
 */

export type SectionKind = 'receipts' | 'outflow';
export type Recurrence = 'monthly' | 'annual' | 'seasonal' | 'calculated';
export type CalculatorType = 'paycheck' | 'purchase' | 'energy';

export interface CfScenario {
    id: string;
    name: string;
    year: number;
    openingCash: number;
    isPrimary: boolean;
    clonedFromId: string | null;
    notes: string | null;
}

export interface CfSection {
    id: string;
    scenarioId: string;
    kind: SectionKind;
    name: string;
    sortOrder: number;
}

export interface CfLineItem {
    id: string;
    scenarioId: string;
    sectionId: string;
    name: string;
    category: string;
    dueDay: number | null;
    recurrence: Recurrence;
    sortOrder: number;
    archived: boolean;
    notes: string | null;
}

export interface CfCell {
    id: string;
    scenarioId: string;
    lineItemId: string;
    month: number; // 0-11
    planned: number;
    actual: number | null;
    paid: boolean;
    note: string | null;
}

export interface CfCalculator {
    id: string;
    scenarioId: string;
    lineItemId: string | null;
    type: CalculatorType;
    name: string;
    params: Record<string, unknown>;
}

/** Everything needed to render one scenario. */
export interface ScenarioBundle {
    scenario: CfScenario;
    sections: CfSection[];
    lineItems: CfLineItem[];
    cells: CfCell[];
    calculators: CfCalculator[];
}

/** Which number a cell contributes to the statement. */
export type StatementMode = 'planned' | 'actual';
