export async function readImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
