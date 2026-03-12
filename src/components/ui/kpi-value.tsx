"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Auto-sizing KPI value display.
 * Scales font size down based on content length and available container width.
 */
export function KpiValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const resize = () => {
      // Reset to max size to measure natural width
      text.style.fontSize = "";
      const maxSize = parseFloat(getComputedStyle(text).fontSize);
      const containerWidth = container.clientWidth;
      const textWidth = text.scrollWidth;

      if (textWidth > containerWidth) {
        // Scale down proportionally, with a floor of 14px
        const scaled = Math.max(14, maxSize * (containerWidth / textWidth) * 0.95);
        setFontSize(scaled);
      } else {
        setFontSize(null); // Use default CSS size
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "font-bold text-2xl md:text-3xl text-[#2a4f3f] relative z-10 overflow-hidden whitespace-nowrap",
        className
      )}
    >
      <span
        ref={textRef}
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
      >
        {children}
      </span>
    </div>
  );
}
