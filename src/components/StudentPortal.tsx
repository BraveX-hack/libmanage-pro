import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { BookOpen, Clock, AlertCircle, CheckCircle, FileText, RefreshCw, XCircle, Send, ShieldAlert, Award } from 'lucide-react';
import { Loan, Reservation } from '../types/library';

export const StudentPortal: React.FC = () => {
  const {
    currentUser,
    loans,
    reservations,
    readingAccesses,
    books,
    openReader,
    buyReading,
    renewLoan,
    cancelReservation,
    generateLoanReceipt,
    generateReservationReceipt,
    setActiveReceipt,
    addToast,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'emprunts' | 'reservations' | 'lectures' | 'historique' | 'demande'>('emprunts');

  // Book request form state
  const [requestTitle, setRequestTitle] = useState('');
  const [requestAuthor, setRequestAuthor] = useState('');
  const [requestReason, setRequestReason] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Espace Étudiant & Lecteur
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          Veuillez vous connecter avec votre identifiant ou sélectionner le rôle Étudiant dans la barre supérieure pour consulter vos emprunts en cours, vos quittances et vos réservations.
        </p>
      </div>
    );
  }

  // Filter loans for this user
  const userLoans = loans.filter((l) => l.userId === currentUser.id);
  const activeLoans = userLoans.filter((l) => l.status !== 'rendu');
  const pastLoans = userLoans.filter((l) => l.status === 'rendu');
  const myAccesses = readingAccesses.filter((x) => x.userId === currentUser.id);
  const isLive = (x: (typeof myAccesses)[number]) => x.status === 'active' && new Date(x.expiresAt).getTime() > Date.now();
  const liveReadings = myAccesses.filter(isLive);
  const otherReadings = myAccesses.filter((x) => !isLive(x) && (x.status === 'expiree' || x.status === 'en_attente_paiement')).slice(0, 6);
  const timeLeft = (iso: string) => {
    const ms = new Date(iso).getTime() - Date.now();
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return `${d > 0 ? `${d} j ` : ''}${h} h`;
  };
  const userReservations = reservations.filter((r) => r.userId === currentUser.id && r.status === 'active');

  // Calculate late days and fines
  const calculateLateInfo = (loan: Loan) => {
    const today = new Date();
    const due = new Date(loan.dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return { isLate: true, daysLate: diffDays, fine: diffDays * loan.dailyLateFee };
    }
    return { isLate: false, daysLate: 0, fine: 0 };
  };

  // Calculate hours remaining for 4-day reservation
  const calculateReservationCountdown = (res: Reservation) => {
    const now = new Date().getTime();
    const expireTime = new Date(res.expiresAt).getTime();
    const diffMs = expireTime - now;
    if (diffMs <= 0) return 'Expiré';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}j ${remainingHours}h restants`;
  };

  const handleOpenLoanReceipt = async (loan: Loan) => {
    const receipt = await generateLoanReceipt(loan);
    if (receipt) setActiveReceipt(receipt);
  };

  const handleOpenReservationTicket = async (res: Reservation) => {
    const receipt = await generateReservationReceipt(res);
    if (receipt) setActiveReceipt(receipt);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTitle.trim()) return;
    addToast(`Votre suggestion d'achat pour "${requestTitle}" a été transmise aux bibliothécaires.`, 'success');
    setRequestTitle('');
    setRequestAuthor('');
    setRequestReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Student Profile Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl font-serif">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-slate-900">
                  {currentUser.name}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentUser.status === 'actif' ? 'Compte Valide' : 'Compte Suspendu'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  {currentUser.academicLevel || 'Licence 2'} — {currentUser.filiere || 'IRTG'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                <span>Carte n° <strong className="font-mono text-slate-800">{currentUser.studentCardNumber || 'ETU-2026-8841'}</strong></span>
                <span>·</span>
                <span>{currentUser.school || currentUser.faculty || 'ESGIS'}</span>
                <span>·</span>
                <span>{currentUser.email}</span>
                {currentUser.nationalIdCard && (
                  <>
                    <span>·</span>
                    <span>ID/CIP : <strong className="font-mono text-slate-700">{currentUser.nationalIdCard}</strong></span>
                  </>
                )}
                {currentUser.birthDate && (
                  <>
                    <span>·</span>
                    <span>Né(e) le : <strong className="font-mono text-slate-700">{currentUser.birthDate}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quota & Plan details */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <Award className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-[11px] text-slate-500 font-medium">
                Abonnement : <strong className="text-slate-900">{currentUser.subscriptionPlan}</strong>
              </div>
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <span>Quota de prêts :</span>
                <span className="font-mono font-bold text-amber-800">
                  {activeLoans.length} / {currentUser.maxLoans}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">livres autorisés</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('emprunts')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'emprunts'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Emprunts en cours ({activeLoans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'reservations'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Réservations actives ({userReservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lectures')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'lectures'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mes lectures ({liveReadings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('historique')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'historique'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Historique des retours ({pastLoans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('demande')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'demande'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Suggérer un Livre</span>
        </button>
      </div>

      {/* Tab 1: Active Loans */}
      {activeTab === 'emprunts' && (
        <div className="space-y-4">
          {activeLoans.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-medium text-sm">Aucun emprunt en cours</p>
              <p className="text-xs text-slate-400 mt-1">
                Explorez le catalogue pour emprunter des livres avec votre carte d'étudiant.
              </p>
            </div>
          ) : (
            activeLoans.map((loan) => {
              const lateInfo = calculateLateInfo(loan);
              return (
                <div
                  key={loan.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    lateInfo.isLate
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={loan.bookCover || `/images/${loan.bookId}.jpg`}
                      alt={loan.bookTitle}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/images/${loan.bookId}.jpg`;
                      }}
                      className="w-16 h-22 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-1">
                        <span>RÉF : {loan.reference}</span>
                        <span>·</span>
                        <span>ISBN {loan.isbn}</span>
                      </div>
                      <h3 className="font-serif font-bold text-slate-900 text-base leading-snug">
                        {loan.bookTitle}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">{loan.bookAuthor}</p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>Emprunté le : <strong className="text-slate-700 font-mono">{loan.borrowDate}</strong></span>
                        <span>·</span>
                        <span>
                          Échéance :{' '}
                          <strong
                            className={`font-mono ${
                              lateInfo.isLate ? 'text-rose-700 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {loan.dueDate}
                          </strong>
                        </span>
                      </div>

                      {lateInfo.isLate && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold mt-2 bg-rose-100/80 px-2.5 py-1 rounded-md w-fit">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>
                            En retard de {lateInfo.daysLate} jour(s) — Pénalité cumulée :{' '}
                            {lateInfo.fine} FCFA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleOpenLoanReceipt(loan)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Quittance (PDF)</span>
                    </button>

                    <button
                      onClick={() => renewLoan(loan.id)}
                      disabled={loan.renewalCount >= 1 || lateInfo.isLate}
                      title={
                        loan.renewalCount >= 1
                          ? 'Déjà renouvelé'
                          : lateInfo.isLate
                          ? 'Non renouvelable en retard'
                          : 'Prolonger de 14 jours'
                      }
                      className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{loan.renewalCount >= 1 ? 'Prolongé' : 'Prolonger (+14j)'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Active Reservations */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {userReservations.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-medium text-sm">Aucune réservation active</p>
              <p className="text-xs text-slate-400 mt-1">
                Lorsque tous les exemplaires sont empruntés, réservez pour bloquer le livre pendant 4 jours à son retour.
              </p>
            </div>
          ) : (
            userReservations.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={res.bookCover || `/images/${res.bookId}.jpg`}
                    alt={res.bookTitle}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/images/${res.bookId}.jpg`;
                    }}
                    className="w-16 h-22 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-1">
                      <span>RÉF : {res.reference}</span>
                      <span>·</span>
                      <span>Ticket 4 jours</span>
                    </div>
                    <h3 className="font-serif font-bold text-slate-900 text-base leading-snug">
                      {res.bookTitle}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">{res.bookAuthor}</p>

                    <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold mt-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Compte à rebours : {calculateReservationCountdown(res)}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Lieu de retrait : <strong>{res.pickupDesk}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleOpenReservationTicket(res)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ticket Réservation</span>
                  </button>
                  <button
                    onClick={() => cancelReservation(res.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Annuler</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab : lectures en ligne (7 jours, sans téléchargement) */}
      {activeTab === 'lectures' && (
        <div className="space-y-4">
          {liveReadings.length === 0 && otherReadings.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-medium text-sm">Aucune lecture en ligne</p>
              <p className="text-xs text-slate-400 mt-1">
                Les livres marqués « Lecture en ligne disponible » se lisent directement sur le site pendant 7 jours.
              </p>
            </div>
          ) : (
            <>
              {liveReadings.map((x) => (
                <div key={x.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={books.find((b) => b.id === x.bookId)?.coverUrl || x.bookCover}
                      alt={x.bookTitle}
                      className="w-16 h-22 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 mb-1">RÉF : {x.reference} · Lecture en ligne</div>
                      <h3 className="font-serif font-bold text-slate-900 text-base leading-snug">{x.bookTitle}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{x.bookAuthor}</p>
                      <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold mt-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Il vous reste {timeLeft(x.expiresAt)} pour terminer ce livre</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openReader(x.bookId)}
                    className="px-5 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors self-end md:self-center shrink-0 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Lire</span>
                  </button>
                </div>
              ))}
              {otherReadings.map((x) => (
                <div key={x.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-700 truncate">{x.bookTitle}</div>
                    <div className="text-slate-500">
                      {x.status === 'en_attente_paiement' ? 'Paiement en attente de confirmation' : 'Accès terminé (7 jours écoulés)'}
                    </div>
                  </div>
                  {x.status === 'expiree' && (
                    <button
                      onClick={() => buyReading(x.bookId)}
                      className="px-3 py-1.5 font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-white shrink-0"
                    >
                      Relire (nouveau paiement)
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'historique' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Livre</th>
                <th className="py-3 px-4">Date Emprunt</th>
                <th className="py-3 px-4">Date de Restitution</th>
                <th className="py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastLoans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Aucun historique de restitution pour le moment.
                  </td>
                </tr>
              ) : (
                pastLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 font-serif">{loan.bookTitle}</div>
                      <div className="text-slate-500 text-[11px]">{loan.bookAuthor}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{loan.borrowDate}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                      {loan.returnDate || 'Restitué'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Rendu conforme
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Special Request */}
      {activeTab === 'demande' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-lg font-serif font-bold text-slate-900 mb-1">
            Demande d'acquisition d'un nouvel ouvrage
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Vous ne trouvez pas un manuel indispensable pour votre mémoire, vos cours ou votre recherche ? Soumettez une proposition d'achat au comité de la bibliothèque.
          </p>

          <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Titre de l'ouvrage *</label>
              <input
                type="text"
                required
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="Ex: Intelligence Artificielle : Une Approche Moderne"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Auteur(s) / Éditeur</label>
              <input
                type="text"
                value={requestAuthor}
                onChange={(e) => setRequestAuthor(e.target.value)}
                placeholder="Ex: Stuart Russell & Peter Norvig (Pearson)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Justification pédagogique / Motif</label>
              <textarea
                rows={3}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Précisez pour quelle filière, matière ou projet cet ouvrage est requis..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmettre la Demande</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
