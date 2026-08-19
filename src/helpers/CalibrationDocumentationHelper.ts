import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const SECRET = process.env.JWT_SECRET || 'fastpec-jwt-secret-key-2026';
const STORAGE_ROOT = path.resolve(process.cwd(), 'storage', 'calibration-docs');

export function ensureDirectoryExistence(filePath: string): void {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

export function getStorageRoot(): string {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
  return STORAGE_ROOT;
}

export function computeSha256Checksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function generateSignedPreviewUrl(req: Request | null, docId: string): string {
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours validity
  const payload = `${docId}:${expires}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

  let baseUrl = '';
  if (req) {
    const rawProto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
    const proto = rawProto.startsWith('http') ? rawProto : 'http';
    let host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3304';
    host = host.replace(/^https?:\/\//, '');
    baseUrl = `${proto}://${host}`;
  } else if (process.env.PUBLIC_CALIBRATION_BASE_URL) {
    baseUrl = process.env.PUBLIC_CALIBRATION_BASE_URL.replace(/\/+$/, '');
  }

  return `${baseUrl}/api/calibration-media/${docId}?expires=${expires}&signature=${signature}`;
}

export function verifyMediaSignature(docId: string, expiresStr: string, signature: string): boolean {
  if (!docId || !expiresStr || !signature) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) {
    return false;
  }

  const payload = `${docId}:${expires}`;
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch {
    return false;
  }
}
