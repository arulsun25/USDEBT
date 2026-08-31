const SNAPSHOT = '2026-08-31T00:00:00.000Z';

export const CATEGORIES = ['debt', 'spending', 'revenue', 'economy', 'population', 'personal'];

export const CATEGORY_LABELS = {
  debt: 'Debt',
  spending: 'Spending',
  revenue: 'Revenue',
  economy: 'Economy',
  population: 'Population',
  personal: 'Personal Debt',
};

const VALID_UNITS = new Set(['usd', 'usd-cents', 'count', 'percent']);

export const STATS = [
  // Debt
  { id: 'total-national-debt', label: 'Total National Debt', category: 'debt', unit: 'usd', baseline: 37300000000000, asOf: SNAPSHOT, perSecondRate: 85000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'debt-held-by-public', label: 'Debt Held by the Public', category: 'debt', unit: 'usd', baseline: 28500000000000, asOf: SNAPSHOT, perSecondRate: 60000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'intragovernmental-holdings', label: 'Intragovernmental Holdings', category: 'debt', unit: 'usd', baseline: 8800000000000, asOf: SNAPSHOT, perSecondRate: 25000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'debt-per-citizen', label: 'Debt Per Citizen', category: 'debt', unit: 'usd-cents', baseline: 108963.75, asOf: SNAPSHOT, perSecondRate: 0.000248, source: 'Derived: total debt / US population (illustrative snapshot)' },
  { id: 'debt-per-taxpayer', label: 'Debt Per Taxpayer', category: 'debt', unit: 'usd-cents', baseline: 231677.02, asOf: SNAPSHOT, perSecondRate: 0.000528, source: 'Derived: total debt / US taxpayers (illustrative snapshot)' },
  { id: 'debt-to-gdp-ratio', label: 'Debt to GDP Ratio', category: 'debt', unit: 'percent', baseline: 124.5, asOf: SNAPSHOT, perSecondRate: 0, source: 'FRED (illustrative snapshot)' },
  { id: 'fiscal-year-interest-paid', label: 'Interest Paid This Fiscal Year', category: 'debt', unit: 'usd', baseline: 950000000000, asOf: SNAPSHOT, perSecondRate: 34880, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },

  // Spending
  { id: 'total-federal-spending-fy', label: 'Total Federal Spending (FY)', category: 'spending', unit: 'usd', baseline: 6800000000000, asOf: SNAPSHOT, perSecondRate: 215000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'medicare-spending', label: 'Medicare Spending', category: 'spending', unit: 'usd', baseline: 1020000000000, asOf: SNAPSHOT, perSecondRate: 32300, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'social-security-spending', label: 'Social Security Spending', category: 'spending', unit: 'usd', baseline: 1520000000000, asOf: SNAPSHOT, perSecondRate: 48200, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'defense-spending', label: 'Defense Spending', category: 'spending', unit: 'usd', baseline: 880000000000, asOf: SNAPSHOT, perSecondRate: 27900, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'medicaid-spending', label: 'Medicaid Spending', category: 'spending', unit: 'usd', baseline: 620000000000, asOf: SNAPSHOT, perSecondRate: 19600, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'net-interest-spending', label: 'Net Interest on Debt', category: 'spending', unit: 'usd', baseline: 950000000000, asOf: SNAPSHOT, perSecondRate: 30100, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'income-security-spending', label: 'Income Security Spending', category: 'spending', unit: 'usd', baseline: 720000000000, asOf: SNAPSHOT, perSecondRate: 22800, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'other-discretionary-spending', label: 'Other Discretionary Spending', category: 'spending', unit: 'usd', baseline: 1090000000000, asOf: SNAPSHOT, perSecondRate: 34500, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },

  // Revenue
  { id: 'total-federal-revenue-fy', label: 'Total Federal Revenue (FY)', category: 'revenue', unit: 'usd', baseline: 5100000000000, asOf: SNAPSHOT, perSecondRate: 161700, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'individual-income-tax-revenue', label: 'Individual Income Tax Revenue', category: 'revenue', unit: 'usd', baseline: 2650000000000, asOf: SNAPSHOT, perSecondRate: 84000, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'payroll-tax-revenue', label: 'Payroll Tax Revenue', category: 'revenue', unit: 'usd', baseline: 1700000000000, asOf: SNAPSHOT, perSecondRate: 53900, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'corporate-tax-revenue', label: 'Corporate Tax Revenue', category: 'revenue', unit: 'usd', baseline: 530000000000, asOf: SNAPSHOT, perSecondRate: 16800, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },
  { id: 'federal-budget-deficit-fy', label: 'Federal Budget Deficit (FY)', category: 'revenue', unit: 'usd', baseline: 1700000000000, asOf: SNAPSHOT, perSecondRate: 53900, source: 'Derived: spending minus revenue (illustrative snapshot)' },
  { id: 'excise-and-other-revenue', label: 'Excise & Other Revenue', category: 'revenue', unit: 'usd', baseline: 220000000000, asOf: SNAPSHOT, perSecondRate: 6970, source: 'US Treasury Fiscal Data API (illustrative snapshot)' },

  // Economy
  { id: 'gdp-nominal', label: 'Nominal GDP', category: 'economy', unit: 'usd', baseline: 29300000000000, asOf: SNAPSHOT, perSecondRate: 27870, source: 'FRED / BEA (illustrative snapshot)' },
  { id: 'gdp-per-capita', label: 'GDP Per Capita', category: 'economy', unit: 'usd-cents', baseline: 85600.0, asOf: SNAPSHOT, perSecondRate: 0.0000814, source: 'Derived: GDP / population (illustrative snapshot)' },
  { id: 'unemployment-rate', label: 'Unemployment Rate', category: 'economy', unit: 'percent', baseline: 4.2, asOf: SNAPSHOT, perSecondRate: 0, source: 'BLS (illustrative snapshot)' },
  { id: 'inflation-rate-cpi', label: 'Inflation Rate (CPI)', category: 'economy', unit: 'percent', baseline: 2.9, asOf: SNAPSHOT, perSecondRate: 0, source: 'BLS (illustrative snapshot)' },
  { id: 'federal-funds-rate', label: 'Federal Funds Rate', category: 'economy', unit: 'percent', baseline: 4.25, asOf: SNAPSHOT, perSecondRate: 0, source: 'FRED (illustrative snapshot)' },
  { id: 'm2-money-supply', label: 'M2 Money Supply', category: 'economy', unit: 'usd', baseline: 21700000000000, asOf: SNAPSHOT, perSecondRate: 13400, source: 'FRED (illustrative snapshot)' },
  { id: 'trade-deficit-ytd', label: 'Trade Deficit (YTD)', category: 'economy', unit: 'usd', baseline: 780000000000, asOf: SNAPSHOT, perSecondRate: 24700, source: 'US Census Bureau (illustrative snapshot)' },
  { id: 'labor-force-participation-rate', label: 'Labor Force Participation Rate', category: 'economy', unit: 'percent', baseline: 62.6, asOf: SNAPSHOT, perSecondRate: 0, source: 'BLS (illustrative snapshot)' },

  // Population
  { id: 'us-population', label: 'US Population', category: 'population', unit: 'count', baseline: 342300000, asOf: SNAPSHOT, perSecondRate: 0.054, source: 'US Census Bureau (illustrative snapshot)' },
  { id: 'us-taxpayers', label: 'US Taxpayers', category: 'population', unit: 'count', baseline: 161000000, asOf: SNAPSHOT, perSecondRate: 0.02, source: 'IRS (illustrative snapshot)' },
  { id: 'world-population', label: 'World Population', category: 'population', unit: 'count', baseline: 8230000000, asOf: SNAPSHOT, perSecondRate: 2.6, source: 'UN Population Division (illustrative snapshot)' },
  { id: 'us-births-this-year', label: 'US Births This Year', category: 'population', unit: 'count', baseline: 2400000, asOf: SNAPSHOT, perSecondRate: 0.114, source: 'CDC (illustrative snapshot)' },
  { id: 'us-deaths-this-year', label: 'US Deaths This Year', category: 'population', unit: 'count', baseline: 2050000, asOf: SNAPSHOT, perSecondRate: 0.099, source: 'CDC (illustrative snapshot)' },
  { id: 'us-households', label: 'US Households', category: 'population', unit: 'count', baseline: 132000000, asOf: SNAPSHOT, perSecondRate: 0.02, source: 'US Census Bureau (illustrative snapshot)' },

  // Personal Debt
  { id: 'total-consumer-debt', label: 'Total US Consumer Debt', category: 'personal', unit: 'usd', baseline: 18200000000000, asOf: SNAPSHOT, perSecondRate: 41200, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'mortgage-debt-total', label: 'Total Mortgage Debt', category: 'personal', unit: 'usd', baseline: 12900000000000, asOf: SNAPSHOT, perSecondRate: 22800, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'student-loan-debt-total', label: 'Total Student Loan Debt', category: 'personal', unit: 'usd', baseline: 1780000000000, asOf: SNAPSHOT, perSecondRate: 5100, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'credit-card-debt-total', label: 'Total Credit Card Debt', category: 'personal', unit: 'usd', baseline: 1320000000000, asOf: SNAPSHOT, perSecondRate: 4600, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'auto-loan-debt-total', label: 'Total Auto Loan Debt', category: 'personal', unit: 'usd', baseline: 1660000000000, asOf: SNAPSHOT, perSecondRate: 4100, source: 'NY Fed Consumer Credit Panel (illustrative snapshot)' },
  { id: 'avg-credit-card-debt-per-household', label: 'Avg Credit Card Debt / Household', category: 'personal', unit: 'usd-cents', baseline: 10990.0, asOf: SNAPSHOT, perSecondRate: 0.0000348, source: 'Derived (illustrative snapshot)' },
  { id: 'avg-student-loan-debt-per-borrower', label: 'Avg Student Loan Debt / Borrower', category: 'personal', unit: 'usd-cents', baseline: 39075.0, asOf: SNAPSHOT, perSecondRate: 0.0001194, source: 'Derived (illustrative snapshot)' },
  { id: 'avg-mortgage-debt-per-household', label: 'Avg Mortgage Debt / Household', category: 'personal', unit: 'usd-cents', baseline: 244500.0, asOf: SNAPSHOT, perSecondRate: 0.0001727, source: 'Derived (illustrative snapshot)' },
  { id: 'personal-savings-rate', label: 'Personal Savings Rate', category: 'personal', unit: 'percent', baseline: 4.6, asOf: SNAPSHOT, perSecondRate: 0, source: 'BEA (illustrative snapshot)' },
  { id: 'unfunded-liabilities-total', label: 'Total Unfunded Liabilities', category: 'personal', unit: 'usd', baseline: 212000000000000, asOf: SNAPSHOT, perSecondRate: 605000, source: 'Trustees reports methodology (illustrative snapshot)' },
];

export function groupByCategory(stats) {
  const groups = new Map();
  for (const category of CATEGORIES) {
    groups.set(category, []);
  }
  for (const stat of stats) {
    groups.get(stat.category).push(stat);
  }
  return groups;
}

export function validateStats(stats) {
  const errors = [];
  const seenIds = new Set();
  for (const stat of stats) {
    if (seenIds.has(stat.id)) errors.push(`Duplicate id: ${stat.id}`);
    seenIds.add(stat.id);
    if (typeof stat.id !== 'string' || stat.id.length === 0) errors.push(`Invalid id on stat with label "${stat.label}"`);
    if (!CATEGORIES.includes(stat.category)) errors.push(`Invalid category "${stat.category}" on ${stat.id}`);
    if (!VALID_UNITS.has(stat.unit)) errors.push(`Invalid unit "${stat.unit}" on ${stat.id}`);
    if (typeof stat.baseline !== 'number' || Number.isNaN(stat.baseline)) errors.push(`Invalid baseline on ${stat.id}`);
    if (typeof stat.perSecondRate !== 'number' || Number.isNaN(stat.perSecondRate)) errors.push(`Invalid perSecondRate on ${stat.id}`);
    if (Number.isNaN(new Date(stat.asOf).getTime())) errors.push(`Invalid asOf on ${stat.id}`);
    if (typeof stat.label !== 'string' || stat.label.length === 0) errors.push(`Invalid label on ${stat.id}`);
    if (typeof stat.source !== 'string' || stat.source.length === 0) errors.push(`Invalid source on ${stat.id}`);
  }
  return errors;
}
