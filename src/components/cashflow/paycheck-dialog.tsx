"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { computePaycheck, paycheckParamsFrom, type PaycheckParams } from "@/lib/cashflow/paycheck";
import type { CfCalculator, CfLineItem, CfSection } from "@/lib/cashflow/types";

const NEW_LINE = "__new__";

interface PaycheckDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sections: CfSection[];
    lineItems: CfLineItem[];
    existing?: CfCalculator;
    /** Persist params and write netMonthly into all 12 months of the target line
     *  (creating "Primary Income" in the receipts section when targetLineId is NEW_LINE). */
    onApply: (params: PaycheckParams, targetLineId: string | typeof NEW_LINE, calculatorId?: string) => Promise<void>;
}

export function PaycheckDialog({ open, onOpenChange, sections, lineItems, existing, onApply }: PaycheckDialogProps) {
    const [params, setParams] = useState<PaycheckParams>(paycheckParamsFrom(undefined));
    const [target, setTarget] = useState<string>(NEW_LINE);
    const [busy, setBusy] = useState(false);

    const receiptsSectionIds = new Set(sections.filter(s => s.kind === "receipts").map(s => s.id));
    const receiptLines = lineItems.filter(l => receiptsSectionIds.has(l.sectionId) && !l.archived);

    useEffect(() => {
        if (!open) return;
        setParams(paycheckParamsFrom(existing?.params));
        setTarget(existing?.lineItemId ?? (receiptLines.find(l => /income|pay|salary/i.test(l.name))?.id ?? NEW_LINE));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, existing]);

    const result = useMemo(() => computePaycheck(params), [params]);
    const set = (k: keyof PaycheckParams, v: string) => setParams(p => ({ ...p, [k]: k === "mode" ? (v as PaycheckParams["mode"]) : Number(v) || 0 }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Paycheck calculator</DialogTitle>
                    <DialogDescription>Gross pay to net monthly, the way the spreadsheet did it. Applying writes the net monthly figure into every month of the income line.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Pay basis</Label>
                            <Select value={params.mode} onValueChange={v => set("mode", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">Hourly</SelectItem>
                                    <SelectItem value="salary">Annual salary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {params.mode === "hourly" ? (
                            <div className="grid gap-1.5">
                                <Label>Hourly rate</Label>
                                <Input inputMode="decimal" value={params.hourlyRate || ""} onChange={e => set("hourlyRate", e.target.value)} placeholder="e.g. 80" />
                            </div>
                        ) : (
                            <div className="grid gap-1.5">
                                <Label>Annual salary</Label>
                                <Input inputMode="decimal" value={params.annualSalary || ""} onChange={e => set("annualSalary", e.target.value)} placeholder="e.g. 120000" />
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {params.mode === "hourly" && (
                            <div className="grid gap-1.5">
                                <Label>Hours / year</Label>
                                <Input inputMode="numeric" value={params.hoursPerYear || ""} onChange={e => set("hoursPerYear", e.target.value)} />
                            </div>
                        )}
                        <div className="grid gap-1.5">
                            <Label>Pay periods / yr</Label>
                            <Select value={String(params.payPeriodsPerYear)} onValueChange={v => set("payPeriodsPerYear", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="52">52 (weekly)</SelectItem>
                                    <SelectItem value="26">26 (biweekly)</SelectItem>
                                    <SelectItem value="24">24 (semi-monthly)</SelectItem>
                                    <SelectItem value="12">12 (monthly)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Withholding %</Label>
                            <Input inputMode="decimal" value={Math.round(params.taxRate * 1000) / 10 || ""} onChange={e => set("taxRate", String((Number(e.target.value) || 0) / 100))} placeholder="26.4" />
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Pre-tax deductions per check (401k etc.)</Label>
                        <Input inputMode="decimal" value={params.preTaxDeductionsPerPeriod || ""} onChange={e => set("preTaxDeductionsPerPeriod", e.target.value)} placeholder="0" />
                        <p className="text-[11px] text-slate-500">Leave at 0 if you show retirement contributions as their own negative receipt lines, which is how the spreadsheet does it.</p>
                    </div>

                    <div className="rounded-lg border border-[#e0e8d5] bg-[#f8fbf5] p-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <span className="text-slate-500">Gross annual</span><span className="text-right tabular-nums font-medium">{formatCurrency(result.grossAnnual)}</span>
                        <span className="text-slate-500">Gross per check</span><span className="text-right tabular-nums">{formatCurrency(result.grossPerPeriod)}</span>
                        <span className="text-slate-500">Withheld per check</span><span className="text-right tabular-nums">{formatCurrency(result.taxPerPeriod)}</span>
                        <span className="text-slate-500">Net per check</span><span className="text-right tabular-nums font-medium">{formatCurrency(result.netPerPeriod)}</span>
                        <span className="text-slate-500">Net annual</span><span className="text-right tabular-nums">{formatCurrency(result.netAnnual)}</span>
                        <span className="text-brand-primary font-semibold">Net monthly (to statement)</span><span className="text-right tabular-nums font-bold text-brand-primary">{formatCurrency(result.netMonthly)}</span>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Write to income line</Label>
                        <Select value={target} onValueChange={setTarget}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NEW_LINE}>Create &quot;Primary Income&quot; line</SelectItem>
                                {receiptLines.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" className="bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={busy || result.grossAnnual <= 0} onClick={async () => { setBusy(true); try { await onApply(params, target, existing?.id); onOpenChange(false); } finally { setBusy(false); } }}>
                        Apply to statement
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { NEW_LINE as PAYCHECK_NEW_LINE };
