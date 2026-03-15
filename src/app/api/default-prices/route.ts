import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prices = await prisma.defaultPrice.findMany({
      orderBy: { serviceName: "asc" },
    });
    return NextResponse.json(prices);
  } catch (error) {
    console.error("DefaultPrices GET error:", error);
    return NextResponse.json({ error: "Chyba při načítání ceníku" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceName, price } = body;

    if (!serviceName || price === undefined) {
      return NextResponse.json(
        { error: "Název služby a cena jsou povinné" },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 100_000_000) {
      return NextResponse.json(
        { error: "Cena musí být číslo v rozmezí 0 - 100 000 000" },
        { status: 400 }
      );
    }

    const defaultPrice = await prisma.defaultPrice.create({
      data: { serviceName, price: parsedPrice },
    });

    return NextResponse.json(defaultPrice, { status: 201 });
  } catch (error) {
    console.error("DefaultPrice POST error:", error);
    return NextResponse.json({ error: "Chyba při vytváření ceníku" }, { status: 500 });
  }
}
