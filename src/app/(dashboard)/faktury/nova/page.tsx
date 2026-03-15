import { Suspense } from "react";
import { NovaFakturaForm } from "@/components/forms/nova-faktura-form";

export default function NovaFakturaPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded bg-muted" />}>
      <NovaFakturaForm />
    </Suspense>
  );
}
