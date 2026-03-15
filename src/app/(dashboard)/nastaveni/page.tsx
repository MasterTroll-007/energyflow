"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface CompanySettings {
  companyName: string;
  ico: string;
  dic: string;
  address: string;
  email: string;
  phone: string;
  bankAccount: string;
}

interface DefaultPrice {
  id: string;
  serviceName: string;
  price: number;
}

export default function NastaveniPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "",
    ico: "",
    dic: "",
    address: "",
    email: "",
    phone: "",
    bankAccount: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [prices, setPrices] = useState<DefaultPrice[]>([]);
  const [newPriceName, setNewPriceName] = useState("");
  const [newPriceAmount, setNewPriceAmount] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceName, setEditPriceName] = useState("");
  const [editPriceAmount, setEditPriceAmount] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);

    fetch("/api/default-prices")
      .then((r) => r.json())
      .then(setPrices);
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Nastavení uloženo");
      }
    } catch {
      toast.error("Chyba při ukládání");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddPrice = async () => {
    if (!newPriceName.trim() || !newPriceAmount) {
      toast.error("Vyplňte název a cenu");
      return;
    }

    try {
      const res = await fetch("/api/default-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: newPriceName,
          price: newPriceAmount,
        }),
      });
      if (res.ok) {
        const price = await res.json();
        setPrices([...prices, price]);
        setNewPriceName("");
        setNewPriceAmount("");
        toast.success("Ceník přidán");
      }
    } catch {
      toast.error("Chyba při přidávání");
    }
  };

  const handleUpdatePrice = async (id: string) => {
    try {
      const res = await fetch(`/api/default-prices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: editPriceName,
          price: editPriceAmount,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPrices(prices.map((p) => (p.id === id ? updated : p)));
        setEditingPriceId(null);
        toast.success("Ceník aktualizován");
      }
    } catch {
      toast.error("Chyba při aktualizaci");
    }
  };

  const handleDeletePrice = async (id: string) => {
    try {
      const res = await fetch(`/api/default-prices/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPrices(prices.filter((p) => p.id !== id));
        toast.success("Ceník smazán");
      }
    } catch {
      toast.error("Chyba při mazání");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nastavení"
        description="Profil firmy a výchozí ceník"
      />

      {/* Company Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil firmy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Název firmy</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) =>
                  setSettings({ ...settings, companyName: e.target.value })
                }
                placeholder="Vaše firma s.r.o."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ico">IČO</Label>
              <Input
                id="ico"
                value={settings.ico}
                onChange={(e) =>
                  setSettings({ ...settings, ico: e.target.value })
                }
                placeholder="12345678"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dic">DIČ</Label>
              <Input
                id="dic"
                value={settings.dic}
                onChange={(e) =>
                  setSettings({ ...settings, dic: e.target.value })
                }
                placeholder="CZ12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Bankovní účet</Label>
              <Input
                id="bankAccount"
                value={settings.bankAccount}
                onChange={(e) =>
                  setSettings({ ...settings, bankAccount: e.target.value })
                }
                placeholder="1234567890/0100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresa</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
              placeholder="Ulice 123, 110 00 Praha"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                placeholder="info@firma.cz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                placeholder="+420 123 456 789"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              <Save className="mr-2 h-4 w-4" />
              {savingSettings ? "Ukládám..." : "Uložit nastavení"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Default Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Výchozí ceník</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Nastavte výchozí ceny pro běžné služby. Tyto ceny se budou nabízet
            při vytváření faktur.
          </p>

          {/* Existing prices */}
          {prices.length > 0 && (
            <div className="mb-4 space-y-2">
              {prices.map((price) =>
                editingPriceId === price.id ? (
                  <div key={price.id} className="flex items-end gap-3 rounded-lg border p-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Název služby</Label>
                      <Input
                        value={editPriceName}
                        onChange={(e) => setEditPriceName(e.target.value)}
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Cena (Kč)</Label>
                      <Input
                        type="number"
                        value={editPriceAmount}
                        onChange={(e) => setEditPriceAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePrice(price.id)}
                    >
                      Uložit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPriceId(null)}
                    >
                      Zrušit
                    </Button>
                  </div>
                ) : (
                  <div
                    key={price.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{price.serviceName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCurrency(price.price)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingPriceId(price.id);
                          setEditPriceName(price.serviceName);
                          setEditPriceAmount(price.price.toString());
                        }}
                        aria-label="Upravit ceník"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeletePrice(price.id)}
                        aria-label="Smazat ceník"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <Separator className="my-4" />

          {/* Add new price */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Název služby</Label>
              <Input
                value={newPriceName}
                onChange={(e) => setNewPriceName(e.target.value)}
                placeholder="Např. PENB rodinný dům"
              />
            </div>
            <div className="w-32 space-y-1">
              <Label className="text-xs">Cena (Kč)</Label>
              <Input
                type="number"
                value={newPriceAmount}
                onChange={(e) => setNewPriceAmount(e.target.value)}
                placeholder="5000"
              />
            </div>
            <Button onClick={handleAddPrice}>
              <Plus className="mr-1 h-4 w-4" /> Přidat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
