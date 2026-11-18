"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import type { DealStage } from "@/generated/prisma/enums";
import { dealStageLabel, formatDate, formatToman } from "@/lib/labels";
import { dealStages } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { OwnerOption } from "@/components/app/owner-select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { moveDealAction } from "./actions";
import { DealFormDialog, type DealFormValue } from "./deal-form-dialog";

export type BoardDeal = DealFormValue & { customerName: string; ownerName: string | null };
type Columns = Record<DealStage, BoardDeal[]>;

const stageAccent: Record<DealStage, string> = {
  NEW: "border-t-sky-500",
  CONTACTED: "border-t-violet-500",
  PROPOSAL: "border-t-amber-500",
  NEGOTIATION: "border-t-orange-500",
  WON: "border-t-emerald-500",
  LOST: "border-t-zinc-400",
};

const group = (deals: BoardDeal[]) =>
  Object.fromEntries(dealStages.map((s) => [s, deals.filter((d) => d.stage === s)])) as Columns;

const stageOf = (columns: Columns, id: string): DealStage | undefined =>
  dealStages.includes(id as DealStage) ? (id as DealStage) : dealStages.find((s) => columns[s].some((d) => d.id === id));

export function Board({ deals, owners }: { deals: BoardDeal[]; owners?: OwnerOption[] }) {
  const router = useRouter();
  const [columns, setColumns] = useState(() => group(deals));
  // Re-sync with fresh server data after a save (React's "adjust state when a prop changes" pattern).
  const [prevDeals, setPrevDeals] = useState(deals);
  if (deals !== prevDeals) {
    setPrevDeals(deals);
    setColumns(group(deals));
  }
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fromStage, setFromStage] = useState<DealStage | null>(null);
  const [editing, setEditing] = useState<BoardDeal | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    // A 6px threshold lets a plain click open the card instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const active = activeId ? Object.values(columns).flat().find((d) => d.id === activeId) : undefined;

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setFromStage(stageOf(columns, String(active.id)) ?? null);
  };

  // Moving across columns updates state live so the card shows where it will land.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = stageOf(columns, String(active.id));
    const to = stageOf(columns, String(over.id));
    if (!from || !to || from === to) return;
    setColumns((cols) => {
      const card = cols[from].find((d) => d.id === active.id)!;
      const overIndex = cols[to].findIndex((d) => d.id === over.id);
      const target = [...cols[to]];
      target.splice(overIndex < 0 ? target.length : overIndex, 0, { ...card, stage: to });
      return { ...cols, [from]: cols[from].filter((d) => d.id !== active.id), [to]: target };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    setActiveId(null);
    const stage = stageOf(columns, id);
    if (!over || !stage) return;

    let column = columns[stage];
    const oldIndex = column.findIndex((d) => d.id === id);
    const newIndex = column.findIndex((d) => d.id === over.id);
    if (newIndex >= 0 && oldIndex !== newIndex) column = arrayMove(column, oldIndex, newIndex);
    if (stage === fromStage && column === columns[stage]) return; // dropped where it started

    const next = { ...columns, [stage]: column };
    setColumns(next);
    startTransition(async () => {
      const res = await moveDealAction(id, stage, column.map((d) => d.id));
      if (!res.ok) {
        toast.error(res.error);
        setColumns(group(deals)); // roll back the optimistic move
      } else if (stage !== fromStage) {
        toast.success(`به «${dealStageLabel[stage]}» منتقل شد.`);
      }
      router.refresh();
    });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => (setActiveId(null), setColumns(group(deals)))}
        accessibility={{
          screenReaderInstructions: { draggable: "برای جابه‌جایی، فاصله را بزنید، با کلیدهای جهت حرکت دهید و دوباره فاصله را بزنید." },
        }}
      >
        {/* Horizontal scroll on small screens; six columns side by side on wide ones. */}
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
          <div className="grid min-w-[72rem] grid-cols-6 gap-3">
            {dealStages.map((stage) => (
              <Column key={stage} stage={stage} deals={columns[stage]} onOpen={setEditing} />
            ))}
          </div>
        </div>
        <DragOverlay>{active && <DealCard deal={active} overlay />}</DragOverlay>
      </DndContext>

      {editing && (
        <DealFormDialog
          key={editing.id}
          deal={editing}
          owners={owners}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  );
}

function Column({ stage, deals, onOpen }: { stage: DealStage; deals: BoardDeal[]; onOpen: (d: BoardDeal) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, d) => sum + d.amount, 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={dealStageLabel[stage]}
      className={cn("flex min-h-96 flex-col rounded-xl border border-t-4 bg-muted/40 transition-colors", stageAccent[stage], isOver && "bg-muted")}
    >
      <header className="flex items-baseline justify-between gap-2 px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold">{dealStageLabel[stage]}</h2>
        <span className="text-xs text-muted-foreground">{deals.length.toLocaleString("fa-IR")}</span>
      </header>
      <p className="px-3 pb-3 text-xs text-muted-foreground">{formatToman(total)}</p>
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
          {deals.map((d) => (
            <SortableCard key={d.id} deal={d} onOpen={onOpen} />
          ))}
          {deals.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">معامله‌ای اینجا نیست</p>}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCard({ deal, onOpen }: { deal: BoardDeal; onOpen: (d: BoardDeal) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(deal)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter") onOpen(deal);
      }}
      aria-roledescription="کارت معامله"
    >
      <DealCard deal={deal} />
    </div>
  );
}

function DealCard({ deal, overlay }: { deal: BoardDeal; overlay?: boolean }) {
  return (
    <article
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 text-sm shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing",
        overlay && "rotate-2 shadow-lg",
      )}
    >
      <h3 className="font-medium leading-snug">{deal.title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{deal.customerName}</p>
      <p className="mt-2 font-semibold tabular-nums">{formatToman(deal.amount)}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {deal.expectedCloseAt ? (
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {formatDate(deal.expectedCloseAt)}
          </span>
        ) : (
          <span />
        )}
        {deal.ownerName && (
          <Avatar className="size-6" title={deal.ownerName}>
            <AvatarFallback className="text-[10px]">{deal.ownerName.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </article>
  );
}
