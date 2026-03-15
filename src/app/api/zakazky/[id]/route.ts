import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ZAKAZKA_STATUSES, ZAKAZKA_TYPES } from "@/lib/constants";

const VALID_STATUSES = Object.keys(ZAKAZKA_STATUSES);
const VALID_TYPES = Object.keys(ZAKAZKA_TYPES);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const zakazka = await prisma.zakazka.findUnique({
      where: { id },
      include: {
        client: true,
        penb: true,
        documents: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!zakazka) {
      return NextResponse.json({ error: "Zakázka nenalezena" }, { status: 404 });
    }

    return NextResponse.json(zakazka);
  } catch (error) {
    console.error("Zakazka GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání zakázky" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId, address, type, status, price, deadline, notes } = body;

    const existing = await prisma.zakazka.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Zakázka nenalezena" }, { status: 404 });
    }

    if (type && !VALID_TYPES.includes(type)) {
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

    const zakazka = await prisma.zakazka.update({
      where: { id },
      data: {
        clientId,
        address,
        type,
        status,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
        notes,
      },
      include: { client: true },
    });

    if (existing.status !== status && status) {
      const statusLabel =
        ZAKAZKA_STATUSES[status as keyof typeof ZAKAZKA_STATUSES]?.label || status;
      await prisma.activity.create({
        data: {
          zakazkaId: id,
          type: "status_change",
          message: `Status změněn na "${statusLabel}"`,
        },
      });
    }

    return NextResponse.json(zakazka);
  } catch (error) {
    console.error("Zakazka PUT error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci zakázky" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.zakazka.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Zakazka DELETE error:", error);
    return NextResponse.json({ error: "Chyba při mazání zakázky" }, { status: 500 });
  }
}
