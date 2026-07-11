// DEPENDENCIES
const fs = require("fs/promises");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

// SUPPORTED FILE TYPES
const PDF_MIME_TYPE = "application/pdf";

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extracts plain text from a PDF file.
 *
 * @param {string} filePath - Path to the uploaded PDF.
 * @returns {Promise<string>} Extracted plain text.
 */
async function extractPdfText(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    // pdf-parse recommends destroying the parser to release memory.
    await parser.destroy();
  }
}

/**
 * Extracts plain text from a DOCX file.
 *
 * @param {string} filePath - Path to the uploaded DOCX file.
 * @returns {Promise<string>} Extracted plain text.
 */
async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({
    path: filePath,
  });

  return result.value.trim();
}

/**
 * Extracts résumé text based on MIME type.
 *
 * @param {string} filePath - Path to the uploaded résumé.
 * @param {string} mimeType - MIME type supplied by Multer.
 * @returns {Promise<string>} Extracted plain text.
 */
async function extractResumeText(filePath, mimeType) {
  if (!filePath) {
    throw new Error("A résumé file path is required.");
  }

  const extension = path.extname(filePath).toLowerCase();

  if (mimeType === PDF_MIME_TYPE || extension === ".pdf") {
    return extractPdfText(filePath);
  }

  if (
    mimeType === DOCX_MIME_TYPE ||
    extension === ".docx"
  ) {
    return extractDocxText(filePath);
  }

  throw new Error(
    `Unsupported résumé type: ${mimeType || extension || "unknown"}`
  );
}

module.exports = {
  extractResumeText,
};