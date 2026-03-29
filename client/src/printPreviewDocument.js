import previewHtml from "../print-preview.html?raw";
import previewCss from "../print-preview.css?raw";

const previewStylesheetPattern = /<link rel="stylesheet" href="print-preview\.css">\s*/i;
const inlinePreviewStyles = `<style>${previewCss}</style>\n`;
const previewBodyPattern = /<\/body>/i;

export const PRINT_PREVIEW_DOCUMENT = previewStylesheetPattern.test(previewHtml)
  ? previewHtml.replace(previewStylesheetPattern, inlinePreviewStyles)
  : previewHtml;

const serializePreviewData = (previewData) =>
  JSON.stringify(previewData)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export function buildPrintPreviewDocument(previewData) {
  if (!previewData) return PRINT_PREVIEW_DOCUMENT;

  const bootScript = `<script>window.__AUDIT_PREVIEW__=${serializePreviewData(previewData)};window.dispatchEvent(new Event("audit-preview-ready"));</script>\n`;
  return previewBodyPattern.test(PRINT_PREVIEW_DOCUMENT)
    ? PRINT_PREVIEW_DOCUMENT.replace(previewBodyPattern, `${bootScript}</body>`)
    : `${PRINT_PREVIEW_DOCUMENT}\n${bootScript}`;
}
