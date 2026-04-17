"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium capitalize",
        nav: "space-x-1 flex items-center",
        nav_button:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg hover:bg-neutral-100 flex items-center justify-center",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-neutral-400 rounded-md w-9 font-normal text-[0.8rem] capitalize",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm relative focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal rounded-xl hover:bg-neutral-100 aria-selected:opacity-100",
        day_selected:
          "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white focus:bg-neutral-900 focus:text-white rounded-xl",
        day_today: "bg-neutral-100 text-neutral-900 font-semibold",
        day_outside: "opacity-30",
        day_disabled: "opacity-20 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-neutral-100 aria-selected:text-neutral-900 rounded-none",
        day_range_start: "rounded-l-xl",
        day_range_end: "rounded-r-xl",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
