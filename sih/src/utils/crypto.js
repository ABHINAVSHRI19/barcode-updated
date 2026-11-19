/**
 * Pure JavaScript synchronous hash function.
 * Converts a string into a reliable 8-character hexadecimal fingerprint.
 * Any change in reading, status, shop name, or instrument type will alter the hash.
 */
export function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert 32-bit unsigned integer to hex and pad with zeros to 8 chars
  const hex = (hash >>> 0).toString(16).toUpperCase();
  return hex.padStart(8, '0').slice(0, 8);
}

/**
 * Generate a record's lock fingerprint string based on its core parameters.
 */
export function generateRecordPayload(record) {
  return `${record.id}|${record.shopName}|${record.instrumentType}|${record.reading}|${record.unit}|${record.reference}|${record.status}`;
}

export function generateRecordHash(record) {
  const payload = generateRecordPayload(record);
  return simpleHash(payload);
}

/**
 * Verify whether a record has been modified/tampered with since it was originally locked.
 */
export function verifyRecordTampering(record) {
  if (!record.originalHash) {
    return { isTampered: false, currentHash: '', originalHash: '' };
  }
  const currentHash = generateRecordHash(record);
  const isTampered = currentHash !== record.originalHash;
  return {
    isTampered,
    currentHash,
    originalHash: record.originalHash
  };
}
