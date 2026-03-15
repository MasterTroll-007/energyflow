import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INVOICE_STATUSES } from "@/lib/constants";

const VALID_INVOICE_STATUSES = Object.keys(INVOICE_STATUSES);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        zakazka: true,
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Faktura nenalezena" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání faktury" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status && !VALID_INVOICE_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Neplatný status faktury. Povolené hodnoty: ${VALID_INVOICE_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { client: true, zakazka: true, items: true },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice PUT error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci faktury" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invoice DELETE error:", error);
    return NextResponse.json({ error: "Chyba při mazání faktury" }, { status: 500 });
  }
}
