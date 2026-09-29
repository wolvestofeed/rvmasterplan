"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CfScenario } from "@/lib/cashflow/types";
import { parseCell } from "./cell-input";

export interface ScenarioInput {
    name: string;
    year: number;
    openingCash: number;
    /** Earlier-year scenario to carry opening cash from, or null to use the amount. */
    openingSourceScenarioId: string | null;
    notes: string | null;
}

type OpeningMode = "manual" | "linked";

interface ScenarioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scenario?: CfScenario;
    /** All of the user's scenarios; earlier years are offered as an opening-cash source. */
    scenarios: CfScenario[];
    /** What the statement currently opens with (the linked value when linked). Prefills
     *  the amount so switching a linked year back to "enter an amount" does not jump. */
    effectiveOpeningCash?: number;
    onSave: (input: ScenarioInput, id?: string) => Promise<void>;
}

export function ScenarioDialog({ open, onOpenChange, scenario, scenarios, effectiveOpeningCash, onSave }: ScenarioDialogProps) {
    const [name, setName] = useState("");
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [openingCash, setOpeningCash] = useState("");
    const [openingMode, setOpeningMode] = useState<OpeningMode>("manual");
    const [sourceId, setSourceId] = useState("");
    const [notes, setNotes] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(scenario?.name ?? "");
        setYear(String(scenario?.year ?? new Date().getFullYear()));
        setOpeningCash(scenario ? String(effectiveOpeningCash ?? scenario.openingCash) : "");
        setOpeningMode(scenario?.openingSourceScenarioId ? "linked" : "manual");
        setSourceId(scenario?.openingSourceScenarioId ?? "");
        setNotes(scenario?.notes ?? "");
    }, [open, scenario, effectiveOpeningCash]);

    const yearNum = parseInt(year, 10) || new Date().getFullYear();
    // Only earlier years qualify, which also rules out linking a scenario to itself or in a loop.
    const candidates = useMemo(
        () => scenarios
            .filter(s => s.id !== scenario?.id && s.year < yearNum)
            .sort((a, b) => b.year - a.year || Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name)),
        [scenarios, scenario?.id, yearNum],
    );

    // Keep the source pointing at something offerable: default to the latest earlier year.
    useEffect(() => {
        if (openingMode !== "linked") return;
        if (candidates.some(c => c.id === sourceId)) return;
        setSourceId(candidates[0]?.id ?? "");
    }, [openingMode, candidates, sourceId]);

    const linked = openingMode === "linked" && !!sourceId;

    const save = async () => {
        setBusy(true);
        try {
            await onSave({
                name: name.trim(),
                year: yearNum,
                openingCash: parseCell(openingCash),
                openingSourceScenarioId: linked ? sourceId : null,
                notes: notes.trim() || null,
            }, scenario?.id);
            onOpenChange(false);
        } finally { setBusy(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{scenario ? "Edit scenario" : "New scenario"}</DialogTitle>
                    <DialogDescription>A scenario is one 12-month statement, usually one per year.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label>Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2026 Austin" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Year</Label>
                            <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Opening cash (Jan 1)</Label>
                            <Select value={openingMode} onValueChange={v => setOpeningMode(v as OpeningMode)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Enter an amount</SelectItem>
                                    <SelectItem value="linked" disabled={candidates.length === 0}>Carry forward from an earlier year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {openingMode === "manual" ? (
                        <div className="grid gap-1.5">
                            <Label>Amount</Label>
                            <Input inputMode="decimal" value={openingCash} onChange={e => setOpeningCash(e.target.value)} placeholder="e.g. 7000" />
                            {candidates.length === 0 && (
                                <p className="text-xs text-slate-500">Once a scenario for {yearNum - 1} exists, you can carry its December ending cash forward instead.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-1.5">
                            <Label>Carry forward from</Label>
                            <Select value={sourceId} onValueChange={setSourceId}>
                                <SelectTrigger><SelectValue placeholder="Pick a scenario" /></SelectTrigger>
                                <SelectContent>
                                    {candidates.map(c => <SelectItem key={c.id} value={c.id}>{c.isPrimary ? "★ " : ""}{c.name} · {c.year}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">January starts with that scenario&apos;s December ending cash and follows every edit made to it.</p>
                        </div>
                    )}
                    <div className="grid gap-1.5">
                        <Label>Notes</Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" className="bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={busy || (openingMode === "linked" && !sourceId)} onClick={save}>{scenario ? "Save" : "Create"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
