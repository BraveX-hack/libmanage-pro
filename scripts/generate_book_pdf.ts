import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_CHAPTERS, PROJECT_METADATA, ORAL_DEFENSE_CHEAT_SHEET } from '../src/data/projectBookData';

export const buildPdf = () => {
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
    doc.text('Document de Soutenance • 2GroupESGIS', pageWidth - marginX, pageHeight - 9, { align: 'right' });
  };

  // ==========================================
  // PAGE DE GARDE / COUVERTURE ACADÉMIQUE
  // ==========================================

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
  doc.setTextColor(180, 83, 9);
  doc.text(PROJECT_METADATA.institution.toUpperCase(), pageWidth / 2, 36, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Département des Sciences & Technologies de l\'Information', pageWidth / 2, 42, { align: 'center' });
  doc.text('Filières Informatique & Réseaux (IRTG) / Génie Logiciel (GL)', pageWidth / 2, 47, { align: 'center' });

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

  // Titre Principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(PROJECT_METADATA.title.toUpperCase(), contentWidth - 10);
  doc.text(titleLines, pageWidth / 2, 85, { align: 'center' });

  // Sous-titre
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const subLines = doc.splitTextToSize(PROJECT_METADATA.subtitle, contentWidth - 20);
  doc.text(subLines, pageWidth / 2, 103, { align: 'center' });

  // Symbole central
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth / 2 - 45, 120, 90, 24, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('BiblioTech', pageWidth / 2, 131, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setTextColor(217, 119, 6);
  doc.text('APPLICATION WEB • 2GroupESGIS', pageWidth / 2, 138, { align: 'center' });

  // Bloc Auteurs & Encadrement (Groupe 2GroupESGIS)
  const boxY = 156;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX + 5, boxY, contentWidth - 10, 68, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉALISÉ PAR LE COLLECTIF ÉTUDIANT :', marginX + 12, boxY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  doc.text('• COLLECTIF « 2GroupESGIS »', marginX + 14, boxY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('  Membres du Groupe : [Nom, Prénom & Matricule des Étudiants]', marginX + 18, boxY + 25);
  doc.text('  Promotion : Licence 2 — Informatique, Réseaux & Génie Logiciel', marginX + 18, boxY + 31);
  doc.text('  Spécialités : IRTG / Génie Logiciel / Systèmes d\'Information', marginX + 18, boxY + 37);

  doc.setDrawColor(203, 213, 225);
  doc.line(marginX + 12, boxY + 44, marginX + contentWidth - 22, boxY + 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SOUS LA DIRECTION DE :', marginX + 12, boxY + 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Monsieur l\'Enseignant Référent du Module de Développement', marginX + 58, boxY + 54);
  doc.text('École Supérieure de Gestion, d\'Informatique et des Sciences (ESGIS)', marginX + 58, boxY + 60);

  // Bas de page de garde
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('ANNÉE ACADÉMIQUE 2025 - 2026', pageWidth / 2, 260, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Sujet officiel : Application de gestion d\'une bibliothèque (Livres, Étudiants, Emprunts, Retours)', pageWidth / 2, 266, { align: 'center' });

  // ==========================================
  // PAGE 2 : SOMMAIRE & TABLE DES MATIÈRES
  // ==========================================
  doc.addPage();
  addPageDecorations();
  currentY = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('TABLE DES MATIÈRES', marginX, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Plan officiel de présentation requis pour la soutenance académique :', marginX, currentY);

  currentY += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 8;

  // Ligne Introduction
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('INTRODUCTION GÉNÉRALE', marginX + 2, currentY);
  doc.text(' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .', marginX + 90, currentY);
  doc.text('Page 3', pageWidth - marginX, currentY, { align: 'right' });
  currentY += 8;

  PROJECT_CHAPTERS.forEach((ch, idx) => {
    checkPageBreak(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(ch.title, marginX + 2, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 190, 205);
    doc.text(' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .', marginX + 90, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(217, 119, 6);
    doc.text(`Chap. ${idx + 1}`, pageWidth - marginX, currentY, { align: 'right' });

    currentY += 8;
  });

  // Ligne Conclusion
  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('CONCLUSION GÉNÉRALE & PERSPECTIVES', marginX + 2, currentY);
  doc.text(' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .', marginX + 90, currentY);
  doc.text('Conclusion', pageWidth - marginX, currentY, { align: 'right' });
  currentY += 8;

  // Ligne Annexe
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 83, 9);
  doc.text('ANNEXE : Guide de Soutenance Orale (Pitch 20/20)', marginX + 2, currentY);
  doc.text(' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .', marginX + 90, currentY);
  doc.text('Annexe', pageWidth - marginX, currentY, { align: 'right' });
  currentY += 14;

  // Encadré résumé
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉSUMÉ DU PROJET', marginX + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const summaryLines = doc.splitTextToSize(
    "Ce livre de projet documente la réalisation de l'application BiblioTech par le collectif étudiant 2GroupESGIS. Développée en stricte conformité avec le cours d'ingénierie logicielle, la plateforme digitalise à 100% la gestion des livres, des étudiants, des emprunts et des retours, avec panier de réservation temporaire de 4 jours et délivrance automatique de quittance officielle au format PDF.",
    contentWidth - 12
  );
  doc.text(summaryLines, marginX + 6, currentY + 14);

  // ==========================================
  // PAGE 3 : INTRODUCTION GÉNÉRALE
  // ==========================================
  doc.addPage();
  addPageDecorations();
  currentY = 25;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('INTRODUCTION GÉNÉRALE', marginX + 6, currentY + 8);

  currentY += 18;

  const introParagraphs = [
    "Au sein d'un établissement d'enseignement supérieur de référence tel que l'ESGIS, la bibliothèque universitaire constitue le pilier fondamental de la recherche, de la documentation pédagogique et de la réussite académique de chaque étudiant.",
    "Toutefois, la gestion manuelle sur registres en papier et fiches cartonnées montre aujourd'hui ses limites structurelles : pertes d'historiques d'emprunt, files d'attente pénalisantes lors des interclasses, manque de visibilité en temps réel sur la disponibilité des manuels et litiges fréquents sur les délais de restitution.",
    "Face à ce constat, le présent projet académique, initié sous la conduite de notre enseignant sous l'intitulé 'Application de gestion d'une bibliothèque', répond à un impératif d'efficacité et d'apprentissage professionnel. Il a pour mandat la conception et la mise en œuvre d'une solution informatique intégrée, assurant la traçabilité complète des quatre axes majeurs : la gestion des livres, des étudiants, des emprunts et des retours.",
    "Ce livre technique et académique formalise les fondements théoriques, les modèles conceptuels issus du cours (MCD Merise, MLD 3NF), l'architecture logicielle 3-tiers, les scénarios de démonstration, l'évaluation budgétaire ainsi que le guide d'exposé oral pour la soutenance finale du collectif 2GroupESGIS.",
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  introParagraphs.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentWidth);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, marginX, currentY);
    currentY += lines.length * 5 + 3;
  });

  // ==========================================
  // LES 10 CHAPITRES
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

        // Paragraphes
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        sub.paragraphs.forEach((sp) => {
          const spLines = doc.splitTextToSize(sp, contentWidth);
          checkPageBreak(spLines.length * 4.8 + 3);
          doc.text(spLines, marginX, currentY);
          currentY += spLines.length * 4.8 + 2;
        });

        // Bullet Points
        if (sub.bulletPoints) {
          currentY += 2;
          sub.bulletPoints.forEach((bp) => {
            const bpLines = doc.splitTextToSize(`• ${bp}`, contentWidth - 4);
            checkPageBreak(bpLines.length * 4.5 + 2);
            doc.text(bpLines, marginX + 3, currentY);
            currentY += bpLines.length * 4.5 + 2;
          });
        }

        // Table
        if (sub.table) {
          currentY += 4;
          checkPageBreak(25);

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

        // Callout
        if (sub.callout) {
          currentY += 3;
          const calloutLines = doc.splitTextToSize(sub.callout, contentWidth - 10);
          const boxHeight = calloutLines.length * 4.5 + 8;
          checkPageBreak(boxHeight + 4);

          doc.setFillColor(254, 243, 199);
          doc.setDrawColor(245, 158, 11);
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

    // Points Clés
    if (chapter.keyTakeaways) {
      currentY += 4;
      checkPageBreak(25);
      doc.setFillColor(240, 253, 244);
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
  // CONCLUSION GÉNÉRALE & PERSPECTIVES
  // ==========================================
  doc.addPage();
  addPageDecorations();
  currentY = 25;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('CONCLUSION GÉNÉRALE & PERSPECTIVES', marginX + 6, currentY + 8);

  currentY += 18;

  const conclusionParagraphs = [
    "Au terme de ce projet d'envergure, le collectif étudiant 2GroupESGIS tire un bilan particulièrement satisfaisant de la réalisation de la plateforme BiblioTech.",
    "L'application développée répond point par point au cahier des charges assigné par Monsieur l'Enseignant : catalogage exhaustif des ouvrages avec stock dynamique, profils étudiants personnalisés sans discrimination de cycle ou de filière, panier de réservation rigoureux sans emprunt automatique prématuré, délivrance d'une véritable quittance officielle PDF avec empreinte cryptographique SHA-256, et restitution en un clic avec réassort instantané du fonds documentaire.",
    "Sur le plan méthodologique, ce travail a permis au groupe de consolider les acquis du cursus universitaire : analyse conceptuelle MERISE (MCD), normalisation relationnelle (MLD 3NF), architecture logicielle 3-tiers découplée, et programmation réactive de haute précision en TypeScript.",
    "En perspective, l'intégration prochaine de puces RFID sur les tranches des livres, de rappels automatisés par WhatsApp et d'une application mobile compagnon permettra d'ériger BiblioTech au rang des meilleures bibliothèques universitaires connectées de la sous-région.",
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  conclusionParagraphs.forEach((cp) => {
    const lines = doc.splitTextToSize(cp, contentWidth);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, marginX, currentY);
    currentY += lines.length * 5 + 3;
  });

  // ==========================================
  // ANNEXE : FICHE SOUTENANCE ORALE
  // ==========================================
  doc.addPage();
  addPageDecorations();
  currentY = 25;

  doc.setFillColor(180, 83, 9);
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
  doc.text('Document officiel certifié par le Collectif Étudiant 2GroupESGIS', marginX, currentY);
  doc.text('Fait à Cotonou, le ' + new Date().toLocaleDateString('fr-FR'), pageWidth - marginX, currentY, { align: 'right' });

  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Signature du Collectif : Équipe de Projet Informatique & Réseaux / Génie Logiciel — ESGIS', marginX, currentY);

  // Sauvegarde dans le dossier public
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'Livre_Projet_Gestion_Bibliotheque_2GroupESGIS.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`[SUCCÈS] Le PDF a été généré avec succès dans : ${outputPath} (${pdfBuffer.length} octets) — Total pages : ${doc.getNumberOfPages()}`);
};

buildPdf();
