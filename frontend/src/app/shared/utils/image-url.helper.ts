import { environment } from '../../../environment';

/**
 * Helper utility to convert relative image URLs to absolute backend URLs
 * Fixes 404 errors when images are stored on backend but referenced from frontend
 */
export class ImageUrlHelper {
  
  /**
   * Convert a relative or absolute URL to a full backend URL
   * @param url - The image URL (can be relative or absolute)
   * @param fallback - Fallback image if URL is invalid (default: placeholder)
   * @returns Full absolute URL pointing to backend
   */
  static toAbsoluteUrl(url: string | undefined | null, fallback: string = '/assets/images/placeholder.png'): string {
    // Handle null/undefined
    if (!url) {
      return this.getBackendUrl(fallback);
    }

    // Already absolute HTTP/HTTPS URL - return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Relative URL starting with /uploads/ or uploads/
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      const backendHost = environment.apiUrl.replace('/api', '');
      const cleanPath = url.startsWith('/') ? url : '/' + url;
      return backendHost + cleanPath;
    }

    // Assets path (frontend static files)
    if (url.startsWith('/assets/') || url.startsWith('assets/')) {
      // These should be served from frontend, ensure leading slash
      return url.startsWith('/') ? url : '/' + url;
    }

    // Default: treat as backend upload path
    const backendHost = environment.apiUrl.replace('/api', '');
    const cleanPath = url.startsWith('/') ? url : '/' + url;
    return backendHost + cleanPath;
  }

  /**
   * Get backend base URL without /api suffix
   */
  static getBackendUrl(path: string = ''): string {
    const backendHost = environment.apiUrl.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return backendHost + cleanPath;
  }

  /**
   * Convert array of image objects to absolute URLs
   */
  static toAbsoluteUrls(images: Array<{ url: string } | string> | undefined): string[] {
    if (!images || images.length === 0) {
      return [this.toAbsoluteUrl(null)];
    }

    return images.map(img => {
      const url = typeof img === 'string' ? img : img.url;
      return this.toAbsoluteUrl(url);
    });
  }
}
