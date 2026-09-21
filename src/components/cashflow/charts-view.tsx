"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CategoryBreakdown } from "@/components/ui/category-breakdown";
import { formatCurrency } from "@/lib/utils";
import { MONTHS_SHORT } from "@/lib/cashflow/constants";
import { outflowByCategory, type StatementComputed } from "@/lib/cashflow/compute";
import type { ScenarioBundle } from "@/lib/cashflow/types";

const compact = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export function ChartsView({ bundle, computed }: { bundle: ScenarioBundle; computed: StatementComputed }) {
    const data = computed.months.map(m => ({ name: MONTHS_SHORT[m.month], ending: Math.round(m.ending), net: Math.round(m.net), receipts: Math.round(m.receipts), outflow: Math.round(m.outflow) }));
    const byCategory = outflowByCategory(bundle, computed);
    const lineName = new Map(bundle.lineItems.map(l => [l.id, l.name]));
    const byLine = computed.lines.filter(l => l.kind === "outflow" && l.yearTotal > 0).sort((a, b) => b.yearTotal - a.yearTotal).slice(0, 12).map(l => ({ name: lineName.get(l.lineItemId) ?? "", value: l.yearTotal }));

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-brand-primary">Cash position (end of month)</CardTitle><CardDescription>Where the year leaves you each month. Below zero is the month to fix.</CardDescription></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e8d5" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={56} />
                                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
                                <Line type="monotone" dataKey="ending" name="End of month" stroke="#2a4f3f" strokeWidth={2.5} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-brand-primary">Monthly net cash</CardTitle><CardDescription>Receipts minus cash paid out, each month.</CardDescription></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e8d5" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={56} />
                                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                <ReferenceLine y={0} stroke="#64748b" />
                                <Bar dataKey="net" name="Net cash" radius={[3, 3, 0, 0]}>
                                    {data.map((d, i) => <Cell key={i} fill={d.net < 0 ? "#ef4444" : "#8ca163"} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-brand-primary">Cash paid out by category</CardTitle><CardDescription>Full-year totals.</CardDescription></CardHeader>
                    <CardContent><CategoryBreakdown data={byCategory} formatValue={formatCurrency} totalLabel="Total cash paid out" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-brand-primary">Biggest lines</CardTitle><CardDescription>Top cash-out lines for the year.</CardDescription></CardHeader>
                    <CardContent><CategoryBreakdown data={byLine} formatValue={formatCurrency} showTotal={false} /></CardContent>
                </Card>
            </div>
        </div>
    );
}
