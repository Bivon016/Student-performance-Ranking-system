import { API_BASE } from '../config';

/** Turn a stored logo path or legacy base64 value into a browser-ready image URL. */
export function resolveLogoUrl(logo) {
  if (!logo) return null;
  if (logo.startsWith('data:') || logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }
  if (logo.startsWith('/')) return `${API_BASE}${logo}`;
  return `${API_BASE}/${logo}`;
}
