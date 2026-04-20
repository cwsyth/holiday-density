'use client';

import React, { useState } from 'react';
import { getDensityMap, isCountryOnHoliday, getRegionsOnHoliday, getRegionCount, getHolidayNamesForDate, COUNTRIES } from '@/lib/holidays';
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
  // Key to detect when the view changes (year or selected countries).
  const viewKey = `${year}:${countryCodes.join(',')}`;

  // Store the view context alongside the clicked date so the panel
  // automatically clears when the user switches year/country.
  const [clickedState, setClickedState] = useState<{ viewKey: string; dateStr: string } | null>(null);
  const clickedCell = clickedState?.viewKey === viewKey ? clickedState.dateStr : null;

  const densityMap = React.useMemo(
    () => getDensityMap(year, countryCodes),
    [year, countryCodes]
  );

  const isSingleCountry = countryCodes.length === 1;
  const singleCountryCode = isSingleCountry ? countryCodes[0] : null;
  const regionCount = singleCountryCode ? getRegionCount(singleCountryCode) : 0;
  const hasRegions = regionCount > 0;

  const countryNames = React.useMemo(() => {
    return COUNTRIES.filter((c) => countryCodes.includes(c.code));
  }, [countryCodes]);

  /** Shared tooltip/panel content for a given date. */
  function renderCellInfo(dateStr: string, density: number, weekday: string, monthIdx: number, day: number) {
    const onHolidayCountries =
      density > 0 && !isSingleCountry
        ? countryNames.filter((c) => isCountryOnHoliday(c.code, dateStr))
        : [];
    const regionsOnHoliday =
      hasRegions && singleCountryCode ? getRegionsOnHoliday(singleCountryCode, dateStr) : [];
    const holidayNames =
      isSingleCountry && singleCountryCode && density > 0
        ? getHolidayNamesForDate(singleCountryCode, dateStr)
        : [];

    return (
      <>
        <div className="font-semibold">
          {weekday}, {MONTHS[monthIdx]} {day}, {year}
        </div>
        {density > 0 ? (
          <div className="mt-0.5 text-blue-300">~{density * 10}% of population on holiday</div>
        ) : regionsOnHoliday.length > 0 ? (
          <div className="mt-0.5 text-gray-300">
            School break in {regionsOnHoliday.length}/{regionCount}{' '}
            {regionsOnHoliday.length === 1 ? 'region' : 'regions'}
          </div>
        ) : (
          <div className="mt-0.5 text-gray-400">No holidays</div>
        )}
        {holidayNames.length > 0 && (
          <div className="mt-1 text-gray-300 text-[10px]">
            {holidayNames.join(' · ')}
          </div>
        )}
        {onHolidayCountries.length > 0 && (
          <div className="mt-1 text-gray-300 text-[10px]">
            {onHolidayCountries.length}/{countryNames.length} countries:{' '}
            {onHolidayCountries.map((c) => c.name).join(', ')}
          </div>
        )}
        {regionsOnHoliday.length > 0 && (
          <div className="mt-1 text-gray-300 text-[10px]">
            {regionsOnHoliday.length}/{regionCount} regions:{' '}
            {regionsOnHoliday.join(', ')}
          </div>
        )}
      </>
    );
  }

  // Compute info for the clicked cell (used by the info panel)
  const clickedInfo = React.useMemo(() => {
    if (!clickedCell) return null;
    const [cy, cm, cd] = clickedCell.split('-').map(Number);
    const date = new Date(cy, cm - 1, cd);
    return {
      density: densityMap.get(clickedCell) ?? 0,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      monthIdx: cm - 1,
      day: cd,
    };
  }, [clickedCell, densityMap]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full overflow-x-auto -mx-1 px-1">
        <div className="min-w-[340px]">
          {/* Month header */}
          <div className="flex">
            <div className="w-5 sm:w-7 shrink-0" />
            {MONTHS.map((month) => (
              <div
                key={month}
                className="flex-1 text-center text-[10px] sm:text-xs font-semibold text-gray-500 pb-1"
              >
                {month}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <div key={day} className="flex items-center gap-0">
              {/* Day label */}
              <div className="w-5 sm:w-7 shrink-0 text-right pr-0.5 sm:pr-1 text-[10px] sm:text-xs text-gray-400 font-mono leading-none">
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
                      className="flex-1 h-3 sm:h-4 m-px rounded-sm bg-gray-50"
                    />
                  );
                }

                const bg = density !== null ? densityColor(density) : 'bg-gray-50';

                const date = new Date(year, monthIdx, day);
                const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isClicked = clickedCell === dateStr;

                return (
                  <Tooltip key={monthIdx}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex-1 h-3 sm:h-4 m-px rounded-sm cursor-pointer transition-opacity hover:opacity-80 ${bg} ${
                          isClicked
                            ? 'ring-2 ring-white'
                            : isWeekend
                            ? 'ring-1 ring-inset ring-black/10'
                            : ''
                        }`}
                        onClick={() =>
                          setClickedState(isClicked ? null : { viewKey, dateStr: dateStr! })
                        }
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {dateStr && density !== null
                        ? renderCellInfo(dateStr, density, weekday, monthIdx, day)
                        : null}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}

          {/* Weekend indicator row */}
          <div className="flex mt-2">
            <div className="w-5 sm:w-7 shrink-0" />
            <div className="flex-1 flex items-center gap-1 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-sm ring-1 ring-inset ring-black/10 bg-gray-100" />
              <span>Weekend</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium w-full sm:w-auto">Population on holiday:</span>
            {Array.from({ length: DENSITY_MAX + 1 }, (_, i) => i).map((step) => (
              <div key={step} className="flex items-center gap-0.5 sm:gap-1">
                <div
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${densityColor(step)}`}
                />
                <span className="text-[10px] sm:text-xs text-gray-500">{step * 10}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clicked-cell info panel — visible on all screen sizes, useful on mobile where hover is unavailable */}
      {clickedCell && clickedInfo && (
        <div className="mt-3 p-3 bg-slate-900 rounded-lg text-white text-xs relative">
          <button
            onClick={() => setClickedState(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white leading-none"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="pr-4">
            {renderCellInfo(
              clickedCell,
              clickedInfo.density,
              clickedInfo.weekday,
              clickedInfo.monthIdx,
              clickedInfo.day,
            )}
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
