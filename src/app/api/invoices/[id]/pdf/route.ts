import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Faktura nenalezena" }, { status: 404 });
    }

    const settings = await prisma.companySettings.findUnique({
      where: { id: "default" },
    });

    const formatDate = (date: Date) => format(date, "d. M. yyyy", { locale: cs });
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("cs-CZ", {
        style: "currency",
        currency: "CZK",
        minimumFractionDigits: 0,
      }).format(amount);

    const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Faktura ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .header h1 { font-size: 28px; color: #2563eb; }
    .header .invoice-number { font-size: 16px; color: #666; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { width: 45%; }
    .party h3 { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px; letter-spacing: 1px; }
    .party p { margin: 2px 0; }
    .party .name { font-weight: bold; font-size: 16px; }
    .dates { display: flex; gap: 40px; margin-bottom: 30px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
    .dates div { }
    .dates label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .dates p { font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #2563eb; color: white; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    th:first-child { border-radius: 8px 0 0 0; }
    th:last-child { border-radius: 0 8px 0 0; text-align: right; }
    th:nth-child(2), th:nth-child(3) { text-align: right; }
    td { padding: 12px 16px; border-bottom: 1px solid #eee; }
    td:nth-child(2), td:nth-child(3), td:last-child { text-align: right; }
    .total-row { display: flex; justify-content: flex-end; margin-bottom: 40px; }
    .total-box { background: #2563eb; color: white; padding: 16px 32px; border-radius: 8px; text-align: right; }
    .total-box label { font-size: 12px; opacity: 0.8; text-transform: uppercase; }
    .total-box p { font-size: 24px; font-weight: bold; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; }
    .footer .bank { margin-bottom: 16px; }
    .footer label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer p { margin-top: 2px; }
    .notes { margin-top: 20px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b; }
    .notes label { font-size: 12px; color: #888; text-transform: uppercase; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>FAKTURA</h1>
      <div class="invoice-number">${escapeHtml(invoice.invoiceNumber)}</div>
    </div>
    <div style="text-align: right; color: ${invoice.status === "zaplaceno" ? "#16a34a" : "#dc2626"}; font-weight: bold; font-size: 18px;">
      ${invoice.status === "zaplaceno" ? "ZAPLACENO" : "NEZAPLACENO"}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Dodavatel</h3>
      <p class="name">${escapeHtml(settings?.companyName) || "Vaše firma"}</p>
      ${settings?.ico ? `<p>IČO: ${escapeHtml(settings.ico)}</p>` : ""}
      ${settings?.dic ? `<p>DIČ: ${escapeHtml(settings.dic)}</p>` : ""}
      ${settings?.address ? `<p>${escapeHtml(settings.address)}</p>` : ""}
      ${settings?.email ? `<p>${escapeHtml(settings.email)}</p>` : ""}
      ${settings?.phone ? `<p>${escapeHtml(settings.phone)}</p>` : ""}
    </div>
    <div class="party">
      <h3>Odběratel</h3>
      <p class="name">${escapeHtml(invoice.client.companyName) || escapeHtml(invoice.client.name)}</p>
      <p>${escapeHtml(invoice.client.name)}</p>
      ${invoice.client.ico ? `<p>IČO: ${escapeHtml(invoice.client.ico)}</p>` : ""}
      ${invoice.client.address ? `<p>${escapeHtml(invoice.client.address)}</p>` : ""}
      ${invoice.client.email ? `<p>${escapeHtml(invoice.client.email)}</p>` : ""}
    </div>
  </div>

  <div class="dates">
    <div>
      <label>Datum vystavení</label>
      <p>${formatDate(invoice.issueDate)}</p>
    </div>
    <div>
      <label>Datum splatnosti</label>
      <p>${formatDate(invoice.dueDate)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Popis</th>
        <th>Množství</th>
        <th>Cena za kus</th>
        <th>Celkem</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items
        .map(
          (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="total-row">
    <div class="total-box">
      <label>Celkem k úhradě</label>
      <p>${formatCurrency(invoice.totalAmount)}</p>
    </div>
  </div>

  ${
    settings?.bankAccount
      ? `
  <div class="footer">
    <div class="bank">
      <label>Bankovní spojení</label>
      <p style="font-weight: 600; font-size: 16px;">${escapeHtml(settings.bankAccount)}</p>
    </div>
  </div>
  `
      : ""
  }

  ${
    invoice.notes
      ? `
  <div class="notes">
    <label>Poznámky</label>
    <p>${escapeHtml(invoice.notes)}</p>
  </div>
  `
      : ""
  }
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Invoice PDF error:", error);
    return NextResponse.json({ error: "Chyba při generování faktury" }, { status: 500 });
  }
}
