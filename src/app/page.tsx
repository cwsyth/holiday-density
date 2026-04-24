'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { COUNTRIES, COUNTRY_DATA_DETAILS } from '@/lib/holidays';
import DensityCalendar from '@/components/DensityCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const ALL_CODES = COUNTRIES.map((c) => c.code);
const DEFAULT_WINDOW_DAYS = 7;
const MIN_WINDOW_DAYS = 3;
const MAX_WINDOW_DAYS = 30;

function defaultYear(): number {
  const current = new Date().getFullYear();
  if (YEARS.includes(current)) return current;
  // Clamp to the nearest available year
  return current < YEARS[0] ? YEARS[0] : YEARS[YEARS.length - 1];
}

type Tab = 'all' | string;
type ShareState = 'idle' | 'copied' | 'error';
type UiState = {
  year: number;
  activeTab: Tab;
  showBestTime: boolean;
  windowDays: number;
  selectedRangeStart: string | null;
  selectedRangeEnd: string | null;
};

function parseYear(value: string | null): number {
  const n = Number(value);
  return YEARS.includes(n) ? n : defaultYear();
}

function parseCountry(value: string | null): Tab {
  if (!value) return 'all';
  return ALL_CODES.includes(value) ? value : 'all';
}

function parseWindowDays(value: string | null): number {
  const n = Number(value);
  if (!Number.isInteger(n)) return DEFAULT_WINDOW_DAYS;
  return Math.min(MAX_WINDOW_DAYS, Math.max(MIN_WINDOW_DAYS, n));
}

function parseDateForYear(value: string | null, year: number): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  if (!value.startsWith(`${year}-`)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const normalized = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  return normalized === value ? value : null;
}

function parseSelectedRange(startValue: string | null, endValue: string | null, year: number): {
  selectedRangeStart: string | null;
  selectedRangeEnd: string | null;
} {
  const start = parseDateForYear(startValue, year);
  const end = parseDateForYear(endValue, year);
  if (!start || !end) return { selectedRangeStart: null, selectedRangeEnd: null };
  if (start > end) return { selectedRangeStart: null, selectedRangeEnd: null };
  return { selectedRangeStart: start, selectedRangeEnd: end };
}

function confidenceBadgeClass(confidence: 'high' | 'medium' | 'approximate'): string {
  if (confidence === 'high') return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
  if (confidence === 'medium') return 'bg-amber-500/20 text-amber-100 border-amber-400/30';
  return 'bg-zinc-500/20 text-zinc-100 border-zinc-400/30';
}

function getInitialUiState(): UiState {
  const fallback: UiState = {
    year: defaultYear(),
    activeTab: 'all',
    showBestTime: false,
    windowDays: DEFAULT_WINDOW_DAYS,
    selectedRangeStart: null,
    selectedRangeEnd: null,
  };
  if (typeof window === 'undefined') return fallback;

  const params = new URLSearchParams(window.location.search);
  const year = parseYear(params.get('y'));
  const selectedRange = parseSelectedRange(params.get('s'), params.get('e'), year);
  return {
    year,
    activeTab: parseCountry(params.get('c')),
    showBestTime: params.get('q') === '1',
    windowDays: parseWindowDays(params.get('w')),
    selectedRangeStart: selectedRange.selectedRangeStart,
    selectedRangeEnd: selectedRange.selectedRangeEnd,
  };
}

export default function Home() {
  const [uiState, setUiState] = useState<UiState>(getInitialUiState);
  const [shareState, setShareState] = useState<ShareState>('idle');

  const { year, activeTab, showBestTime, windowDays, selectedRangeStart, selectedRangeEnd } = uiState;
  const countryCodes = activeTab === 'all' ? ALL_CODES : [activeTab];
  const activeCountry = COUNTRIES.find((c) => c.code === activeTab);
  const detailsByCode = useMemo(
    () => new Map(COUNTRY_DATA_DETAILS.map((d) => [d.code, d])),
    [],
  );

  const visibleCountries = useMemo(
    () => COUNTRIES.filter((c) => activeTab === 'all' || c.code === activeTab),
    [activeTab],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('y', String(year));
    if (activeTab === 'all') params.delete('c');
    else params.set('c', activeTab);

    if (showBestTime) params.set('q', '1');
    else params.delete('q');

    if (showBestTime && windowDays !== DEFAULT_WINDOW_DAYS) params.set('w', String(windowDays));
    else params.delete('w');

    if (selectedRangeStart && selectedRangeEnd) {
      params.set('s', selectedRangeStart);
      params.set('e', selectedRangeEnd);
    } else {
      params.delete('s');
      params.delete('e');
    }

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [year, activeTab, showBestTime, windowDays, selectedRangeStart, selectedRangeEnd]);

  async function copyShareLink() {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState('copied');
    } catch {
      setShareState('error');
    }
    window.setTimeout(() => setShareState('idle'), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Holiday Density</h1>
            <Badge variant="secondary" className="text-xs bg-white text-slate-900 border-white">2025–2030</Badge>
          </div>
          <p className="text-zinc-300 text-sm max-w-2xl">
            Visualize the share of the population on public or school holidays across Europe.
            Darker cells indicate a higher percentage of the combined population is off simultaneously —
            ideal for planning travel or remote work. Germany, Austria, Poland, Switzerland, and France are
            modelled by region to reflect staggered school holiday schedules.
          </p>
        </div>

        <Card className="shadow-sm bg-zinc-800 border-zinc-700 text-zinc-100">
          <CardHeader className="pb-4 px-3 sm:px-6">
            {/* Year selector */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-sm font-medium text-zinc-300 mr-1">Year:</span>
              {YEARS.map((y) => (
                <Button
                  key={y}
                  variant={y === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setUiState((prev) => ({
                      ...prev,
                      year: y,
                      selectedRangeStart: null,
                      selectedRangeEnd: null,
                    }))
                  }
                  className="h-8 px-3 text-sm"
                >
                  {y}
                </Button>
              ))}
            </div>

            {/* Country tab selector */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() =>
                  setUiState((prev) => ({
                    ...prev,
                    activeTab: 'all',
                    selectedRangeStart: null,
                    selectedRangeEnd: null,
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                     : 'bg-zinc-700 border border-zinc-600 text-zinc-200 hover:bg-zinc-600'
                }`}
              >
                🌍 All Countries
              </button>
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() =>
                    setUiState((prev) => ({
                      ...prev,
                      activeTab: c.code,
                      selectedRangeStart: null,
                      selectedRangeEnd: null,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === c.code
                      ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-zinc-700 border border-zinc-600 text-zinc-200 hover:bg-zinc-600'
                  }`}
                >
                  <Image
                    src={`https://flagcdn.com/16x12/${c.code.toLowerCase()}.png`}
                    alt={`${c.name} flag`}
                    width={16}
                    height={12}
                    unoptimized
                    className="rounded-sm shrink-0"
                  />
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {activeTab === 'all' ? (
                  `All 11 Countries — ${year}`
                ) : (
                  <>
                    <Image
                      src={`https://flagcdn.com/20x15/${activeTab.toLowerCase()}.png`}
                      alt={`${activeCountry?.name} flag`}
                      width={20}
                      height={15}
                      unoptimized
                      className="rounded-sm shrink-0"
                    />
                    {activeCountry?.name} — {year}
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {activeTab === 'all'
                  ? 'Showing combined holiday density across Germany, Austria, Switzerland, France, Spain, Belgium, Denmark, Italy, Norway, Poland, and Czech Republic'
                  : `Showing public holidays and school holidays for ${activeCountry?.name}`}
              </CardDescription>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={copyShareLink} className="h-7 px-2 text-xs">
                  Copy share link
                </Button>
                {shareState === 'copied' && <span className="text-[11px] text-emerald-300">Copied</span>}
                {shareState === 'error' && <span className="text-[11px] text-rose-300">Clipboard unavailable</span>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-6">
            <DensityCalendar
              year={year}
              countryCodes={countryCodes}
              showBestTime={showBestTime}
              windowDays={windowDays}
              selectedRangeStart={selectedRangeStart}
              selectedRangeEnd={selectedRangeEnd}
              onShowBestTimeChange={(show) => setUiState((prev) => ({ ...prev, showBestTime: show }))}
              onWindowDaysChange={(days) => setUiState((prev) => ({ ...prev, windowDays: days }))}
              onSelectedRangeChange={(start, end) =>
                setUiState((prev) => ({ ...prev, selectedRangeStart: start, selectedRangeEnd: end }))
              }
            />
          </CardContent>
        </Card>

        <Card className="mt-4 shadow-sm bg-zinc-800 border-zinc-700 text-zinc-100">
          <details>
            <summary
              aria-label="Toggle data quality and source transparency"
              className="list-none cursor-pointer px-3 sm:px-6 py-3"
            >
              <div className="text-base font-semibold text-zinc-100">Data quality & source transparency</div>
              <p className="text-xs mt-1 text-zinc-400">
                Expand for source links, last-updated dates, confidence notes, and modelling references.
              </p>
            </summary>
            <CardContent className="px-3 sm:px-6 pb-4">
              <div className="mb-3 rounded-md border border-cyan-700/40 bg-cyan-900/20 p-3 text-xs text-cyan-100">
                Near-term public-holiday baselines are modelled from OpenHolidays API data.
                {' '}
                <a
                  href="https://github.com/openpotato/openholidaysapi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                >
                  OpenHolidays API (GitHub)
                </a>
              </div>
              <div className="space-y-3">
                {visibleCountries.map((country) => {
                  const details = detailsByCode.get(country.code);
                  if (!details) return null;
                  return (
                    <div key={country.code} className="rounded-md border border-zinc-700/80 bg-zinc-900/40 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-sm">{country.name}</div>
                        <Badge variant="outline" className={`text-[10px] ${confidenceBadgeClass(details.confidence)}`}>
                          {details.confidence} confidence
                        </Badge>
                        <span className="text-[10px] text-zinc-400">Last updated: {details.lastUpdated}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-300">{details.notes}</p>
                      <ul className="mt-2 space-y-1">
                        {details.sources.map((source) => (
                          <li key={source.url} className="text-xs">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                            >
                              {source.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </details>
        </Card>

        <footer className="mt-8 text-center text-xs text-zinc-400">
          Holiday data is approximate. Public holidays and school holiday periods vary by region.
        </footer>
      </div>
    </div>
  );
}
