"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, FileText, Download, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/format";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";

interface Doc {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  category: string;
  createdAt: string;
  zakazka: {
    id: string;
    address: string;
    client: { name: string };
  };
}

export default function DokumentyPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = () => {
    setLoading(true);
    setError(null);
    const params = categoryFilter !== "all" ? `?category=${categoryFilter}` : "";
    fetch(`/api/documents${params}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setDocuments)
      .catch(() => setError("Nepodařilo se načíst dokumenty. Zkuste to prosím znovu."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Dokument smazán");
        setDocuments((prev) => prev.filter((d) => d.id !== deleteId));
      }
    } catch {
      toast.error("Chyba při mazání");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumenty"
        description="Archív dokumentů ze všech zakázek"
      />

      <div className="flex gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny kategorie</SelectItem>
            {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
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
                  onClick={fetchDocs}
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
                <div className="h-12 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Žádné dokumenty"
          description="Dokumenty se nahrávají přes detail zakázky"
        />
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <Link
                          href={`/zakazky/${doc.zakazka.id}`}
                          className="hover:underline"
                        >
                          {doc.zakazka.address}
                        </Link>
                        {" | "}
                        {doc.zakazka.client.name}
                        {" | "}
                        {formatFileSize(doc.fileSize)}
                        {" | "}
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {DOCUMENT_CATEGORIES[doc.category as keyof typeof DOCUMENT_CATEGORIES] || doc.category}
                    </Badge>
                    <a
                      href={`/uploads/${doc.fileName}`}
                      download={doc.name}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label={`Stáhnout ${doc.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(doc.id)}
                      aria-label="Smazat dokument"
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
        title="Smazat dokument?"
        description="Tato akce je nevratná."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
