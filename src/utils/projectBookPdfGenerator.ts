import jsPDF from 'jspdf';
import { PROJECT_CHAPTERS, PROJECT_METADATA, ORAL_DEFENSE_CHEAT_SHEET } from '../data/projectBookData';

export const generateProjectBookPDF = (): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 25;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 22) {
      doc.addPage();
      currentY = 25;
      addPageDecorations();
    }
  };

  const addPageDecorations = () => {
    // Header
    doc.setDrawColor(220, 226, 235);
    doc.setLineWidth(0.3);
    doc.line(marginX, 14, pageWidth - marginX, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('BiblioTech — 2GroupESGIS | Livre Officiel du Projet Académique', marginX, 11);
    doc.text('Gestion de Bibliothèque', pageWidth - marginX, 11, { align: 'right' });

    // Footer
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text('École Supérieure de Gestion, d\'Informatique et des Sciences (ESGIS)', marginX, pageHeight - 9);
    doc.text('Document de Soutenance • WOTTO Précieux', pageWidth - marginX, pageHeight - 9, { align: 'right' });
  };

  // ==========================================
  // PAGE DE GARDE / COUVERTURE ACADÉMIQUE
  // ==========================================

  // Cadre double bordure élégant
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(1);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.4);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

  // En-tête institutionnel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉPUBLIQUE DU BÉNIN / ENSEIGNEMENT SUPÉRIEUR', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(PROJECT_METADATA.institution.toUpperCase(), pageWidth / 2, 36, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Département des Sciences & Technologies de l\'Information', pageWidth / 2, 42, { align: 'center' });
  doc.text('Filières Informatique & Réseaux (IRTG) / Génie Logiciel (GL)', pageWidth / 2, 47, { align: 'center' });

  // Séparateur
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(40, 53, pageWidth - 40, 53);

  // Badge du Projet
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(pageWidth / 2 - 40, 62, 80, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11);
  doc.text('PROJET DE FIN DE MODULE', pageWidth / 2, 68, { align: 'center' });

  // Titre Principal du Projet
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(PROJECT_METADATA.title.toUpperCase(), contentWidth - 10);
  doc.text(titleLines, pageWidth / 2, 85, { align: 'center' });

  // Sous-titre
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105);
  const subLines = doc.splitTextToSize(PROJECT_METADATA.subtitle, contentWidth - 20);
  doc.text(subLines, pageWidth / 2, 103, { align: 'center' });

  // Logo / Symbole central
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth / 2 - 45, 122, 90, 26, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('BiblioTech', pageWidth / 2, 134, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(217, 119, 6);
  doc.text('APPLICATION WEB • 2GroupESGIS', pageWidth / 2, 141, { align: 'center' });

  // Bloc Auteurs & Encadrement
  const boxY = 162;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX + 5, boxY, contentWidth - 10, 60, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉALISÉ PAR L\'ÉQUIPE ÉTUDIANTE :', marginX + 12, boxY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('• WOTTO Précieux (Chef de Projet & Développeur Principal)', marginX + 14, boxY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('  Licence 2 — Informatique & Réseaux (IRTG2 / GL)', marginX + 18, boxY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('• Collectif 2GroupESGIS & Collègues de Promotion', marginX + 14, boxY + 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('  Spécialités : Génie Logiciel, Réseaux & Systèmes d\'Information', marginX + 18, boxY + 38);

  doc.setDrawColor(203, 213, 225);
  doc.line(marginX + 12, boxY + 44, marginX + contentWidth - 22, boxY + 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SOUS LA DIRECTION DE :', marginX + 12, boxY + 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(PROJECT_METADATA.supervisor, marginX + 58, boxY + 52);

  // Bas de page de garde
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ANNÉE ACADÉMIQUE 2025 - 2026', pageWidth / 2, 260, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Cahier des charges : Gérer les livres, étudiants, emprunts et retours', pageWidth / 2, 266, { align: 'center' });

  // ==========================================
  // PAGE 2 : SOMMAIRE / TABLE DES MATIÈRES
  // ==========================================
  doc.addPage();
  addPageDecorations();
  currentY = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('TABLE DES MATIÈRES & PLAN DU LIVRE', marginX, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Plan officiel de présentation requis pour la soutenance académique :', marginX, currentY);

  currentY += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  PROJECT_CHAPTERS.forEach((ch, idx) => {
    checkPageBreak(12);

    // Numéro de chapitre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(ch.title, marginX + 2, currentY);

    // Ligne pointillée
    const dotsText = ' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 190, 205);
    doc.text(dotsText, marginX + 90, currentY);

    // Page approximative
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(217, 119, 6);
    doc.text(`Chap. ${idx + 1}`, pageWidth - marginX, currentY, { align: 'right' });

    currentY += 8;
  });

  // Annexe Soutenance
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9);
  doc.text('Annexe : Fiche Mémo & Déroulé de Soutenance Orale (Discours 20/20)', marginX + 2, currentY);
  doc.text('Annexe', pageWidth - marginX, currentY, { align: 'right' });

  currentY += 14;

  // Encadré résumé exécutif
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉSUMÉ ANALYTIQUE (ABSTRACT)', marginX + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const summaryLines = doc.splitTextToSize(PROJECT_METADATA.summary, contentWidth - 12);
  doc.text(summaryLines, marginX + 6, currentY + 14);

  // ==========================================
  // CORPS DES 10 CHAPITRES
  // ==========================================
  PROJECT_CHAPTERS.forEach((chapter) => {
    doc.addPage();
    addPageDecorations();
    currentY = 25;

    // Titre de Chapitre (Bandeau élégant)
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(chapter.title.toUpperCase(), marginX + 6, currentY + 8);

    currentY += 18;

    // Introduction du chapitre
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    chapter.content.forEach((paragraph) => {
      const pLines = doc.splitTextToSize(paragraph, contentWidth);
      checkPageBreak(pLines.length * 5 + 4);
      doc.text(pLines, marginX, currentY);
      currentY += pLines.length * 5 + 3;
    });

    currentY += 3;

    // Sous-sections
    if (chapter.subsections) {
      chapter.subsections.forEach((sub) => {
        checkPageBreak(16);

        // Sous-titre
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(sub.subtitle, marginX, currentY);
        currentY += 6;

        // Paragraphes de la sous-section
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        sub.paragraphs.forEach((sp) => {
          const spLines = doc.splitTextToSize(sp, contentWidth);
          checkPageBreak(spLines.length * 4.8 + 3);
          doc.text(spLines, marginX, currentY);
          currentY += spLines.length * 4.8 + 2;
        });

        // Puces / Bullet Points
        if (sub.bulletPoints) {
          currentY += 2;
          sub.bulletPoints.forEach((bp) => {
            const bpLines = doc.splitTextToSize(`• ${bp}`, contentWidth - 4);
            checkPageBreak(bpLines.length * 4.5 + 2);
            doc.text(bpLines, marginX + 3, currentY);
            currentY += bpLines.length * 4.5 + 2;
          });
        }

        // Tableau si existant
        if (sub.table) {
          currentY += 4;
          checkPageBreak(25);

          // Header de table
          const colWidth = contentWidth / sub.table.headers.length;
          doc.setFillColor(241, 245, 249);
          doc.rect(marginX, currentY, contentWidth, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);

          sub.table.headers.forEach((h, hIdx) => {
            doc.text(h, marginX + hIdx * colWidth + 2, currentY + 5);
          });
          currentY += 7;

          // Lignes de table
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(51, 65, 85);

          sub.table.rows.forEach((row, rIdx) => {
            checkPageBreak(9);
            if (rIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(marginX, currentY, contentWidth, 7.5, 'F');
            }
            doc.setDrawColor(226, 232, 240);
            doc.line(marginX, currentY + 7.5, marginX + contentWidth, currentY + 7.5);

            row.forEach((cell, cIdx) => {
              const cellLines = doc.splitTextToSize(cell, colWidth - 3);
              doc.text(cellLines[0] || '', marginX + cIdx * colWidth + 2, currentY + 5);
            });
            currentY += 7.5;
          });
          currentY += 4;
        }

        // Callout si existant
        if (sub.callout) {
          currentY += 3;
          const calloutLines = doc.splitTextToSize(sub.callout, contentWidth - 10);
          const boxHeight = calloutLines.length * 4.5 + 8;
          checkPageBreak(boxHeight + 4);

          doc.setFillColor(254, 243, 199); // amber-100
          doc.setDrawColor(245, 158, 11); // amber-500
          doc.roundedRect(marginX, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(146, 64, 14);
          doc.text(calloutLines, marginX + 5, currentY + 6);
          currentY += boxHeight + 4;
        }

        currentY += 3;
      });
    }

    // Points Clés / Synthèse du Chapitre
    if (chapter.keyTakeaways) {
      currentY += 4;
      checkPageBreak(25);
      doc.setFillColor(240, 253, 244); // emerald-50
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(marginX, currentY, contentWidth, 6 + chapter.keyTakeaways.length * 6, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52);
      doc.text('CE QU\'IL FAUT RETENIR POUR LA SOUTENANCE :', marginX + 4, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(21, 128, 61);
      chapter.keyTakeaways.forEach((kt, kIdx) => {
        doc.text(`✓ ${kt}`, marginX + 6, currentY + 11 + kIdx * 6);
      });

      currentY += 8 + chapter.keyTakeaways.length * 6;
    }
  });

  // ==========================================
  // PAGE ANNEXE : FICHE SOUTENANCE ORALE
  // ==========================================
  doc.addPage();
  addPageDecorations();
  currentY = 25;

  doc.setFillColor(180, 83, 9); // amber-700
  doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(ORAL_DEFENSE_CHEAT_SHEET.title.toUpperCase(), marginX + 6, currentY + 8);

  currentY += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Public cible : ${ORAL_DEFENSE_CHEAT_SHEET.targetAudience} • Durée recommandée : ${ORAL_DEFENSE_CHEAT_SHEET.totalDuration}`, marginX, currentY);

  currentY += 8;

  ORAL_DEFENSE_CHEAT_SHEET.steps.forEach((st) => {
    checkPageBreak(38);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, currentY, contentWidth, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text(`[${st.time}] ${st.speakerRole}`, marginX + 4, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const speechLines = doc.splitTextToSize(`« ${st.speech} »`, contentWidth - 8);
    doc.text(speechLines, marginX + 4, currentY + 12);

    currentY += 38;
  });

  // Signature et Sceau Final
  checkPageBreak(30);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Document certifié conforme par le Collectif 2GroupESGIS', marginX, currentY);
  doc.text('Fait à Cotonou, le ' + new Date().toLocaleDateString('fr-FR'), pageWidth - marginX, currentY, { align: 'right' });

  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Signé électroniquement : WOTTO Précieux — Ingénieur Logiciel & Représentant des Étudiants', marginX, currentY);

  // Téléchargement du fichier
  doc.save('Livre_Projet_Gestion_Bibliotheque_2GroupESGIS.pdf');
};
