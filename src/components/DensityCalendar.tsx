'use client';

import React from 'react';
import { getDensityMap, isCountryOnHoliday, getGermanStatesOnHoliday, COUNTRIES } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  year: number;
  countryCodes: string[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Density scale is always 0–10 (representing 0 %–100 % of population). */
const DENSITY_MAX = 10;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function densityColor(density: number): string {
  if (density === 0) return 'bg-gray-100';
  const colors = [
    'bg-blue-100',
    'bg-blue-200',
    'bg-blue-300',
    'bg-blue-400',
    'bg-blue-500',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-indigo-700',
    'bg-indigo-800',
    'bg-indigo-900',
  ];
  // density 1 → colors[0], density 10 → colors[9]
  return colors[Math.min(density - 1, colors.length - 1)];
}


export default function DensityCalendar({ year, countryCodes }: Props) {
  const densityMap = React.useMemo(
    () => getDensityMap(year, countryCodes),
    [year, countryCodes]
  );

  const isSingleCountry = countryCodes.length === 1;
  const singleCountryCode = isSingleCountry ? countryCodes[0] : null;
  const isGermany = singleCountryCode === 'DE';

  const countryNames = React.useMemo(() => {
    return COUNTRIES.filter((c) => countryCodes.includes(c.code));
  }, [countryCodes]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month header */}
          <div className="flex">
            <div className="w-7 shrink-0" />
            {MONTHS.map((month) => (
              <div
                key={month}
                className="flex-1 text-center text-xs font-semibold text-gray-500 pb-1"
              >
                {month}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <div key={day} className="flex items-center gap-0">
              {/* Day label */}
              <div className="w-7 shrink-0 text-right pr-1 text-xs text-gray-400 font-mono leading-none">
                {day}
              </div>

              {/* Month cells */}
              {Array.from({ length: 12 }, (_, monthIdx) => {
                const month = monthIdx + 1;
                const daysInMonth = getDaysInMonth(year, month);
                const isValid = day <= daysInMonth;
                const dateStr = isValid
                  ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  : null;
                const density = isValid && dateStr ? (densityMap.get(dateStr) ?? 0) : null;

                if (!isValid) {
                  return (
                    <div
                      key={monthIdx}
                      className="flex-1 h-4 m-px rounded-sm bg-gray-50"
                    />
                  );
                }

                const bg = density !== null ? densityColor(density) : 'bg-gray-50';

                const date = new Date(year, monthIdx, day);
                const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <Tooltip key={monthIdx}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex-1 h-4 m-px rounded-sm cursor-default transition-opacity hover:opacity-80 ${bg} ${isWeekend ? 'ring-1 ring-inset ring-black/10' : ''}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-semibold">
                        {weekday}, {MONTHS[monthIdx]} {day}, {year}
                      </div>
                      {density !== null && density > 0 ? (
                        <div className="mt-0.5 text-blue-300">
                          ~{density * 10}% of population on holiday
                        </div>
                      ) : (
                        <div className="mt-0.5 text-gray-400">No holidays</div>
                      )}
                      {density !== null && density > 0 && !isSingleCountry && dateStr && (
                        <div className="mt-1 text-gray-300 text-[10px]">
                          {countryNames
                            .filter((c) => isCountryOnHoliday(c.code, dateStr))
                            .map((c) => `${c.flag} ${c.name}`)
                            .join(', ')}
                        </div>
                      )}
                      {density !== null && density > 0 && isGermany && dateStr && (
                        <div className="mt-1 text-gray-300 text-[10px]">
                          {getGermanStatesOnHoliday(dateStr).join(', ')}
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}

          {/* Weekend indicator row */}
          <div className="flex mt-2">
            <div className="w-7 shrink-0" />
            <div className="flex-1 flex items-center gap-1 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-sm ring-1 ring-inset ring-black/10 bg-gray-100" />
              <span>Weekend</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Population on holiday:</span>
            {Array.from({ length: DENSITY_MAX + 1 }, (_, i) => i).map((step) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={`w-4 h-4 rounded-sm ${densityColor(step)}`}
                />
                <span className="text-xs text-gray-500">{step * 10}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
