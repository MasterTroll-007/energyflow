import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ENERGY_CLASSES } from "@/lib/constants";

const VALID_ENERGY_CLASSES: readonly string[] = ENERGY_CLASSES;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { certificateNumber, buildingAddress, energyClass, issueDate, expiryDate } = body;

    if (energyClass && !VALID_ENERGY_CLASSES.includes(energyClass)) {
      return NextResponse.json(
        { error: `Neplatná energetická třída. Povolené hodnoty: ${VALID_ENERGY_CLASSES.join(", ")}` },
        { status: 400 }
      );
    }

    const penb = await prisma.penb.update({
      where: { id },
      data: {
        certificateNumber,
        buildingAddress,
        energyClass,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });

    return NextResponse.json(penb);
  } catch (error) {
    console.error("PENB PUT error:", error);
    return NextResponse.json({ error: "Chyba při aktualizaci PENB" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.penb.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PENB DELETE error:", error);
    return NextResponse.json({ error: "Chyba při mazání PENB" }, { status: 500 });
  }
}
