"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiBlock } from "@/components/ui/kpi-block";
import { KpiValue } from "@/components/ui/kpi-value";
import { formatCurrency, cn } from "@/lib/utils";
import { MONTHS_LONG } from "@/lib/cashflow/constants";
import { billsForMonth, type StatementComputed } from "@/lib/cashflow/compute";
import type { ScenarioBundle } from "@/lib/cashflow/types";

interface BillsViewProps {
    bundle: ScenarioBundle;
    computed: StatementComputed;
    month: number;
    onMonthChange: (m: number) => void;
    readOnly: boolean;
    todayDay: number | null; // day of month when viewing the live month, else null
    onTogglePaid: (lineItemId: string, month: number, paid: boolean) => void;
}

export function BillsView({ bundle, computed, month, onMonthChange, readOnly, todayDay, onTogglePaid }: BillsViewProps) {
    const rows = billsForMonth(bundle, month);
    const mo = computed.months[month];
    const receipts = rows.filter(r => r.section.kind === "receipts");
    const bills = rows.filter(r => r.section.kind === "outflow");
    const received = receipts.filter(r => r.paid).reduce((a, r) => a + r.amount, 0);
    const paidOut = bills.filter(r => r.paid).reduce((a, r) => a + r.amount, 0);
    const stillDue = bills.filter(r => !r.paid).reduce((a, r) => a + r.amount, 0);
    const cashNow = mo.opening + received - paidOut;
    const upcoming = todayDay !== null ? bills.filter(r => !r.paid && r.lineItem.dueDay !== null && r.lineItem.dueDay >= todayDay && r.lineItem.dueDay < todayDay + 14) : [];

    const renderRows = (list: typeof rows, kind: "receipts" | "outflow") => (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-[11px] uppercase tracking-wide text-brand-primary">
                    <th className="text-left px-2 py-1.5 w-14">Due</th>
                    <th className="text-left px-2 py-1.5">Line</th>
                    <th className="text-right px-2 py-1.5">Amount</th>
                    <th className="text-center px-2 py-1.5 w-24">{kind === "receipts" ? "Received" : "Paid"}</th>
                </tr>
            </thead>
            <tbody>
                {list.length === 0 && <tr><td colSpan={4} className="px-2 py-3 text-xs italic text-slate-400">Nothing this month.</td></tr>}
                {list.map(r => {
                    const overdue = todayDay !== null && !r.paid && r.lineItem.dueDay !== null && r.lineItem.dueDay < todayDay;
                    const soon = todayDay !== null && !r.paid && r.lineItem.dueDay !== null && r.lineItem.dueDay >= todayDay && r.lineItem.dueDay <= todayDay + 3;
                    return (
                        <tr key={r.lineItem.id} className={cn("border-t border-[#e0e8d5]", r.paid && "text-slate-400")}>
                            <td className="px-2 py-1.5 tabular-nums">
                                {r.lineItem.dueDay ?? <span className="text-slate-300">—</span>}
                                {overdue && <Badge variant="destructive" className="ml-1 px-1 py-0 text-[10px]">late</Badge>}
                                {soon && <Badge className="ml-1 px-1 py-0 text-[10px] bg-brand-solar text-white">soon</Badge>}
                            </td>
                            <td className="px-2 py-1.5">
                                <div className={cn("font-medium", r.paid && "line-through")}>{r.lineItem.name}</div>
                                <div className="text-[11px] text-slate-500">{r.lineItem.category}{r.cell?.note ? ` · ${r.cell.note}` : ""}</div>
                            </td>
                            <td className={cn("px-2 py-1.5 text-right tabular-nums font-medium", r.amount < 0 && "text-red-700")}>{formatCurrency(r.amount)}</td>
                            <td className="px-2 py-1.5 text-center">
                                <Switch checked={r.paid} disabled={readOnly} onCheckedChange={(v) => onTogglePaid(r.lineItem.id, month, v)} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">Month</span>
                    <Select value={String(month)} onValueChange={v => onMonthChange(parseInt(v, 10))}>
                        <SelectTrigger className="w-[170px] bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>{MONTHS_LONG.map((m, i) => <SelectItem key={m} value={String(i)}>{m} {bundle.scenario.year}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                {upcoming.length > 0 && (
                    <div className="text-xs text-slate-600">
                        <span className="font-semibold text-brand-primary">Next 14 days:</span> {upcoming.map(u => `${u.lineItem.name} (${u.lineItem.dueDay})`).join(", ")}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiBlock label="Cash on hand (start)" variant="primary"><KpiValue className={cn(mo.opening < 0 && "text-red-700")}>{formatCurrency(mo.opening)}</KpiValue></KpiBlock>
                <KpiBlock label="Received so far" variant="accent"><KpiValue>{formatCurrency(received)}</KpiValue></KpiBlock>
                <KpiBlock label="Paid so far" variant="solar"><KpiValue>{formatCurrency(paidOut)}</KpiValue></KpiBlock>
                <KpiBlock label="Still due" variant="solar"><KpiValue>{formatCurrency(stillDue)}</KpiValue></KpiBlock>
                <KpiBlock label="Projected end of month" variant="water"><KpiValue className={cn(mo.ending < 0 && "text-red-700")}>{formatCurrency(mo.ending)}</KpiValue></KpiBlock>
            </div>
            <p className="text-xs text-slate-500 -mt-2">Cash after what has actually cleared so far: <span className={cn("font-semibold", cashNow < 0 ? "text-red-700" : "text-brand-primary")}>{formatCurrency(cashNow)}</span>. Toggle a line when the money moves.</p>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-brand-primary">Bills</CardTitle><CardDescription>Cash paid out this month, by due day.</CardDescription></CardHeader>
                    <CardContent className="p-0 sm:px-2 pb-2">{renderRows(bills, "outflow")}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-brand-primary">Receipts</CardTitle><CardDescription>Cash coming in this month.</CardDescription></CardHeader>
                    <CardContent className="p-0 sm:px-2 pb-2">{renderRows(receipts, "receipts")}</CardContent>
                </Card>
            </div>
        </div>
    );
}
