// Keep phone photos within the API's 5 MB image limit, including large native captures.
const MAX_SIDE = 1600;

export function capturePhoto(video: HTMLVideoElement, mirrored: boolean): string {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) throw new Error('Aguarde a câmera ficar pronta.');
  // Preserve the whole sensor image; the user chooses the crop in PhotoEditor.
  const cropWidth = video.videoWidth;
  const cropHeight = video.videoHeight;
  const scale = Math.min(1, MAX_SIDE / Math.max(cropWidth, cropHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cropWidth * scale);
  canvas.height = Math.round(cropHeight * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível preparar a foto.');
  if (mirrored) { context.translate(canvas.width, 0); context.scale(-1, 1); }
  context.drawImage(video, (video.videoWidth - cropWidth) / 2, (video.videoHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function photoFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) throw new Error('Escolha uma foto de até 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a foto.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    throw new Error('Não foi possível abrir essa foto. Tente uma imagem JPEG, PNG ou WebP.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
