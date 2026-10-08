/**
 * Prépare une photo de livre avant envoi : redimensionnée (800 px max) et compressée en JPEG
 * pour rester légère (quelques centaines de Ko) quelle que soit la photo prise avec le téléphone.
 */
export const compressImageToDataUrl = (file: File, maxSize = 800, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      reject(new Error('Format non pris en charge (JPEG, PNG ou WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Ce fichier n'est pas une image valide."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Traitement de l\'image impossible.'));
          return;
        }
        ctx.fillStyle = '#ffffff'; // fond blanc pour les PNG transparents
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
