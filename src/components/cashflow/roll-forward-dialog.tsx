"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import type { CfScenario } from "@/lib/cashflow/types";

interface RollForwardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scenario: CfScenario;
    /** This scenario's December ending cash, shown so the user knows what next year starts with. */
    endingCash: number;
    onConfirm: (input: { name: string }) => Promise<void>;
}

export function RollForwardDialog({ open, onOpenChange, scenario, endingCash, onConfirm }: RollForwardDialogProps) {
    const nextYear = scenario.year + 1;
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(`${nextYear} Budget`);
    }, [open, nextYear]);

    const confirm = async () => {
        setBusy(true);
        try { await onConfirm({ name: name.trim() || `${nextYear} Budget` }); onOpenChange(false); }
        finally { setBusy(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Roll forward to {nextYear}</DialogTitle>
                    <DialogDescription>
                        Creates {nextYear} from &ldquo;{scenario.name}&rdquo;: every line with all of its details, and every month&apos;s amount carried into the same month next year.
                        January opening cash follows this scenario&apos;s December ending cash ({formatCurrency(endingCash)} right now) and updates whenever {scenario.year} changes.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label>Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    <div className="rounded-lg border border-[#e0e8d5] bg-[#f8fbf5] p-3 text-xs text-slate-600 space-y-1">
                        <div><span className="font-medium text-slate-800">Monthly lines</span> also fill any month that is still empty this year with their latest amount, so next year starts with every bill from January. A monthly line with an amount in only one month is treated as a one-off and copied as is.</div>
                        <div><span className="font-medium text-slate-800">Annual, seasonal and calculator lines</span> keep exactly the months they have this year.</div>
                        <div>Paid flags and cell notes are not carried over. Override any month by hand afterwards.</div>
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
