const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const fmt = (n: number): string => currencyFormatter.format(n);

export const fmtPct = (n: number): string => `${n.toFixed(1)}%`;

export const fmtK = (n: number): string => {
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M€`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}k€`;
  return fmt(n);
};
