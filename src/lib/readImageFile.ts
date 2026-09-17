const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif)$/i;

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSION_PATTERN.test(file.name);
}

export async function readImageFile(file: File): Promise<string | null> {
  if (!isImageFile(file)) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
