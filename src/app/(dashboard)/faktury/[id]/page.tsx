"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  client: {
    id: string;
    name: string;
    email: string | null;
    companyName: string | null;
    address: string | null;
    ico: string | null;
  };
  zakazka: { id: string; address: string; type: string } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export default function FakturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoice = () => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setInvoice)
      .catch(() => router.push("/faktury"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleStatus = async () => {
    if (!invoice) return;
    const newStatus =
      invoice.status === "zaplaceno" ? "nezaplaceno" : "zaplaceno";
    try {
      const res = await fetch(`/api/invoices/${id}`, {
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
        fetchInvoice();
      }
    } catch {
      toast.error("Chyba při aktualizaci");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Faktura smazána");
        router.push("/faktury");
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

  if (!invoice) return null;

  const isOverdue =
    invoice.status === "nezaplaceno" &&
    new Date(invoice.dueDate) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/faktury">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Zpět
          </Button>
        </Link>
      </div>

      <PageHeader title={invoice.invoiceNumber}>
        {invoice.status === "nezaplaceno" ? (
          <Button onClick={handleToggleStatus} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" /> Označit jako zaplacenou
          </Button>
        ) : (
          <Button variant="outline" onClick={handleToggleStatus}>
            <XCircle className="mr-2 h-4 w-4" /> Označit jako nezaplacenou
          </Button>
        )}
        <a
          href={`/api/invoices/${id}/pdf`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Zobrazit PDF
        </a>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => setShowDelete(true)}
          aria-label="Smazat fakturu"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Položky</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">Celkem</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={invoice.status} type="invoice" />
                    {isOverdue && (
                      <span className="text-xs font-medium text-red-600">
                        Po splatnosti
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Vystaveno
                  </span>
                  <span className="text-sm">{formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Splatnost
                  </span>
                  <span
                    className={`text-sm ${isOverdue ? "font-medium text-red-600" : ""}`}
                  >
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Odběratel</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/klienti/${invoice.client.id}`}
                className="block space-y-1 hover:underline"
              >
                <p className="font-medium">
                  {invoice.client.companyName || invoice.client.name}
                </p>
                {invoice.client.companyName && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.client.name}
                  </p>
                )}
                {invoice.client.ico && (
                  <p className="text-xs text-muted-foreground">
                    IČO: {invoice.client.ico}
                  </p>
                )}
                {invoice.client.address && (
                  <p className="text-xs text-muted-foreground">
                    {invoice.client.address}
                  </p>
                )}
              </Link>
            </CardContent>
          </Card>

          {/* Linked Job */}
          {invoice.zakazka && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zakázka</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/zakazky/${invoice.zakazka.id}`}
                  className="hover:underline"
                >
                  <p className="text-sm font-medium">
                    {invoice.zakazka.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.zakazka.type}
                  </p>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Smazat fakturu?"
        description="Tato akce je nevratná."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
