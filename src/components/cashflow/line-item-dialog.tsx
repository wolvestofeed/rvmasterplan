"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CF_CATEGORIES, MONTHS_LONG, RECURRENCE_LABELS } from "@/lib/cashflow/constants";
import type { CfLineItem, CfSection, Recurrence } from "@/lib/cashflow/types";
import type { LineItemInput } from "@/lib/actions/cashflow";
import { parseCell } from "./cell-input";

interface LineItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sections: CfSection[];
    /** Existing line when editing; undefined when adding. */
    line?: CfLineItem;
    /** Preselected section when adding. */
    defaultSectionId?: string;
    onSave: (input: LineItemInput, lineId?: string) => Promise<void>;
    onFill: (lineId: string, amount: number) => Promise<void>;
    onSetAnnual: (lineId: string, month: number, amount: number) => Promise<void>;
    onClear: (lineId: string) => Promise<void>;
    onMove: (lineId: string, direction: -1 | 1) => Promise<void>;
    onArchive: (lineId: string, archived: boolean) => Promise<void>;
    onDelete: (lineId: string) => Promise<void>;
}

export function LineItemDialog(p: LineItemDialogProps) {
    const editing = !!p.line;
    const [name, setName] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [category, setCategory] = useState("Other");
    const [dueDay, setDueDay] = useState("");
    const [recurrence, setRecurrence] = useState<Recurrence>("monthly");
    const [notes, setNotes] = useState("");
    const [fillAmount, setFillAmount] = useState("");
    const [annualMonth, setAnnualMonth] = useState("0");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!p.open) return;
        setName(p.line?.name ?? "");
        setSectionId(p.line?.sectionId ?? p.defaultSectionId ?? p.sections[0]?.id ?? "");
        setCategory(p.line?.category ?? "Other");
        setDueDay(p.line?.dueDay ? String(p.line.dueDay) : "");
        setRecurrence(p.line?.recurrence ?? "monthly");
        setNotes(p.line?.notes ?? "");
        setFillAmount("");
        setAnnualMonth("0");
    }, [p.open, p.line, p.defaultSectionId, p.sections]);

    const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

    const save = () => run(async () => {
        const due = dueDay.trim() === "" ? null : Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1));
        await p.onSave({
            sectionId, name, category, dueDay: due, recurrence, notes: notes.trim() || null,
            fillAmount: !editing && fillAmount.trim() ? parseCell(fillAmount) : undefined,
        }, p.line?.id);
        p.onOpenChange(false);
    });

    return (
        <Dialog open={p.open} onOpenChange={p.onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit line" : "Add line"}</DialogTitle>
                    <DialogDescription>{editing ? "Change how this line appears on the statement, or fill its months below." : "A line is one row on the statement: an income source or a bill."}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label>Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rent" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Section</Label>
                            <Select value={sectionId} onValueChange={setSectionId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{p.sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{CF_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Due day of month</Label>
                            <Input type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="optional" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Recurrence</Label>
                            <Select value={recurrence} onValueChange={v => setRecurrence(v as Recurrence)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(RECURRENCE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Notes</Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" />
                    </div>
                    {!editing && (
                        <div className="grid gap-1.5">
                            <Label>Fill all 12 months with</Label>
                            <Input inputMode="decimal" value={fillAmount} onChange={e => setFillAmount(e.target.value)} placeholder="optional, e.g. 1800" />
                        </div>
                    )}
                    {editing && p.line && (
                        <div className="rounded-lg border border-[#e0e8d5] bg-[#f8fbf5] p-3 grid gap-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Months</div>
                            <div className="flex gap-2 items-end">
                                <div className="grid gap-1 flex-1">
                                    <Label className="text-xs">Amount</Label>
                                    <Input inputMode="decimal" value={fillAmount} onChange={e => setFillAmount(e.target.value)} placeholder="e.g. 1800" />
                                </div>
                                <Button type="button" variant="outline" disabled={busy || !fillAmount.trim()} onClick={() => run(() => p.onFill(p.line!.id, parseCell(fillAmount)))}>Fill all months</Button>
                            </div>
                            <div className="flex gap-2 items-end">
                                <div className="grid gap-1 flex-1">
                                    <Label className="text-xs">Only in</Label>
                                    <Select value={annualMonth} onValueChange={setAnnualMonth}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{MONTHS_LONG.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" variant="outline" disabled={busy || !fillAmount.trim()} onClick={() => run(() => p.onSetAnnual(p.line!.id, parseInt(annualMonth, 10), parseCell(fillAmount)))}>Set annual amount</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => run(() => p.onClear(p.line!.id))}>Clear all months</Button>
                                <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => run(() => p.onMove(p.line!.id, -1))}>Move up</Button>
                                <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => run(() => p.onMove(p.line!.id, 1))}>Move down</Button>
                                <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => run(async () => { await p.onArchive(p.line!.id, !p.line!.archived); p.onOpenChange(false); })}>{p.line.archived ? "Unarchive" : "Archive"}</Button>
                                <Button type="button" size="sm" variant="ghost" className="text-red-700 hover:text-red-800" disabled={busy} onClick={() => { if (confirm(`Delete "${p.line!.name}" and all its months?`)) run(async () => { await p.onDelete(p.line!.id); p.onOpenChange(false); }); }}>Delete</Button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => p.onOpenChange(false)}>Cancel</Button>
                    <Button type="button" className="bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={busy || !name.trim() || !sectionId} onClick={save}>{editing ? "Save" : "Add line"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
