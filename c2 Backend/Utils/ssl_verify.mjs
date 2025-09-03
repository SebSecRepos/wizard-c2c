import crypto from "crypto";

function validateCertAndKey(cert, key) {
  try {
    crypto.createPrivateKey(key);
    crypto.createPublicKey(cert);
    return true;
  } catch (err) {
    console.error("Certificado o clave inválidos:", err.message);
    return false;
  }
}

function isValidPEM(pem, type) {
  const regex = {
    cert: /-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/g,
    key: /-----BEGIN (RSA )?PRIVATE KEY-----[\s\S]+-----END (RSA )?PRIVATE KEY-----/g
  };
  return regex[type].test(pem);
}

export { validateCertAndKey, isValidPEM };