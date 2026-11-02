/**
 * Utilitaire de compression d'images via HTML5 Canvas
 * Réduit le poids des photos d'étiquettes/BL avant stockage IndexedDB
 */

export class ImageCompressor {
  /**
   * Compresse un fichier image File/Blob en base64 JPEG
   * @param {File} file 
   * @param {number} maxWidth 
   * @param {number} quality (0 to 1)
   * @returns {Promise<string>}
   */
  static compress(file, maxWidth = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const ratio = Math.min(1, maxWidth / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
}
