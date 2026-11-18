import { describe, expect, it } from "vitest";
import {
  buildCitizenDocumentStoragePath,
  isStoragePathOwnedByUser,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  sanitizeStorageFileName,
  validateCitizenDocumentFile,
} from "@/infrastructure/storage/citizen-documents";

describe("Phase 2 — Citizen Document Storage Path & File Validation", () => {
  const userA = "11111111-1111-4111-8111-111111111111";
  const userB = "22222222-2222-4222-8222-222222222222";
  const docId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  it("builds sanitized user-scoped storage paths and blocks path traversal", () => {
    expect(sanitizeStorageFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeStorageFileName("Income Certificate (2026)!.pdf")).toBe(
      "Income_Certificate_2026_.pdf"
    );

    const path = buildCitizenDocumentStoragePath({
      userId: userA,
      documentId: docId,
      fileName: "income_certificate.pdf",
    });

    expect(path).toBe(`${userA}/${docId}/income_certificate.pdf`);
    expect(isStoragePathOwnedByUser(path, userA)).toBe(true);
    expect(isStoragePathOwnedByUser(path, userB)).toBe(false);
    expect(
      isStoragePathOwnedByUser(`${userA}/../${userB}/${docId}/file.pdf`, userA)
    ).toBe(false);
  });

  it("validates file size, allowed MIME types, and magic byte signatures", () => {
    // Valid PDF (%PDF)
    const pdfMagic = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    expect(
      validateCitizenDocumentFile({
        fileName: "cert.pdf",
        mimeType: "application/pdf",
        sizeBytes: 250_000,
        headerBytes: pdfMagic,
      })
    ).toEqual({ valid: true });

    // Valid PNG
    const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(
      validateCitizenDocumentFile({
        fileName: "scan.png",
        mimeType: "image/png",
        sizeBytes: 500_000,
        headerBytes: pngMagic,
      })
    ).toEqual({ valid: true });

    // Reject oversized file (> 10 MB)
    expect(
      validateCitizenDocumentFile({
        fileName: "huge.pdf",
        mimeType: "application/pdf",
        sizeBytes: MAX_DOCUMENT_FILE_SIZE_BYTES + 1,
        headerBytes: pdfMagic,
      }).valid
    ).toBe(false);

    // Reject disallowed MIME type
    expect(
      validateCitizenDocumentFile({
        fileName: "script.html",
        mimeType: "text/html",
        sizeBytes: 1024,
      }).valid
    ).toBe(false);

    // Reject spoofed file extension/MIME where magic bytes do not match PDF
    const fakePdfBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // EXE header MZ
    const spoofResult = validateCitizenDocumentFile({
      fileName: "disguised.pdf",
      mimeType: "application/pdf",
      sizeBytes: 4096,
      headerBytes: fakePdfBytes,
    });
    expect(spoofResult.valid).toBe(false);
    expect(spoofResult.error).toMatch(/signature does not match/i);
  });
});
