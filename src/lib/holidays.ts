export type HolidayPeriod = {
  start: string;
  end: string;
  name: string;
  type: 'public' | 'school';
};

export type CountryHolidays = {
  code: string;
  name: string;
  periods: HolidayPeriod[];
};

// Easter dates per year
// 2025: Apr 20, 2026: Apr 5, 2027: Mar 28, 2028: Apr 16, 2029: Apr 1, 2030: Apr 21
function easterDate(year: number): Date {
  const easters: Record<number, [number, number]> = {
    2025: [4, 20],
    2026: [4, 5],
    2027: [3, 28],
    2028: [4, 16],
    2029: [4, 1],
    2030: [4, 21],
  };
  const [m, d] = easters[year];
  return new Date(year, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function single(date: Date, name: string, type: 'public' | 'school'): HolidayPeriod {
  const s = fmt(date);
  return { start: s, end: s, name, type };
}

function period(start: Date, end: Date, name: string, type: 'public' | 'school'): HolidayPeriod {
  return { start: fmt(start), end: fmt(end), name, type };
}

function dateOf(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// Shift a date string by offsetting the year and keeping approximate week
function shiftYear(isoDate: string, targetYear: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const original = new Date(y, m - 1, d);
  const dayOfYear = Math.floor((original.getTime() - new Date(y, 0, 0).getTime()) / 86400000);
  const target = new Date(targetYear, 0, dayOfYear);
  return fmt(target);
}

function buildGermanyPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    // Public holidays
    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(addDays(easter, -2), 'Good Friday', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'May Day', 'public'));
    periods.push(single(addDays(easter, 39), 'Ascension Day', 'public'));
    periods.push(single(addDays(easter, 50), 'Whit Monday', 'public'));
    periods.push(single(dateOf(year, 10, 3), 'German Unity Day', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'Boxing Day', 'public'));

    // School holidays (approximate national averages)
    // Winter/Semester
    const winterStart = shiftYear(`${year}-01-27`, year);
    const winterEnd = shiftYear(`${year}-02-08`, year);
    periods.push({ start: winterStart, end: winterEnd, name: 'Winter Holidays', type: 'school' });

    // Easter holidays
    const easterSchoolStart = fmt(addDays(easter, -7));
    const easterSchoolEnd = fmt(addDays(easter, 7));
    periods.push({ start: easterSchoolStart, end: easterSchoolEnd, name: 'Easter Holidays', type: 'school' });

    // Whitsun
    const whitsun = addDays(easter, 49);
    periods.push(period(addDays(whitsun, -3), addDays(whitsun, 4), 'Whitsun Holidays', 'school'));

    // Summer holidays (~6 weeks, mid-June to late August, averaged across states)
    const summerStart = new Date(year, 5, 26); // Jun 26
    const summerEnd = new Date(year, 8, 7);    // Sep 7
    periods.push(period(summerStart, summerEnd, 'Summer Holidays', 'school'));

    // Autumn
    periods.push(period(dateOf(year, 10, 27), dateOf(year, 11, 8), 'Autumn Holidays', 'school'));

    // Christmas
    periods.push(period(dateOf(year, 12, 22), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    const nextYear = Math.min(year + 1, 2030);
    periods.push(period(dateOf(nextYear, 1, 1), dateOf(nextYear, 1, 5), 'Christmas Holidays', 'school'));
  }

  return periods;
}

function buildAustriaPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    // Public holidays
    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(dateOf(year, 1, 6), 'Epiphany', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'Labour Day', 'public'));
    periods.push(single(addDays(easter, 39), 'Ascension Day', 'public'));
    periods.push(single(addDays(easter, 50), 'Whit Monday', 'public'));
    periods.push(single(addDays(easter, 60), 'Corpus Christi', 'public'));
    periods.push(single(dateOf(year, 8, 15), 'Assumption', 'public'));
    periods.push(single(dateOf(year, 10, 26), 'National Day', 'public'));
    periods.push(single(dateOf(year, 11, 1), 'All Saints', 'public'));
    periods.push(single(dateOf(year, 12, 8), 'Immaculate Conception', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'St. Stephen\'s Day', 'public'));

    // School holidays
    periods.push(period(dateOf(year, 2, 10), dateOf(year, 2, 15), 'Semester Break', 'school'));
    const easterSch = addDays(easter, -8);
    periods.push(period(easterSch, addDays(easter, 6), 'Easter Holidays', 'school'));
    periods.push(period(addDays(easter, 50), addDays(easter, 51), 'Whitsun Break', 'school'));
    periods.push(period(dateOf(year, 7, 5), dateOf(year, 9, 1), 'Summer Holidays', 'school'));
    periods.push(period(dateOf(year, 10, 27), dateOf(year, 10, 31), 'Autumn Holidays', 'school'));
    periods.push(period(dateOf(year, 12, 22), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 6), 'Christmas Holidays', 'school'));
    }
  }

  return periods;
}

function buildSwitzerlandPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(dateOf(year, 1, 2), 'Berchtoldstag', 'public'));
    periods.push(single(addDays(easter, -2), 'Good Friday', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(addDays(easter, 39), 'Ascension Day', 'public'));
    periods.push(single(addDays(easter, 50), 'Whit Monday', 'public'));
    periods.push(single(dateOf(year, 8, 1), 'National Day', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'Boxing Day', 'public'));

    // School holidays (approximate, varies by canton)
    periods.push(period(dateOf(year, 2, 17), dateOf(year, 2, 21), 'Carnival Break', 'school'));
    periods.push(period(addDays(easter, -6), addDays(easter, 6), 'Easter Holidays', 'school'));
    periods.push(period(dateOf(year, 6, 30), dateOf(year, 8, 17), 'Summer Holidays', 'school'));
    periods.push(period(dateOf(year, 10, 6), dateOf(year, 10, 19), 'Autumn Holidays', 'school'));
    periods.push(period(dateOf(year, 12, 22), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 4), 'Christmas Holidays', 'school'));
    }
  }

  return periods;
}

function buildSpainPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(dateOf(year, 1, 6), 'Epiphany', 'public'));
    periods.push(single(addDays(easter, -2), 'Good Friday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'Labour Day', 'public'));
    periods.push(single(dateOf(year, 8, 15), 'Assumption', 'public'));
    periods.push(single(dateOf(year, 10, 12), 'National Day', 'public'));
    periods.push(single(dateOf(year, 11, 1), 'All Saints', 'public'));
    periods.push(single(dateOf(year, 12, 6), 'Constitution Day', 'public'));
    periods.push(single(dateOf(year, 12, 8), 'Immaculate Conception', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));

    // School holidays
    periods.push(period(dateOf(year, 12, 23), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 7), 'Christmas Holidays', 'school'));
    }
    // Carnival (late Feb / early Mar)
    const carnivalStart = addDays(easter, -47);
    periods.push(period(carnivalStart, addDays(carnivalStart, 4), 'Carnival Break', 'school'));
    // Easter
    periods.push(period(addDays(easter, -8), addDays(easter, 1), 'Easter Holidays', 'school'));
    // Summer
    periods.push(period(dateOf(year, 6, 20), dateOf(year, 9, 10), 'Summer Holidays', 'school'));
  }

  return periods;
}

function buildBelgiumPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'Labour Day', 'public'));
    periods.push(single(addDays(easter, 39), 'Ascension Day', 'public'));
    periods.push(single(addDays(easter, 50), 'Whit Monday', 'public'));
    periods.push(single(dateOf(year, 7, 21), 'Belgian National Day', 'public'));
    periods.push(single(dateOf(year, 8, 15), 'Assumption', 'public'));
    periods.push(single(dateOf(year, 11, 1), 'All Saints', 'public'));
    periods.push(single(dateOf(year, 11, 11), 'Armistice Day', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));

    // School holidays
    periods.push(period(dateOf(year, 2, 24), dateOf(year, 3, 9), 'Carnival Holidays', 'school'));
    periods.push(period(addDays(easter, -6), addDays(easter, 13), 'Easter Holidays', 'school'));
    periods.push(period(dateOf(year, 7, 1), dateOf(year, 8, 31), 'Summer Holidays', 'school'));
    periods.push(period(dateOf(year, 10, 27), dateOf(year, 11, 2), 'Autumn Holidays', 'school'));
    periods.push(period(dateOf(year, 12, 22), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 4), 'Christmas Holidays', 'school'));
    }
  }

  return periods;
}

function buildDenmarkPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(addDays(easter, -3), 'Maundy Thursday', 'public'));
    periods.push(single(addDays(easter, -2), 'Good Friday', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(addDays(easter, 26), 'Store Bededag', 'public'));
    periods.push(single(addDays(easter, 39), 'Ascension Day', 'public'));
    periods.push(single(addDays(easter, 50), 'Whit Monday', 'public'));
    periods.push(single(dateOf(year, 6, 5), 'Constitution Day', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'Boxing Day', 'public'));

    // School holidays
    periods.push(period(dateOf(year, 2, 10), dateOf(year, 2, 16), 'Winter Holidays', 'school'));
    periods.push(period(addDays(easter, -5), addDays(easter, 6), 'Easter Holidays', 'school'));
    periods.push(period(dateOf(year, 6, 27), dateOf(year, 8, 10), 'Summer Holidays', 'school'));
    periods.push(period(dateOf(year, 10, 13), dateOf(year, 10, 19), 'Autumn Holidays', 'school'));
    periods.push(period(dateOf(year, 12, 20), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 2), 'Christmas Holidays', 'school'));
    }
  }

  return periods;
}

function buildItalyPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(dateOf(year, 1, 6), 'Epiphany', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 4, 25), 'Liberation Day', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'Labour Day', 'public'));
    periods.push(single(dateOf(year, 6, 2), 'Republic Day', 'public'));
    periods.push(single(dateOf(year, 8, 15), 'Assumption', 'public'));
    periods.push(single(dateOf(year, 11, 1), 'All Saints', 'public'));
    periods.push(single(dateOf(year, 12, 8), 'Immaculate Conception', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'St. Stephen\'s Day', 'public'));

    // School holidays
    periods.push(period(dateOf(year, 12, 23), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 7), 'Christmas Holidays', 'school'));
    }
    // Carnival
    const carnival = addDays(easter, -47);
    periods.push(period(carnival, addDays(carnival, 2), 'Carnival Break', 'school'));
    // Easter
    periods.push(period(addDays(easter, -3), addDays(easter, 5), 'Easter Holidays', 'school'));
    // Summer
    periods.push(period(dateOf(year, 6, 11), dateOf(year, 9, 14), 'Summer Holidays', 'school'));
  }

  return periods;
}

function buildNorwayPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(addDays(easter, -3), 'Maundy Thursday', 'public'));
    periods.push(single(addDays(easter, -2), 'Good Friday', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'Labour Day', 'public'));
    periods.push(single(dateOf(year, 5, 17), 'Constitution Day', 'public'));
    periods.push(single(addDays(easter, 39), 'Ascension Day', 'public'));
    periods.push(single(addDays(easter, 50), 'Whit Monday', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'Boxing Day', 'public'));

    // School holidays
    periods.push(period(dateOf(year, 2, 24), dateOf(year, 3, 2), 'Winter Holidays', 'school'));
    periods.push(period(addDays(easter, -5), addDays(easter, 6), 'Easter Holidays', 'school'));
    periods.push(period(dateOf(year, 6, 21), dateOf(year, 8, 17), 'Summer Holidays', 'school'));
    periods.push(period(dateOf(year, 10, 6), dateOf(year, 10, 12), 'Autumn Holidays', 'school'));
    periods.push(period(dateOf(year, 12, 20), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 2), 'Christmas Holidays', 'school'));
    }
  }

  return periods;
}

function buildPolandPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(dateOf(year, 1, 6), 'Epiphany', 'public'));
    periods.push(single(easter, 'Easter Sunday', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'Labour Day', 'public'));
    periods.push(single(dateOf(year, 5, 3), 'Constitution Day', 'public'));
    periods.push(single(addDays(easter, 60), 'Corpus Christi', 'public'));
    periods.push(single(dateOf(year, 8, 15), 'Assumption', 'public'));
    periods.push(single(dateOf(year, 11, 1), 'All Saints', 'public'));
    periods.push(single(dateOf(year, 11, 11), 'Independence Day', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'Boxing Day', 'public'));

    // School holidays
    // Winter (two separate regional groups, approximate combined)
    periods.push(period(dateOf(year, 1, 27), dateOf(year, 2, 9), 'Winter Holidays', 'school'));
    // Easter
    periods.push(period(addDays(easter, -4), addDays(easter, 2), 'Easter Break', 'school'));
    // Summer
    periods.push(period(dateOf(year, 6, 27), dateOf(year, 8, 31), 'Summer Holidays', 'school'));
    // Christmas
    periods.push(period(dateOf(year, 12, 23), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 1), 'Christmas Holidays', 'school'));
    }
  }

  return periods;
}

function buildCzechPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year / Restoration Day', 'public'));
    periods.push(single(addDays(easter, -2), 'Good Friday', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'Labour Day', 'public'));
    periods.push(single(dateOf(year, 5, 8), 'Liberation Day', 'public'));
    periods.push(single(dateOf(year, 7, 5), 'Cyril & Methodius Day', 'public'));
    periods.push(single(dateOf(year, 7, 6), 'Jan Hus Day', 'public'));
    periods.push(single(dateOf(year, 9, 28), 'Statehood Day', 'public'));
    periods.push(single(dateOf(year, 10, 28), 'Independence Day', 'public'));
    periods.push(single(dateOf(year, 11, 17), 'Freedom & Democracy Day', 'public'));
    periods.push(single(dateOf(year, 12, 24), 'Christmas Eve', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'St. Stephen\'s Day', 'public'));

    // School holidays
    // Autumn
    periods.push(period(dateOf(year, 10, 27), dateOf(year, 10, 31), 'Autumn Holidays', 'school'));
    // Christmas
    periods.push(period(dateOf(year, 12, 23), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
    if (year < 2030) {
      periods.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 3), 'Christmas Holidays', 'school'));
    }
    // Spring half-term (varies by region, approximate)
    periods.push(period(dateOf(year, 2, 17), dateOf(year, 2, 21), 'Spring Half-term', 'school'));
    // Easter
    periods.push(period(addDays(easter, -4), addDays(easter, 2), 'Easter Holidays', 'school'));
    // Summer
    periods.push(period(dateOf(year, 6, 28), dateOf(year, 9, 1), 'Summer Holidays', 'school'));
  }

  return periods;
}

export const HOLIDAY_DATA: CountryHolidays[] = [
  { code: 'DE', name: 'Germany', periods: buildGermanyPeriods() },
  { code: 'AT', name: 'Austria', periods: buildAustriaPeriods() },
  { code: 'CH', name: 'Switzerland', periods: buildSwitzerlandPeriods() },
  { code: 'ES', name: 'Spain', periods: buildSpainPeriods() },
  { code: 'BE', name: 'Belgium', periods: buildBelgiumPeriods() },
  { code: 'DK', name: 'Denmark', periods: buildDenmarkPeriods() },
  { code: 'IT', name: 'Italy', periods: buildItalyPeriods() },
  { code: 'NO', name: 'Norway', periods: buildNorwayPeriods() },
  { code: 'PL', name: 'Poland', periods: buildPolandPeriods() },
  { code: 'CZ', name: 'Czech Republic', periods: buildCzechPeriods() },
];

export const COUNTRIES = [
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
];

export function getHolidaysForCountry(countryCode: string): CountryHolidays | undefined {
  return HOLIDAY_DATA.find((c) => c.code === countryCode);
}

function isDateInPeriod(dateStr: string, period: HolidayPeriod): boolean {
  return dateStr >= period.start && dateStr <= period.end;
}

export function getDensityForDate(date: string, countryCodes: string[]): number {
  let count = 0;
  for (const code of countryCodes) {
    const country = getHolidaysForCountry(code);
    if (!country) continue;
    const hasHoliday = country.periods.some((p) => isDateInPeriod(date, p));
    if (hasHoliday) count++;
  }
  return count;
}

export function getDensityMap(year: number, countryCodes: string[]): Map<string, number> {
  const map = new Map<string, number>();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = fmt(d);
    map.set(dateStr, getDensityForDate(dateStr, countryCodes));
  }

  return map;
}
