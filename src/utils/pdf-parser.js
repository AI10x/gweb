import * as pdfjs from 'pdfjs-dist';

// Use jsdelivr CDN for the worker - consistent with version 4.x
if (typeof window !== 'undefined') {
    const v = pdfjs.version || '4.10.38';
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${v}/build/pdf.worker.min.mjs`;
    console.log(`PDF.js worker source set to: ${pdfjs.GlobalWorkerOptions.workerSrc}`);
}

/**
 * Extracts text content from a PDF file.
 * @param {ArrayBuffer} arrayBuffer The PDF file content as an ArrayBuffer.
 * @returns {Promise<string>} The extracted text.
 */
export const extractTextFromPDF = async (arrayBuffer) => {
    console.log("extractTextFromPDF: starting parsing", arrayBuffer.byteLength, "bytes");

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Invalid PDF data: ArrayBuffer is empty");
    }

    try {
        const loadingTask = pdfjs.getDocument({
            data: arrayBuffer,
            useWorkerFetch: true,
            isEvalSupported: false,
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF successfully loaded: ${pdf.numPages} pages`);

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`Extracting text from page ${i}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => item.str)
                .join(' ');

            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }

        const trimmedText = fullText.trim();
        if (!trimmedText) {
            console.warn("PDF extraction returned empty text. PDF might be scanned/image-based.");
            return "Note: This PDF appears to contain no selectable text (it might be a scanned image).";
        }

        console.log(`Extraction complete. Total characters: ${trimmedText.length}`);
        return trimmedText;
    } catch (error) {
        console.error('CRITICAL: Error in extractTextFromPDF:', error);
        throw error;
    }
};
