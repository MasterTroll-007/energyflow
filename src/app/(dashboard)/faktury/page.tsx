"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
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
import { INVOICE_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  client: { id: string; name: string };
  zakazka: { id: string; address: string } | null;
}

export default function FakturyPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const url = `/api/invoices${params.toString() ? `?${params}` : ""}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setInvoices)
      .catch(() => setError("Nepodařilo se načíst faktury. Zkuste to prosím znovu."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleToggleStatus = async (invoiceId: string, currentStatus: string) => {
    const newStatus =
      currentStatus === "zaplaceno" ? "nezaplaceno" : "zaplaceno";
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(
          newStatus === "zaplaceno"
            ? "Faktura označena jako zaplacená"
            : "Faktura označena jako nezaplacená"
        );
        fetchInvoices();
      }
    } catch {
      toast.error("Chyba při aktualizaci");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Faktura smazána");
        setInvoices((prev) => prev.filter((i) => i.id !== deleteId));
      }
    } catch {
      toast.error("Chyba při mazání");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const isOverdue = (invoice: Invoice) => {
    return (
      invoice.status === "nezaplaceno" && new Date(invoice.dueDate) < new Date()
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Faktury" description="Správa faktur a plateb">
        <Link href="/faktury/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nová faktura
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hledat faktury..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny</SelectItem>
            {Object.entries(INVOICE_STATUSES).map(([key, { label }]) => (
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
                  onClick={fetchInvoices}
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
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Žádné faktury"
          description={
            search || statusFilter !== "all"
              ? "Žádné faktury neodpovídají filtru"
              : "Vytvořte první fakturu"
          }
        >
          {!search && statusFilter === "all" && (
            <Link href="/faktury/nova">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nová faktura
              </Button>
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Card
              key={invoice.id}
              className={
                isOverdue(invoice) ? "border-red-200 bg-red-50/50" : ""
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/faktury/${invoice.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {invoice.invoiceNumber}
                          </p>
                          {isOverdue(invoice) && (
                            <span className="text-xs font-medium text-red-600">
                              Po splatnosti
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.client.name}
                          {invoice.zakazka &&
                            ` | ${invoice.zakazka.address}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vystaveno: {formatDate(invoice.issueDate)} | Splatnost:{" "}
                          {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleStatus(invoice.id, invoice.status)
                      }
                    >
                      <StatusBadge status={invoice.status} type="invoice" />
                    </Button>
                    <a
                      href={`/api/invoices/${invoice.id}/pdf`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label="Zobrazit PDF faktury"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(invoice.id)}
                      aria-label="Smazat fakturu"
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
        title="Smazat fakturu?"
        description="Tato akce je nevratná."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
