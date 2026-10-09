import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { X, Lock, Mail, User, BookOpen, ShieldCheck, Calendar, IdCard, School } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginUser, registerUser, resendVerificationEmail } = useLibrary();
  // Adresse à laquelle le lien de vérification vient d'être envoyé (affiche l'écran « vérifiez votre boîte mail »)
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state (Requested: Nom, Prénom, Email, Licence, Filière, École, ID Carte d'identité, Date de naissance, Mot de passe)
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Licence 2');
  const [filiere, setFiliere] = useState('IRTG');
  const [customFiliere, setCustomFiliere] = useState('');
  const [school, setSchool] = useState('ESGIS — École Supérieure de Gestion, d\'Informatique et des Sciences');
  const [nationalIdCard, setNationalIdCard] = useState('');
  const [birthDate, setBirthDate] = useState('2003-05-14');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await loginUser(email, password);
      if (success) {
        setPassword('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!lastName.trim() || !firstName.trim() || !regEmail.trim()) return;

    const effectiveFiliere = filiere === 'Autre' ? (customFiliere.trim() || 'Filière Spécialisée') : filiere;

    setIsSubmitting(true);
    let success = false;
    try {
      success = await registerUser({
      lastName,
      firstName,
      email: regEmail,
      school,
      nationalIdCard: nationalIdCard || 'CIP-' + Math.floor(1000000000 + Math.random() * 9000000000),
      birthDate,
      academicLevel,
      filiere: effectiveFiliere,
      password: regPassword,
    });
    } finally {
      setIsSubmitting(false);
    }

    if (success) {
      setRegPassword('');
      setSentTo(regEmail.trim().toLowerCase());
    }
  };

  const handleResend = async () => {
    if (!sentTo || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await resendVerificationEmail(sentTo);
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleButton = (
    <>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <div className="flex-1 border-t border-slate-200" />
        <span>ou</span>
        <div className="flex-1 border-t border-slate-200" />
      </div>
      <a
        href="/api/auth/google"
        className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        Continuer avec Google
      </a>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-slate-900 text-base sm:text-lg">
                {mode === 'login' ? 'Connexion Lecteur & Administration' : 'Inscription Étudiant — 2GroupESGIS'}
              </h2>
              <p className="text-[11px] text-slate-500">Bibliothèque Universitaire ESGIS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4 flex border-b border-slate-200">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Se Connecter
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Créer un Compte (Étudiant)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="wottoprecieux@gmail.com ou etudiant@esgis.org"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mot de Passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shadow-xs"
              >
                Connexion Sécurisée
              </button>
              {googleButton}
            </form>
          ) : sentTo ? (
            <div className="space-y-4 text-xs text-center">
              <Mail className="w-10 h-10 mx-auto text-amber-600" />
              <h3 className="font-serif font-bold text-slate-900 text-base">Vérifiez votre boîte mail</h3>
              <p className="text-slate-600 leading-relaxed">
                Un lien de confirmation a été envoyé à <strong>{sentTo}</strong>. Cliquez dessus pour activer votre compte
                (valable 24 h). Pensez à regarder dans vos courriers indésirables.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isSubmitting}
                className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl transition-colors"
              >
                Renvoyer l'e-mail
              </button>
              <button
                type="button"
                onClick={() => {
                  setSentTo(null);
                  setMode('login');
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shadow-xs"
              >
                J'ai confirmé mon e-mail : me connecter
              </button>
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline underline-offset-2"
              >
                Adresse incorrecte ? Modifier l'inscription
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: WOTTO"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prénom(s) *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Précieux"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="votre.nom@esgis.org"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date de Naissance *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    N° Carte d'Identité / CIP / Passeport *
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={nationalIdCard}
                      onChange={(e) => setNationalIdCard(e.target.value)}
                      placeholder="Ex: 019284758291"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Cycle / Licence & Filière */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cycle / Licence *
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Licence 1">Licence 1 (L1)</option>
                    <option value="Licence 2">Licence 2 (L2)</option>
                    <option value="Licence 3">Licence 3 (L3)</option>
                    <option value="Master 1">Master 1 (M1)</option>
                    <option value="Master 2">Master 2 (M2)</option>
                    <option value="Doctorat">Doctorat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Filière / Spécialité *
                  </label>
                  <select
                    value={filiere}
                    onChange={(e) => setFiliere(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="IRTG">IRTG (Informatique & Réseaux)</option>
                    <option value="GL">GL (Génie Logiciel)</option>
                    <option value="RIT">RIT (Réseaux & Télécoms)</option>
                    <option value="IG">IG (Informatique de Gestion)</option>
                    <option value="SE">SE (Systèmes Embarqués & IoT)</option>
                    <option value="SEG">SEG (Sciences Éco & Gestion)</option>
                    <option value="FBA">FBA (Finance, Banque & Assurance)</option>
                    <option value="MCD">MCD (Marketing & Communication)</option>
                    <option value="Droit">Droit des Affaires</option>
                    <option value="Autre">Autre filière...</option>
                  </select>
                </div>
              </div>

              {filiere === 'Autre' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Précisez votre filière spécifique *
                  </label>
                  <input
                    type="text"
                    required
                    value={customFiliere}
                    onChange={(e) => setCustomFiliere(e.target.value)}
                    placeholder="Ex: Cybersécurité, Bio-informatique, Audit, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">École / Université *</label>
                <div className="relative">
                  <School className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="ESGIS — École Supérieure de Gestion, d'Informatique et des Sciences">
                      ESGIS (École Supérieure de Gestion, d'Informatique et des Sciences)
                    </option>
                    <option value="ESGIS — Filière Génie Logiciel & Réseaux">
                      ESGIS — Filière Génie Logiciel & Réseaux
                    </option>
                    <option value="ESGIS — Sciences Économiques & Gestion">
                      ESGIS — Sciences Économiques & Gestion
                    </option>
                    <option value="Autre Établissement Universitaire Partenaire">
                      Autre Établissement Partenaire
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mot de Passe Secret *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 8 caractères" minLength={8}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  Valider l'Inscription & Générer ma Carte
                </button>
              </div>

              {googleButton}

              <p className="text-[10px] text-slate-400 text-center">
                Un e-mail de confirmation vous sera envoyé : votre carte d'étudiant numérique 2GroupESGIS est attribuée dès que vous avez cliqué sur le lien.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
