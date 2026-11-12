/**
 * Utilitário de compressão e otimização de imagens no cliente (Browser)
 * Converte qualquer imagem (JPG, PNG, WebP) em WebP ultra-leve com corte quadrado
 * otimizado para foto de perfil (reduz fotos de 2MB-10MB para ~20KB).
 */
export async function compressAvatarToWebP(
  file: File,
  targetSize: number = 280,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("O arquivo selecionado não é uma imagem válida."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Não foi possível inicializar o renderizador de imagem."));
          return;
        }

        // Calcula corte quadrado centralizado (Center Crop) para manter a foto sem distorção
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        const minSide = Math.min(naturalWidth, naturalHeight);

        const sourceX = (naturalWidth - minSide) / 2;
        const sourceY = (naturalHeight - minSide) / 2;

        canvas.width = targetSize;
        canvas.height = targetSize;

        // Renderização suave de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Desenha o quadrado central da foto original reescalado para targetSize x targetSize
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          minSide,
          minSide,
          0,
          0,
          targetSize,
          targetSize
        );

        // Exporta primeiramente em formato WebP moderno
        let compressedBase64 = canvas.toDataURL("image/webp", quality);

        // Fallback defensivo para JPEG caso o navegador não suporte exportação WebP
        if (!compressedBase64.startsWith("data:image/webp")) {
          compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Falha ao carregar a imagem para processamento."));
    };

    img.src = objectUrl;
  });
}

