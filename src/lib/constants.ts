export const ZAKAZKA_STATUSES = {
  nova: { label: "Nová", color: "bg-blue-100 text-blue-800" },
  v_reseni: { label: "V řešení", color: "bg-yellow-100 text-yellow-800" },
  ceka_na_podklady: { label: "Čeká na podklady", color: "bg-orange-100 text-orange-800" },
  dokoncena: { label: "Dokončená", color: "bg-green-100 text-green-800" },
  fakturovana: { label: "Fakturovaná", color: "bg-purple-100 text-purple-800" },
} as const;

export const ZAKAZKA_TYPES = {
  PENB: "PENB",
  EA: "Energetický audit",
  EP: "Energetický posudek",
} as const;

export const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export const DOCUMENT_CATEGORIES = {
  podklady: "Podklady",
  vystupy: "Výstupy",
  faktury: "Faktury",
} as const;

export const INVOICE_STATUSES = {
  nezaplaceno: { label: "Nezaplaceno", color: "bg-red-100 text-red-800" },
  zaplaceno: { label: "Zaplaceno", color: "bg-green-100 text-green-800" },
} as const;

export type ZakazkaStatus = keyof typeof ZAKAZKA_STATUSES;
export type ZakazkaType = keyof typeof ZAKAZKA_TYPES;
export type EnergyClass = (typeof ENERGY_CLASSES)[number];
export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES;
export type InvoiceStatus = keyof typeof INVOICE_STATUSES;
