"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS_SHORT } from "@/lib/cashflow/constants";
import { sortByOrder } from "@/lib/cashflow/compute";
import type { StatementComputed } from "@/lib/cashflow/compute";
import type { CfLineItem, CfSection, ScenarioBundle } from "@/lib/cashflow/types";
import { CellInput, fmtCell } from "./cell-input";

interface StatementGridProps {
    bundle: ScenarioBundle;
    computed: StatementComputed;
    readOnly: boolean;
    /** 0-11 when the scenario year is the current year, else null. */
    currentMonth: number | null;
    onCellCommit: (lineItemId: string, month: number, value: number) => void;
    onOpeningCashCommit: (value: number) => void;
    onEditLine: (line: CfLineItem) => void;
    onAddLine: (section: CfSection) => void;
}

const num = (v: number, opts: { blankZero?: boolean } = {}) => (opts.blankZero && !v ? "" : fmtCell(Math.round(v * 100) / 100) || "0");

export function StatementGrid({ bundle, computed, readOnly, currentMonth, onCellCommit, onOpeningCashCommit, onEditLine, onAddLine }: StatementGridProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const sections = sortByOrder(bundle.sections);
    const lineById = new Map(bundle.lineItems.map(l => [l.id, l]));
    const linesBySection = new Map<string, CfLineItem[]>();
    for (const s of sections) linesBySection.set(s.id, sortByOrder(bundle.lineItems.filter(l => l.sectionId === s.id && !l.archived)));
    const computedByLine = new Map(computed.lines.map(l => [l.lineItemId, l]));
    const computedBySection = new Map(computed.sections.map(s => [s.sectionId, s]));
    const calcByLine = new Map(bundle.calculators.filter(c => c.lineItemId).map(c => [c.lineItemId as string, c]));

    // Row index for keyboard navigation: opening-cash row is 0, each line row increments.
    let rowIdx = 0;

    const monthHead = (m: number) => cn(
        "px-1 py-2 text-right text-[11px] font-semibold tracking-wide min-w-[84px]",
        currentMonth === m ? "bg-brand-blue-soft text-brand-blue-accent" : "text-brand-primary",
    );
    const monthCell = (m: number, extra?: string) => cn(
        "px-0.5 py-0.5 text-right tabular-nums",
        currentMonth === m && "bg-brand-blue-soft/60",
        currentMonth !== null && m < currentMonth && "text-slate-500",
        extra,
    );

    const receiptsSections = sections.filter(s => s.kind === "receipts");
    const outflowSections = sections.filter(s => s.kind === "outflow");

    const renderSection = (section: CfSection) => {
        const lines = linesBySection.get(section.id) ?? [];
        const sc = computedBySection.get(section.id);
        const isCollapsed = collapsed[section.id];
        return (
            <tbody key={section.id} className="border-t border-[#e0e8d5]">
                <tr className="bg-[#f1f6ea]">
                    <td className="sticky left-0 z-10 bg-[#f1f6ea] px-2 py-1.5 font-semibold text-brand-primary text-sm whitespace-nowrap">
                        <button type="button" onClick={() => setCollapsed(c => ({ ...c, [section.id]: !c[section.id] }))} className="inline-flex items-center gap-1 hover:text-brand-primary-dark">
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {section.name}
                        </button>
                        {!readOnly && (
                            <button type="button" onClick={() => onAddLine(section)} title={`Add line to ${section.name}`} className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-brand-blue-accent hover:underline">
                                <Plus className="h-3 w-3" /> line
                            </button>
                        )}
                    </td>
                    <td className="bg-[#f1f6ea]" />
                    {MONTHS_SHORT.map((_, m) => <td key={m} className={cn(monthCell(m), "bg-[#f1f6ea] text-xs font-medium text-slate-600 px-1.5")}>{isCollapsed && sc ? num(sc.monthly[m], { blankZero: true }) : ""}</td>)}
                    <td className="bg-[#f1f6ea] text-right text-xs font-medium text-slate-600 px-1.5">{isCollapsed && sc ? num(sc.yearTotal, { blankZero: true }) : ""}</td>
                    <td className="bg-[#f1f6ea] text-right text-xs text-slate-500 px-1.5">{section.kind === "outflow" && sc && sc.yearTotal ? `${(sc.pctOfOutflow * 100).toFixed(1)}%` : ""}</td>
                </tr>
                {!isCollapsed && lines.map(line => {
                    const lc = computedByLine.get(line.id);
                    const r = ++rowIdx;
                    const calc = calcByLine.get(line.id);
                    return (
                        <tr key={line.id} className="group hover:bg-[#f8fbf5]">
                            <td className="sticky left-0 z-10 bg-white group-hover:bg-[#f8fbf5] px-2 py-0.5 text-sm whitespace-nowrap max-w-[260px]">
                                <button type="button" onClick={() => onEditLine(line)} className="inline-flex items-center gap-1.5 text-left text-slate-800 hover:text-brand-blue-accent truncate max-w-full" title={line.notes || line.name}>
                                    <span className="truncate">{line.name}</span>
                                    {calc && <Calculator className="h-3 w-3 text-brand-solar shrink-0" />}
                                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
                                </button>
                            </td>
                            <td className="px-1.5 text-center text-xs text-slate-500">{line.dueDay ?? ""}</td>
                            {MONTHS_SHORT.map((_, m) => (
                                <td key={m} className={monthCell(m)}>
                                    <CellInput row={r} col={m} value={lc?.monthly[m] ?? 0} disabled={readOnly} onCommit={(v) => onCellCommit(line.id, m, v)} />
                                </td>
                            ))}
                            <td className="px-1.5 text-right text-sm tabular-nums font-medium text-slate-700">{num(lc?.yearTotal ?? 0, { blankZero: true })}</td>
                            <td className="px-1.5 text-right text-xs tabular-nums text-slate-500">{section.kind === "outflow" && lc && lc.yearTotal ? `${(lc.pctOfOutflow * 100).toFixed(1)}%` : ""}</td>
                        </tr>
                    );
                })}
                {!isCollapsed && lines.length === 0 && (
                    <tr><td colSpan={16} className="sticky left-0 px-6 py-2 text-xs italic text-slate-400">No lines yet.</td></tr>
                )}
                {!isCollapsed && sc && (
                    <tr className="bg-white">
                        <td className="sticky left-0 z-10 bg-white px-2 py-1 text-sm font-semibold text-slate-700 text-right pr-4">Total</td>
                        <td />
                        {sc.monthly.map((v, m) => <td key={m} className={cn(monthCell(m), "px-1.5 text-sm font-semibold text-slate-700 border-t border-slate-300")}>{num(v)}</td>)}
                        <td className="px-1.5 text-right text-sm font-semibold tabular-nums text-slate-800 border-t border-slate-300">{num(sc.yearTotal)}</td>
                        <td className="px-1.5 text-right text-xs text-slate-500 border-t border-slate-300">{section.kind === "outflow" && sc.yearTotal ? `${(sc.pctOfOutflow * 100).toFixed(1)}%` : ""}</td>
                    </tr>
                )}
            </tbody>
        );
    };

    const computedRow = (label: string, values: number[], yearValue: number | null, opts: { strong?: boolean; negativeRed?: boolean; tone?: "green" | "blue" } = {}) => (
        <tr className={cn(opts.tone === "green" && "bg-emerald-50/60", opts.tone === "blue" && "bg-brand-blue-soft/50")}>
            <td className={cn("sticky left-0 z-10 px-2 py-1.5 text-sm whitespace-nowrap", opts.strong ? "font-bold text-brand-primary" : "font-semibold text-slate-700", opts.tone === "green" ? "bg-emerald-50" : opts.tone === "blue" ? "bg-[#eef2f6]" : "bg-white")}>{label}</td>
            <td />
            {values.map((v, m) => (
                <td key={m} className={cn(monthCell(m), "px-1.5 text-sm tabular-nums", opts.strong ? "font-bold" : "font-semibold", opts.negativeRed && v < 0 ? "text-red-700" : "text-slate-800")}>{num(v)}</td>
            ))}
            <td className={cn("px-1.5 text-right text-sm tabular-nums", opts.strong ? "font-bold" : "font-semibold", yearValue !== null && opts.negativeRed && yearValue < 0 ? "text-red-700" : "text-slate-800")}>{yearValue === null ? "" : num(yearValue)}</td>
            <td />
        </tr>
    );

    const months = computed.months;
    const openingRow = 0;
    return (
        <div className="overflow-x-auto rounded-xl border-2 border-brand-primary/20 bg-white shadow-[4px_4px_12px_rgba(0,0,0,0.15)]">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                    <tr className="bg-white">
                        <th className="sticky left-0 z-20 bg-white px-2 py-2 text-left text-xs font-semibold text-brand-primary uppercase tracking-wide min-w-[220px]">Line</th>
                        <th className="px-1 py-2 text-center text-[11px] font-semibold text-brand-primary" title="Due day of month">Due</th>
                        {MONTHS_SHORT.map((mo, m) => <th key={mo} className={monthHead(m)}>{mo}</th>)}
                        <th className="px-1.5 py-2 text-right text-[11px] font-semibold text-brand-primary min-w-[96px]">Year</th>
                        <th className="px-1.5 py-2 text-right text-[11px] font-semibold text-brand-primary min-w-[56px]" title="Share of total cash paid out">% Out</th>
                    </tr>
                </thead>
                <tbody className="border-t border-[#e0e8d5]">
                    <tr className="bg-white">
                        <td className="sticky left-0 z-10 bg-white px-2 py-1 text-sm font-semibold text-slate-700 whitespace-nowrap">Cash on Hand (beginning of month)</td>
                        <td />
                        {months.map((mo, m) => (
                            <td key={m} className={cn(monthCell(m), "px-1.5 text-sm font-semibold tabular-nums", mo.opening < 0 ? "text-red-700" : "text-slate-800")}>
                                {m === 0
                                    ? <CellInput row={openingRow} col={0} value={bundle.scenario.openingCash} disabled={readOnly} onCommit={onOpeningCashCommit} className="font-semibold" title="Opening cash for the year (editable)" />
                                    : num(mo.opening)}
                            </td>
                        ))}
                        <td /><td />
                    </tr>
                </tbody>
                {receiptsSections.map(renderSection)}
                <tbody>{computedRow("Total Cash Available (before cash out)", months.map(m => m.totalAvailable), null, { strong: true, tone: "green" })}</tbody>
                {outflowSections.map(renderSection)}
                <tbody>
                    {computedRow("Total Cash Paid Out", months.map(m => m.outflow), computed.totals.outflow, { strong: true, tone: "green" })}
                    {computedRow("Monthly Net Cash", months.map(m => m.net), computed.totals.net, { negativeRed: true })}
                    {computedRow("Cash Position (end of month)", months.map(m => m.ending), computed.totals.endingCash, { strong: true, negativeRed: true, tone: "blue" })}
                </tbody>
            </table>
            <div className="px-3 py-2 text-[11px] text-slate-500 border-t border-[#e0e8d5]">
                Click a line name to edit it. Enter moves down, Tab moves across, Esc cancels. Year-total percentages are each line&apos;s share of total cash paid out.
                {lineById.size === 0 && " Start by adding a line to a section."}
            </div>
        </div>
    );
}
