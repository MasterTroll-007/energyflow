"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  companyName: string | null;
}

interface Zakazka {
  id: string;
  address: string;
  type: string;
  price: number | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface DefaultPrice {
  id: string;
  serviceName: string;
  price: number;
}

export function NovaFakturaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") || "";
  const preselectedZakazkaId = searchParams.get("zakazkaId") || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [zakazky, setZakazky] = useState<Zakazka[]>([]);
  const [defaultPrices, setDefaultPrices] = useState<DefaultPrice[]>([]);
  const [clientId, setClientId] = useState(preselectedClientId);
  const [zakazkaId, setZakazkaId] = useState(preselectedZakazkaId);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/default-prices").then((r) => r.json()),
    ]).then(([c, dp]) => {
      setClients(c);
      setDefaultPrices(dp);
    });
  }, []);

  useEffect(() => {
    if (clientId) {
      fetch(`/api/zakazky?clientId=${clientId}`)
        .then((r) => r.json())
        .then(setZakazky);
    } else {
      setZakazky([]);
    }
  }, [clientId]);

  useEffect(() => {
    if (zakazkaId && zakazky.length > 0) {
      const z = zakazky.find((z) => z.id === zakazkaId);
      if (z && z.price && items.length === 1 && !items[0].description) {
        setItems([
          {
            description: `${z.type} - ${z.address}`,
            quantity: 1,
            unitPrice: z.price,
          },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zakazkaId, zakazky]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];
    if (field === "description") {
      updated[index].description = value as string;
    } else {
      updated[index][field] = Number(value) || 0;
    }
    setItems(updated);
  };

  const applyDefaultPrice = (index: number, priceId: string) => {
    const dp = defaultPrices.find((p) => p.id === priceId);
    if (dp) {
      const updated = [...items];
      updated[index].description = dp.serviceName;
      updated[index].unitPrice = dp.price;
      setItems(updated);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Vyberte klienta");
      return;
    }
    if (items.some((item) => !item.description || item.unitPrice <= 0)) {
      toast.error("Vyplňte všechny položky");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          zakazkaId: zakazkaId || null,
          dueDate,
          items,
          notes,
        }),
      });

      if (res.ok) {
        const invoice = await res.json();
        toast.success("Faktura vytvořena");
        router.push(`/faktury/${invoice.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Chyba při vytváření");
      }
    } catch {
      toast.error("Chyba při vytváření");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nová faktura"
        description="Vytvořte fakturu pro klienta"
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Základní údaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Klient *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte klienta">
                        {(value: string) => {
                          const c = clients.find((cl) => cl.id === value);
                          return c ? `${c.name}${c.companyName ? ` (${c.companyName})` : ""}` : "Vyberte klienta";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.companyName ? ` (${c.companyName})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zakázka (volitelné)</Label>
                  <Select
                    value={zakazkaId}
                    onValueChange={setZakazkaId}
                    disabled={!clientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte zakázku">
                        {(value: string) => {
                          const z = zakazky.find((zk) => zk.id === value);
                          return z ? `${z.address} (${z.type})` : "Vyberte zakázku";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {zakazky.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.address} ({z.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Datum splatnosti *</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Položky</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-4 w-4" /> Přidat položku
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="space-y-2">
                    {index > 0 && <Separator />}
                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Popis</Label>
                        <div className="flex gap-2">
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            placeholder="Popis položky"
                          />
                          {defaultPrices.length > 0 && (
                            <Select
                              onValueChange={(v) => applyDefaultPrice(index, v)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Z ceníku">
                                  {(value: string) => {
                                    const dp = defaultPrices.find((p) => p.id === value);
                                    return dp ? dp.serviceName : "Z ceníku";
                                  }}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {defaultPrices.map((dp) => (
                                  <SelectItem key={dp.id} value={dp.id}>
                                    {dp.serviceName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Množství</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <Label className="text-xs">Cena/ks (Kč)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">Celkem</Label>
                        <p className="flex h-9 items-center text-sm font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Celkem</p>
                  <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>Poznámky</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Poznámky k faktuře..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Vytvářím..." : "Vytvořit fakturu"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Zrušit
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
