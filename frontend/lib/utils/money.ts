/**
 * Centralized RecoverFlow Money & Currency Formatting Utility
 * Strictly data-driven financial representation using Intl.NumberFormat.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  SGD: "S$",
  JPY: "¥",
};

/**
 * Formats a monetary amount with its authoritative currency.
 *
 * @param amount Number, string numeric value, or null/undefined
 * @param currency ISO currency code (e.g. "USD", "INR", "EUR") or fallback
 * @param options Custom formatting options (e.g. minimumFractionDigits)
 * @returns Formatted currency string (e.g. "$14,850.00", "₹2,500.00")
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency?: string | null,
  options?: {
    showDecimals?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  // Safe numeric conversion
  if (amount === null || amount === undefined || amount === "") {
    return formatMoney(0, currency, options);
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || !isFinite(num)) {
    return "$0.00";
  }

  const normalizedCurrency = (currency || "USD").toUpperCase().trim();
  const minDecimals = options?.minimumFractionDigits ?? (options?.showDecimals === false ? 0 : 2);
  const maxDecimals = options?.maximumFractionDigits ?? 2;

  try {
    // Attempt standard Intl.NumberFormat with authoritative currency
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    return formatter.format(num);
  } catch {
    // Fallback if currency code is non-standard
    const symbol = CURRENCY_SYMBOLS[normalizedCurrency] || `${normalizedCurrency} `;
    const formattedNum = num.toLocaleString("en-US", {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    return `${symbol}${formattedNum}`;
  }
}

/**
 * Formats a compact currency value (e.g. for pulse rails or small badges)
 */
export function formatCompactMoney(
  amount: number | string | null | undefined,
  currency?: string | null
): string {
  return formatMoney(amount, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
