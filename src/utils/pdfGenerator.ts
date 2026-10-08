import jsPDF from 'jspdf';
import { Receipt } from '../types/library';

// Format ticket de caisse : bande de 80 mm de large, police à chasse fixe, séparateurs en pointillés.
const TICKET_WIDTH = 80;
const MARGIN = 5;
const LINE = 4;

const typeLabel = (receipt: Receipt): string =>
  receipt.type === 'emprunt'
    ? "QUITTANCE D'EMPRUNT"
    : receipt.type === 'paiement'
    ? 'REÇU DE PAIEMENT'
    : 'TICKET DE RÉSERVATION (4 JOURS)';

/** Dessine le ticket sur `doc` et retourne la hauteur utilisée (mm). */
const drawTicket = (doc: jsPDF, receipt: Receipt): number => {
  const contentWidth = TICKET_WIDTH - MARGIN * 2;
  const center = TICKET_WIDTH / 2;
  const right = TICKET_WIDTH - MARGIN;
  let y = MARGIN + 2;

  const setFont = (bold = false, size = 8) => {
    doc.setFont('courier', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(15, 23, 42);
  };
  const centered = (text: string, bold = false, size = 8) => {
    setFont(bold, size);
    doc.splitTextToSize(text, contentWidth).forEach((l: string) => {
      doc.text(l, center, y, { align: 'center' });
      y += LINE;
    });
  };
  const row = (left: string, rightText: string, bold = false, size = 8) => {
    setFont(bold, size);
    const rightWidth = doc.getTextWidth(rightText);
    const leftLines: string[] = doc.splitTextToSize(left, Math.max(10, contentWidth - rightWidth - 2));
    doc.text(leftLines[0] ?? '', MARGIN, y);
    doc.text(rightText, right, y, { align: 'right' });
    y += LINE;
    for (let i = 1; i < leftLines.length; i++) {
      doc.text(leftLines[i], MARGIN, y);
      y += LINE;
    }
  };
  const small = (text: string, indent = 0, color: [number, number, number] = [100, 116, 139]) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.splitTextToSize(text, contentWidth - indent).forEach((l: string) => {
      doc.text(l, MARGIN + indent, y);
      y += 3.2;
    });
  };
  const dashed = () => {
    y += 1;
    doc.setDrawColor(100, 116, 139);
    doc.setLineDashPattern([1, 1], 0);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, right, y);
    doc.setLineDashPattern([], 0);
    y += LINE - 1;
  };

  const date = new Date(receipt.createdAt);
  const isPayment = receipt.type === 'paiement';
  const isReservation = receipt.type === 'reservation';
  const amount = `${(receipt.amountPaid ?? 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} FCFA`;

  // En-tête
  centered('ESGIS', true, 11);
  centered('Bibliothèque Universitaire', true, 8);
  centered('Cotonou, Bénin', false, 7.5);
  centered('Tél : +229 01 62 66 21 32', false, 7.5);
  dashed();

  centered(typeLabel(receipt), true, 8.5);
  y += 1;
  row(`N° ${receipt.receiptNumber}`, '');
  row(date.toLocaleDateString('fr-FR'), date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  row('Lecteur', receipt.userName || '-', true);
  row('Carte', receipt.studentCardNumber || '-');
  row('Niveau', `${receipt.academicLevel || '-'} · ${receipt.filiere || '-'}`);
  dashed();

  // Articles
  row('DÉSIGNATION', isPayment ? 'MONTANT' : isReservation ? 'VALIDITÉ' : 'RETOUR LE', true, 7);
  y += 0.5;
  (receipt.items || []).forEach((item) => {
    row(`1x ${item.title}`, isPayment ? amount : item.dueDate || (isReservation ? '4 jours max' : '14 jours'));
    small(item.author, 6);
    small(isPayment ? item.isbn : `${item.isbn} · ${item.shelfLocation || 'Rayon Central'}`, 6, [148, 163, 184]);
    y += 1;
  });
  dashed();

  // Total
  row(isPayment ? 'TOTAL' : 'TOTAL OUVRAGES', isPayment ? amount : String((receipt.items || []).length), true, 9);
  if (isReservation && (receipt.amountPaid ?? 0) > 0) row('TOTAL PAYÉ', amount, true, 9);
  if ((receipt.amountPaid ?? 0) > 0 && receipt.paymentMethod) row('Mode de paiement', receipt.paymentMethod, false, 7.5);
  dashed();

  // Mentions
  if (!isPayment) {
    small(
      isReservation
        ? 'Ouvrages conservés 4 jours. Retrait au guichet avec ce ticket.'
        : 'Prêt de 14 jours. Retard : 200 FCFA par jour.'
    );
    y += 1;
  }
  small(`Empreinte : ${receipt.securityHash || 'N/A'}`, 0, [148, 163, 184]);
  small(`Opérateur : ${receipt.operatorName || ''}`, 0, [148, 163, 184]);
  dashed();

  centered('Merci de votre visite !', true, 8.5);
  centered("Conservez ce ticket jusqu'à la restitution.", false, 7);
  centered('2GroupESGIS', false, 7);
  y += MARGIN;

  return y;
};

export const generateReceiptPDF = (receipt: Receipt): void => {
  // 1er passage : mesure de la hauteur nécessaire ; 2e passage : ticket de la bonne longueur
  const probe = new jsPDF({ unit: 'mm', format: [TICKET_WIDTH, 600] });
  const height = Math.max(60, Math.ceil(drawTicket(probe, receipt)));

  const doc = new jsPDF({ unit: 'mm', format: [TICKET_WIDTH, height], orientation: height > TICKET_WIDTH ? 'portrait' : 'landscape' });
  drawTicket(doc, receipt);
  doc.save(`Ticket_${receipt.receiptNumber}.pdf`);
};
