"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Download, Plus, Star, Pencil, Trash2, Calculator, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { HeaderHero } from "@/components/layout/header-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiBlock, KpiBlockSkeleton } from "@/components/ui/kpi-block";
import { KpiValue } from "@/components/ui/kpi-value";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";

import { StatementGrid } from "@/components/cashflow/statement-grid";
import { LineItemDialog } from "@/components/cashflow/line-item-dialog";
import { ScenarioDialog } from "@/components/cashflow/scenario-dialog";
import { PaycheckDialog, PAYCHECK_NEW_LINE } from "@/components/cashflow/paycheck-dialog";
import { BillsView } from "@/components/cashflow/bills-view";
import { ChartsView } from "@/components/cashflow/charts-view";

import { computeStatement, sortByOrder } from "@/lib/cashflow/compute";
import { computePaycheck, type PaycheckParams } from "@/lib/cashflow/paycheck";
import { MONTHS_LONG } from "@/lib/cashflow/constants";
import { downloadWorkbook } from "@/lib/cashflow/export-xlsx";
import type { CfLineItem, CfScenario, CfSection, ScenarioBundle } from "@/lib/cashflow/types";
import {
    getScenarios, getScenarioBundle, createScenario, cloneScenario, updateScenario, setPrimaryScenario, deleteScenario,
    addLineItem, updateLineItem, deleteLineItem, reorderLineItems, setCellsPlanned, setCellPaid, saveCalculator,
    type LineItemInput,
} from "@/lib/actions/cashflow";
import { isReadOnly } from "@/lib/actions/auth-helpers";

const TAB_CLASS = "h-11 px-6 border border-brand-primary/20 bg-gradient-to-b from-white to-[#f1f6ea] text-brand-primary data-[state=active]:from-white data-[state=active]:to-emerald-50 data-[state=active]:border-brand-primary data-[state=active]:shadow-md font-semibold transition-all rounded-md whitespace-nowrap";

export default function CashFlowPage() {
    const [scenarios, setScenarios] = useState<CfScenario[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [bundle, setBundle] = useState<ScenarioBundle | null>(null);
    const [loading, setLoading] = useState(true);
    const [readOnly, setReadOnly] = useState(true);
    const [tab, setTab] = useState("statement");

    const [lineDialog, setLineDialog] = useState<{ open: boolean; line?: CfLineItem; sectionId?: string }>({ open: false });
    const [scenarioDialog, setScenarioDialog] = useState<{ open: boolean; scenario?: CfScenario }>({ open: false });
    const [paycheckOpen, setPaycheckOpen] = useState(false);

    const today = new Date();
    const isLiveYear = bundle?.scenario.year === today.getFullYear();
    const currentMonth = isLiveYear ? today.getMonth() : null;
    const [billsMonth, setBillsMonth] = useState<number>(today.getMonth());

    const computed = useMemo(() => (bundle ? computeStatement(bundle) : null), [bundle]);

    const loadScenarios = useCallback(async (preferId?: string) => {
        const res = await getScenarios();
        if (!res.success) { toast.error(res.error); return []; }
        setScenarios(res.data);
        const pick = preferId && res.data.some(s => s.id === preferId) ? preferId : (res.data.find(s => s.isPrimary)?.id ?? res.data[0]?.id ?? null);
        setSelectedId(pick);
        return res.data;
    }, []);

    const loadBundle = useCallback(async (id: string) => {
        const res = await getScenarioBundle(id);
        if (!res.success) { toast.error(res.error); setBundle(null); return; }
        setBundle(res.data);
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [ro] = await Promise.all([isReadOnly(), loadScenarios()]);
            setReadOnly(ro);
            setLoading(false);
        })();
    }, [loadScenarios]);

    useEffect(() => {
        if (!selectedId) { setBundle(null); return; }
        loadBundle(selectedId);
    }, [selectedId, loadBundle]);

    const bundleYear = bundle?.scenario.year;
    const bundleId = bundle?.scenario.id;
    useEffect(() => {
        if (bundleYear === undefined) return;
        const now = new Date();
        setBillsMonth(bundleYear === now.getFullYear() ? now.getMonth() : 0);
    }, [bundleId, bundleYear]);

    const guard = () => { if (readOnly) { toast.error("Sign in with an active subscription to edit."); return false; } return true; };
    const refresh = () => selectedId && loadBundle(selectedId);

    // ── cell edits (optimistic) ─────────────────────────────────────────────
    const applyCellsLocally = (items: { lineItemId: string; month: number; planned: number }[]) => {
        setBundle(b => {
            if (!b) return b;
            const cells = [...b.cells];
            for (const it of items) {
                const idx = cells.findIndex(c => c.lineItemId === it.lineItemId && c.month === it.month);
                if (idx >= 0) cells[idx] = { ...cells[idx], planned: it.planned };
                else cells.push({ id: `tmp-${it.lineItemId}-${it.month}`, scenarioId: b.scenario.id, lineItemId: it.lineItemId, month: it.month, planned: it.planned, actual: null, paid: false, note: null });
            }
            return { ...b, cells };
        });
    };
    const commitCells = async (items: { lineItemId: string; month: number; planned: number }[]) => {
        if (!bundle || !guard()) return;
        applyCellsLocally(items);
        const res = await setCellsPlanned(bundle.scenario.id, items);
        if (!res.success) { toast.error(res.error); refresh(); }
    };
    const onCellCommit = (lineItemId: string, month: number, value: number) => commitCells([{ lineItemId, month, planned: value }]);
    const onOpeningCashCommit = async (value: number) => {
        if (!bundle || !guard()) return;
        setBundle(b => b && ({ ...b, scenario: { ...b.scenario, openingCash: value } }));
        const res = await updateScenario(bundle.scenario.id, { openingCash: value });
        if (!res.success) { toast.error(res.error); refresh(); }
        else setScenarios(s => s.map(x => x.id === bundle.scenario.id ? { ...x, openingCash: value } : x));
    };

    // ── line items ──────────────────────────────────────────────────────────
    const onSaveLine = async (input: LineItemInput, lineId?: string) => {
        if (!bundle || !guard()) return;
        const res = lineId ? await updateLineItem(bundle.scenario.id, lineId, input) : await addLineItem(bundle.scenario.id, input);
        if (!res.success) { toast.error(res.error); return; }
        toast.success(lineId ? "Line updated" : "Line added");
        await refresh();
    };
    const fill12 = (lineId: string, amount: number) => commitCells(Array.from({ length: 12 }, (_, month) => ({ lineItemId: lineId, month, planned: amount })));
    const onSetAnnual = (lineId: string, month: number, amount: number) => commitCells(Array.from({ length: 12 }, (_, m) => ({ lineItemId: lineId, month: m, planned: m === month ? amount : 0 })));
    const onMove = async (lineId: string, dir: -1 | 1) => {
        if (!bundle || !guard()) return;
        const line = bundle.lineItems.find(l => l.id === lineId); if (!line) return;
        const siblings = sortByOrder(bundle.lineItems.filter(l => l.sectionId === line.sectionId));
        const i = siblings.findIndex(l => l.id === lineId); const j = i + dir;
        if (j < 0 || j >= siblings.length) return;
        [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
        const res = await reorderLineItems(bundle.scenario.id, siblings.map(s => s.id));
        if (!res.success) toast.error(res.error); else await refresh();
    };
    const onArchive = async (lineId: string, archived: boolean) => {
        if (!bundle || !guard()) return;
        const res = await updateLineItem(bundle.scenario.id, lineId, { archived });
        if (!res.success) toast.error(res.error); else { toast.success(archived ? "Line archived" : "Line restored"); await refresh(); }
    };
    const onDelete = async (lineId: string) => {
        if (!bundle || !guard()) return;
        const res = await deleteLineItem(bundle.scenario.id, lineId);
        if (!res.success) toast.error(res.error); else { toast.success("Line deleted"); await refresh(); }
    };

    // ── scenarios ───────────────────────────────────────────────────────────
    const onSaveScenario = async (input: { name: string; year: number; openingCash: number; notes: string | null }, id?: string) => {
        if (!guard()) return;
        if (id) {
            const res = await updateScenario(id, input);
            if (!res.success) { toast.error(res.error); return; }
            toast.success("Scenario updated");
            await loadScenarios(id); await loadBundle(id);
        } else {
            const res = await createScenario({ name: input.name, year: input.year, openingCash: input.openingCash, notes: input.notes ?? undefined });
            if (!res.success) { toast.error(res.error); return; }
            toast.success("Scenario created");
            await loadScenarios(res.data.id);
        }
    };
    const onClone = async () => {
        if (!bundle || !guard()) return;
        const name = prompt("Name for the copy:", `${bundle.scenario.name} (what-if)`); if (name === null) return;
        const res = await cloneScenario(bundle.scenario.id, name.trim() || undefined);
        if (!res.success) { toast.error(res.error); return; }
        toast.success("Scenario cloned"); await loadScenarios(res.data.id);
    };
    const onSetPrimary = async () => {
        if (!bundle || !guard()) return;
        const res = await setPrimaryScenario(bundle.scenario.id);
        if (!res.success) toast.error(res.error); else { toast.success("Primary scenario set"); await loadScenarios(bundle.scenario.id); }
    };
    const onDeleteScenario = async () => {
        if (!bundle || !guard()) return;
        if (!confirm(`Delete scenario "${bundle.scenario.name}"? This removes all of its lines and months.`)) return;
        const res = await deleteScenario(bundle.scenario.id);
        if (!res.success) toast.error(res.error); else { toast.success("Scenario deleted"); await loadScenarios(); }
    };

    // ── paycheck ────────────────────────────────────────────────────────────
    const existingPaycheck = bundle?.calculators.find(c => c.type === "paycheck");
    const onApplyPaycheck = async (params: PaycheckParams, target: string, calculatorId?: string) => {
        if (!bundle || !guard()) return;
        let lineId = target;
        if (target === PAYCHECK_NEW_LINE) {
            const receipts = sortByOrder(bundle.sections).find(s => s.kind === "receipts");
            if (!receipts) { toast.error("This scenario has no receipts section."); return; }
            const res = await addLineItem(bundle.scenario.id, { sectionId: receipts.id, name: "Primary Income", category: "Income", dueDay: null, recurrence: "calculated" });
            if (!res.success) { toast.error(res.error); return; }
            lineId = res.data.id;
        }
        const saved = await saveCalculator(bundle.scenario.id, { id: calculatorId, lineItemId: lineId, type: "paycheck", name: "Paycheck", params: params as unknown as Record<string, unknown> });
        if (!saved.success) { toast.error(saved.error); return; }
        const net = Math.round(computePaycheck(params).netMonthly * 100) / 100;
        const res = await setCellsPlanned(bundle.scenario.id, Array.from({ length: 12 }, (_, month) => ({ lineItemId: lineId, month, planned: net })));
        if (!res.success) { toast.error(res.error); return; }
        toast.success(`Net monthly ${formatCurrency(net)} applied to all 12 months`);
        await refresh();
    };

    const onTogglePaid = async (lineItemId: string, month: number, paid: boolean) => {
        if (!bundle || !guard()) return;
        setBundle(b => {
            if (!b) return b;
            const cells = [...b.cells];
            const idx = cells.findIndex(c => c.lineItemId === lineItemId && c.month === month);
            if (idx >= 0) cells[idx] = { ...cells[idx], paid };
            return { ...b, cells };
        });
        const res = await setCellPaid(bundle.scenario.id, lineItemId, month, paid);
        if (!res.success) { toast.error(res.error); refresh(); }
    };

    const sections: CfSection[] = bundle ? sortByOrder(bundle.sections) : [];
    const hasScenarios = scenarios.length > 0;

    return (
        <div className="p-6 space-y-6">
            <HeaderHero
                title="Cash Flow Statement"
                description="Your year, month by month: cash in, cash out, and where you land. Scenarios let you try a what-if without losing the plan you live by."
                imageUrl="/images/page-headers/cashflow-header.jpg"
                imageClass="object-cover object-[50%_62%]"
                frameClass="aspect-[16/7] max-h-[520px]"
            />

            {/* KPIs */}
            {loading || (hasScenarios && !computed) ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{[0, 1, 2, 3, 4].map(i => <KpiBlockSkeleton key={i} />)}</div>
            ) : computed && bundle ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <KpiBlock label="Opening cash" variant="primary"><KpiValue>{formatCurrency(computed.totals.openingCash)}</KpiValue></KpiBlock>
                    <KpiBlock label="Cash receipts (year)" variant="accent"><KpiValue>{formatCurrency(computed.totals.receipts)}</KpiValue></KpiBlock>
                    <KpiBlock label="Cash paid out (year)" variant="solar"><KpiValue>{formatCurrency(computed.totals.outflow)}</KpiValue></KpiBlock>
                    <KpiBlock label="Net cash (year)" variant="accent"><KpiValue className={cn(computed.totals.net < 0 && "text-red-700")}>{formatCurrency(computed.totals.net)}</KpiValue></KpiBlock>
                    <KpiBlock label="Ending cash (Dec)" variant="water"><KpiValue className={cn(computed.totals.endingCash < 0 && "text-red-700")}>{formatCurrency(computed.totals.endingCash)}</KpiValue></KpiBlock>
                </div>
            ) : null}

            {computed && computed.firstNegativeMonth !== null && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Cash goes negative in {MONTHS_LONG[computed.firstNegativeMonth]} (lowest point {formatCurrency(computed.lowestEnding.value)} in {MONTHS_LONG[computed.lowestEnding.month]}).
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedId ?? ""} onValueChange={setSelectedId} disabled={!hasScenarios}>
                    <SelectTrigger className="w-[260px] bg-white h-10"><SelectValue placeholder={loading ? "Loading…" : "No scenarios yet"} /></SelectTrigger>
                    <SelectContent>
                        {scenarios.map(s => <SelectItem key={s.id} value={s.id}>{s.isPrimary ? "★ " : ""}{s.name} · {s.year}</SelectItem>)}
                    </SelectContent>
                </Select>
                {!readOnly && (
                    <>
                        <Button variant="outline" size="sm" onClick={() => setScenarioDialog({ open: true })}><Plus className="h-4 w-4 mr-1" />New</Button>
                        <Button variant="outline" size="sm" disabled={!bundle} onClick={() => bundle && setScenarioDialog({ open: true, scenario: bundle.scenario })}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
                        <Button variant="outline" size="sm" disabled={!bundle} onClick={onClone}><Copy className="h-4 w-4 mr-1" />Clone</Button>
                        <Button variant="outline" size="sm" disabled={!bundle || bundle.scenario.isPrimary} onClick={onSetPrimary}><Star className="h-4 w-4 mr-1" />Set primary</Button>
                        <Button variant="ghost" size="sm" disabled={!bundle} className="text-red-700 hover:text-red-800" onClick={onDeleteScenario}><Trash2 className="h-4 w-4" /></Button>
                    </>
                )}
                <div className="ml-auto flex items-center gap-2">
                    {!readOnly && bundle && (
                        <>
                            <Button size="sm" className="bg-brand-primary hover:bg-brand-primary-dark text-white" onClick={() => setLineDialog({ open: true, sectionId: sections.find(s => s.kind === "outflow")?.id })}><Plus className="h-4 w-4 mr-1" />Add line</Button>
                            <Button size="sm" variant="outline" onClick={() => setPaycheckOpen(true)}><Calculator className="h-4 w-4 mr-1" />Paycheck</Button>
                        </>
                    )}
                    <Button size="sm" variant="outline" disabled={!bundle} onClick={() => bundle && downloadWorkbook(bundle)}><Download className="h-4 w-4 mr-1" />Export .xlsx</Button>
                </div>
            </div>

            {/* Body */}
            {loading ? (
                <Skeleton className="h-[480px] w-full rounded-xl" />
            ) : !hasScenarios ? (
                <Card>
                    <CardContent className="py-12 text-center space-y-3">
                        <h3 className="text-lg font-semibold text-brand-primary">No scenarios yet</h3>
                        <p className="text-sm text-slate-600 max-w-md mx-auto">Create your first scenario for the year, then add income and bill lines. Or run the workbook importer to bring in an existing spreadsheet.</p>
                        {!readOnly && <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white" onClick={() => setScenarioDialog({ open: true })}><Plus className="h-4 w-4 mr-1" />Create scenario</Button>}
                    </CardContent>
                </Card>
            ) : bundle && computed ? (
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="grid w-full max-w-xl grid-cols-3 bg-transparent h-auto gap-2 p-0 shadow-none border-0 mb-4">
                        <TabsTrigger value="statement" className={TAB_CLASS}>Statement</TabsTrigger>
                        <TabsTrigger value="bills" className={TAB_CLASS}>Bills</TabsTrigger>
                        <TabsTrigger value="charts" className={TAB_CLASS}>Charts</TabsTrigger>
                    </TabsList>
                    <TabsContent value="statement">
                        <StatementGrid
                            bundle={bundle} computed={computed} readOnly={readOnly} currentMonth={currentMonth}
                            onCellCommit={onCellCommit} onOpeningCashCommit={onOpeningCashCommit}
                            onEditLine={(line) => setLineDialog({ open: true, line })}
                            onAddLine={(section) => setLineDialog({ open: true, sectionId: section.id })}
                        />
                        {bundle.lineItems.some(l => l.archived) && (
                            <p className="mt-2 text-xs text-slate-500">
                                Archived lines: {bundle.lineItems.filter(l => l.archived).map(l => (
                                    <button key={l.id} type="button" className="underline mr-2" onClick={() => setLineDialog({ open: true, line: l })}>{l.name}</button>
                                ))}
                            </p>
                        )}
                    </TabsContent>
                    <TabsContent value="bills">
                        <BillsView bundle={bundle} computed={computed} month={billsMonth} onMonthChange={setBillsMonth} readOnly={readOnly} todayDay={isLiveYear && billsMonth === today.getMonth() ? today.getDate() : null} onTogglePaid={onTogglePaid} />
                    </TabsContent>
                    <TabsContent value="charts">
                        <ChartsView bundle={bundle} computed={computed} />
                    </TabsContent>
                </Tabs>
            ) : (
                <Skeleton className="h-[480px] w-full rounded-xl" />
            )}

            {/* Dialogs */}
            <LineItemDialog
                open={lineDialog.open} onOpenChange={(o) => setLineDialog(d => ({ ...d, open: o }))}
                sections={sections} line={lineDialog.line} defaultSectionId={lineDialog.sectionId}
                onSave={onSaveLine} onFill={fill12} onSetAnnual={onSetAnnual}
                onClear={(id) => fill12(id, 0)} onMove={onMove} onArchive={onArchive} onDelete={onDelete}
            />
            <ScenarioDialog open={scenarioDialog.open} onOpenChange={(o) => setScenarioDialog(d => ({ ...d, open: o }))} scenario={scenarioDialog.scenario} onSave={onSaveScenario} />
            {bundle && (
                <PaycheckDialog open={paycheckOpen} onOpenChange={setPaycheckOpen} sections={sections} lineItems={bundle.lineItems} existing={existingPaycheck} onApply={onApplyPaycheck} />
            )}
        </div>
    );
}
