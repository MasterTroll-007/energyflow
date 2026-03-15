"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  User,
  FileText,
  Upload,
  Plus,
  Send,
  Clock,
  MessageSquare,
  FileUp,
  Receipt,
  Activity,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ZakazkaForm } from "@/components/forms/zakazka-form";
import { formatDate, formatDateTime, formatRelative, formatCurrency } from "@/lib/format";
import {
  ZAKAZKA_TYPES,
  ZAKAZKA_STATUSES,
  DOCUMENT_CATEGORIES,
  ENERGY_CLASSES,
} from "@/lib/constants";
import { toast } from "sonner";

interface ZakazkaDetail {
  id: string;
  clientId: string;
  address: string;
  type: string;
  status: string;
  price: number | null;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
  };
  penb: {
    id: string;
    certificateNumber: string;
    buildingAddress: string;
    energyClass: string;
    issueDate: string;
    expiryDate: string;
  } | null;
  documents: Array<{
    id: string;
    name: string;
    fileName: string;
    fileSize: number;
    category: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    issueDate: string;
  }>;
}

export default function ZakazkaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [zakazka, setZakazka] = useState<ZakazkaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("podklady");
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showPenbDialog, setShowPenbDialog] = useState(false);
  const [penbForm, setPenbForm] = useState({
    certificateNumber: "",
    buildingAddress: "",
    energyClass: "B",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });
  const [savingPenb, setSavingPenb] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState(false);

  const fetchZakazka = () => {
    fetch(`/api/zakazky/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setZakazka(data);
        if (!penbForm.buildingAddress) {
          setPenbForm((prev) => ({
            ...prev,
            buildingAddress: data.address,
            expiryDate: prev.expiryDate || getExpiryDate(new Date().toISOString().split("T")[0]),
          }));
        }
      })
      .catch(() => router.push("/zakazky"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchZakazka();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getExpiryDate = (issueDate: string) => {
    const d = new Date(issueDate);
    d.setFullYear(d.getFullYear() + 10);
    return d.toISOString().split("T")[0];
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/zakazky/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...zakazka, status: newStatus }),
      });
      if (res.ok) {
        toast.success("Status aktualizován");
        fetchZakazka();
      }
    } catch {
      toast.error("Chyba při změně statusu");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/zakazky/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        fetchZakazka();
        toast.success("Poznámka přidána");
      }
    } catch {
      toast.error("Chyba při přidávání poznámky");
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      toast.error("Vyberte soubor");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("zakazkaId", id);
      formData.append("category", uploadCategory);
      formData.append("name", uploadName || file.name);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Dokument nahrán");
        setShowUpload(false);
        setUploadName("");
        fetchZakazka();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Chyba při nahrávání");
      }
    } catch {
      toast.error("Chyba při nahrávání");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocId) return;
    setDeletingDoc(true);
    try {
      const res = await fetch(`/api/documents/${deleteDocId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Dokument smazán");
        fetchZakazka();
      }
    } catch {
      toast.error("Chyba při mazání dokumentu");
    } finally {
      setDeletingDoc(false);
      setDeleteDocId(null);
    }
  };

  const handleSavePenb = async () => {
    if (!penbForm.certificateNumber || !penbForm.energyClass) {
      toast.error("Vyplňte povinná pole");
      return;
    }
    setSavingPenb(true);
    try {
      const url = zakazka?.penb ? `/api/penb/${zakazka.penb.id}` : "/api/penb";
      const method = zakazka?.penb ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...penbForm,
          zakazkaId: id,
        }),
      });
      if (res.ok) {
        toast.success(zakazka?.penb ? "PENB aktualizován" : "PENB vytvořen");
        setShowPenbDialog(false);
        fetchZakazka();
      }
    } catch {
      toast.error("Chyba při ukládání PENB");
    } finally {
      setSavingPenb(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/zakazky/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Zakázka smazána");
        router.push("/zakazky");
      }
    } catch {
      toast.error("Chyba při mazání");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "note":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "document_upload":
        return <FileUp className="h-4 w-4 text-orange-500" />;
      case "invoice_created":
        return <Receipt className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
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

  if (!zakazka) return null;

  if (editing) {
    return (
      <div className="space-y-6">
        <PageHeader title="Upravit zakázku" />
        <ZakazkaForm initialData={zakazka} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/zakazky">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Zpět
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{zakazka.address}</h1>
            <StatusBadge status={zakazka.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {ZAKAZKA_TYPES[zakazka.type as keyof typeof ZAKAZKA_TYPES] || zakazka.type}
            {" | "}
            <Link href={`/klienti/${zakazka.client.id}`} className="underline hover:text-foreground">
              {zakazka.client.name}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={zakazka.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ZAKAZKA_STATUSES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Upravit
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setShowDelete(true)} aria-label="Smazat zakázku">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Klient
            </div>
            <p className="mt-1 font-medium">{zakazka.client.name}</p>
            {zakazka.client.companyName && (
              <p className="text-xs text-muted-foreground">{zakazka.client.companyName}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Adresa
            </div>
            <p className="mt-1 font-medium">{zakazka.address}</p>
          </CardContent>
        </Card>
        {zakazka.price && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Receipt className="h-4 w-4" />
                Cena
              </div>
              <p className="mt-1 font-medium">{formatCurrency(zakazka.price)}</p>
            </CardContent>
          </Card>
        )}
        {zakazka.deadline && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Termín
              </div>
              <p className="mt-1 font-medium">{formatDate(zakazka.deadline)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {zakazka.notes && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{zakazka.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* PENB */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">PENB certifikát</CardTitle>
          <Dialog open={showPenbDialog} onOpenChange={setShowPenbDialog}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  variant={zakazka.penb ? "outline" : "default"}
                  onClick={() => {
                    if (zakazka.penb) {
                      setPenbForm({
                        certificateNumber: zakazka.penb.certificateNumber,
                        buildingAddress: zakazka.penb.buildingAddress,
                        energyClass: zakazka.penb.energyClass,
                        issueDate: new Date(zakazka.penb.issueDate)
                          .toISOString()
                          .split("T")[0],
                        expiryDate: new Date(zakazka.penb.expiryDate)
                          .toISOString()
                          .split("T")[0],
                      });
                    }
                  }}
                />
              }
            >
              {zakazka.penb ? (
                <>
                  <Pencil className="mr-1 h-4 w-4" /> Upravit
                </>
              ) : (
                <>
                  <Plus className="mr-1 h-4 w-4" /> Přidat PENB
                </>
              )}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {zakazka.penb ? "Upravit PENB" : "Nový PENB certifikát"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Číslo certifikátu *</Label>
                  <Input
                    value={penbForm.certificateNumber}
                    onChange={(e) =>
                      setPenbForm({ ...penbForm, certificateNumber: e.target.value })
                    }
                    placeholder="PENB-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresa budovy *</Label>
                  <Input
                    value={penbForm.buildingAddress}
                    onChange={(e) =>
                      setPenbForm({ ...penbForm, buildingAddress: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Energetická třída *</Label>
                    <Select
                      value={penbForm.energyClass}
                      onValueChange={(v) =>
                        setPenbForm({ ...penbForm, energyClass: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENERGY_CLASSES.map((c) => (
                          <SelectItem key={c} value={c}>
                            Třída {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Datum vydání</Label>
                    <Input
                      type="date"
                      value={penbForm.issueDate}
                      onChange={(e) =>
                        setPenbForm({
                          ...penbForm,
                          issueDate: e.target.value,
                          expiryDate: getExpiryDate(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Platnost do</Label>
                    <Input
                      type="date"
                      value={penbForm.expiryDate}
                      onChange={(e) =>
                        setPenbForm({ ...penbForm, expiryDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSavePenb} disabled={savingPenb}>
                    {savingPenb ? "Ukládám..." : "Uložit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPenbDialog(false)}
                  >
                    Zrušit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {zakazka.penb ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Číslo certifikátu</p>
                <p className="font-medium">{zakazka.penb.certificateNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Energetická třída</p>
                <Badge variant="outline" className="mt-1">
                  Třída {zakazka.penb.energyClass}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Datum vydání</p>
                <p className="font-medium">{formatDate(zakazka.penb.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platnost do</p>
                <p className="font-medium">{formatDate(zakazka.penb.expiryDate)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Žádný PENB certifikát nebyl zatím přidán.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Documents, Activity, Invoices */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">
            Aktivita ({zakazka.activities.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Dokumenty ({zakazka.documents.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Faktury ({zakazka.invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {/* Add note */}
              <div className="mb-6 flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Přidejte poznámku..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="self-end"
                >
                  <Send className="mr-1 h-4 w-4" />
                  {addingNote ? "..." : "Přidat"}
                </Button>
              </div>

              <Separator className="my-4" />

              {/* Timeline */}
              {zakazka.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádná aktivita</p>
              ) : (
                <div className="space-y-4">
                  {zakazka.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-1">{activityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(activity.createdAt)} &middot;{" "}
                          {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Dokumenty</CardTitle>
              <Dialog open={showUpload} onOpenChange={setShowUpload}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Upload className="mr-1 h-4 w-4" /> Nahrát
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nahrát dokument</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Název dokumentu</Label>
                      <Input
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="Název (volitelné)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kategorie</Label>
                      <Select
                        value={uploadCategory}
                        onValueChange={setUploadCategory}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DOCUMENT_CATEGORIES).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Soubor *</Label>
                      <Input type="file" required />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={uploading}>
                        {uploading ? "Nahrávám..." : "Nahrát"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUpload(false)}
                      >
                        Zrušit
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {zakazka.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádné dokumenty</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(DOCUMENT_CATEGORIES).map(
                    ([catKey, catLabel]) => {
                      const docs = zakazka.documents.filter(
                        (d) => d.category === catKey
                      );
                      if (docs.length === 0) return null;
                      return (
                        <div key={catKey}>
                          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                            {catLabel}
                          </h4>
                          <div className="space-y-1">
                            {docs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">
                                      {doc.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(doc.fileSize)} &middot;{" "}
                                      {formatDate(doc.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
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
                                    onClick={() => setDeleteDocId(doc.id)}
                                    aria-label="Smazat dokument"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Faktury</CardTitle>
              <Link href={`/faktury/nova?clientId=${zakazka.clientId}&zakazkaId=${zakazka.id}`}>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Nová faktura
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {zakazka.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádné faktury</p>
              ) : (
                <div className="space-y-2">
                  {zakazka.invoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/faktury/${inv.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(inv.issueDate)}
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
        open={!!deleteDocId}
        onOpenChange={() => setDeleteDocId(null)}
        title="Smazat dokument?"
        description="Tato akce je nevratná."
        onConfirm={handleDeleteDoc}
        loading={deletingDoc}
      />

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Smazat zakázku?"
        description="Tato akce je nevratná. Budou smazány i všechny dokumenty, poznámky a PENB."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
