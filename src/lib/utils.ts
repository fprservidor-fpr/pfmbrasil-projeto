import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Abre um link externo de forma compatível tanto com o ambiente de preview do Orchids
 * quanto com o ambiente de produção (deploy).
 */
export function openExternalLink(url: string) {
  if (typeof window === "undefined") return;

  // Verifica se está dentro de um iframe
  const isIframe = window.self !== window.top;

  if (isIframe) {
    // No Orchids Preview, usamos postMessage para que o container abra o link
    window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
  } else {
    // Em produção/standalone, usamos window.open normalmente
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
