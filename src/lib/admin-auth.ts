/* Shared Super Admin demo credentials — used by the admin gate AND the regular
   login form (typing these anywhere signs into the backoffice). */
export const ADMIN_EMAIL = "super@globexchange.co.uk";
export const ADMIN_PASSWORD = "Super@2026";

export function isAdminCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}
