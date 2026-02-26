import React, { useState, useEffect, useRef } from "react"
import { generateChatPDF } from "../utils/pdf-generator"
import ReactMarkdown from "react-markdown"
import { ethers } from "ethers"
import MermaidDiagram from "./mermaid-diagram"
import Header from "./header"
import Avatar from "./avatar"
import "./chat-widget.css"
import { fetchGroqCompletion } from "../services/groq"
import { fetchAdditionalApiCompletion } from "../services/api-service"
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
7. Additionally, explain the process using the Lean Canvas framework; and provide graphs and tables in ASCII text and mermaid code.
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
    const [verifiedAddress, setVerifiedAddress] = useState(null)
    const messagesEndRef = useRef(null)

    const thoughts = [
        "Design thinking toolbox? Donate at - https://ud.me/ai10x.org",
        "I'm here for your team! Donate at - https://ud.me/ai10x.org",
        "Lean startup? Donate at - https://ud.me/ai10x.org",
        "MVP (minimum vaiable product)? Donate at - https://ud.me/ai10x.org",
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

    const [attachments, setAttachments] = useState([])
    const fileInputRef = useRef(null)
    const folderInputRef = useRef(null)

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        const newAttachments = []

        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
                newAttachments.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    path: file.webkitRelativePath || file.name,
                    preview: e.target.result,
                    type: file.type.startsWith('image/') ? 'image' : 'text'
                })

                if (newAttachments.length === files.length) {
                    setAttachments(prev => [...prev, ...newAttachments])
                }
            }
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file)
            } else {
                reader.readAsText(file)
            }
        })

        // Clear input so same file can be selected again if needed
        e.target.value = null
    }

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(att => att.id !== id))
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!inputValue.trim() && attachments.length === 0) return

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: "user",
            attachments: attachments
        }

        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInputValue("")
        setAttachments([])
        setIsLoading(true)

        try {
            const apiMessages = newMessages.map((msg) => {
                const role = msg.sender === "user" ? "user" : "assistant"

                if (msg.attachments && msg.attachments.length > 0) {
                    const content = []
                    if (msg.text) {
                        content.push({ type: "text", text: msg.text })
                    }

                    msg.attachments.forEach(att => {
                        const filePath = att.path || att.file.name
                        if (att.type === 'image') {
                            content.push({
                                type: "image_url",
                                image_url: {
                                    url: att.preview
                                }
                            })
                        } else {
                            content.push({
                                type: "text",
                                text: `\n--- START OF FILE: ${filePath} ---\n${att.preview}\n--- END OF FILE: ${filePath} ---\n`
                            })
                        }
                    })

                    // Add a summary instruction at the end of the content array if files were attached
                    content.push({
                        type: "text",
                        text: "\n[System Instruction: Please summarize the content of the attached file(s) and then address the user's request using that information.]"
                    })

                    return { role, content }
                } else {
                    return { role, content: msg.text }
                }
            })

            let response
            if (verifiedAddress) {
                try {
                    console.log("Attempting additional API with address:", verifiedAddress)
                    response = await fetchAdditionalApiCompletion(apiMessages, verifiedAddress)
                } catch (apiError) {
                    console.error("Additional API failed, falling back to Groq:", apiError)
                    response = await fetchGroqCompletion(apiMessages, SYSTEM_PROMPT)
                }
            } else {
                response = await fetchGroqCompletion(apiMessages, SYSTEM_PROMPT)
            }

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
        await generateChatPDF(messages)
    }

    const handleCopy = (text, id) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedId(id)
                setTimeout(() => setCopiedId(null), 2000)
            })
        }
    }

    const connectAndSign = async () => {
        if (!window.ethereum) {
            console.log("Please install MetaMask!")
            alert("Please install MetaMask to use this feature.")
            return
        }

        try {
            console.log("Connecting...")
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()

            console.log("Signing...")
            const message = `Identity verification for: ${address}`
            const signature = await signer.signMessage(message)

            console.log("Connected Address:", address)
            console.log("Signed Message:", message)
            console.log("Signature:", signature)

            setVerifiedAddress(address)
            alert(`Signed! Check console for details.\nAddress: ${address}`)
        } catch (error) {
            console.error("Error connecting/signing:", error)
            alert("Error: " + error.message)
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
                        <button onClick={connectAndSign} className="header-action-button" title="Connect & Sign Wallet">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                                <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
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

                <div className="chat-input-wrapper">
                    {attachments.length > 0 && (
                        <div className="attachment-preview-area">
                            {attachments.map(att => (
                                <div key={att.id} className="attachment-preview-item">
                                    {att.type === 'image' ? (
                                        <div className="attachment-image-preview">
                                            <img src={att.preview} alt="nav" />
                                        </div>
                                    ) : (
                                        <div className="attachment-file-preview">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                <polyline points="13 2 13 9 20 9"></polyline>
                                            </svg>
                                            <span title={att.path || att.file.name}>{att.file.name}</span>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="attachment-remove-btn"
                                        onClick={() => removeAttachment(att.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <form className="chat-input-area" onSubmit={handleSend}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*,text/*,.txt,.md,.js,.py,.json"
                        />
                        <input
                            type="file"
                            ref={folderInputRef}
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            webkitdirectory=""
                            directory=""
                            mozdirectory=""
                        />
                        <button
                            type="button"
                            className="attachment-button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach files"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="attachment-button"
                            onClick={() => folderInputRef.current?.click()}
                            title="Attach folder"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" className="send-button" disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
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
