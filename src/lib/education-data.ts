export interface YearReturn {
  year: number;
  sp500: number;
  asx200: number;
}

// S&P 500 & ASX 200 approximate total returns (dividends reinvested)
export const ANNUAL_RETURNS: YearReturn[] = [
  { year: 2000, sp500: -9.1, asx200: 3.6 },
  { year: 2001, sp500: -11.9, asx200: 10.0 },
  { year: 2002, sp500: -22.1, asx200: -8.1 },
  { year: 2003, sp500: 28.7, asx200: 15.9 },
  { year: 2004, sp500: 10.9, asx200: 27.6 },
  { year: 2005, sp500: 4.9, asx200: 22.8 },
  { year: 2006, sp500: 15.8, asx200: 25.0 },
  { year: 2007, sp500: 5.5, asx200: 18.0 },
  { year: 2008, sp500: -37.0, asx200: -40.4 },
  { year: 2009, sp500: 26.5, asx200: 39.6 },
  { year: 2010, sp500: 15.1, asx200: 3.3 },
  { year: 2011, sp500: 2.1, asx200: -11.4 },
  { year: 2012, sp500: 16.0, asx200: 20.3 },
  { year: 2013, sp500: 32.4, asx200: 20.2 },
  { year: 2014, sp500: 13.7, asx200: 5.3 },
  { year: 2015, sp500: 1.4, asx200: 2.6 },
  { year: 2016, sp500: 12.0, asx200: 11.8 },
  { year: 2017, sp500: 21.8, asx200: 11.8 },
  { year: 2018, sp500: -4.4, asx200: -2.8 },
  { year: 2019, sp500: 31.5, asx200: 23.4 },
  { year: 2020, sp500: 18.4, asx200: 1.4 },
  { year: 2021, sp500: 28.7, asx200: 17.2 },
  { year: 2022, sp500: -18.1, asx200: -1.1 },
  { year: 2023, sp500: 26.3, asx200: 12.4 },
  { year: 2024, sp500: 23.3, asx200: 11.4 },
];

export interface GrowthPoint {
  year: number;
  etf: number;
  savings: number;
  managed: number;
}

export function calcCompoundGrowth(
  initial: number,
  monthly: number,
  years: number,
  annualRate: number
): number {
  let balance = initial;
  const monthlyRate = annualRate / 100 / 12;
  for (let m = 0; m < years * 12; m++) {
    balance = balance * (1 + monthlyRate) + monthly;
  }
  return balance;
}

// Build compound growth series starting from 2000 with $10,000 lump sum
export function buildGrowthSeries(initial = 10000): GrowthPoint[] {
  let etf = initial;
  let savings = initial;
  let managed = initial;

  return ANNUAL_RETURNS.map(({ year, sp500 }) => {
    etf *= 1 + sp500 / 100;
    savings *= 1 + 0.03; // average Aus savings account ~3%
    managed *= 1 + (sp500 - 2) / 100; // managed fund: index minus ~2% fees
    return {
      year,
      etf: Math.round(etf),
      savings: Math.round(savings),
      managed: Math.round(managed),
    };
  });
}

export const ETF_STATS = {
  sp500AvgReturn: 10.7,
  asx200AvgReturn: 9.4,
  avgManagedFundFee: 1.8,
  avgETFFee: 0.1,
  pctActiveUnderperform15yr: 87,
  source: "SPIVA Australia Scorecard 2024, S&P Global",
};
