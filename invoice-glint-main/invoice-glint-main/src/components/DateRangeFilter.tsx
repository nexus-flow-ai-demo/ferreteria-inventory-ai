import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

const presets = [
  { label: 'Últimos 7 días', range: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Últimos 30 días', range: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Este mes', range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
];

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
    } else if (range?.from) {
      onDateRangeChange({ from: range.from, to: range.from });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-lg border-0 bg-card shadow-card hover:shadow-card-hover text-sm gap-2 h-10">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline">
            {format(dateRange.from, 'dd MMM', { locale: es })} – {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
          </span>
          <span className="sm:hidden">
            {format(dateRange.from, 'dd/MM')} – {format(dateRange.to, 'dd/MM')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl border-0 shadow-card-hover" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r border-border">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start text-sm rounded-md"
                onClick={() => {
                  onDateRangeChange(preset.range());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={handleSelect}
            numberOfMonths={1}
            className={cn("p-3 pointer-events-auto")}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
