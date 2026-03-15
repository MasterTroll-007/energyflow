import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const sixMonthsFromNow = addMonths(now, 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalClients,
      activeJobs,
      revenueThisMonth,
      expiringPenbs,
      recentZakazky,
      upcomingDeadlines,
      expiringPenbList,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.zakazka.count({
        where: { status: { in: ["nova", "v_reseni", "ceka_na_podklady"] } },
      }),
      prisma.invoice.aggregate({
        where: {
          status: "zaplaceno",
          issueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      prisma.penb.count({
        where: {
          expiryDate: { lte: sixMonthsFromNow, gte: now },
        },
      }),
      prisma.zakazka.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: true },
      }),
      prisma.zakazka.findMany({
        where: {
          deadline: { gte: now },
          status: { in: ["nova", "v_reseni", "ceka_na_podklady"] },
        },
        take: 5,
        orderBy: { deadline: "asc" },
        include: { client: true },
      }),
      prisma.penb.findMany({
        where: {
          expiryDate: { lte: sixMonthsFromNow, gte: now },
        },
        take: 5,
        orderBy: { expiryDate: "asc" },
        include: { zakazka: { include: { client: true } } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalClients,
        activeJobs,
        revenueThisMonth: revenueThisMonth._sum.totalAmount || 0,
        expiringPenbs,
      },
      recentZakazky,
      upcomingDeadlines,
      expiringPenbList,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Chyba při načítání dashboardu" }, { status: 500 });
  }
}
