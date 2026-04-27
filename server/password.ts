import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(plainText: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainText, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plainText: string, encoded: string): boolean {
  const [salt, storedHash] = encoded.split(":");
  if (!salt || !storedHash) return false;
  const hashBuffer = scryptSync(plainText, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (storedBuffer.length !== hashBuffer.length) return false;
  return timingSafeEqual(storedBuffer, hashBuffer);
}
