export type HolidayPeriod = {
  start: string;
  end: string;
  name: string;
  type: 'public' | 'school';
};

/**
 * A sub-national region (e.g. a German federal state) with its own population
 * and holiday periods that are *additional* to the country-wide periods.
 */
export type RegionHolidays = {
  code: string;       // e.g. 'DE-BY'
  name: string;       // e.g. 'Bavaria'
  population: number; // in thousands
  periods: HolidayPeriod[];
};

export type CountryHolidays = {
  code: string;
  name: string;
  /** Total country population in thousands */
  population: number;
  /**
   * Optional sub-regions. When present the density for this country is
   * population-weighted across regions. National periods (below) apply to
   * every region automatically.
   */
  regions?: RegionHolidays[];
  /** Country-wide / national holiday periods */
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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

/** Germany national public holidays only (apply to all 16 states). */
function buildGermanyNationalPeriods(): HolidayPeriod[] {
  const periods: HolidayPeriod[] = [];

  for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
    const easter = easterDate(year);

    periods.push(single(dateOf(year, 1, 1), 'New Year', 'public'));
    periods.push(single(addDays(easter, -2), 'Good Friday', 'public'));
    periods.push(single(addDays(easter, 1), 'Easter Monday', 'public'));
    periods.push(single(dateOf(year, 5, 1), 'May Day', 'public'));
    periods.push(single(addDays(easter, 39), 'Ascension Day', 'public'));
    periods.push(single(addDays(easter, 50), 'Whit Monday', 'public'));
    periods.push(single(dateOf(year, 10, 3), 'German Unity Day', 'public'));
    periods.push(single(dateOf(year, 12, 25), 'Christmas Day', 'public'));
    periods.push(single(dateOf(year, 12, 26), 'Boxing Day', 'public'));
  }

  return periods;
}

/** First year covered by the holiday data arrays (index 0). */
const HOLIDAY_DATA_START_YEAR = 2025;

/**
 * A compact encoding of a school-break period: [startMonth, startDay, endMonth, endDay].
 * Used for summer, winter/carnival, and autumn breaks in the German state lookup tables.
 */
type BreakTuple = [number, number, number, number];
const DE_SUMMER: Record<string, BreakTuple[]> = {
  // Nordrhein-Westfalen
  NW: [[6,30,8,12],[6,29,8,11],[6,28,8,10],[6,30,8,12],[6,28,8,10],[6,29,8,11]],
  // Bayern
  BY: [[7,26,9, 8],[7,30,9,11],[7,28,9, 9],[7,26,9, 7],[7,29,9,10],[7,31,9,12]],
  // Baden-Württemberg
  BW: [[7,31,9,13],[7,30,9,12],[7,29,9,11],[7,31,9,12],[8, 1,9,13],[7,25,9, 6]],
  // Niedersachsen
  NI: [[7,24,9, 3],[7,23,9, 2],[7,22,9, 1],[7,25,9, 3],[7,24,9, 2],[7,24,9, 3]],
  // Hessen
  HE: [[7,14,8,22],[7, 6,8,14],[7,12,8,20],[7,11,8,19],[7, 7,8,15],[7,14,8,22]],
  // Sachsen
  SN: [[6,28,8, 6],[6,27,8, 5],[6,26,8, 4],[6,28,8, 6],[6,27,8, 5],[6,26,8, 4]],
  // Rheinland-Pfalz
  RP: [[7, 7,8,15],[6,29,8, 7],[7, 6,8,14],[7, 8,8,16],[7, 5,8,13],[7, 7,8,15]],
  // Berlin
  BE: [[6,26,8, 6],[6,25,8, 5],[6,24,8, 4],[6,26,8, 6],[6,26,8, 6],[6,25,8, 5]],
  // Schleswig-Holstein
  SH: [[6,26,8, 6],[6,25,8, 5],[6,24,8, 4],[6,27,8, 7],[6,26,8, 6],[6,25,8, 5]],
  // Brandenburg
  BB: [[6,26,8, 6],[6,25,8, 5],[6,24,8, 4],[6,26,8, 6],[6,26,8, 6],[6,25,8, 5]],
  // Sachsen-Anhalt
  ST: [[6,26,8, 6],[6,25,8, 5],[6,24,8, 4],[6,27,8, 7],[6,25,8, 5],[6,26,8, 6]],
  // Thüringen
  TH: [[6,26,8, 6],[6,25,8, 5],[6,26,8, 6],[6,27,8, 7],[6,26,8, 6],[6,25,8, 5]],
  // Hamburg
  HH: [[6,26,8, 6],[6,25,8, 5],[6,24,8, 4],[6,27,8, 7],[6,26,8, 6],[6,25,8, 5]],
  // Mecklenburg-Vorpommern
  MV: [[6,26,8, 6],[6,25,8, 5],[6,23,8, 3],[6,27,8, 7],[6,25,8, 5],[6,26,8, 6]],
  // Saarland
  SL: [[7, 7,8,15],[6,29,8, 7],[7, 6,8,14],[7, 8,8,16],[7, 5,8,13],[7, 7,8,15]],
  // Bremen
  HB: [[7,24,9, 3],[7,23,9, 2],[7,22,9, 1],[7,25,9, 3],[7,24,9, 2],[7,24,9, 3]],
};

/**
 * Winter/Carnival break per state.
 * Index order: [2025, 2026, 2027, 2028, 2029, 2030]
 */
const DE_WINTER: Record<string, BreakTuple[]> = {
  // Carnival / Fasching states
  BW: [[2,24,3, 7],[2,23,3, 6],[2,22,3, 5],[2,24,3, 7],[2,24,3, 6],[2,23,3, 5]],
  BY: [[2,27,3, 7],[2,16,2,20],[2,15,2,19],[2,19,2,23],[2,17,2,21],[2,16,2,20]],
  RP: [[2,24,3, 2],[2,23,3, 1],[2,22,2,28],[2,24,3, 2],[2,23,3, 1],[2,24,3, 2]],
  SL: [[2,24,3, 2],[2,23,3, 1],[2,22,2,28],[2,24,3, 2],[2,23,3, 1],[2,24,3, 2]],
  // Winter break states
  BE: [[1,27,2, 2],[1,26,2, 1],[2, 1,2, 7],[1,29,2, 4],[1,27,2, 2],[1,26,2, 1]],
  BB: [[1,27,2, 2],[1,26,2, 1],[2, 1,2, 7],[1,29,2, 4],[1,27,2, 2],[1,26,2, 1]],
  HH: [[1,30,2, 7],[1,26,2, 6],[1,25,2, 5],[1,27,2, 7],[1,28,2, 6],[1,27,2, 5]],
  SH: [[1,27,2, 5],[1,26,2, 5],[1,26,2, 5],[1,28,2, 6],[1,26,2, 4],[1,27,2, 5]],
  NI: [[1,27,2, 1],[1,26,1,31],[1,25,1,30],[1,28,2, 1],[1,26,1,31],[1,27,2, 1]],
  HB: [[1,27,2, 1],[1,26,1,31],[1,25,1,30],[1,28,2, 1],[1,26,1,31],[1,27,2, 1]],
  MV: [[2, 3,2, 7],[2, 2,2, 6],[2, 1,2, 5],[2, 3,2, 7],[2, 3,2, 7],[2, 2,2, 6]],
  SN: [[2,17,2,21],[2,16,2,20],[2,14,2,18],[2,19,2,23],[2,16,2,20],[2,17,2,21]],
  ST: [[2,10,2,14],[2, 9,2,13],[2, 8,2,12],[2,10,2,14],[2, 9,2,13],[2,10,2,14]],
  TH: [[2, 3,2, 8],[2, 2,2, 7],[2, 1,2, 6],[2, 3,2, 7],[2, 3,2, 7],[2, 2,2, 6]],
  // NW has no official school winter break; Karneval days are not a formal break
  NW: [],
  HE: [],
};

/**
 * Autumn break per state.
 * Index order: [2025, 2026, 2027, 2028, 2029, 2030]
 */
const DE_AUTUMN: Record<string, BreakTuple[]> = {
  NW: [[10,13,10,25],[10,12,10,24],[10,11,10,23],[10,14,10,26],[10,13,10,25],[10,11,10,24]],
  BY: [[10,31,11, 7],[10,31,11, 6],[10,30,11, 6],[11, 1,11, 7],[10,31,11, 7],[10,30,11, 6]],
  BW: [[10,28,10,31],[10,26,10,30],[10,25,10,29],[10,28,10,31],[10,27,10,30],[10,28,10,31]],
  NI: [[10, 6,10,18],[10, 5,10,17],[10, 4,10,16],[10, 6,10,18],[10, 6,10,18],[10, 5,10,17]],
  HE: [[10, 6,10,18],[10, 5,10,17],[10, 4,10,16],[10, 7,10,19],[10, 6,10,18],[10, 5,10,17]],
  SN: [[10, 6,10,18],[10, 5,10,17],[10, 4,10,16],[10, 6,10,18],[10, 6,10,18],[10, 5,10,17]],
  RP: [[10,14,10,25],[10,12,10,24],[10,11,10,23],[10,14,10,26],[10,13,10,25],[10,12,10,24]],
  BE: [[10,20,11, 2],[10,19,11, 1],[10,18,10,31],[10,21,11, 3],[10,20,11, 2],[10,19,11, 1]],
  SH: [[10,20,11, 1],[10,19,10,31],[10,18,10,30],[10,21,11, 1],[10,20,11, 1],[10,19,10,31]],
  BB: [[10,20,11, 2],[10,19,11, 1],[10,18,10,31],[10,21,11, 3],[10,20,11, 2],[10,19,11, 1]],
  ST: [[9,29,10,11],[9,28,10,10],[9,27,10, 9],[9,29,10,11],[9,28,10,10],[9,29,10,11]],
  TH: [[9,29,10,11],[9,28,10,10],[9,27,10, 9],[9,29,10,11],[9,28,10,10],[9,29,10,11]],
  HH: [[10,16,10,25],[10,15,10,24],[10,14,10,23],[10,17,10,26],[10,16,10,25],[10,15,10,24]],
  MV: [[9,22,10, 4],[9,21,10, 3],[9,20,10, 2],[9,23,10, 5],[9,22,10, 4],[9,21,10, 3]],
  SL: [[10,20,10,24],[10,19,10,23],[10,18,10,22],[10,21,10,25],[10,20,10,24],[10,19,10,23]],
  HB: [[9,29,10,17],[9,28,10,16],[9,27,10,15],[9,30,10,17],[9,29,10,16],[9,29,10,17]],
};

function buildStateSchoolHolidays(
  stateCode: string,
  year: number,
  easter: Date,
): HolidayPeriod[] {
  const idx = year - HOLIDAY_DATA_START_YEAR; // index into per-year arrays
  const out: HolidayPeriod[] = [];

  // Summer holidays
  const summerDates = DE_SUMMER[stateCode]?.[idx];
  if (summerDates) {
    const [sm, sd, em, ed] = summerDates;
    out.push(period(dateOf(year, sm, sd), dateOf(year, em, ed), 'Summer Holidays', 'school'));
  }

  // Winter / Carnival break
  const winterDates = DE_WINTER[stateCode]?.[idx];
  if (winterDates) {
    const [sm, sd, em, ed] = winterDates;
    out.push(period(dateOf(year, sm, sd), dateOf(year, em, ed), 'Winter Holidays', 'school'));
  }

  // Easter school break: ~8 days before to 5 days after Easter Monday (varies by state,
  // but most states share similar dates)
  out.push(period(addDays(easter, -8), addDays(easter, 5), 'Easter Holidays', 'school'));

  // Whitsun school break (most states take the week around Whit Monday)
  const whitsun = addDays(easter, 49);
  out.push(period(addDays(whitsun, -2), addDays(whitsun, 4), 'Whitsun Holidays', 'school'));

  // Autumn break
  const autumnDates = DE_AUTUMN[stateCode]?.[idx];
  if (autumnDates) {
    const [sm, sd, em, ed] = autumnDates;
    out.push(period(dateOf(year, sm, sd), dateOf(year, em, ed), 'Autumn Holidays', 'school'));
  }

  // Christmas school break (uniform across states)
  out.push(period(dateOf(year, 12, 22), dateOf(year, 12, 31), 'Christmas Holidays', 'school'));
  if (year < 2030) {
    out.push(period(dateOf(year + 1, 1, 1), dateOf(year + 1, 1, 5), 'Christmas Holidays', 'school'));
  }

  return out;
}

/** State-specific public holidays in addition to German national holidays. */
function buildStatePublicHolidays(stateCode: string, year: number, easter: Date): HolidayPeriod[] {
  const out: HolidayPeriod[] = [];

  // Epiphany (Jan 6): BY, BW, ST
  if (['BY', 'BW', 'ST'].includes(stateCode)) {
    out.push(single(dateOf(year, 1, 6), 'Epiphany', 'public'));
  }

  // International Women's Day (Mar 8): BE, MV, TH, HB
  if (['BE', 'MV', 'TH', 'HB'].includes(stateCode)) {
    out.push(single(dateOf(year, 3, 8), "Women's Day", 'public'));
  }

  // Corpus Christi (60 days after Easter): BY, BW, HE, NW, RP, SL, SN, TH
  if (['BY', 'BW', 'HE', 'NW', 'RP', 'SL', 'SN', 'TH'].includes(stateCode)) {
    out.push(single(addDays(easter, 60), 'Corpus Christi', 'public'));
  }

  // Assumption (Aug 15): BY, SL
  if (['BY', 'SL'].includes(stateCode)) {
    out.push(single(dateOf(year, 8, 15), 'Assumption', 'public'));
  }

  // Reformation Day (Oct 31): BB, HB, HH, MV, NI, SH, SN, ST, TH
  if (['BB', 'HB', 'HH', 'MV', 'NI', 'SH', 'SN', 'ST', 'TH'].includes(stateCode)) {
    out.push(single(dateOf(year, 10, 31), 'Reformation Day', 'public'));
  }

  // All Saints (Nov 1): BY, BW, NW, RP, SL
  if (['BY', 'BW', 'NW', 'RP', 'SL'].includes(stateCode)) {
    out.push(single(dateOf(year, 11, 1), 'All Saints', 'public'));
  }

  // Buß- und Bettag (3rd Wednesday of November): SN only
  if (stateCode === 'SN') {
    // Find 3rd Wednesday of November
    let wed = 0;
    for (let d = 1; d <= 30; d++) {
      if (new Date(year, 10, d).getDay() === 3) {
        wed++;
        if (wed === 3) {
          out.push(single(dateOf(year, 11, d), 'Buß- und Bettag', 'public'));
          break;
        }
      }
    }
  }

  return out;
}

type StateInfo = { code: string; name: string; population: number };

const DE_STATES: StateInfo[] = [
  { code: 'NW', name: 'Nordrhein-Westfalen', population: 18_100 },
  { code: 'BY', name: 'Bayern',              population: 13_400 },
  { code: 'BW', name: 'Baden-Württemberg',   population: 11_200 },
  { code: 'NI', name: 'Niedersachsen',       population:  7_900 },
  { code: 'HE', name: 'Hessen',             population:  6_400 },
  { code: 'SN', name: 'Sachsen',             population:  4_100 },
  { code: 'RP', name: 'Rheinland-Pfalz',     population:  4_100 },
  { code: 'BE', name: 'Berlin',              population:  3_800 },
  { code: 'SH', name: 'Schleswig-Holstein',  population:  3_100 },
  { code: 'BB', name: 'Brandenburg',         population:  2_600 },
  { code: 'ST', name: 'Sachsen-Anhalt',      population:  2_200 },
  { code: 'TH', name: 'Thüringen',          population:  2_100 },
  { code: 'HH', name: 'Hamburg',             population:  1_900 },
  { code: 'MV', name: 'Mecklenburg-Vorpommern', population:  1_600 },
  { code: 'SL', name: 'Saarland',            population:  1_000 },
  { code: 'HB', name: 'Bremen',              population:    700 },
];

function buildGermanyRegions(): RegionHolidays[] {
  return DE_STATES.map(({ code, name, population }) => {
    const periods: HolidayPeriod[] = [];
    for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
      const easter = easterDate(year);
      periods.push(...buildStatePublicHolidays(code, year, easter));
      periods.push(...buildStateSchoolHolidays(code, year, easter));
    }
    return { code: `DE-${code}`, name, population, periods };
  });
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
  {
    code: 'DE', name: 'Germany', population: 84_600,
    regions: buildGermanyRegions(),
    periods: buildGermanyNationalPeriods(),
  },
  { code: 'AT', name: 'Austria',        population:  9_100, periods: buildAustriaPeriods() },
  { code: 'CH', name: 'Switzerland',    population:  8_700, periods: buildSwitzerlandPeriods() },
  { code: 'ES', name: 'Spain',          population: 47_500, periods: buildSpainPeriods() },
  { code: 'BE', name: 'Belgium',        population: 11_600, periods: buildBelgiumPeriods() },
  { code: 'DK', name: 'Denmark',        population:  5_900, periods: buildDenmarkPeriods() },
  { code: 'IT', name: 'Italy',          population: 59_000, periods: buildItalyPeriods() },
  { code: 'NO', name: 'Norway',         population:  5_500, periods: buildNorwayPeriods() },
  { code: 'PL', name: 'Poland',         population: 37_000, periods: buildPolandPeriods() },
  { code: 'CZ', name: 'Czech Republic', population: 10_900, periods: buildCzechPeriods() },
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

function isDateInPeriod(dateStr: string, p: HolidayPeriod): boolean {
  return dateStr >= p.start && dateStr <= p.end;
}

/**
 * Returns the fraction (0–1) of a country's population that is on holiday on the given date.
 * - National periods apply to 100 % of the population.
 * - For countries with regions, the fraction is weighted by regional population.
 */
function getCountryHolidayFraction(dateStr: string, country: CountryHolidays): number {
  // National public holiday → everyone is off
  if (country.periods.some((p) => isDateInPeriod(dateStr, p))) return 1;

  if (!country.regions || country.regions.length === 0) return 0;

  const totalRegionPop = country.regions.reduce((s, r) => s + r.population, 0);
  if (totalRegionPop === 0) return 0;

  const popOnHoliday = country.regions
    .filter((r) => r.periods.some((p) => isDateInPeriod(dateStr, p)))
    .reduce((s, r) => s + r.population, 0);

  return popOnHoliday / totalRegionPop;
}

/**
 * Returns true when any part of the country has a holiday on the given date.
 * Used for tooltip display in the "all countries" view.
 */
export function isCountryOnHoliday(countryCode: string, dateStr: string): boolean {
  const country = getHolidaysForCountry(countryCode);
  if (!country) return false;
  if (country.periods.some((p) => isDateInPeriod(dateStr, p))) return true;
  return (country.regions ?? []).some((r) =>
    r.periods.some((p) => isDateInPeriod(dateStr, p))
  );
}

/**
 * Returns the names of German states (regions) that have a holiday on the given date,
 * taking national periods into account.
 */
export function getGermanStatesOnHoliday(dateStr: string): string[] {
  const germany = getHolidaysForCountry('DE');
  if (!germany) return [];
  // National holiday → all states
  if (germany.periods.some((p) => isDateInPeriod(dateStr, p))) {
    return (germany.regions ?? []).map((r) => r.name);
  }
  return (germany.regions ?? [])
    .filter((r) => r.periods.some((p) => isDateInPeriod(dateStr, p)))
    .map((r) => r.name);
}

/**
 * Returns density as an integer 0–10 representing population-weighted percentage
 * of the selected countries' population that is on holiday on the given date.
 * (0 = nobody, 10 = 100 % of combined population)
 */
export function getDensityForDate(dateStr: string, countryCodes: string[]): number {
  const selected = HOLIDAY_DATA.filter((c) => countryCodes.includes(c.code));
  if (selected.length === 0) return 0;

  const totalPop = selected.reduce((s, c) => s + c.population, 0);
  if (totalPop === 0) return 0;

  const popOnHoliday = selected.reduce(
    (s, c) => s + getCountryHolidayFraction(dateStr, c) * c.population,
    0,
  );

  return Math.round((popOnHoliday / totalPop) * 10);
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
