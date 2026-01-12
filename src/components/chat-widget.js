import React, { useState, useEffect, useRef } from "react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import ReactMarkdown from "react-markdown"
import MermaidDiagram from "./mermaid-diagram"
import Header from "./header"
import Avatar from "./avatar"
import "./chat-widget.css"
import { fetchGroqCompletion } from "../services/groq"
import AI10xIcon from "../images/ai10x-icon.png"

const SYSTEM_PROMPT = `**Role:** You are an expert Lean Startup Strategist and Venture Capital Analyst with a deep understanding of Ash Maurya’s Lean Canvas framework.

**Objective:** Your goal is to ingest, analyze, and provide critical feedback on Lean Model Canvases provided by the user. You help entrepreneurs identify "leap-of-faith" assumptions and suggest ways to de-risk their business models.

**Knowledge Base:** 1. Focus on the relationship between "Problem" and "Customer Segment."
2. Prioritize the "Unique Value Proposition" as the core differentiator.
3. Evaluate "Key Metrics" based on the Pirate Metrics (AARRR) framework.
4. Ensure the "Unfair Advantage" is a true moat, not just a "first-mover" claim.

**Instructions for Analysis:**
When a user provides their canvas data, evaluate it based on the following:
- **Internal Consistency:** Do the "Solution" and "UVP" actually solve the "Problem" for that specific "Customer Segment"?
- **Risk Identification:** Identify the 3 riskiest assumptions in the current model.
- **Clarity & Specificity:** Flag vague entries (e.g., "Marketing" as a channel) and suggest specific alternatives.
- **Market Viability:** Briefly assess if the "Revenue Streams" outweigh the "Cost Structure" based on current market trends.

**Response Format:**
1. **Executive Summary:** A 2-sentence overview of the business viability.
2. **Strengths:** What is well-defined?
3. **Critical Gaps:** What is missing or contradictory?
4. **The "Stress Test":** 3-5 challenging questions the founder must answer.
5. **Next Steps:** Actionable experiments to validate the model.
6. **Final Thoughts:** A final note of encouragement and next steps.
7. Additionally, explain the process using the Lean Canvas framework; and provide graphs and tables.
**Tone:** Professional, objective, encouraging, and highly analytical.`
const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! How can I help you today?", sender: "support" },
    ])
    const [inputValue, setInputValue] = useState("")
    const [thought, setThought] = useState("Need help?")
    const [isBubbleVisible, setIsBubbleVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [copiedId, setCopiedId] = useState(null)
    const messagesEndRef = useRef(null)

    const thoughts = [
        "Need help in your design thinking process?",
        "Check this out - ask me anything design thinking related!",
        "I'm here for your team!",
        "Lean startup?",
        "MVP (minimum vaiable product)?",
    ]

    useEffect(() => {
        let thoughtInterval
        if (!isOpen) {
            // Proactive thought bubbles when closed
            thoughtInterval = setInterval(() => {
                const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)]
                setThought(randomThought)
                setIsBubbleVisible(true)

                setTimeout(() => {
                    setIsBubbleVisible(false)
                }, 3000)
            }, 8000)
        } else {
            setIsBubbleVisible(false)
        }

        return () => clearInterval(thoughtInterval)
    }, [isOpen])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isOpen])

    const handleToggle = () => setIsOpen(!isOpen)

    const handleSend = async (e) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: "user",
        }

        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInputValue("")
        setIsLoading(true)

        try {
            const apiMessages = newMessages.map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text,
            }))

            const response = await fetchGroqCompletion(apiMessages, SYSTEM_PROMPT)

            const assistantMessage = {
                id: Date.now() + 1,
                text: response.content,
                sender: "support",
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error("Error getting response:", error)
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: "Sorry, I'm having trouble connecting right now.",
                    sender: "support",
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height
        const margin = 20
        let yPos = 20

        // Header
        doc.setFontSize(18)
        doc.setTextColor(40, 44, 52)
        doc.setFont("helvetica", "bold")
        doc.text("AI10xTech", margin, yPos)

        yPos += 8
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text("Lean Startup Strategy Report", margin, yPos)

        yPos += 7
        doc.setFontSize(8)
        doc.setTextColor(120)
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos)

        // Divider
        yPos += 4
        doc.setDrawColor(220)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 10

        // Get all message elements from DOM to find diagrams
        const messageElements = document.querySelectorAll('.message')

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i]
            const senderLabel = msg.sender === "user" ? "ENTREPRENEUR" : "AI10x STRATEGIST"

            // Check for space
            if (yPos > pageHeight - 20) {
                doc.addPage()
                yPos = 20
            }

            // Sender Label
            doc.setFontSize(10)
            doc.setTextColor(msg.sender === "user" ? 60 : 0, 70, 150)
            doc.setFont("helvetica", "bold")
            doc.text(`${senderLabel}:`, margin, yPos)
            yPos += 6

            // Mermaid Check
            const hasMermaid = msg.text.includes('```mermaid')
            if (hasMermaid && messageElements[i]) {
                const diagramContainer = messageElements[i].querySelector('.mermaid-container')
                if (diagramContainer) {
                    try {
                        const canvas = await html2canvas(diagramContainer, {
                            scale: 2,
                            logging: false,
                            useCORS: true
                        })
                        const imgData = canvas.toDataURL('image/png')
                        const imgWidth = pageWidth - (margin * 2)
                        const imgHeight = (canvas.height * imgWidth) / canvas.width

                        if (yPos + imgHeight > pageHeight - 15) {
                            doc.addPage()
                            yPos = 20
                        }

                        doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight)
                        yPos += imgHeight + 6
                    } catch (e) {
                        console.error("Failed to capture mermaid diagram:", e)
                    }
                }
            }

            // Message Content
            const cleanText = msg.text
                .replace(/```mermaid[\s\S]*?```/g, '[Visual Flowchart Included]')
                .replace(/[*_#]/g, '')
                .replace(/`/g, '')

            doc.setFontSize(10)
            doc.setTextColor(30)
            doc.setFont("helvetica", "normal")

            const contentWidth = pageWidth - (margin * 2)
            const splitText = doc.splitTextToSize(cleanText, contentWidth)

            splitText.forEach((line) => {
                if (yPos > pageHeight - 15) {
                    doc.addPage()
                    yPos = 20
                }

                // Start from the far left margin
                doc.text(line, margin, yPos)
                yPos += 6
            })

            yPos += 8 // Spacing between messages
        }

        doc.save("ai10x-strategy-report.pdf")
    }

    const handleCopy = (text, id) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedId(id)
                setTimeout(() => setCopiedId(null), 2000)
            })
        }
    }

    return (
        <div className="chat-widget-container">
            <div className={`chat-window ${isOpen ? "" : "closed"}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <span className="chat-header-title">Premium Support</span>
                        <span className="chat-header-status">Online</span>
                    </div>
                    <div className="chat-header-actions">
                        <button onClick={handleDownloadPDF} className="header-action-button" title="Download PDF">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                        <button onClick={handleToggle} className="header-action-button" title="Close chat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`message ${msg.sender === "user" ? "message-sent" : "message-received"
                                }`}
                        >
                            {msg.sender === "support" && (
                                <img src={AI10xIcon} alt="AI10x" className="message-avatar" />
                            )}
                            <div className="message-content">
                                <ReactMarkdown
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || "")
                                            const isMermaid = match && match[1] === "mermaid"
                                            return !inline && isMermaid ? (
                                                <MermaidDiagram chart={String(children).replace(/\n$/, "")} />
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                            <button
                                className={`copy-button ${copiedId === msg.id ? "copied" : ""}`}
                                onClick={() => handleCopy(msg.text, msg.id)}
                                title="Copy message"
                            >
                                {copiedId === msg.id ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="copy-icon">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="copy-icon">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message message-received">
                            <span className="typing-indicator">...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading}
                    />
                    <button type="submit" className="send-button" disabled={isLoading}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>

            <div className="chat-toggle-wrapper" onClick={handleToggle}>
                {!isOpen && <Avatar thought={thought} isBubbleVisible={isBubbleVisible} />}
                <button className="chat-toggle-button" aria-label="Open chat">
                    {isOpen ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}

export default ChatWidget
