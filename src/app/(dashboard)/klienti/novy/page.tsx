import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/forms/client-form";

export default function NovyKlientPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Nový klient" description="Přidejte nového klienta do systému" />
      <ClientForm />
    </div>
  );
}
