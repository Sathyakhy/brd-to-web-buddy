/**
 * Money helpers for the dashboard, billing tab, and reports.
 *
 * Keep currency formatting in one place so the symbol, decimal handling, and
 * fallback logic stay consistent across screens.
 */

export type Currency = "USD" | "KHR";

export const SUPPORTED_CURRENCIES: Currency[] = ["USD", "KHR"];

export function formatMoney(amount: number | string | null | undefined, currency: string | null | undefined = "USD"): string {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const cur = (currency ?? "USD").toUpperCase();
  // KHR is whole-riel only; USD shows two decimals.
  const fractionDigits = cur === "KHR" ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(safe);
  } catch {
    // Unknown currency code → fall back to plain number + suffix.
    return `${safe.toFixed(fractionDigits)} ${cur}`;
  }
}

export function paymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "paid": return "Paid";
    case "partial": return "Partial";
    default: return "Unpaid";
  }
}

/** Tailwind classes for a payment-status badge. */
export function paymentStatusClasses(status: string | null | undefined): string {
  switch (status) {
    case "paid":
      return "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30";
    case "partial":
      return "bg-amber-500/15 text-amber-600 border border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}
