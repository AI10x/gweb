import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

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
    // create document
    const doc = new jsPDF('p', 'mm', 'a3')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    const contentIndent = 0
    let yPos = margin
    const usableWidth = pageWidth - margin * 2 - contentIndent

    // Header
    doc.setFontSize(16)
    doc.setTextColor(40, 44, 52)
    doc.setFont("helvetica", "bold")
    doc.text("AI10xTech", margin, yPos)

    yPos += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Lean Startup Strategy Report", margin, yPos)

    yPos += 5
    doc.setFontSize(7)
    doc.setTextColor(120)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)

    // Divider
    yPos += 5
    doc.setDrawColor(220)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 15

    const messageElements = document.querySelectorAll('.message')

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        const senderLabel = msg.sender === "user" ? "ENTREPRENEUR" : "AI10x STRATEGIST"

        if (yPos > pageHeight - margin) {
            doc.addPage()
            yPos = margin
        }

        doc.setFontSize(8)
        doc.setTextColor(msg.sender === "user" ? 60 : 0, 70, 150)
        doc.setFont("helvetica", "bold")
        doc.text(`${senderLabel}:`, margin, yPos)
        yPos += 6

        const segments = msg.text.split(/(```[\s\S]*?```|\n---\n|\n\*\*\*\n|\n___\n)/g)
        const restrictedWidth = usableWidth
        const mermaidContainers = Array.from(messageElements[i]?.querySelectorAll('.mermaid-container') || [])
        let mermaidIdx = 0

        for (const segment of segments) {
            if (!segment || !segment.trim()) continue

            if (segment.startsWith('```mermaid')) {
                const container = mermaidContainers[mermaidIdx++]
                if (container) {
                    try {
                        const canvas = await html2canvas(container, { scale: 2, logging: false, useCORS: true })
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
                        console.error("PDF: Mermaid failed", e)
                    }
                }
            } else if (segment.startsWith('```')) {
                const code = segment.replace(/```\w*\n?/, '').replace(/```$/, '')
                doc.setFont("courier", "normal").setFontSize(7).setTextColor(30)

                yPos += 2
                const codeLines = code.split('\n')
                codeLines.forEach(rawLine => {
                    yPos = addWrappedText(doc, rawLine, margin + contentIndent, restrictedWidth, yPos, 4.5, margin)
                })
                yPos += 6
            } else if (segment.match(/^\n?(---|\*\*\*|___)\n?$/)) {
                yPos += 2
                doc.setDrawColor(200)
                doc.line(margin + contentIndent, yPos, margin + contentIndent + restrictedWidth, yPos)
                yPos += 8
            } else {
                const cleanSegment = segment.replace(/[*_#]/g, '').replace(/`/g, '')
                const paragraphs = cleanSegment.split('\n\n')

                doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(30)

                paragraphs.forEach((para, pIdx) => {
                    if (!para.trim()) return
                    yPos = addWrappedText(doc, para.trim(), margin + contentIndent, restrictedWidth, yPos, 5, margin)
                    if (pIdx < paragraphs.length - 1) yPos += 5
                })
            }
        }

        yPos += 4
    }

    doc.save("ai10x-strategy-report.pdf")
}
