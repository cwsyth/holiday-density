'use client';

import React, { useState } from 'react';
import {
  getDensityMap,
  isCountryOnHoliday,
  getRegionsOnHoliday,
  getRegionCount,
  getHolidayNamesForDate,
  getQuietestWindows,
  COUNTRIES,
} from '@/lib/holidays';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  year: number;
  countryCodes: string[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Density scale is always 0–10 (representing 0 %–100 % of population). */
const DENSITY_MAX = 10;

// Supported trip-length choices from 3 to 30 days inclusive.
const WINDOW_DURATIONS = Array.from({ length: 28 }, (_, i) => i + 3);
type WindowDays = number;
type QuietWindow = { start: string; end: string; avgDensity: number };
type QuietWindowBlock = QuietWindow & { windowCount: number };
const INVALID_DAY_RING_CLASS = 'ring-1 ring-inset ring-zinc-600/70';
const INVALID_DAY_BG_CLASS =
  'bg-zinc-700/65 bg-[repeating-linear-gradient(135deg,rgba(113,122,138,0.45)_0px,rgba(113,122,138,0.45)_2px,rgba(56,62,75,0.65)_2px,rgba(56,62,75,0.65)_5px)]';
const WEEKEND_RING_CLASS = 'ring-1 ring-inset ring-[#4d5a73]';
const WEEKEND_BG_CLASS = 'bg-[#2f3b52]';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function densityColor(density: number): string {
  if (density === 0) return 'bg-[#dbe4f0]';
  const colors = [
    'bg-[#b8eadf]',
    'bg-[#81d5c9]',
    'bg-[#56c8c8]',
    'bg-[#84c8ff]',
    'bg-[#4ca9ff]',
    'bg-[#2f78ff]',
    'bg-[#3557f0]',
    'bg-[#5b3fe6]',
    'bg-[#7430df]',
    'bg-[#8d2df5]',
  ];
  // density 1 → colors[0], density 10 → colors[9]
  return colors[Math.min(density - 1, colors.length - 1)];
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Format a YYYY-MM-DD string as "Mon D, YYYY". */
function formatDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Iterate over all dates in [start, end] inclusive and call cb for each. */
function eachDate(start: string, end: string, cb: (dateStr: string) => void): void {
  const [sy, sm, sd] = start.split('-').map(Number);
  const d = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = end.split('-').map(Number);
  const endTs = new Date(ey, em - 1, ed).getTime();
  while (d.getTime() <= endTs) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    cb(`${y}-${mo}-${day}`);
    d.setDate(d.getDate() + 1);
  }
}

// ---------------------------------------------------------------------------
// Selection state machine
// ---------------------------------------------------------------------------
type SelectionState =
  | { phase: 'idle' }
  | { phase: 'single'; date: string }
  | { phase: 'range'; start: string; end: string };

export default function DensityCalendar({ year, countryCodes }: Props) {
  // Key to detect when the view changes (year or selected countries).
  const viewKey = `${year}:${countryCodes.join(',')}`;

  const [selectionState, setSelectionState] = useState<SelectionState & { viewKey: string }>({
    phase: 'idle',
    viewKey,
  });

  // Best-time-to-travel state
  const [showBestTime, setShowBestTime] = useState(false);
  const [windowDays, setWindowDays] = useState<WindowDays>(7);

  // Clear selection when the view changes
  const effectiveSelection: SelectionState =
    selectionState.viewKey === viewKey ? selectionState : { phase: 'idle' };

  const densityMap = React.useMemo(
    () => getDensityMap(year, countryCodes),
    [year, countryCodes],
  );

  const isSingleCountry = countryCodes.length === 1;
  const singleCountryCode = isSingleCountry ? countryCodes[0] : null;
  const regionCount = singleCountryCode ? getRegionCount(singleCountryCode) : 0;
  const hasRegions = regionCount > 0;

  const countryNames = React.useMemo(() => {
    return COUNTRIES.filter((c) => countryCodes.includes(c.code));
  }, [countryCodes]);

  // ---------------------------------------------------------------------------
  // Best-time windows
  // ---------------------------------------------------------------------------
  const bestTimeWindows = React.useMemo<QuietWindow[]>(() => {
    if (!showBestTime) return [];
    return getQuietestWindows(densityMap, year, windowDays);
  }, [showBestTime, densityMap, year, windowDays]);

  const quietestBlocks = React.useMemo<QuietWindowBlock[]>(() => {
    if (bestTimeWindows.length === 0) return [];

    const blocks: QuietWindowBlock[] = [];
    let current: QuietWindowBlock = { ...bestTimeWindows[0], windowCount: 1 };

    for (let i = 1; i < bestTimeWindows.length; i++) {
      const next = bestTimeWindows[i];
      const shouldMerge = next.start <= addDays(current.end, 1);

      if (shouldMerge) {
        if (next.end > current.end) current.end = next.end;
        current.windowCount += 1;
      } else {
        blocks.push(current);
        current = { ...next, windowCount: 1 };
      }
    }

    blocks.push(current);
    return blocks;
  }, [bestTimeWindows]);

  const bestTimeSet = React.useMemo(() => {
    const set = new Set<string>();
    for (const block of quietestBlocks) {
      eachDate(block.start, block.end, (d) => set.add(d));
    }
    return set;
  }, [quietestBlocks]);

  // ---------------------------------------------------------------------------
  // Range stats
  // ---------------------------------------------------------------------------
  const rangeStats = React.useMemo(() => {
    if (effectiveSelection.phase !== 'range') return null;
    const { start, end } = effectiveSelection;
    const densities: number[] = [];
    eachDate(start, end, (d) => densities.push(densityMap.get(d) ?? 0));
    const avg = densities.reduce((s, v) => s + v, 0) / densities.length;
    const peak = Math.max(...densities);
    return { days: densities.length, avg, peak };
  }, [effectiveSelection, densityMap]);

  // ---------------------------------------------------------------------------
  // Click handler
  // ---------------------------------------------------------------------------
  function handleCellClick(dateStr: string) {
    const sel = effectiveSelection;
    if (sel.phase === 'idle' || sel.phase === 'range') {
      setSelectionState({ phase: 'single', date: dateStr, viewKey });
    } else {
      // phase === 'single'
      if (dateStr === sel.date) {
        setSelectionState({ phase: 'idle', viewKey });
      } else {
        const [s, e] = dateStr < sel.date ? [dateStr, sel.date] : [sel.date, dateStr];
        setSelectionState({ phase: 'range', start: s, end: e, viewKey });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Tooltip/panel content for a single date
  // ---------------------------------------------------------------------------
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

  // Compute info for the single-day panel
  const singleInfo = React.useMemo(() => {
    if (effectiveSelection.phase !== 'single') return null;
    const dateStr = effectiveSelection.date;
    const [, cm, cd] = dateStr.split('-').map(Number);
    const date = new Date(year, cm - 1, cd);
    return {
      dateStr,
      density: densityMap.get(dateStr) ?? 0,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      monthIdx: cm - 1,
      day: cd,
    };
  }, [effectiveSelection, densityMap, year]);

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
                      className={cn(
                        'flex-1 h-3 sm:h-4 m-px rounded-sm',
                        INVALID_DAY_RING_CLASS,
                        INVALID_DAY_BG_CLASS,
                      )}
                    />
                  );
                }

                const bg = density !== null ? densityColor(density) : 'bg-gray-50';

                const date = new Date(year, monthIdx, day);
                const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                // Determine selection highlight
                const isSingleSelected =
                  effectiveSelection.phase === 'single' && dateStr === effectiveSelection.date;
                const isInRange =
                  effectiveSelection.phase === 'range' &&
                  dateStr !== null &&
                  dateStr >= effectiveSelection.start &&
                  dateStr <= effectiveSelection.end;
                const isRangeEndpoint =
                  effectiveSelection.phase === 'range' &&
                  dateStr !== null &&
                  (dateStr === effectiveSelection.start || dateStr === effectiveSelection.end);

                const isInBestTime = showBestTime && dateStr !== null && bestTimeSet.has(dateStr);

                let ringClass = '';
                let stateBgClass = '';
                if (isSingleSelected || isRangeEndpoint) {
                  ringClass = 'ring-2 sm:ring-[3px] ring-cyan-300';
                  stateBgClass = 'bg-cyan-500/65';
                } else if (isInRange) {
                  ringClass = 'ring-2 sm:ring-[3px] ring-amber-400';
                  stateBgClass = 'bg-amber-400/55';
                } else if (isInBestTime) {
                  ringClass = 'ring-2 sm:ring-[3px] ring-emerald-400';
                  stateBgClass = 'bg-emerald-500/50';
                } else if (isWeekend) {
                  ringClass = WEEKEND_RING_CLASS;
                  stateBgClass = WEEKEND_BG_CLASS;
                }

                return (
                  <Tooltip key={monthIdx}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'flex-1 h-3 sm:h-4 m-px rounded-sm cursor-pointer transition-opacity hover:opacity-80',
                          bg,
                          stateBgClass,
                          ringClass,
                        )}
                        onClick={() => dateStr && handleCellClick(dateStr)}
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
              <div className={cn('w-3 h-3 rounded-sm', WEEKEND_RING_CLASS, WEEKEND_BG_CLASS)} />
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

          {/* Single-day info panel */}
          {effectiveSelection.phase === 'single' && singleInfo && (
            <div className="mt-3 p-3 bg-[#1a2233] border border-zinc-700/80 rounded-lg text-white text-xs relative">
              <button
                onClick={() => setSelectionState({ phase: 'idle', viewKey })}
                className="absolute top-2 right-2 text-gray-400 hover:text-white leading-none"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="pr-4">
                {renderCellInfo(
                  singleInfo.dateStr,
                  singleInfo.density,
                  singleInfo.weekday,
                  singleInfo.monthIdx,
                  singleInfo.day,
                )}
                <div className="mt-1.5 text-gray-400 text-[10px]">
                  Click another date to select a range.
                </div>
              </div>
            </div>
          )}

          {/* Range stats panel */}
          {effectiveSelection.phase === 'range' && rangeStats && (
            <div className="mt-3 p-3 bg-[#1a2233] border border-zinc-700/80 rounded-lg text-white text-xs relative">
              <button
                onClick={() => setSelectionState({ phase: 'idle', viewKey })}
                className="absolute top-2 right-2 text-gray-400 hover:text-white leading-none"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="pr-4">
                <div className="font-semibold">
                  {formatDateStr(effectiveSelection.start)} – {formatDateStr(effectiveSelection.end)}
                </div>
                <div className="mt-0.5 text-gray-300">{rangeStats.days} day{rangeStats.days !== 1 ? 's' : ''} selected</div>
                <div className="mt-1 text-blue-300">
                  Avg ~{Math.round(rangeStats.avg * 10)}% of population on holiday
                </div>
                <div className="mt-0.5 text-gray-300">
                  Peak ~{rangeStats.peak * 10}% on at least one day
                </div>
                <div className="mt-1.5 text-gray-400 text-[10px]">
                  Click any date to start a new selection.
                </div>
              </div>
            </div>
          )}

          {/* Best time to travel controls */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowBestTime((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                showBestTime
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              🌿 Find quietest periods
            </button>
            {showBestTime && (
              <>
                <span className="text-xs text-gray-500">Trip length:</span>
                <select
                  aria-label="Trip length"
                  value={windowDays}
                  onChange={(e) => setWindowDays(Number(e.target.value))}
                  className="h-8 rounded-full border border-gray-200 bg-white px-3 text-xs text-gray-700"
                >
                  {WINDOW_DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Info panels                                                         */}
      {/* ------------------------------------------------------------------ */}

      {/* Best-time windows panel */}
      {showBestTime && quietestBlocks.length > 0 && (
        <div className="mt-3 p-3 bg-zinc-800 rounded-lg text-white text-xs">
          <div className="font-semibold text-emerald-400 mb-2">
            🌿 {quietestBlocks.length} quietest period{quietestBlocks.length !== 1 ? 's' : ''} for {windowDays}-day trips in {year}
          </div>
          <div className="space-y-1.5">
            {quietestBlocks.map((w, i) => (
              <div key={`${w.start}-${w.end}`} className="flex items-center gap-2">
                <span className="text-gray-400 w-4 shrink-0">{i + 1}.</span>
                <div className="w-2 h-2 rounded-sm ring-2 sm:ring-[3px] ring-emerald-400 bg-transparent shrink-0" />
                <span className="text-gray-100 truncate">
                  {formatDateStr(w.start)} – {formatDateStr(w.end)}
                </span>
                <span className="text-emerald-400 ml-auto shrink-0">
                  avg ~{Math.round(w.avgDensity * 10)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-gray-500 text-[10px]">
            Similar quiet windows are grouped together for easier planning; green-ringed cells show these periods on the calendar above.
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
