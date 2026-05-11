import { jsPDF } from 'jspdf';
import type { PaySlipWithLines } from '../types';

async function tryLoadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(new Error('read'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function pickImageFormat(dataUrl: string): 'PNG' | 'JPEG' {
  if (dataUrl.startsWith('data:image/jpeg')) return 'JPEG';
  return 'PNG';
}

/**
 * Génère un bulletin de paie PDF côté employeur (aperçu / archivage indicatif).
 */
export async function buildPaySlipPdfDocument(opts: {
  slip: PaySlipWithLines;
  employeeDisplayName: string;
  orgName?: string;
  orgLogoUrl?: string | null;
  fr: boolean;
}): Promise<jsPDF> {
  const { slip, employeeDisplayName, orgName, orgLogoUrl, fr } = opts;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = margin;

  if (orgLogoUrl) {
    const dataUrl = await tryLoadImageDataUrl(orgLogoUrl);
    if (dataUrl) {
      try {
        const fmt = pickImageFormat(dataUrl);
        doc.addImage(dataUrl, fmt, margin, y, 72, 36);
        y += 44;
      } catch {
        /* ignore logo errors */
      }
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(orgName || (fr ? 'Organisation' : 'Organization'), margin, y);
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(fr ? 'Bulletin de paie (indicatif)' : 'Pay slip (indicative)', margin, y);
  y += 18;

  doc.setFontSize(9);
  doc.text(`${fr ? 'Période' : 'Period'} : ${slip.periodStart} → ${slip.periodEnd}`, margin, y);
  y += 14;
  doc.text(`${fr ? 'Salarié' : 'Employee'} : ${employeeDisplayName}`, margin, y);
  y += 14;
  doc.text(`${fr ? 'Brut' : 'Gross'} : ${slip.grossAmount.toLocaleString()} ${slip.currencyCode || 'XOF'}`, margin, y);
  y += 14;
  doc.text(`${fr ? 'Net' : 'Net'} : ${slip.netAmount.toLocaleString()} ${slip.currencyCode || 'XOF'}`, margin, y);
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.text(fr ? 'Lignes' : 'Lines', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const lines = slip.lines || [];
  if (lines.length === 0) {
    doc.text(fr ? 'Aucune ligne enregistrée.' : 'No lines recorded.', margin, y);
    y += 16;
  } else {
    for (const l of lines) {
      const row = `${l.rubriqueCode} — ${l.label} [${l.side}] : ${l.amount.toLocaleString()}`;
      const split = doc.splitTextToSize(row, 500);
      doc.text(split, margin, y);
      y += split.length * 10 + 4;
      if (y > 720) {
        doc.addPage();
        y = margin;
      }
    }
  }

  y += 18;
  doc.setFontSize(7);
  const legal = fr
    ? 'Document généré à partir des données COYA — références SIRET/SN non présentes en base : valider avec la direction et votre conseil social.'
    : 'Generated from COYA data — no SIRET/SN columns in database: validate with management and social counsel.';
  doc.text(doc.splitTextToSize(legal, 500), margin, y);

  return doc;
}

export async function downloadPaySlipPdf(opts: Parameters<typeof buildPaySlipPdfDocument>[0]): Promise<void> {
  const doc = await buildPaySlipPdfDocument(opts);
  const safeName = (opts.employeeDisplayName || 'employee').replace(/[^\w\-]+/g, '_').slice(0, 40);
  doc.save(`bulletin_${opts.slip.periodStart}_${safeName}.pdf`);
}

export async function printPaySlipPdf(opts: Parameters<typeof buildPaySlipPdfDocument>[0]): Promise<void> {
  const doc = await buildPaySlipPdfDocument(opts);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  // Laisser React terminer le commit DOM avant d’ouvrir une fenêtre (évite removeChild / navigation).
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) {
    w.addEventListener('load', () => {
      try {
        w.print();
      } catch {
        /* ignore */
      }
    });
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
