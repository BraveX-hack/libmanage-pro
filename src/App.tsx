/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { PromoBanner } from './components/PromoBanner';
import { HomeView } from './components/HomeView';
import { CatalogueView } from './components/CatalogueView';
import { StudentPortal } from './components/StudentPortal';
import { SubscriptionView } from './components/SubscriptionView';
import { BookModal } from './components/BookModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CartModal } from './components/CartModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { Book, Receipt, SubscriptionPlan } from './types/library';

// Console d'administration chargée à la demande (allège le premier chargement)
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

function MainApp() {
  const { activeReceipt, setActiveReceipt, resetDemoData, currentUser, upgradeSubscription, addToast } = useLibrary();

  const [currentTab, setCurrentTab] = useState<'accueil' | 'catalogue' | 'etudiant' | 'admin' | 'abonnements'>('accueil');
  const [catalogueSearchQuery, setCatalogueSearchQuery] = useState('');
  const [selectedBookForModal, setSelectedBookForModal] = useState<Book | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

  const handleHeroSearch = (query: string) => {
    setCatalogueSearchQuery(query);
    setCurrentTab('catalogue');
  };

  // Clic sur « Souscrire » : redirection directe vers la page de paiement Bachs (sans fenêtre intermédiaire)
  const handleSelectPlanToPay = async (plan: SubscriptionPlan, amount: number) => {
    if (!currentUser) {
      addToast('Connectez-vous pour souscrire à une formule.', 'warning');
      setIsAuthOpen(true);
      return;
    }
    if (isRedirectingToPayment) return;
    setIsRedirectingToPayment(true);
    const result = await upgradeSubscription(plan, { method: 'Bachs', amount });
    if (result.success && result.checkoutUrl) {
      addToast('Redirection vers la page de paiement sécurisée Bachs…', 'info');
      window.location.assign(result.checkoutUrl);
      return;
    }
    setIsRedirectingToPayment(false);
  };

  const handleOpenQuittanceDemo = () => {
    const demoReceipt: Receipt = {
      id: 'demo-rcpt',
      receiptNumber: 'QUITT-2026-94812',
      type: 'emprunt',
      createdAt: new Date().toISOString(),
      userId: currentUser?.id || 'user-etu-1',
      userName: currentUser?.name || 'Koffi Alexandre Dupont',
      userEmail: currentUser?.email || 'koffi.alexandre@univ-tech.edu',
      studentCardNumber: currentUser?.studentCardNumber || 'ETU-2026-8841',
      academicLevel: currentUser?.academicLevel || 'Licence 2',
      filiere: currentUser?.filiere || 'IRTG',
      school: currentUser?.school || 'ESGIS',
      items: [
        {
          bookId: 'book-1',
          title: 'Algorithmique Avancée & Structures de Données',
          author: 'Thomas H. Cormen, Charles Leiserson',
          isbn: '978-2100814526',
          dueDate: '2026-10-15',
          shelfLocation: 'Rayon INF-A04',
        },
      ],
      securityHash: 'SHA256:d8b724a910f54e12cbb832049e7145bc',
      operatorName: 'WOTTO Précieux - Direction Générale de la Bibliothèque',
    };
    setActiveReceipt(demoReceipt);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-500/20 selection:text-amber-900">
      {/* Promotional Banner */}
      <PromoBanner onExploreOffer={() => setCurrentTab('abonnements')} />

      {/* Top Bar Contract Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'accueil' && (
          <HomeView
            onSearch={handleHeroSearch}
            onNavigateCatalogue={() => setCurrentTab('catalogue')}
            onNavigateStudent={() => setCurrentTab('etudiant')}
            onNavigateSubscriptions={() => setCurrentTab('abonnements')}
            onOpenBookDetails={(book) => setSelectedBookForModal(book)}
            onOpenQuittanceDemo={handleOpenQuittanceDemo}
            onSelectPlanToPay={handleSelectPlanToPay}
          />
        )}

        {currentTab === 'catalogue' && (
          <CatalogueView
            initialSearch={catalogueSearchQuery}
            onOpenBookDetails={(book) => setSelectedBookForModal(book)}
          />
        )}

        {currentTab === 'etudiant' && <StudentPortal />}

        {currentTab === 'abonnements' && (
          <SubscriptionView onSelectPlanToPay={handleSelectPlanToPay} />
        )}

        {currentTab === 'admin' && (
          <Suspense fallback={null}>
            <AdminDashboard />
          </Suspense>
        )}
      </main>

      {/* Modals */}
      <BookModal
        book={selectedBookForModal}
        onClose={() => setSelectedBookForModal(null)}
      />

      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Footer */}
      <Footer
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onResetDemo={currentUser?.role === 'super_admin' ? resetDemoData : undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <MainApp />
    </LibraryProvider>
  );
}
