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
  };
  if (typeof window === 'undefined') return fallback;

  const params = new URLSearchParams(window.location.search);
  return {
    year: parseYear(params.get('y')),
    activeTab: parseCountry(params.get('c')),
    showBestTime: params.get('q') === '1',
    windowDays: parseWindowDays(params.get('w')),
  };
}

export default function Home() {
  const [uiState, setUiState] = useState<UiState>(getInitialUiState);
  const [shareState, setShareState] = useState<ShareState>('idle');

  const { year, activeTab, showBestTime, windowDays } = uiState;
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

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState(null, '', nextUrl);
  }, [year, activeTab, showBestTime, windowDays]);

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
                  onClick={() => setUiState((prev) => ({ ...prev, year: y }))}
                  className="h-8 px-3 text-sm"
                >
                  {y}
                </Button>
              ))}
            </div>

            {/* Country tab selector */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setUiState((prev) => ({ ...prev, activeTab: 'all' }))}
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
                  onClick={() => setUiState((prev) => ({ ...prev, activeTab: c.code }))}
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
              onShowBestTimeChange={(show) => setUiState((prev) => ({ ...prev, showBestTime: show }))}
              onWindowDaysChange={(days) => setUiState((prev) => ({ ...prev, windowDays: days }))}
            />
          </CardContent>
        </Card>

        <Card className="mt-4 shadow-sm bg-zinc-800 border-zinc-700 text-zinc-100">
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-base">Data quality & source transparency</CardTitle>
            <CardDescription className="text-xs">
              Source links, last-updated dates, and confidence notes for the currently viewed country set.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4">
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
        </Card>

        <footer className="mt-8 text-center text-xs text-zinc-400">
          Holiday data is approximate. Public holidays and school holiday periods vary by region.
        </footer>
      </div>
    </div>
  );
}
