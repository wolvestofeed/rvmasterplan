"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import type { CfScenario } from "@/lib/cashflow/types";

interface RollForwardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scenario: CfScenario;
    /** This scenario's December ending cash, shown so the user knows what next year starts with. */
    endingCash: number;
    onConfirm: (input: { name: string; copyAmounts: boolean }) => Promise<void>;
}

export function RollForwardDialog({ open, onOpenChange, scenario, endingCash, onConfirm }: RollForwardDialogProps) {
    const nextYear = scenario.year + 1;
    const [name, setName] = useState("");
    const [copyAmounts, setCopyAmounts] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(`${nextYear} Budget`);
        setCopyAmounts(true);
    }, [open, nextYear]);

    const confirm = async () => {
        setBusy(true);
        try { await onConfirm({ name: name.trim() || `${nextYear} Budget`, copyAmounts }); onOpenChange(false); }
        finally { setBusy(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Roll forward to {nextYear}</DialogTitle>
                    <DialogDescription>
                        Creates a {nextYear} scenario from &ldquo;{scenario.name}&rdquo; with the same sections and lines.
                        Its January opening cash follows this scenario&apos;s December ending cash ({formatCurrency(endingCash)} right now) and updates whenever {scenario.year} changes.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label>Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    <div className="flex items-start justify-between gap-4 rounded-lg border border-[#e0e8d5] bg-[#f8fbf5] p-3">
                        <div>
                            <div className="text-sm font-medium text-slate-800">Copy planned amounts</div>
                            <div className="text-xs text-slate-500">Off copies the lines only, with every month blank. Paid flags and cell notes are never carried over.</div>
                        </div>
                        <Switch checked={copyAmounts} onCheckedChange={setCopyAmounts} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" className="bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={busy} onClick={confirm}>Roll forward</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
