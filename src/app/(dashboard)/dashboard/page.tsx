"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatCurrency } from "@/lib/format";

interface DashboardData {
  stats: {
    totalClients: number;
    activeJobs: number;
    revenueThisMonth: number;
    expiringPenbs: number;
  };
  recentZakazky: Array<{
    id: string;
    address: string;
    type: string;
    status: string;
    createdAt: string;
    client: { name: string };
  }>;
  upcomingDeadlines: Array<{
    id: string;
    address: string;
    type: string;
    deadline: string;
    client: { name: string };
  }>;
  expiringPenbList: Array<{
    id: string;
    certificateNumber: string;
    buildingAddress: string;
    energyClass: string;
    expiryDate: string;
    zakazka: { client: { name: string } };
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Chyba při načítání dat");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Nepodařilo se načíst data dashboardu. Zkuste to prosím znovu."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Přehled vaší činnosti" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Přehled vaší činnosti" />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">{error}</p>
                <button
                  onClick={() => { setError(null); setLoading(true); fetch("/api/dashboard").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => setError("Nepodařilo se načíst data dashboardu. Zkuste to prosím znovu.")).finally(() => setLoading(false)); }}
                  className="mt-1 text-sm text-red-600 underline hover:text-red-800"
                >
                  Zkusit znovu
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      title: "Klienti celkem",
      value: data.stats.totalClients,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Aktivní zakázky",
      value: data.stats.activeJobs,
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Příjem tento měsíc",
      value: formatCurrency(data.stats.revenueThisMonth),
      icon: DollarSign,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Expirující PENB",
      value: data.stats.expiringPenbs,
      icon: AlertTriangle,
      color: data.stats.expiringPenbs > 0 ? "text-orange-600" : "text-gray-400",
      bg: data.stats.expiringPenbs > 0 ? "bg-orange-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Přehled vaší činnosti" />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Poslední zakázky</CardTitle>
            <Link href="/zakazky">
              <Button variant="ghost" size="sm">
                Zobrazit vše <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentZakazky.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádné zakázky</p>
            ) : (
              <div className="space-y-3">
                {data.recentZakazky.map((z) => (
                  <Link
                    key={z.id}
                    href={`/zakazky/${z.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{z.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {z.client.name} &middot; {z.type}
                      </p>
                    </div>
                    <StatusBadge status={z.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Blížící se termíny</CardTitle>
            <Link href="/zakazky">
              <Button variant="ghost" size="sm">
                Zobrazit vše <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádné blížící se termíny</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingDeadlines.map((z) => (
                  <Link
                    key={z.id}
                    href={`/zakazky/${z.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{z.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {z.client.name} &middot; {z.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(z.deadline)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring PENBs */}
      {data.expiringPenbList.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">
                PENB certifikáty s blížící se expirací
              </CardTitle>
            </div>
            <Link href="/penb">
              <Button variant="ghost" size="sm">
                Zobrazit vše <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.expiringPenbList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">{p.buildingAddress}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.zakazka.client.name} &middot; Č. {p.certificateNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      Třída {p.energyClass}
                    </Badge>
                    <Badge variant="outline" className="border-orange-300 bg-orange-100 text-orange-800">
                      Expirace: {formatDate(p.expiryDate)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
