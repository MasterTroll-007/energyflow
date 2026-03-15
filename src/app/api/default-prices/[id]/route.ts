import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serviceName, price } = body;

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 100_000_000) {
      return NextResponse.json(
        { error: "Cena musí být číslo v rozmezí 0 - 100 000 000" },
        { status: 400 }
      );
    }

    const defaultPrice = await prisma.defaultPrice.update({
      where: { id },
      data: { serviceName, price: parsedPrice },
    });

    return NextResponse.json(defaultPrice);
  } catch (error) {
    console.error("DefaultPrice PUT error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci ceníku" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.defaultPrice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DefaultPrice DELETE error:", error);
    return NextResponse.json({ error: "Chyba při mazání ceníku" }, { status: 500 });
  }
}
