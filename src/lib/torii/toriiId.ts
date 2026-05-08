export function gerarToriiId(userId?: string | null): string {
  if (!userId) {
    return "TN-······";
  }

  // FNV-1a 32-bit (sincrono, simples, sem dependencias)
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    // hash *= 16777619 (com overflow 32-bit)
    hash = Math.imul(hash, 0x01000193);
  }

  // 6 chars estaveis, base36 uppercase, sempre preenchido
  const code = (hash >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `TN-${code}`;
}
