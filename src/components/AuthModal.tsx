import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { X, Lock, Mail, User, BookOpen, ShieldCheck, Calendar, IdCard, School } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginUser, registerUser } = useLibrary();
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
      onClose();
    }
  };

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
            </form>
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

              <p className="text-[10px] text-slate-400 text-center">
                Une carte d'étudiant numérique unique sera immédiatement attribuée pour le groupe 2GroupESGIS.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
