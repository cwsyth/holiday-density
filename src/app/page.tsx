'use client';

import React, { useState } from 'react';
import { COUNTRIES } from '@/lib/holidays';
import DensityCalendar from '@/components/DensityCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const ALL_CODES = COUNTRIES.map((c) => c.code);

type Tab = 'all' | string;

export default function Home() {
  const [year, setYear] = useState(2025);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const countryCodes = activeTab === 'all' ? ALL_CODES : [activeTab];
  const activeCountry = COUNTRIES.find((c) => c.code === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Holiday Density</h1>
            <Badge variant="secondary" className="text-xs">2025–2030</Badge>
          </div>
          <p className="text-gray-500 text-sm max-w-2xl">
            Visualize when public and school holidays overlap across Europe. Darker cells indicate
            more countries are on holiday simultaneously — ideal for planning travel or remote work.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            {/* Year selector */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-sm font-medium text-gray-600 mr-1">Year:</span>
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
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                🌍 All Countries
              </button>
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setActiveTab(c.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === c.code
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {c.flag} {c.name}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <CardTitle className="text-lg">
                {activeTab === 'all'
                  ? `All 10 Countries — ${year}`
                  : `${activeCountry?.flag} ${activeCountry?.name} — ${year}`}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {activeTab === 'all'
                  ? 'Showing combined holiday density across Germany, Austria, Switzerland, Spain, Belgium, Denmark, Italy, Norway, Poland, and Czech Republic'
                  : `Showing public holidays and school holidays for ${activeCountry?.name}`}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <DensityCalendar year={year} countryCodes={countryCodes} />
          </CardContent>
        </Card>

        {/* Country grid overview */}
        {activeTab === 'all' && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setActiveTab(c.code)}
                className="bg-white rounded-lg border border-gray-200 p-3 text-left hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="text-xl mb-1">{c.flag}</div>
                <div className="text-xs font-medium text-gray-700 group-hover:text-indigo-600">{c.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{c.code}</div>
              </button>
            ))}
          </div>
        )}

        <footer className="mt-8 text-center text-xs text-gray-400">
          Holiday data is approximate. Public holidays and school holiday periods vary by region.
        </footer>
      </div>
    </div>
  );
}
