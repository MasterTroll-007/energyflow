import { Badge } from "@/components/ui/badge";
import { ZAKAZKA_STATUSES, INVOICE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "zakazka" | "invoice";
}

export function StatusBadge({ status, type = "zakazka" }: StatusBadgeProps) {
  let label: string;
  let color: string;

  if (type === "zakazka") {
    const config = ZAKAZKA_STATUSES[status as keyof typeof ZAKAZKA_STATUSES];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    label = config.label;
    color = config.color;
  } else {
    const config = INVOICE_STATUSES[status as keyof typeof INVOICE_STATUSES];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    label = config.label;
    color = config.color;
  }

  return (
    <Badge variant="outline" className={cn("border-0 font-medium", color)}>
      {label}
    </Badge>
  );
}
