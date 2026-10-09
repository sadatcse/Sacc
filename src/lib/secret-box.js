// Encrypts small secrets (e.g. the SMTP password) before they are stored in MongoDB.
// AES-256-GCM with a key derived from JWT_SECRET — if JWT_SECRET changes, stored secrets must be re-entered.
import crypto from 'node:crypto';

function key() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required to encrypt settings.');
  return crypto.createHash('sha256').update(`${process.env.JWT_SECRET}:settings-secret`).digest();
}

// "v1:<iv>:<tag>:<ciphertext>" (base64 parts)
export function encryptSecret(plain) {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

// Returns '' when the value is missing or can't be decrypted (e.g. JWT_SECRET changed)
export function decryptSecret(stored) {
  if (!stored || !String(stored).startsWith('v1:')) return '';
  try {
    const [, iv, tag, data] = String(stored).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}
