"use client";

import { useState } from "react";
import * as jalali from "date-fns-jalali";
import { CalendarIcon, X } from "lucide-react";
import { faIR } from "react-day-picker/locale";
import { formatDate } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// date-fns-jalali has the same function names as date-fns, so DayPicker does all its month math in the Jalali calendar.
const jalaliDateLib = jalali as unknown as React.ComponentProps<typeof Calendar>["dateLib"];
const monthLabel = (d: Date) => new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(d);
const dayLabel = (d: Date) => new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);

/** Jalali date picker for forms. Submits `name` as an ISO date (yyyy-mm-dd) or empty. */
export function DatePicker({ name, defaultValue, placeholder = "انتخاب تاریخ" }: { name: string; defaultValue?: Date | null; placeholder?: string }) {
  const [date, setDate] = useState<Date | undefined>(defaultValue ?? undefined);
  const [open, setOpen] = useState(false);
  // Local date parts, not toISOString(), which would shift the day across midnight in Tehran's UTC+3:30.
  const iso = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : "";

  return (
    <div className="flex gap-1">
      <input type="hidden" name={name} value={iso} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="flex-1 justify-start font-normal">
            <CalendarIcon />
            {date ? formatDate(date) : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => (setDate(d), setOpen(false))}
            dateLib={jalaliDateLib}
            locale={faIR}
            dir="rtl"
            numerals="arabext"
            // The locale's month names are Gregorian; Intl's fa-IR uses the Persian calendar ("آبان ۱۴۰۵").
            formatters={{ formatCaption: monthLabel }}
            labels={{
              labelGrid: monthLabel,
              labelDayButton: (d, m) => `${dayLabel(d)}${m.today ? "، امروز" : ""}${m.selected ? "، انتخاب‌شده" : ""}`,
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {date && (
        <Button type="button" variant="ghost" size="icon" onClick={() => setDate(undefined)} aria-label="پاک کردن تاریخ">
          <X />
        </Button>
      )}
    </div>
  );
}
