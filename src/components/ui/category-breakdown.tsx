"use client";

import { CHART_COLORS } from "@/lib/constants/brand";

interface BreakdownItem {
    name: string;
    value: number;
    color?: string;
}

interface CategoryBreakdownProps {
    data: BreakdownItem[];
    formatValue?: (val: number) => string;
    totalLabel?: string;
    showTotal?: boolean;
    emptyMessage?: string;
    colors?: string[];
}

export function CategoryBreakdown({
    data,
    formatValue = (v) => v.toLocaleString(),
    totalLabel = "Total",
    showTotal = true,
    emptyMessage = "No data to display",
    colors = CHART_COLORS,
}: CategoryBreakdownProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (!data.length || total === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-400 italic text-sm">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.map((item, index) => {
                const color = item.color ?? colors[index % colors.length];
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                    <div key={item.name}>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                <span className="text-xs text-[#2a4f3f] font-medium tabular-nums">{pct.toFixed(1)}%</span>
                                <span className="text-sm font-semibold text-slate-800 tabular-nums">{formatValue(item.value)}</span>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-[#e0e8d5] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                        </div>
                    </div>
                );
            })}

            {showTotal && (
                <div className="pt-3 mt-1 border-t border-[#e0e8d5] flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600">{totalLabel}</span>
                    <span className="text-sm font-bold text-[#2a4f3f]">{formatValue(total)}</span>
                </div>
            )}
        </div>
    );
}
