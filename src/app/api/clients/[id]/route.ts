import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        zakazky: {
          orderBy: { createdAt: "desc" },
          include: { penb: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Klient nenalezen" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání klienta" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, ico, companyName, notes } = body;

    if (!name) {
      return NextResponse.json({ error: "Jméno je povinné" }, { status: 400 });
    }

    const client = await prisma.client.update({
      where: { id },
      data: { name, email, phone, address, ico, companyName, notes },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client PUT error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci klienta" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Client DELETE error:", error);
    return NextResponse.json({ error: "Chyba při mazání klienta" }, { status: 500 });
  }
}
