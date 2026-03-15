import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ENERGY_CLASSES } from "@/lib/constants";

const VALID_ENERGY_CLASSES: readonly string[] = ENERGY_CLASSES;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const expiring = searchParams.get("expiring") === "true";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    if (expiring) {
      const now = new Date();
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      where.expiryDate = { lte: sixMonthsFromNow, gte: now };
    }

    if (search) {
      where.OR = [
        { certificateNumber: { contains: search } },
        { buildingAddress: { contains: search } },
      ];
    }

    const penbs = await prisma.penb.findMany({
      where,
      orderBy: { expiryDate: "asc" },
      include: {
        zakazka: { include: { client: true } },
      },
    });

    return NextResponse.json(penbs);
  } catch (error) {
    console.error("PENB GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání PENB" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zakazkaId, certificateNumber, buildingAddress, energyClass, issueDate, expiryDate } = body;

    if (!zakazkaId || !certificateNumber || !buildingAddress || !energyClass || !issueDate || !expiryDate) {
      return NextResponse.json({ error: "Všechna pole jsou povinná" }, { status: 400 });
    }

    if (!VALID_ENERGY_CLASSES.includes(energyClass)) {
      return NextResponse.json(
        { error: `Neplatná energetická třída. Povolené hodnoty: ${VALID_ENERGY_CLASSES.join(", ")}` },
        { status: 400 }
      );
    }

    const penb = await prisma.penb.create({
      data: {
        zakazkaId,
        certificateNumber,
        buildingAddress,
        energyClass,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
      },
      include: { zakazka: { include: { client: true } } },
    });

    return NextResponse.json(penb, { status: 201 });
  } catch (error) {
    console.error("PENB POST error:", error);
    return NextResponse.json({ error: "Chyba při vytváření PENB" }, { status: 500 });
  }
}
