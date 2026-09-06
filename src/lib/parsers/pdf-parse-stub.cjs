/** Stub for GitHub Pages static export — PDF extraction is Node-only. */
module.exports = async function pdfParse() {
  return { text: '' };
};

module.exports.PDFParse = class PDFParse {
  async getText() {
    return { text: '' };
  }
};
