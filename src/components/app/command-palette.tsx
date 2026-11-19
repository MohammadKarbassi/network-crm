"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Kanban, Loader2, Target, Users } from "lucide-react";
import { type SearchHit, searchAction } from "@/app/(app)/search/actions";
import type { Role } from "@/generated/prisma/enums";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { visibleNav } from "./nav";

const kindIcon = { customer: Users, lead: Target, deal: Kanban } as const;
const kindLabel = { customer: "مشتری‌ها", lead: "لیدها", deal: "معامله‌ها" } as const;

const PaletteContext = createContext<() => void>(() => {});
/** Opens the palette from anywhere (the sidebar search button). */
export const useOpenPalette = () => useContext(PaletteContext);

/** ⌘K / Ctrl+K: jump to any page or any customer, lead or deal the user may see. */
export function CommandPalette({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A slow earlier response must not overwrite results for a newer query.
  const latest = useRef(query);
  useEffect(() => {
    latest.current = query;
    const t = setTimeout(
      () =>
        startSearch(async () => {
          const res = query.trim().length >= 2 ? await searchAction(query) : [];
          if (latest.current === query) setHits(res);
        }),
      180,
    );
    return () => clearTimeout(t);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const nav = visibleNav(role)
    .flatMap((g) => g.items)
    .filter((i) => !query.trim() || i.label.includes(query.trim()));
  const groups = (["customer", "lead", "deal"] as const).map((k) => ({ kind: k, items: hits.filter((h) => h.kind === k) })).filter((g) => g.items.length);

  return (
    <PaletteContext value={() => setOpen(true)}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} title="جستجو" description="جستجوی صفحه‌ها، مشتری‌ها، لیدها و معامله‌ها" className="sm:max-w-xl">
        {/* Results come from the server, so cmdk's own fuzzy filter is off. */}
        <Command shouldFilter={false} dir="rtl">
          <CommandInputWrapper value={query} onChange={setQuery} searching={searching} />
          <CommandList className="max-h-[min(60svh,26rem)]">
            <CommandEmpty>{query.trim().length < 2 ? "حداقل دو حرف بنویسید." : "چیزی پیدا نشد."}</CommandEmpty>
            {groups.map((g) => {
              const Icon = kindIcon[g.kind];
              return (
                <CommandGroup key={g.kind} heading={kindLabel[g.kind]}>
                  {g.items.map((h) => (
                    <CommandItem key={h.kind + h.id} value={h.kind + h.id} onSelect={() => go(h.href)}>
                      <Icon className="text-muted-foreground" />
                      <span className="truncate">{h.title}</span>
                      {h.subtitle && <span className="ms-auto truncate text-xs text-muted-foreground">{h.subtitle}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
            {nav.length > 0 && (
              <CommandGroup heading="رفتن به">
                {nav.map((i) => (
                  <CommandItem key={i.href} value={"nav" + i.href} onSelect={() => go(i.href)}>
                    <i.icon className="text-muted-foreground" />
                    {i.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </PaletteContext>
  );
}

function CommandInputWrapper({ value, onChange, searching }: { value: string; onChange: (v: string) => void; searching: boolean }) {
  return (
    <div className="relative">
      <CommandInput value={value} onValueChange={onChange} placeholder="جستجوی نام، شرکت، تلفن یا عنوان معامله…" />
      {searching && <Loader2 className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
    </div>
  );
}

const noop = () => () => {};
/** "⌘K" on Mac, "Ctrl K" elsewhere (most office desktops here run Windows). */
export function useShortcutLabel() {
  return useSyncExternalStore(noop, () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K"), () => "Ctrl K");
}
