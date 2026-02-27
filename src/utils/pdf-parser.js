import * as pdfjs from 'pdfjs-dist';

// Set worker source for pdf.js
// In a Gatsby/Webpack environment, we might need to handle this differently
// but usually this works if the package is installed.
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

/**
 * Extracts text content from a PDF file.
 * @param {ArrayBuffer} arrayBuffer The PDF file content as an ArrayBuffer.
 * @returns {Promise<string>} The extracted text.
 */
export const extractTextFromPDF = async (arrayBuffer) => {
    try {
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => item.str)
                .join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to parse PDF file');
    }
};
