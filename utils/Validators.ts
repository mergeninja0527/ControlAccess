/**
 * Validation utility functions
 */

/**
 * Validates email format using regex
 */
export const validateEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates full name format
 * - Minimum 3 characters
 * - Maximum 100 characters
 * - Only letters, spaces, and common name characters (á, é, í, ó, ú, ñ, etc.)
 */
export const validateNombre = (nombre: string): { valid: boolean; message?: string } => {
  if (!nombre || nombre.trim() === '') {
    return { valid: false, message: 'El nombre completo es requerido.' };
  }
  
  const trimmed = nombre.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, message: 'El nombre debe tener al menos 3 caracteres.' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, message: 'El nombre no puede exceder 100 caracteres.' };
  }
  
  // Allow letters (including accented), spaces, hyphens, and apostrophes
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  if (!nombreRegex.test(trimmed)) {
    return { valid: false, message: 'El nombre solo puede contener letras, espacios y guiones.' };
  }
  
  return { valid: true };
};

/**
 * Validates Chilean phone number format
 * - Must be exactly 9 digits
 * - Must start with 9 (mobile) or 2 (landline)
 */
export const validateTelefono = (telefono: string): { valid: boolean; message?: string } => {
  if (!telefono || telefono.trim() === '') {
    return { valid: false, message: 'El teléfono es requerido.' };
  }
  
  const trimmed = telefono.trim();
  
  if (trimmed.length !== 9) {
    return { valid: false, message: 'El teléfono debe tener 9 dígitos.' };
  }
  
  // Must be all digits
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, message: 'El teléfono solo puede contener números.' };
  }
  
  // Chilean phone format: starts with 9 (mobile) or 2 (landline)
  if (!/^[92]/.test(trimmed)) {
    return { valid: false, message: 'El teléfono debe comenzar con 9 (móvil) o 2 (fijo).' };
  }
  
  return { valid: true };
};

/**
 * Validates RUT format (basic structure check)
 * Checks if RUT has the correct format: numbers-dash-verification digit
 */
export const validateRutFormat = (rut: string): { valid: boolean; message?: string } => {
  if (!rut || rut.trim() === '') {
    return { valid: false, message: 'El RUT es requerido.' };
  }
  
  // Check if RUT contains a dash
  if (!rut.includes('-')) {
    return { valid: false, message: 'El RUT debe incluir un guión (ej: 12345678-9).' };
  }
  
  const parts = rut.split('-');
  if (parts.length !== 2) {
    return { valid: false, message: 'Formato de RUT inválido.' };
  }
  
  const [numbers, verifier] = parts;
  const cleanNumbers = numbers.replace(/\./g, '');
  
  // Check if numbers part is valid (at least 7 digits, max 8)
  if (!/^\d{7,8}$/.test(cleanNumbers)) {
    return { valid: false, message: 'El RUT debe tener entre 7 y 8 dígitos antes del guión.' };
  }
  
  // Check if verifier is valid (single digit or 'k')
  if (!/^[\dkK]$/.test(verifier)) {
    return { valid: false, message: 'El dígito verificador debe ser un número o la letra K.' };
  }
  
  return { valid: true };
};
