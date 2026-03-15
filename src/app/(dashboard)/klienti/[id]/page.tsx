"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Hash,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ClientForm } from "@/components/forms/client-form";
import { formatDate, formatCurrency } from "@/lib/format";
import { ZAKAZKA_TYPES } from "@/lib/constants";
import { toast } from "sonner";

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  ico: string | null;
  companyName: string | null;
  notes: string | null;
  createdAt: string;
  zakazky: Array<{
    id: string;
    address: string;
    type: string;
    status: string;
    price: number | null;
    deadline: string | null;
    createdAt: string;
    penb: { energyClass: string } | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    issueDate: string;
    dueDate: string;
  }>;
}

export default function KlientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setClient)
      .catch(() => router.push("/klienti"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Klient smazán");
        router.push("/klienti");
      } else {
        toast.error("Chyba při mazání");
      }
    } catch {
      toast.error("Chyba při mazání");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!client) return null;

  if (editing) {
    return (
      <div className="space-y-6">
        <PageHeader title="Upravit klienta" />
        <ClientForm initialData={client} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/klienti">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Zpět
          </Button>
        </Link>
      </div>

      <PageHeader
        title={client.name}
        description={client.companyName || undefined}
      >
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Upravit
        </Button>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Smazat
        </Button>
      </PageHeader>

      {/* Client Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.address}</span>
              </div>
            )}
            {client.ico && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">IČO: {client.ico}</span>
              </div>
            )}
            {client.companyName && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.companyName}</span>
              </div>
            )}
          </div>
          {client.notes && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="zakazky">
        <TabsList>
          <TabsTrigger value="zakazky">
            Zakázky ({client.zakazky.length})
          </TabsTrigger>
          <TabsTrigger value="faktury">
            Faktury ({client.invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zakazky" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Zakázky</CardTitle>
              <Link href={`/zakazky/nova?clientId=${client.id}`}>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Nová zakázka
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {client.zakazky.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádné zakázky</p>
              ) : (
                <div className="space-y-2">
                  {client.zakazky.map((z) => (
                    <Link
                      key={z.id}
                      href={`/zakazky/${z.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{z.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {ZAKAZKA_TYPES[z.type as keyof typeof ZAKAZKA_TYPES] || z.type}
                          {z.deadline && ` | Termín: ${formatDate(z.deadline)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {z.price && (
                          <span className="text-sm font-medium">
                            {formatCurrency(z.price)}
                          </span>
                        )}
                        <StatusBadge status={z.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faktury" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Faktury</CardTitle>
              <Link href={`/faktury/nova?clientId=${client.id}`}>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Nová faktura
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {client.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádné faktury</p>
              ) : (
                <div className="space-y-2">
                  {client.invoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/faktury/${inv.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Vystaveno: {formatDate(inv.issueDate)} | Splatnost:{" "}
                          {formatDate(inv.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatCurrency(inv.totalAmount)}
                        </span>
                        <StatusBadge status={inv.status} type="invoice" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Smazat klienta?"
        description="Tato akce je nevratná. Budou smazány i všechny zakázky a faktury."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
