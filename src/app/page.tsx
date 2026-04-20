'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { COUNTRIES } from '@/lib/holidays';
import DensityCalendar from '@/components/DensityCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const ALL_CODES = COUNTRIES.map((c) => c.code);

function defaultYear(): number {
  const current = new Date().getFullYear();
  if (YEARS.includes(current)) return current;
  // Clamp to the nearest available year
  return current < YEARS[0] ? YEARS[0] : YEARS[YEARS.length - 1];
}

type Tab = 'all' | string;

export default function Home() {
  const [year, setYear] = useState(defaultYear());
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const countryCodes = activeTab === 'all' ? ALL_CODES : [activeTab];
  const activeCountry = COUNTRIES.find((c) => c.code === activeTab);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Holiday Density</h1>
            <Badge variant="secondary" className="text-xs bg-white text-slate-900 border-white">2025–2030</Badge>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl">
            Visualize the share of the population on public or school holidays across Europe.
            Darker cells indicate a higher percentage of the combined population is off simultaneously —
            ideal for planning travel or remote work. Germany, Austria, Poland, Switzerland, and France are
            modelled by region to reflect staggered school holiday schedules.
          </p>
        </div>

        <Card className="shadow-sm bg-slate-800 border-slate-700 text-slate-100">
          <CardHeader className="pb-4 px-3 sm:px-6">
            {/* Year selector */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-sm font-medium text-slate-300 mr-1">Year:</span>
              {YEARS.map((y) => (
                <Button
                  key={y}
                  variant={y === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setYear(y)}
                  className="h-8 px-3 text-sm"
                >
                  {y}
                </Button>
              ))}
            </div>

            {/* Country tab selector */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                     : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600'
                }`}
              >
                🌍 All Countries
              </button>
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setActiveTab(c.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === c.code
                      ? 'bg-indigo-600 text-white shadow-sm'
                       : 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600'
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
            </div>
          </CardHeader>

          <CardContent className="px-3 sm:px-6">
            <DensityCalendar year={year} countryCodes={countryCodes} />
          </CardContent>
        </Card>

         <footer className="mt-8 text-center text-xs text-slate-400">
          Holiday data is approximate. Public holidays and school holiday periods vary by region.
        </footer>
      </div>
    </div>
  );
}
