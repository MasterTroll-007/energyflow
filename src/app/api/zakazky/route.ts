import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ZAKAZKA_STATUSES, ZAKAZKA_TYPES } from "@/lib/constants";

const VALID_STATUSES = Object.keys(ZAKAZKA_STATUSES);
const VALID_TYPES = Object.keys(ZAKAZKA_TYPES);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Neplatný status. Povolené hodnoty: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
      }
      where.status = status;
    }
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { address: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    const zakazky = await prisma.zakazka.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        penb: true,
        _count: { select: { documents: true, activities: true } },
      },
    });

    return NextResponse.json(zakazky);
  } catch (error) {
    console.error("Zakazky GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání zakázek" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, address, type, status, price, deadline, notes } = body;

    if (!clientId || !address || !type) {
      return NextResponse.json(
        { error: "Klient, adresa a typ jsou povinné" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Neplatný typ zakázky. Povolené hodnoty: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Neplatný status. Povolené hodnoty: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (price !== undefined && price !== null && price !== "") {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 100_000_000) {
        return NextResponse.json(
          { error: "Cena musí být číslo v rozmezí 0 - 100 000 000" },
          { status: 400 }
        );
      }
    }

    const zakazka = await prisma.zakazka.create({
      data: {
        clientId,
        address,
        type,
        status: status || "nova",
        price: price ? parseFloat(price) : null,
        deadline: deadline ? new Date(deadline) : null,
        notes,
      },
      include: { client: true },
    });

    await prisma.activity.create({
      data: {
        zakazkaId: zakazka.id,
        type: "status_change",
        message: "Zakázka byla vytvořena",
      },
    });

    return NextResponse.json(zakazka, { status: 201 });
  } catch (error) {
    console.error("Zakazka POST error:", error);
    return NextResponse.json({ error: "Chyba při vytváření zakázky" }, { status: 500 });
  }
}
