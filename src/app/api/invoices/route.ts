import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        zakazka: true,
        items: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání faktur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, zakazkaId, dueDate, items, notes } = body;

    if (!clientId || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Klient, datum splatnosti a položky jsou povinné" },
        { status: 400 }
      );
    }

    // Validate invoice items
    for (const item of items) {
      if (!item.description || typeof item.description !== "string") {
        return NextResponse.json(
          { error: "Každá položka musí mít popis" },
          { status: 400 }
        );
      }
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      if (isNaN(qty) || qty <= 0 || qty > 1_000_000) {
        return NextResponse.json(
          { error: "Množství musí být kladné číslo (max 1 000 000)" },
          { status: 400 }
        );
      }
      if (isNaN(price) || price < 0 || price > 100_000_000) {
        return NextResponse.json(
          { error: "Jednotková cena musí být číslo v rozmezí 0 - 100 000 000" },
          { status: 400 }
        );
      }
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: { startsWith: `FV-${year}` },
      },
    });
    const invoiceNumber = `FV-${year}-${String(count + 1).padStart(4, "0")}`;

    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        zakazkaId: zakazkaId || null,
        dueDate: new Date(dueDate),
        totalAmount,
        notes,
        items: {
          create: items.map(
            (item: { description: string; quantity: number; unitPrice: number }) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })
          ),
        },
      },
      include: { client: true, zakazka: true, items: true },
    });

    if (zakazkaId) {
      await prisma.activity.create({
        data: {
          zakazkaId,
          type: "invoice_created",
          message: `Vytvořena faktura ${invoiceNumber}`,
        },
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Invoice POST error:", error);
    return NextResponse.json({ error: "Chyba při vytváření faktury" }, { status: 500 });
  }
}
