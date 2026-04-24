import { environment } from '../../../environment';

/**
 * Helper utility to resolve image URLs.
 * Cloudinary URLs are already absolute HTTPS — returned as-is.
 * Legacy local /uploads/ paths are prefixed with the backend host for backward compat.
 */
export class ImageUrlHelper {

  static toAbsoluteUrl(url: string | undefined | null, fallback = '/assets/images/placeholder.png'): string {
    if (!url) return fallback;

    // Already absolute (Cloudinary, Unsplash, etc.)
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    // Legacy local upload path — prefix with backend host
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      const host = environment.apiUrl.replace('/api', '');
      return host + (url.startsWith('/') ? url : '/' + url);
    }

    // Frontend asset
    if (url.startsWith('/assets/') || url.startsWith('assets/')) {
      return url.startsWith('/') ? url : '/' + url;
    }

    // Fallback: treat as backend path
    const host = environment.apiUrl.replace('/api', '');
    return host + (url.startsWith('/') ? url : '/' + url);
  }

  static getBackendUrl(path = ''): string {
    const host = environment.apiUrl.replace('/api', '');
    return host + (path.startsWith('/') ? path : '/' + path);
  }

  static toAbsoluteUrls(images: Array<{ url: string } | string> | undefined): string[] {
    if (!images || images.length === 0) return [this.toAbsoluteUrl(null)];
    return images.map(img => this.toAbsoluteUrl(typeof img === 'string' ? img : img.url));
  }
}
