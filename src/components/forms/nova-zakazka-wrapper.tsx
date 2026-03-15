"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ZakazkaForm } from "@/components/forms/zakazka-form";

export function NovaZakazkaWrapper() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nová zakázka"
        description="Vytvořte novou zakázku pro klienta"
      />
      <ZakazkaForm preselectedClientId={clientId} />
    </div>
  );
}
