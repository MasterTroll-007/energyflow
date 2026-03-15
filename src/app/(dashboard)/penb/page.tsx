"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Award, AlertTriangle, Building2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PenbEntry {
  id: string;
  certificateNumber: string;
  buildingAddress: string;
  energyClass: string;
  issueDate: string;
  expiryDate: string;
  zakazka: {
    id: string;
    address: string;
    client: { name: string; companyName: string | null };
  };
}

const energyClassColors: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-yellow-500 text-white",
  D: "bg-yellow-600 text-white",
  E: "bg-orange-500 text-white",
  F: "bg-red-500 text-white",
  G: "bg-red-700 text-white",
};

export default function PenbPage() {
  const [allPenbs, setAllPenbs] = useState<PenbEntry[]>([]);
  const [expiringPenbs, setExpiringPenbs] = useState<PenbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchPenbs = () => {
    setLoading(true);
    setError(null);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    Promise.all([
      fetch(`/api/penb${params}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch(`/api/penb?expiring=true`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
    ])
      .then(([all, expiring]) => {
        setAllPenbs(all);
        setExpiringPenbs(expiring);
      })
      .catch(() => setError("Nepodařilo se načíst PENB certifikáty. Zkuste to prosím znovu."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPenbs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const isExpiringSoon = (expiryDate: string) => {
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return new Date(expiryDate) <= sixMonthsFromNow;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const renderPenbCard = (penb: PenbEntry) => (
    <Card key={penb.id} className="transition-shadow hover:shadow-md">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="truncate font-semibold">{penb.buildingAddress}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {penb.zakazka.client.name}
              {penb.zakazka.client.companyName &&
                ` (${penb.zakazka.client.companyName})`}
            </p>
            <p className="text-xs text-muted-foreground">
              Č. {penb.certificateNumber}
            </p>
          </div>
          <Badge
            className={cn(
              "shrink-0 text-sm font-bold",
              energyClassColors[penb.energyClass] || "bg-gray-500 text-white"
            )}
          >
            {penb.energyClass}
          </Badge>
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>Vydáno: {formatDate(penb.issueDate)}</span>
          <span
            className={cn(
              "font-medium",
              isExpired(penb.expiryDate)
                ? "text-red-600"
                : isExpiringSoon(penb.expiryDate)
                  ? "text-orange-600"
                  : ""
            )}
          >
            {isExpired(penb.expiryDate) ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Expirováno
              </span>
            ) : isExpiringSoon(penb.expiryDate) ? (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Expirace: {formatDate(penb.expiryDate)}
              </span>
            ) : (
              `Platnost do: ${formatDate(penb.expiryDate)}`
            )}
          </span>
        </div>

        <div className="mt-2">
          <Link
            href={`/zakazky/${penb.zakazka.id}`}
            className="text-xs text-primary hover:underline"
          >
            Zobrazit zakázku
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="PENB registr"
        description="Přehled vydaných energetických průkazů budov"
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Hledat podle čísla nebo adresy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">{error}</p>
                <button
                  onClick={fetchPenbs}
                  className="mt-1 text-sm text-red-600 underline hover:text-red-800"
                >
                  Zkusit znovu
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Všechny ({allPenbs.length})</TabsTrigger>
          <TabsTrigger value="expiring" className="relative">
            Expirující ({expiringPenbs.length})
            {expiringPenbs.length > 0 && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                {expiringPenbs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-4">
                    <div className="h-24 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allPenbs.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Žádné PENB certifikáty"
              description="PENB certifikáty se přidávají přes detail zakázky"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allPenbs.map(renderPenbCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expiring" className="mt-4">
          {expiringPenbs.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Žádné expirující certifikáty"
              description="Všechny certifikáty jsou platné po dobu delší než 6 měsíců"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expiringPenbs.map(renderPenbCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
