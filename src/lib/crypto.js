export function bytesToBase64(bytes) {
  let binary = '';
  const view = new Uint8Array(bytes);
  view.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function deriveEncryptionKey(passphrase, coupleId) {
  const encoder = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`moodsync:${coupleId}`),
      iterations: 250000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptFileForCouple(file, coupleId, passphrase) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(passphrase, coupleId);
  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, await file.arrayBuffer());
  return {
    blob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    iv: bytesToBase64(iv),
    mimeType: file.type || 'image/jpeg',
  };
}

export async function decryptSignedUrlToObjectUrl(signedUrl, coupleId, passphrase, ivBase64, mimeType = 'image/jpeg') {
  if (!signedUrl || !coupleId || !passphrase || !ivBase64) return null;
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error('Šifrovaný soubor se nepodařilo stáhnout.');
  const encryptedBuffer = await response.arrayBuffer();
  const key = await deriveEncryptionKey(passphrase, coupleId);
  const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(ivBase64) }, key, encryptedBuffer);
  return URL.createObjectURL(new Blob([decryptedBuffer], { type: mimeType || 'image/jpeg' }));
}

