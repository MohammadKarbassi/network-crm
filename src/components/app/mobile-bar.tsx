"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useOpenPalette } from "./command-palette";
import { Logo } from "./logo";

/** Phones only: the sidebar is a sheet, so the bar carries menu, mark and search. */
export function MobileBar() {
  const openPalette = useOpenPalette();
  return (
    <header className="sticky top-0 z-20 flex h-13 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur md:hidden">
      <SidebarTrigger aria-label="منو" />
      <Logo className="[&_svg]:size-6" />
      <Button variant="ghost" size="icon" className="ms-auto" onClick={openPalette} aria-label="جستجو">
        <Search />
      </Button>
    </header>
  );
}
