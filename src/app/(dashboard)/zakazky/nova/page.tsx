import { Suspense } from "react";
import { NovaZakazkaWrapper } from "@/components/forms/nova-zakazka-wrapper";

export default function NovaZakazkaPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded bg-muted" />}>
      <NovaZakazkaWrapper />
    </Suspense>
  );
}
