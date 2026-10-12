import React, { useRef, useState } from 'react';
import { Receipt } from '../types/library';
import { useLibrary } from '../context/LibraryContext';
import { Printer, Download, X, Mail, Send, Check } from 'lucide-react';
import { generateReceiptPDF } from '../utils/pdfGenerator';

interface ReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { currentUser, sendReceiptByEmail, addToast } = useLibrary();

  const [recipientEmail, setRecipientEmail] = useState(
    currentUser?.email || ''
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    setIsSendingEmail(true);
    const sent = await sendReceiptByEmail(receipt.id, recipientEmail.trim());
    setIsSendingEmail(false);
    if (sent) {
      setEmailSent(true);
      addToast(`Quittance ${receipt.receiptNumber} envoyée avec succès à ${recipientEmail} !`, 'success');
      setTimeout(() => setEmailSent(false), 4000);
    }
  };

  const handleDownload = () => {
    try {
      generateReceiptPDF(receipt);
      addToast('Quittance officielle téléchargée en PDF avec succès !', 'success');
    } catch (err) {
      console.error('Erreur PDF:', err);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top actions bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Quittance Officielle Certifiée
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Télécharger la quittance officielle au format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Dispatch Action Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-700">Envoi par email :</span>
          </div>

          <form onSubmit={handleSendEmail} className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="votre.email@domaine.com"
              className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={isSendingEmail}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              {emailSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Envoyé !</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? 'Envoi...' : 'Envoyer'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Ticket de caisse (format reçu thermique) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 print:p-0 print:bg-white">
          <div
            ref={receiptRef}
            className="mx-auto w-full max-w-[340px] bg-white px-5 py-6 font-mono text-[12px] leading-relaxed text-slate-900 shadow-md border border-slate-200"
          >
            {/* En-tête centré */}
            <div className="text-center">
              <div className="text-sm font-bold uppercase">ESGIS</div>
              <div className="font-bold">Bibliothèque Universitaire</div>
              <div className="text-[11px] text-slate-600">Cotonou, Bénin</div>
              <div className="text-[11px] text-slate-600">Tél : +229 01 62 66 21 32</div>
            </div>

            <div className="my-3 border-t border-dashed border-slate-400" />

            <div className="text-center font-bold uppercase">
              {receipt.type === 'emprunt'
                ? "Quittance d'emprunt"
                : receipt.type === 'paiement'
                ? 'Reçu de paiement'
                : 'Ticket de réservation (4 jours)'}
            </div>

            <div className="mt-2 space-y-0.5">
              <div className="flex justify-between gap-3">
                <span>N° {receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>
                  {new Date(receipt.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span>
                  {new Date(receipt.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Lecteur</span>
                <span className="text-right font-bold">{receipt.userName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Carte</span>
                <span className="text-right">
                  {receipt.studentCardNumber || currentUser?.studentCardNumber || '-'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Niveau</span>
                <span className="text-right">
                  {(receipt.academicLevel || currentUser?.academicLevel || '-') +
                    ' · ' +
                    (receipt.filiere || currentUser?.filiere || '-')}
                </span>
              </div>
            </div>

            <div className="my-3 border-t border-dashed border-slate-400" />

            {/* Lignes d'articles */}
            <div className="flex justify-between gap-3 text-[11px] font-bold uppercase text-slate-600">
              <span>Désignation</span>
              <span>{receipt.type === 'paiement' ? 'Montant' : receipt.type === 'reservation' ? 'Validité' : 'Retour le'}</span>
            </div>
            <div className="mt-1 space-y-2">
              {receipt.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between gap-3">
                    <span className="min-w-0 break-words">1x {item.title}</span>
                    <span className="shrink-0 text-right">
                      {receipt.type === 'paiement'
                        ? `${(receipt.amountPaid ?? 0).toLocaleString('fr-FR')} FCFA`
                        : item.dueDate || (receipt.type === 'reservation' ? '4 jours max' : '14 jours')}
                    </span>
                  </div>
                  <div className="pl-4 text-[11px] text-slate-600">{item.author}</div>
                  {receipt.type !== 'paiement' && (
                    <div className="pl-4 text-[11px] text-slate-500">
                      {item.isbn} · {item.shelfLocation || 'Rayon Central'}
                    </div>
                  )}
                  {receipt.type === 'paiement' && (
                    <div className="pl-4 text-[11px] text-slate-500">{item.isbn}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-dashed border-slate-400" />

            {/* Total */}
            <div className="flex justify-between gap-3 text-sm font-bold">
              <span>{receipt.type === 'paiement' ? 'Total' : 'Total ouvrages'}</span>
              <span>
                {receipt.type === 'paiement'
                  ? `${(receipt.amountPaid ?? 0).toLocaleString('fr-FR')} FCFA`
                  : receipt.items.length}
              </span>
            </div>
            {receipt.type === 'reservation' && (receipt.amountPaid ?? 0) > 0 && (
              <div className="flex justify-between gap-3 text-sm font-bold">
                <span>Total payé</span>
                <span>{(receipt.amountPaid ?? 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            {(receipt.amountPaid ?? 0) > 0 && receipt.paymentMethod && (
              <div className="flex justify-between gap-3 text-[11px] text-slate-600">
                <span>Mode de paiement</span>
                <span>{receipt.paymentMethod}</span>
              </div>
            )}

            <div className="my-3 border-t border-dashed border-slate-400" />

            {/* Mentions */}
            {receipt.type !== 'paiement' && (
              <div className="text-[11px] text-slate-600">
                {receipt.type === 'reservation'
                  ? 'Ouvrages conservés 4 jours. Retrait au guichet avec ce ticket.'
                  : 'Prêt de 14 jours. Retard : 200 FCFA par jour.'}
              </div>
            )}
            <div className="mt-2 text-[10px] text-slate-500 break-all">Empreinte : {receipt.securityHash}</div>
            <div className="text-[10px] text-slate-500">Opérateur : {receipt.operatorName}</div>

            <div className="my-3 border-t border-dashed border-slate-400" />

            <div className="text-center">
              <div className="font-bold">Merci de votre visite !</div>
              <div className="text-[11px] text-slate-600">Conservez ce ticket jusqu'à la restitution.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Ce document fait foi de justificatif officiel lors de la sortie de la bibliothèque.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
