// ============================================
// FORMATTERS
// ============================================

export function formatPrix(prix: number): string {
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0
  }).format(prix || 0);
}

export function formatDate(date: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateLong(date: string | Date): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatHeure(date: Date): string {
  if (!date) return '—';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// ============================================
// VALIDATIONS
// ============================================

/**
 * Vérifie qu'une URL commence par http:// ou https://
 */
export function isValidUrl(value: string): boolean {
  if (!value?.trim()) return true; 
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Vérifie un numéro de téléphone Madagascar
 * Format attendu : +261 32 00 000 00
 */
export function isValidPhoneMG(value: string): boolean {
  if (!value?.trim()) return true;
  return /^\+261\s(32|33|34|38)\s\d{2}\s\d{3}\s\d{2}$/.test(value);
}

/**
 * Vérifie un handle réseau social
 * Autorisé : lettres, chiffres, points, tirets, underscores
 * Interdit  : @, espaces, http, slashes
 */
export function isValidSocialHandle(value: string): boolean {
  if (!value?.trim()) return true;
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

/**
 * Nettoie un handle : retire @ et espaces en début/fin
 */
export function cleanSocialHandle(value: string): string {
  if (!value) return '';
  return value.replace(/^@+/, '').trim();
}

/**
 * Vérifie un email basique
 */
export function isValidEmail(value: string): boolean {
  if (!value?.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}