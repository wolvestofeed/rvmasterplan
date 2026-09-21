"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CfScenario } from "@/lib/cashflow/types";
import { parseCell } from "./cell-input";

interface ScenarioDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scenario?: CfScenario;
    onSave: (input: { name: string; year: number; openingCash: number; notes: string | null }, id?: string) => Promise<void>;
}

export function ScenarioDialog({ open, onOpenChange, scenario, onSave }: ScenarioDialogProps) {
    const [name, setName] = useState("");
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [openingCash, setOpeningCash] = useState("");
    const [notes, setNotes] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(scenario?.name ?? "");
        setYear(String(scenario?.year ?? new Date().getFullYear()));
        setOpeningCash(scenario ? String(scenario.openingCash) : "");
        setNotes(scenario?.notes ?? "");
    }, [open, scenario]);

    const save = async () => {
        setBusy(true);
        try {
            await onSave({ name: name.trim(), year: parseInt(year, 10) || new Date().getFullYear(), openingCash: parseCell(openingCash), notes: notes.trim() || null }, scenario?.id);
            onOpenChange(false);
        } finally { setBusy(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{scenario ? "Edit scenario" : "New scenario"}</DialogTitle>
                    <DialogDescription>A scenario is one 12-month statement. Clone it to try a what-if without touching the original.</DialogDescription>
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
                            <Input inputMode="decimal" value={openingCash} onChange={e => setOpeningCash(e.target.value)} placeholder="e.g. 7000" />
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Notes</Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" className="bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={busy} onClick={save}>{scenario ? "Save" : "Create"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
