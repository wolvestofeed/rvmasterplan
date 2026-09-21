"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Display a cell value like the spreadsheet: blank for 0, thousands separators,
 *  decimals only when present. */
export function fmtCell(v: number): string {
    if (!v) return "";
    const hasDecimals = Math.abs(v - Math.round(v)) > 0.004;
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 }).format(v);
}

export function parseCell(raw: string): number {
    const cleaned = raw.replace(/[$,\s]/g, "");
    if (cleaned === "" || cleaned === "-") return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

interface CellInputProps {
    value: number;
    onCommit: (value: number) => void;
    disabled?: boolean;
    className?: string;
    /** "row-month" coordinates used for keyboard navigation between cells. */
    row: number;
    col: number;
    title?: string;
}

/** One editable number cell. Shows the formatted value until focused, then the raw
 *  number. Enter commits and moves down, arrows move up/down, Tab moves across. */
export function CellInput({ value, onCommit, disabled, className, row, col, title }: CellInputProps) {
    const [focused, setFocused] = useState(false);
    const [draft, setDraft] = useState("");

    useEffect(() => { if (!focused) setDraft(value ? String(value) : ""); }, [value, focused]);

    const commit = () => {
        const n = parseCell(draft);
        if (n !== value) onCommit(n);
    };

    const move = (e: React.KeyboardEvent<HTMLInputElement>, dr: number, dc: number) => {
        const table = e.currentTarget.closest("table");
        const next = table?.querySelector<HTMLInputElement>(`input[data-cell="${row + dr}-${col + dc}"]`);
        if (next) { e.preventDefault(); next.focus(); next.select(); }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            data-cell={`${row}-${col}`}
            title={title}
            disabled={disabled}
            value={focused ? draft : fmtCell(value)}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => { setFocused(true); setDraft(value ? String(value) : ""); requestAnimationFrame(() => e.target.select()); }}
            onBlur={() => { setFocused(false); commit(); }}
            onKeyDown={(e) => {
                if (e.key === "Enter") { commit(); move(e, e.shiftKey ? -1 : 1, 0); }
                else if (e.key === "ArrowDown") move(e, 1, 0);
                else if (e.key === "ArrowUp") move(e, -1, 0);
                else if (e.key === "Escape") { setDraft(value ? String(value) : ""); e.currentTarget.blur(); }
            }}
            className={cn(
                "w-full h-8 px-1.5 text-right text-sm tabular-nums bg-transparent border border-transparent rounded-sm outline-none",
                "focus:bg-white focus:border-brand-blue-accent focus:ring-1 focus:ring-brand-blue-accent",
                "hover:border-[#e0e8d5] disabled:cursor-default",
                value < 0 && "text-red-700",
                className,
            )}
        />
    );
}
