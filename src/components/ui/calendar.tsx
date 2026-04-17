"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium capitalize",
        nav: "flex items-center gap-1",
        nav_button:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-input hover:bg-accent",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground w-9 text-center text-xs font-normal",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-accent",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "bg-accent text-accent-foreground rounded-none",
        day_range_start: "bg-primary text-primary-foreground rounded-r-none",
        day_range_end: "bg-primary text-primary-foreground rounded-l-none",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";
