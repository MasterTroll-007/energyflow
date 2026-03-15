import { format, formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "d. M. yyyy", { locale: cs });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "d. M. yyyy HH:mm", { locale: cs });
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: cs });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("cs-CZ").format(num);
}
