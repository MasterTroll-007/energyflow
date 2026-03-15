"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Briefcase, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, formatCurrency } from "@/lib/format";
import { ZAKAZKA_STATUSES, ZAKAZKA_TYPES } from "@/lib/constants";
import { toast } from "sonner";

interface Zakazka {
  id: string;
  address: string;
  type: string;
  status: string;
  price: number | null;
  deadline: string | null;
  createdAt: string;
  client: { id: string; name: string };
  _count: { documents: number };
}

export default function ZakazkyPage() {
  const [zakazky, setZakazky] = useState<Zakazka[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchZakazky = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const url = `/api/zakazky${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setZakazky)
      .catch(() => setError("Nepodařilo se načíst zakázky. Zkuste to prosím znovu."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchZakazky();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchZakazky, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/zakazky/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Zakázka smazána");
        setZakazky((prev) => prev.filter((z) => z.id !== deleteId));
      } else {
        toast.error("Chyba při mazání");
      }
    } catch {
      toast.error("Chyba při mazání");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Zakázky" description="Správa zakázek a projektů">
        <Link href="/zakazky/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nová zakázka
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hledat zakázky..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtr statusu">
              {(value: string) => {
                if (!value || value === "all") return "Všechny statusy";
                return ZAKAZKA_STATUSES[value as keyof typeof ZAKAZKA_STATUSES]?.label ?? value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny statusy</SelectItem>
            {Object.entries(ZAKAZKA_STATUSES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">{error}</p>
                <button
                  onClick={fetchZakazky}
                  className="mt-1 text-sm text-red-600 underline hover:text-red-800"
                >
                  Zkusit znovu
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-4">
                <div className="h-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : zakazky.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Žádné zakázky"
          description={
            search || statusFilter !== "all"
              ? "Žádné zakázky neodpovídají filtru"
              : "Vytvořte první zakázku"
          }
        >
          {!search && statusFilter === "all" && (
            <Link href="/zakazky/nova">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nová zakázka
              </Button>
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {zakazky.map((z) => (
            <Card key={z.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/zakazky/${z.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{z.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {z.client.name} &middot;{" "}
                          {ZAKAZKA_TYPES[z.type as keyof typeof ZAKAZKA_TYPES] || z.type}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    {z.deadline && (
                      <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                        <Calendar className="h-3 w-3" />
                        {formatDate(z.deadline)}
                      </div>
                    )}
                    {z.price && (
                      <span className="hidden text-sm font-medium sm:inline">
                        {formatCurrency(z.price)}
                      </span>
                    )}
                    <StatusBadge status={z.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(z.id)}
                      aria-label="Smazat zakázku"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Smazat zakázku?"
        description="Tato akce je nevratná. Budou smazány i všechny dokumenty a poznámky."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
