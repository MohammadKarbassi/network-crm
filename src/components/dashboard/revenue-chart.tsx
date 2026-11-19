"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatToman } from "@/lib/labels";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// Single series in the brand accent, no legend; the card title names it.
// Axis ticks are plain numbers in millions: Persian words inside the LTR SVG would flip ("میلیون ۳۲۰").
const millions = (n: number) => (n / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 0 });

const config = { revenue: { label: "فروش", color: "var(--primary)" } } satisfies ChartConfig;

export function RevenueChart({ data }: { data: { month: string; revenue: number; count: number }[] }) {
  const reduced = useReducedMotion();
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full" dir="ltr">
      {/* Reversed x-axis so time reads right-to-left like the rest of the page. */}
      <BarChart data={data} margin={{ top: 8, left: 8, right: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" reversed tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis orientation="right" tickLine={false} axisLine={false} width={48} tickFormatter={millions} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideIndicator
              formatter={(value, _name, item) => (
                <div dir="rtl" className="flex flex-col gap-0.5">
                  <span className="font-medium">{formatToman(Number(value))}</span>
                  <span className="text-muted-foreground">{(item.payload.count as number).toLocaleString("fa-IR")} معامله موفق</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={24}
          // Bars rise once on load, after the card itself has settled; off under reduced motion.
          isAnimationActive={!reduced}
          animationBegin={160}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </BarChart>
    </ChartContainer>
  );
}
