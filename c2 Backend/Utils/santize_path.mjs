import path from "path";

function getSafeUploadPath(userDir, BASE_UPLOAD_DIR='') {
  const sanitized = userDir.replace(/[^a-zA-Z0-9_\-/]/g, ''); // solo letras, números, guiones
  const targetPath = path.join(BASE_UPLOAD_DIR, sanitized);
  const normalized = path.normalize(targetPath);

  
  // Verifica que esté dentro del directorio base
  if (!normalized.startsWith(path.normalize(BASE_UPLOAD_DIR))) {
    throw new Error('Invalid destination path');
  }

  return normalized;
}

const sanitizeFilename = (input) => {
  // Solo letras, números, guiones, puntos y guion bajo. Máximo 100 caracteres.
  return input.replace(/[^a-zA-Z0-9._-]/g, '').substring(0, 100);
};


export { getSafeUploadPath, sanitizeFilename }