export const evaluatePasswordStrength = (password) => {
  let score = 0;
  if (!password) return '';

  // Longitud mayor a 6
  if (password.length >= 6) score += 1;
  // Longitud mayor a 8
  if (password.length >= 8) score += 1;
  // Contiene una letra mayúscula
  if (/[A-Z]/.test(password)) score += 1;
  // Contiene un número
  if (/[0-9]/.test(password)) score += 1;
  // Contiene un carácter especial
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { label: 'Débil', color: '#ff4d4f' }; // Rojo
  if (score <= 4) return { label: 'Regular', color: '#faad14' }; // Amarillo
  return { label: 'Fuerte', color: '#52c41a' }; // Verde
};