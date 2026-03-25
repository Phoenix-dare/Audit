import previewHtml from "../print-preview.html?raw";
import previewCss from "../print-preview.css?raw";

const previewStylesheetPattern = /<link rel="stylesheet" href="print-preview\.css">\s*/i;
const inlinePreviewStyles = `<style>${previewCss}</style>\n`;

export const PRINT_PREVIEW_DOCUMENT = previewStylesheetPattern.test(previewHtml)
  ? previewHtml.replace(previewStylesheetPattern, inlinePreviewStyles)
  : previewHtml;
