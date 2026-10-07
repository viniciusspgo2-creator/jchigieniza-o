/**
 * Redimensiona/comprime imagens NO NAVEGADOR antes do upload.
 * Motivo: funções serverless da Vercel rejeitam corpo de requisição > 4,5MB
 * (erro 413 antes de chegar na rota). Fotos de celular facilmente passam disso.
 * Se algo falhar, devolve o arquivo original (o servidor valida de qualquer forma).
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  try {
    if (!file.type.startsWith('image/')) return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') {
      const jpeg: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
      if (!jpeg || jpeg.size >= file.size) return file;
      return new File([jpeg], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    }
    if (blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}
