"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, Phone, Mail, Building2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  ico: string | null;
  companyName: string | null;
  createdAt: string;
  _count: { zakazky: number; invoices: number };
}

export default function KlientiPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = (searchQuery = "") => {
    setLoading(true);
    setError(null);
    const url = searchQuery
      ? `/api/clients?search=${encodeURIComponent(searchQuery)}`
      : "/api/clients";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setClients)
      .catch(() => setError("Nepodařilo se načíst klienty. Zkuste to prosím znovu."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClients(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Klient smazán");
        setClients((prev) => prev.filter((c) => c.id !== deleteId));
      } else {
        toast.error("Chyba při mazání klienta");
      }
    } catch {
      toast.error("Chyba při mazání klienta");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Klienti" description="Správa klientů a jejich kontaktů">
        <Link href="/klienti/novy">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nový klient
          </Button>
        </Link>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Hledat klienty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">{error}</p>
                <button
                  onClick={() => fetchClients(search)}
                  className="mt-1 text-sm text-red-600 underline hover:text-red-800"
                >
                  Zkusit znovu
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Žádní klienti"
          description={search ? "Žádní klienti neodpovídají vyhledávání" : "Přidejte prvního klienta"}
        >
          {!search && (
            <Link href="/klienti/novy">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nový klient
              </Button>
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/klienti/${client.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{client.name}</h3>
                    {client.companyName && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{client.companyName}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(client.id);
                    }}
                    aria-label="Smazat klienta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 space-y-1">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-3 border-t pt-3 text-xs text-muted-foreground">
                  <span>{client._count.zakazky} zakázek</span>
                  <span>{client._count.invoices} faktur</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Smazat klienta?"
        description="Tato akce je nevratná. Budou smazány i všechny zakázky a faktury tohoto klienta."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
