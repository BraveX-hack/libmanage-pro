import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2, Lock, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

/**
 * Liseuse : le PDF est demandé au serveur (qui vérifie le droit de lecture payé), puis dessiné page par page
 * sur un canevas. Aucun lien de téléchargement, aucun cache, impression masquée, filigrane au nom du lecteur.
 * Limite honnête : un navigateur ne peut pas empêcher une capture d'écran.
 */
export const ReaderModal: React.FC = () => {
  const { readerBookId, closeReader, books, readingAccesses, currentUser, addToast } = useLibrary();
  const book = books.find((b) => b.id === readerBookId) ?? null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [now, setNow] = useState(Date.now());

  const access = readingAccesses.find(
    (x) => x.bookId === readerBookId && x.userId === currentUser?.id && x.status === 'active' && new Date(x.expiresAt).getTime() > now
  );
  const isStaffPreview = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const storageKey = currentUser && readerBookId ? `reader:${currentUser.id}:${readerBookId}` : '';

  // Horloge : l'accès se termine à l'heure exacte, même en pleine lecture
  useEffect(() => {
    if (!readerBookId) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [readerBookId]);

  useEffect(() => {
    if (readerBookId && !isStaffPreview && !access && status === 'ready') {
      addToast('Votre accès à la lecture est terminé.', 'warning');
      closeReader();
    }
  }, [access, readerBookId, isStaffPreview, status, closeReader, addToast]);

  // Chargement du PDF (jamais mis en cache) : le serveur refuse si l'accès n'est pas payé ou a expiré
  useEffect(() => {
    if (!readerBookId) return;
    let cancelled = false;
    setStatus('loading');
    setError('');
    setPage(1);
    setZoom(1);
    pdfRef.current = null;

    (async () => {
      try {
        const res = await fetch(`/api/books/${encodeURIComponent(readerBookId)}/content`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!res.ok) {
          let msg = 'Impossible de charger ce livre.';
          try {
            msg = (await res.json()).error || msg;
          } catch {
            /* non JSON */
          }
          throw new Error(msg);
        }
        const data = new Uint8Array(await res.arrayBuffer());
        const pdfjs = await import('pdfjs-dist');
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        pdfRef.current = doc;
        setPageCount(doc.numPages);
        let start = 1;
        try {
          const saved = Number(localStorage.getItem(storageKey));
          if (Number.isInteger(saved) && saved >= 1 && saved <= doc.numPages) start = saved;
        } catch {
          /* stockage indisponible */
        }
        setPage(start);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message || 'Impossible de charger ce livre.');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      pdfRef.current?.destroy?.();
      pdfRef.current = null;
    };
  }, [readerBookId, storageKey]);

  const drawPage = useCallback(async () => {
    const doc = pdfRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!doc || !canvas || !wrap) return;
    try {
      renderTaskRef.current?.cancel?.();
      const pdfPage = await doc.getPage(page);
      const base = pdfPage.getViewport({ scale: 1 });
      const cssWidth = Math.min(wrap.clientWidth - 16, 900) * zoom;
      const scale = cssWidth / base.width;
      const dpr = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale: scale * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
      const ctx = canvas.getContext('2d')!;
      const task = pdfPage.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;

      // Filigrane dessiné DANS l'image : il suit toute capture d'écran
      const mark = `${currentUser?.name ?? ''} · ${currentUser?.studentCardNumber ?? currentUser?.email ?? ''}`;
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${Math.round(canvas.width / 28)}px sans-serif`;
      ctx.rotate(-Math.PI / 6);
      const stepY = Math.round(canvas.width / 5);
      const stepX = Math.round(ctx.measureText(mark).width + canvas.width / 10);
      for (let y = -canvas.width; y < canvas.height + canvas.width; y += stepY) {
        for (let x = -canvas.width; x < canvas.width * 1.5; x += stepX) ctx.fillText(mark, x, y);
      }
      ctx.restore();
    } catch (err) {
      if ((err as any)?.name !== 'RenderingCancelledException') {
        setError('Impossible d\'afficher cette page.');
        setStatus('error');
      }
    }
  }, [page, zoom, currentUser]);

  useEffect(() => {
    if (status === 'ready') drawPage();
  }, [status, drawPage]);

  useEffect(() => {
    if (status !== 'ready') return;
    const onResize = () => drawPage();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [status, drawPage]);

  const goTo = useCallback(
    (p: number) => {
      const next = Math.min(Math.max(1, p), pageCount || 1);
      setPage(next);
      try {
        if (storageKey) localStorage.setItem(storageKey, String(next));
      } catch {
        /* stockage indisponible */
      }
      wrapRef.current?.scrollTo({ top: 0 });
    },
    [pageCount, storageKey]
  );

  // Clavier : flèches pour tourner les pages ; enregistrer/imprimer neutralisés
  useEffect(() => {
    if (!readerBookId) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(page + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(page - 1);
      else if (e.key === 'Escape') closeReader();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readerBookId, page, goTo, closeReader]);

  if (!readerBookId || !book) return null;

  const msLeft = access ? new Date(access.expiresAt).getTime() - now : 0;
  const daysLeft = Math.floor(msLeft / 86400000);
  const hoursLeft = Math.floor((msLeft % 86400000) / 3600000);

  return (
    <div
      className="reader-root fixed inset-0 z-[60] bg-slate-900 flex flex-col select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`@media print { .reader-root { display: none !important; } }`}</style>

      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-950 text-white border-b border-slate-800">
        <div className="min-w-0">
          <div className="font-serif font-bold text-sm truncate">{book.title}</div>
          <div className="text-[11px] text-slate-400 truncate">{book.author}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {access ? (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              Accès : encore {daysLeft > 0 ? `${daysLeft} j ` : ''}
              {hoursLeft} h
            </span>
          ) : (
            isStaffPreview && <span className="text-[11px] text-sky-300 font-semibold">Aperçu administrateur</span>
          )}
          <button
            onClick={closeReader}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Fermer la lecture"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={wrapRef} className="flex-1 overflow-auto bg-slate-800 p-2 flex justify-center items-start">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-slate-300 mt-24">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Ouverture du livre…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-24 max-w-sm text-center text-slate-200">
            <Lock className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <p className="text-sm">{error}</p>
            <button onClick={closeReader} className="mt-4 px-4 py-2 text-xs font-semibold bg-white text-slate-900 rounded-lg">
              Fermer
            </button>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`bg-white shadow-2xl pointer-events-none ${status === 'ready' ? '' : 'hidden'}`}
          draggable={false}
        />
      </div>

      {status === 'ready' && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-950 text-white border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} className="p-2 rounded-lg hover:bg-slate-800" aria-label="Réduire">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(1)))} className="p-2 rounded-lg hover:bg-slate-800" aria-label="Agrandir">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => goTo(page - 1)} disabled={page <= 1} className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-30" aria-label="Page précédente">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono tabular-nums">
              Page {page} / {pageCount}
            </span>
            <button onClick={() => goTo(page + 1)} disabled={page >= pageCount} className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-30" aria-label="Page suivante">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <span className="hidden md:block text-[11px] text-slate-500">Lecture seule — téléchargement et impression désactivés</span>
        </div>
      )}
    </div>
  );
};
