"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ZAKAZKA_STATUSES, ZAKAZKA_TYPES } from "@/lib/constants";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  companyName: string | null;
}

interface ZakazkaFormProps {
  initialData?: {
    id?: string;
    clientId: string;
    address: string;
    type: string;
    status: string;
    price: number | null;
    deadline: string | null;
    notes: string | null;
  };
  preselectedClientId?: string;
}

export function ZakazkaForm({ initialData, preselectedClientId }: ZakazkaFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const [clients, setClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || preselectedClientId || "",
    address: initialData?.address || "",
    type: initialData?.type || "PENB",
    status: initialData?.status || "nova",
    price: initialData?.price?.toString() || "",
    deadline: initialData?.deadline
      ? new Date(initialData.deadline).toISOString().split("T")[0]
      : "",
    notes: initialData?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then(setClients);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.address || !formData.type) {
      toast.error("Klient, adresa a typ jsou povinné");
      return;
    }

    setSaving(true);
    try {
      const url = isEditing
        ? `/api/zakazky/${initialData.id}`
        : "/api/zakazky";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const zakazka = await res.json();
        toast.success(isEditing ? "Zakázka aktualizována" : "Zakázka vytvořena");
        router.push(`/zakazky/${zakazka.id}`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Chyba při ukládání");
      }
    } catch {
      toast.error("Chyba při ukládání");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Upravit zakázku" : "Nová zakázka"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(v) => setFormData({ ...formData, clientId: v })}
              >
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
              <Label htmlFor="type">Typ *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: string) => ZAKAZKA_TYPES[value as keyof typeof ZAKAZKA_TYPES] ?? value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ZAKAZKA_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresa budovy *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Ulice 123, Město, PSČ"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: string) => ZAKAZKA_STATUSES[value as keyof typeof ZAKAZKA_STATUSES]?.label ?? value}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ZAKAZKA_STATUSES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Cena (Kč)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="15000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Termín</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Poznámky k zakázce..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Ukládám..."
                : isEditing
                  ? "Uložit změny"
                  : "Vytvořit zakázku"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Zrušit
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
