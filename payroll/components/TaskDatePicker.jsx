"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISODate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toISODate(value) {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  if (!value) {
    return "";
  }

  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}-${month}-${year}`;
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isBeforeToday(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compare = new Date(value);
  compare.setHours(0, 0, 0, 0);

  return compare.getTime() < today.getTime();
}

function buildMonthDays(viewDate) {
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = start.getDay();
  const days = [];
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - startOffset);

  for (let index = 0; index < 42; index += 1) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export default function TaskDatePicker({
  label,
  value,
  onChange,
  placeholder = "Select due date",
}) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseISODate(value) || new Date());

  const selectedDate = useMemo(() => parseISODate(value), [value]);
  const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate]);

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  function openCalendar() {
    setViewDate(selectedDate || new Date());
    setIsOpen(true);
  }

  function selectDate(day) {
    onChange(toISODate(day));
    setViewDate(day);
    setIsOpen(false);
  }

  const displayValue = selectedDate ? formatDisplayDate(selectedDate) : "";

  return (
    <div ref={rootRef} className="relative space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
        className="relative w-full rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 pl-11 text-left text-lavender outline-none transition hover:border-sage focus:border-sage focus:ring-2 focus:ring-sage/30"
      >
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray">
          <CalendarDays size={16} strokeWidth={2} />
        </span>
        <span className={displayValue ? "text-lavender" : "text-gray"}>
          {displayValue || placeholder}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[20rem] rounded-[1.5rem] border border-sage/35 bg-pakistan-green p-4 shadow-[0_24px_70px_rgba(30,18,18,0.42)]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sage/30 bg-royal-purple text-lavender transition hover:bg-royal-purple/20"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-semibold text-lavender">
              {viewDate.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sage/30 bg-royal-purple text-lavender transition hover:bg-royal-purple/20"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="py-1">
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const inCurrentMonth = day.getMonth() === viewDate.getMonth();
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const disabled = isBeforeToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(day)}
                  className={`flex h-10 items-center justify-center rounded-xl border text-sm transition ${
                    selected
                      ? "border-sage bg-sage text-lavender"
                      : disabled
                      ? "border-gray/25 bg-pakistan-green text-gray opacity-70"
                      : inCurrentMonth
                      ? "border-sage/20 bg-royal-purple text-lavender hover:bg-royal-purple/20"
                      : "border-pakistan-green bg-pakistan-green text-gray hover:bg-pakistan-green"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}


