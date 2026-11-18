import { z } from "zod";

export const CITIZEN_DOCUMENTS_BUCKET = "citizen-documents";

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type AllowedDocumentMimeType =
  (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

const UuidSchema = z.string().uuid();

/**
 * Sanitizes a user-supplied filename to prevent path traversal or unsafe characters.
 */
export function sanitizeStorageFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() ?? "document";
  const cleaned = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/\.+/g, ".")
    .replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned.slice(0, 120) : "document";
}

/**
 * Builds a user-scoped storage object path matching the Supabase Storage RLS policy:
 * `{userId}/{documentId}/{sanitizedFileName}`
 */
export function buildCitizenDocumentStoragePath(params: {
  userId: string;
  documentId: string;
  fileName: string;
}): string {
  const userId = UuidSchema.parse(params.userId);
  const documentId = UuidSchema.parse(params.documentId);
  const safeName = sanitizeStorageFileName(params.fileName);

  return `${userId}/${documentId}/${safeName}`;
}

/**
 * Verifies that a storage object path belongs to the expected authenticated user ID
 * and contains no path traversal segments.
 */
export function isStoragePathOwnedByUser(
  storagePath: string,
  authenticatedUserId: string
): boolean {
  if (!UuidSchema.safeParse(authenticatedUserId).success) {
    return false;
  }
  if (!storagePath || storagePath.includes("..") || storagePath.startsWith("/")) {
    return false;
  }
  const segments = storagePath.split("/");
  if (segments.length < 3) {
    return false;
  }
  const [folderUserId, folderDocId, ...rest] = segments;
  if (folderUserId !== authenticatedUserId) {
    return false;
  }
  if (!UuidSchema.safeParse(folderDocId).success) {
    return false;
  }
  return rest.join("/").trim().length > 0;
}

/**
 * Validates file size, declared MIME type, and file header magic bytes.
 */
export interface FileValidationInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  headerBytes?: Uint8Array;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCitizenDocumentFile(
  input: FileValidationInput
): FileValidationResult {
  if (input.sizeBytes <= 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }

  if (input.sizeBytes > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${
        MAX_DOCUMENT_FILE_SIZE_BYTES / (1024 * 1024)
      } MB.`,
    };
  }

  const normalizedMime = input.mimeType.toLowerCase();
  if (
    !ALLOWED_DOCUMENT_MIME_TYPES.includes(
      normalizedMime as AllowedDocumentMimeType
    )
  ) {
    return {
      valid: false,
      error: `Unsupported file type "${input.mimeType}". Allowed formats: PDF, JPG, JPEG, PNG, WEBP.`,
    };
  }

  if (input.headerBytes && input.headerBytes.length >= 4) {
    const b = input.headerBytes;
    const isPdf =
      b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
    const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const isPng =
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    const isWebp =
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50;

    const matchesDeclared =
      (normalizedMime === "application/pdf" && isPdf) ||
      ((normalizedMime === "image/jpeg" || normalizedMime === "image/jpg") &&
        isJpeg) ||
      (normalizedMime === "image/png" && isPng) ||
      (normalizedMime === "image/webp" && isWebp);

    if (!matchesDeclared) {
      return {
        valid: false,
        error:
          "File content signature does not match the declared file format.",
      };
    }
  }

  return { valid: true };
}
