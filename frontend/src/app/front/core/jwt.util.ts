/**
 * JWT Utility Service
 * Decodes JWT tokens (without verification - for client-side use only)
 * and extracts user information for quick redirection
 */
export class JwtUtil {
  /**
   * Decode a JWT token and return the payload
   * Note: This is client-side decoding only - does NOT verify the signature
   * Signature verification happens on the backend
   */
  static decodeToken(token: string): any {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return null;
      }

      // Decode the payload (base64url)
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Extract role from JWT token
   * Backend stores role in the 'roles' array or 'role' field
   */
  static extractRole(token: string): string | null {
    const decoded = this.decodeToken(token);
    if (!decoded) return null;

    // Try 'roles' array first (Spring Security typically uses this)
    if (decoded.roles && Array.isArray(decoded.roles) && decoded.roles.length > 0) {
      let role = decoded.roles[0]; // Return first role
      // Strip 'ROLE_' prefix if present (Spring Security adds this)
      if (role.startsWith('ROLE_')) {
        role = role.substring(5);
      }
      return role;
    }

    // Fallback to 'role' field
    if (decoded.role) {
      let role = decoded.role;
      // Strip 'ROLE_' prefix if present
      if (role.startsWith('ROLE_')) {
        role = role.substring(5);
      }
      return role;
    }

    return null;
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    // exp is in seconds, convert to milliseconds
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return false;

    return new Date() > expiration;
  }
}
