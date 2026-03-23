
import { liberation_regular, liberation_bold } from "./fonts"

// Helper to add wrapped text without overflow and return updated yPos
// Automatically handles page breaks and respects margins.
function addWrappedText(doc, text, x, maxWidth, yPos, lineHeight = 6.5, margin = 10) {
    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach(line => {
        const pageHeight = doc.internal.pageSize.getHeight()
        if (yPos > pageHeight - margin) {
            doc.addPage()
            yPos = margin
        }
        doc.text(line, x, yPos, { maxWidth })
        yPos += lineHeight
    })
    return yPos
}

export async function generateChatPDF(messages) {
    if (typeof window === 'undefined') return;

    const { jsPDF } = require('jspdf');
    const html2canvas = require('html2canvas');

    // create document
    const doc = new jsPDF('p', 'mm', 'a3')
    
    // Register custom fonts
    doc.addFileToVFS('LiberationSans-Regular.ttf', liberation_regular)
    doc.addFileToVFS('LiberationSans-Bold.ttf', liberation_bold)
    doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal')
    doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold')
    
    // Set default font
    doc.setFont("LiberationSans", "normal")
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentIndent = 0
    let yPos = margin
    const usableWidth = pageWidth - margin * 2 - contentIndent

    // Header
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59) // slate-800
    doc.setFont("LiberationSans", "bold")
    doc.text("AI10x Business Strategy Report", margin, yPos)

    yPos += 10
    doc.setFontSize(12)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.setFont("LiberationSans", "normal")
    doc.text("Lean Startup Strategy & Design Thinking Insights", margin, yPos)

    yPos += 8
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, yPos)

    // Divider
    yPos += 6
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 15

    const messageElements = document.querySelectorAll('.message')

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        const isUser = msg.sender === "user"
        const senderLabel = isUser ? "ENTREPRENEUR" : "AI10x STRATEGIST"

        // Check for page break before starting a new message
        if (yPos > pageHeight - 30) {
            doc.addPage()
            yPos = margin
        }

        // Message Header (Sender)
        doc.setFontSize(10)
        if (isUser) {
            doc.setTextColor(37, 99, 235) // blue-600
        } else {
            doc.setTextColor(15, 23, 42) // slate-900
        }
        doc.setFont("LiberationSans", "bold")
        doc.text(senderLabel, margin, yPos)
        yPos += 7

        // Message Background/Border or just Indent
        const segments = msg.text.split(/(```[\s\S]*?```|\n---\n|\n\*\*\*\n|\n___\n)/g)
        const restrictedWidth = usableWidth
        const flowchartContainers = Array.from(messageElements[i]?.querySelectorAll('.flowchart-container') || [])
        let flowchartIdx = 0

        for (const segment of segments) {
            if (!segment || !segment.trim()) continue

            if (segment.startsWith('```flowchart')) {
                const container = flowchartContainers[flowchartIdx++]
                if (container) {
                    try {
                        const canvas = await html2canvas(container, { 
                            scale: 2, 
                            logging: false, 
                            useCORS: true,
                            backgroundColor: '#ffffff'
                        })
                        const imgData = canvas.toDataURL('image/png')
                        const imgWidth = restrictedWidth
                        const imgHeight = canvas.width > 0 ? (canvas.height * imgWidth) / canvas.width : 0

                        if (imgHeight > 0) {
                            if (yPos + imgHeight > pageHeight - margin) {
                                doc.addPage()
                                yPos = margin
                            }
                            doc.addImage(imgData, 'PNG', margin + contentIndent, yPos, imgWidth, imgHeight)
                            yPos += imgHeight + 10
                        }
                    } catch (e) {
                        console.error("PDF: Flowchart capture failed", e)
                    }
                }
            } else if (segment.startsWith('```')) {
                const code = segment.replace(/```\w*\n?/, '').replace(/```$/, '')
                
                // Code block styling
                doc.setFont("Courier", "normal") // Fallback to Courier for code if needed, or stick to monospace
                doc.setFontSize(8)
                doc.setTextColor(51, 65, 85) // slate-700
                
                // Draw a light background for code
                const codeLines = code.split('\n')
                const tempY = yPos
                
                yPos += 2
                codeLines.forEach(rawLine => {
                    yPos = addWrappedText(doc, rawLine, margin + contentIndent + 5, restrictedWidth - 10, yPos, 5, margin)
                })
                
                // Optional: Draw box around code (needs careful coordinate tracking)
                // doc.setDrawColor(241, 245, 249)
                // doc.rect(margin, tempY, restrictedWidth, yPos - tempY)
                
                yPos += 6
                doc.setFont("LiberationSans", "normal")
            } else if (segment.match(/^\n?(---|\*\*\*|___)\n?$/)) {
                yPos += 4
                doc.setDrawColor(226, 232, 240)
                doc.line(margin + contentIndent, yPos, margin + contentIndent + restrictedWidth, yPos)
                yPos += 10
            } else {
                // Regular text processing with Markdown-like bold detection (simple)
                const cleanSegment = segment.replace(/[*_#]/g, '').replace(/`/g, '')
                const paragraphs = cleanSegment.split('\n\n')

                doc.setFont("LiberationSans", "normal")
                doc.setFontSize(10)
                doc.setTextColor(30, 41, 59)

                paragraphs.forEach((para, pIdx) => {
                    if (!para.trim()) return
                    yPos = addWrappedText(doc, para.trim(), margin + contentIndent, restrictedWidth, yPos, 6, margin)
                    if (pIdx < paragraphs.length - 1) yPos += 6
                })
            }
        }

        yPos += 8
        // Divider between messages
        doc.setDrawColor(241, 245, 249)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 12
    }

    // Footer with page numbers (optional but good)
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    }

    doc.save("AI10x-Startup-Strategy-Report.pdf")
}
