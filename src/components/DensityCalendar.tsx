'use client';

import React from 'react';
import { getDensityMap, getHolidaysForCountry, COUNTRIES } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  year: number;
  countryCodes: string[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function densityColor(density: number, max: number): string {
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
  // When max is 1, there's only one possible non-zero density value
  if (max <= 1) return colors[colors.length - 1];
  const idx = Math.min(density - 1, colors.length - 1);
  // Scale to the full color range when there are fewer countries than color steps
  if (max <= colors.length) {
    const scaled = Math.round(((density - 1) / (max - 1)) * (colors.length - 1));
    return colors[Math.min(scaled, colors.length - 1)];
  }
  return colors[idx];
}


export default function DensityCalendar({ year, countryCodes }: Props) {
  const densityMap = React.useMemo(
    () => getDensityMap(year, countryCodes),
    [year, countryCodes]
  );

  const maxDensity = countryCodes.length;

  const legendSteps = React.useMemo(() => {
    if (maxDensity === 1) return [0, 1];
    const steps: number[] = [];
    for (let i = 0; i <= maxDensity; i++) steps.push(i);
    return steps;
  }, [maxDensity]);

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

                const bg = density !== null ? densityColor(density, maxDensity) : 'bg-gray-50';

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
                          {density} of {maxDensity}{' '}
                          {maxDensity === 1 ? 'country has' : 'countries have'} a holiday
                        </div>
                      ) : (
                        <div className="mt-0.5 text-gray-400">No holidays</div>
                      )}
                      {density !== null && density > 0 && countryNames.length > 1 && (
                        <div className="mt-1 text-gray-300 text-[10px]">
                          {countryNames
                            .filter((c) => {
                              if (!dateStr) return false;
                              const ch = getHolidaysForCountry(c.code);
                              return ch?.periods.some(
                                (p) => dateStr >= p.start && dateStr <= p.end
                              );
                            })
                            .map((c) => `${c.flag} ${c.name}`)
                            .join(', ')}
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
            <span className="text-xs text-gray-500 font-medium">Density:</span>
            {legendSteps.map((step) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={`w-4 h-4 rounded-sm ${densityColor(step, maxDensity)}`}
                />
                <span className="text-xs text-gray-500">{step}</span>
              </div>
            ))}
            <span className="text-xs text-gray-400 ml-1">(countries on holiday)</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
