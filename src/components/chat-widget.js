import React, { useState, useEffect, useRef } from "react"
import { generateChatPDF } from "../utils/pdf-generator"
import ReactMarkdown from "react-markdown"
import { ethers } from "ethers"
import FlowchartDiagram from "./flowchart-diagram"
import Header from "./header"
import Avatar from "./avatar"
import "./chat-widget.css"
import { fetchGroqCompletion } from "../services/groq"
import { fetchAdditionalApiCompletion, fetchFlowchartCompletion, fetchChatStorage, fetchDBEnrichedGroqCompletion } from "../services/api-service"
import { extractTextFromPDF } from "../utils/pdf-parser"
import AI10xIcon from "../images/ai10x-icon.png"

const SYSTEM_PROMPT = `**Role:** You are an expert Lean Startup Strategist and Venture Capital Analyst with a deep understanding of Ash Maurya’s Lean Canvas framework.

**Objective:** Your goal is to ingest, analyze, and provide critical feedback on Lean Model Canvases provided by the user. You help entrepreneurs identify "leap-of-faith" assumptions and suggest ways to de-risk their business models.

**Knowledge Base:** 1. Focus on the relationship between "Problem" and "Customer Segment."
2. Prioritize the "Unique Value Proposition" as the core differentiator.
3. Evaluate "Key Metrics" based on the Pirate Metrics (AARRR) framework.
4. Ensure the "Unfair Advantage" is a true moat, not just a "first-mover" claim.

**Instructions for Analysis:**
 Design‑Thinking & Lean‑Canvas Coach (with Problem‑Opportunity‑Solution‑Ask Structure)

You are an experienced Design‑Thinking facilitator who also masters the Lean Canvas.
Your role is to walk the user, step-by-step, through a human‑centred innovation process. You MUST act as a proactive guide, providing clear instructions and asking ONE focused question at a time to avoid overwhelming the user. Wait for their response before moving on. You will simultaneously populate a Lean Canvas that follows this clear four‑part output structure:

Problem Statement – Question & Refine
Opportunity Insight – What’s the market/strategic win?
Solution Concept – How will you solve it?
Ask – Market‑Channel strategy & Capitalisation plan
Core Behaviour (Design‑Thinking Lens)
Phase	Goal	Typical Prompt	Lean‑Canvas Block(s)
Empathy	Uncover users, pains, motivations	“Tell me about the people you’re trying to help. What does a typical day look like for them?”	Customer Segments, Problem
Define	Sharpen the problem statement	“What’s the core problem you see? Can you phrase it in one sentence?”	Problem, Customer Segments
Ideate	Generate many possible ways to address the problem	“Give me three to five ‘what‑if’ ideas that could alleviate that pain.”	Solution, Unique Value Proposition
Prototype	Sketch the simplest version of the chosen idea	“Describe the user flow or draw a quick mock‑up of the most promising idea.”	Solution, Channels
Test	Plan validation & learning	“How will you test this prototype with real users? Which metrics matter?”	Key Metrics, Unfair Advantage
Conversational Flow (you may adapt)
Welcome & Context

“Welcome! I’ll help you explore a business idea using Design‑Thinking and the Lean Canvas, and we’ll capture everything in a clear Problem‑Opportunity‑Solution‑Ask format.”
Sector & Industry Vertical (Empathy)

“Which sector (e.g., health, finance, education, manufacturing…) are you targeting?”
“Within that sector, which industry vertical or sub‑market are you focusing on?”
Stakeholder Discovery (Empathy)

“Who are the primary users or customers? Describe their goals, daily routines, and frustrations.”
Problem Statement – Question & Refine (Define)

“What is the core problem you’ve observed for these users? Please phrase it in a single sentence.”
Follow‑up: “Why do you think this problem matters now? What evidence do you have?”
Capture → Problem block + Customer Segments (early adopters).
Opportunity Insight – Market / Strategic Win (Define / Ideate)

“Given that problem, what opportunity do you see? Consider market size, trends, or a gap in current solutions.”
“How big could the impact be if the problem were solved?”
Capture → Unfair Advantage (if any), Key Metrics (market‑size, growth).
Solution Concept – Formulate (Ideate → Prototype)

“List up to three concrete solution concepts that could address the problem.”
For each, ask:
“What core feature solves the pain point?”
“What makes this solution unique (your UVP)?”
Choose the most promising and ask the user to describe a low‑fidelity prototype (user flow, sketch, story).
Capture → Solution, Unique Value Proposition, Channels (how the prototype would be delivered).
Ask – Market Channels & Capitalisation (Test / Business Model)

Market‑Channel:
“Through which channels will you reach your customers (online, retail, partnerships, etc.)?”
“What’s your go‑to‑market sequence (pilot → early‑adopter → scale)?”
Capitalisation (Revenue & Funding):
“How will you make money? (e.g., subscription, transaction fee, licensing…)”
“What initial capital will you need to build and launch the prototype? Do you have sources in mind (bootstrapping, angel, VC)?”
Capture → Channels, Revenue Streams, Cost Structure, Ask (funding amount, timeline).
Lean‑Canvas Completion & Recap

Systematically fill the remaining canvas blocks: Cost Structure, Key Metrics, Unfair Advantage.

Summarise in the four‑part output:

1️⃣ Problem Statement: …
2️⃣ Opportunity Insight: …
3️⃣ Solution Concept: …
4️⃣ Ask – Market Channels & Capitalisation: …

Reflection & Next Steps

“Based on what we’ve defined, here are three concrete next actions (e.g., create paper prototype, run 5 user interviews, draft a simple financial model).”
Tone & Style
Curious & Empathetic – Ask open‑ended questions, paraphrase the user’s words to confirm understanding. Please be highly initiative-taking and provide strong, step-by-step guidance.
Positive & Encouraging – Celebrate every idea, even the “wild” ones; frame challenges as learning opportunities.
Clear & Structured – After each phase, briefly restate the captured information before moving on.
Constraints
No final advice until the user has supplied enough detail for every Lean‑Canvas block.
Keep jargon to a minimum; explain any technical terms in plain language.
If the user stalls, gently steer with a focused follow‑up (“Can you tell me more about the main pain point you mentioned?”).
Goal: Co‑create a well‑validated Problem‑Opportunity‑Solution‑Ask statement and a complete Lean Canvas that the user can use to pitch, prototype, and secure resources.
7. Additionally, explain the process using the Lean Canvas framework; and provide graphs and tables in ASCII text and standard flowchart.js code. IMPORTANT: For flowcharts, ONLY output strict flowchart.js syntax (e.g., \`st=>start: Start\`), enclosed in a markdown code block with the \`flowchart\` language identifier. Do NOT use Mermaid.
**Tone:** Professional, objective, encouraging, and highly analytical.`
const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, text: "Need more intensive support for your Startup feel free to reach out at [admin@ai10x.dev](mailto:admin@ai10x.dev) - you can generate an email template (here) as well" },
    ])
    const [inputValue, setInputValue] = useState("")
    const [thought, setThought] = useState("Need help?")
    const [isBubbleVisible, setIsBubbleVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [copiedId, setCopiedId] = useState(null)
    const [verifiedAddress, setVerifiedAddress] = useState(null)
    const [dimensions, setDimensions] = useState({ width: 600, height: 600 })
    const [isResizing, setIsResizing] = useState(false)
    const [userMessageCount, setUserMessageCount] = useState(0)
    const [showArrow, setShowArrow] = useState(true)
    const [dbRecordId, setDbRecordId] = useState(null)
    const resizeRef = useRef(null)
    const messagesEndRef = useRef(null)

    const thoughts = [
        "Design thinking toolbox?",
        "Vertical insight - chat with our assistant",
        "Lean startup?",
        "MVP (minimum vaiable product)?",
        "Founding team? Email at admin@ai10x.dev(mailto:admin@ai110x.dev)",
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

    // Sync messages with DB when wallet is verified
    useEffect(() => {
        const syncWithDB = async () => {
            if (verifiedAddress) {
                try {
                    // Try to list existing chats for this address
                    const history = await fetchChatStorage({ action: "list", userId: verifiedAddress })
                    if (history && history.length > 0) {
                        // Take the most recent chat
                        const latestChat = history[history.length - 1]
                        if (latestChat.chat_data && latestChat.chat_data.messages) {
                            setMessages(latestChat.chat_data.messages)
                            setDbRecordId(latestChat.id)
                        }
                    } else {
                        // Initialize table if it's the first time
                        await fetchChatStorage({ action: "init" })
                    }
                } catch (error) {
                    console.error("Error syncing with DB:", error)
                }
            }
        }
        syncWithDB()
    }, [verifiedAddress])

    // Save chat when messages update and wallet is connected
    useEffect(() => {
        const saveChat = async () => {
            if (verifiedAddress && messages.length > 1) { // messages.length > 1 to avoid saving initial state only
                try {
                    if (dbRecordId) {
                        await fetchChatStorage({
                            action: "update",
                            id: dbRecordId,
                            chatData: { messages }
                        })
                    } else {
                        const newRecord = await fetchChatStorage({
                            action: "insert",
                            userId: verifiedAddress,
                            chatData: { messages }
                        })
                        if (newRecord && newRecord.id) {
                            setDbRecordId(newRecord.id)
                        }
                    }
                } catch (error) {
                    console.error("Error saving to DB:", error)
                }
            }
        }
        saveChat()
    }, [messages, verifiedAddress, dbRecordId])

    const handleToggle = () => {
        if (!isOpen) {
            setShowArrow(false)
            if (typeof window !== 'undefined') {
                const margin = 32
                setDimensions({
                    width: window.innerWidth - margin,
                    height: window.innerHeight - margin - 80
                })
            }
        }
        setIsOpen(!isOpen)
    }

    const [attachments, setAttachments] = useState([])
    const fileInputRef = useRef(null)
    const folderInputRef = useRef(null)

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        console.log("Files selected:", files.map(f => `${f.name} (${f.type})`))

        const processFile = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader()

                if (file.type === 'application/pdf') {
                    console.log(`Processing PDF: ${file.name}`)
                    reader.onload = async (e) => {
                        try {
                            const pdfText = await extractTextFromPDF(e.target.result)
                            console.log(`Successfully extracted text from ${file.name} (${pdfText.length} chars)`)
                            resolve({
                                id: Date.now() + Math.random(),
                                file: file,
                                path: file.webkitRelativePath || file.name,
                                preview: pdfText,
                                type: 'pdf'
                            })
                        } catch (err) {
                            console.error(`PDF parsing failed for ${file.name}:`, err)
                            resolve(null)
                        }
                    }
                    reader.readAsArrayBuffer(file)
                } else if (file.type.startsWith('image/')) {
                    reader.onload = (e) => {
                        resolve({
                            id: Date.now() + Math.random(),
                            file: file,
                            path: file.webkitRelativePath || file.name,
                            preview: e.target.result,
                            type: 'image'
                        })
                    }
                    reader.readAsDataURL(file)
                } else {
                    reader.onload = (e) => {
                        resolve({
                            id: Date.now() + Math.random(),
                            file: file,
                            path: file.webkitRelativePath || file.name,
                            preview: e.target.result,
                            type: 'text'
                        })
                    }
                    reader.readAsText(file)
                }
            })
        }

        try {
            const results = await Promise.all(files.map(processFile))
            const validAttachments = results.filter(att => att !== null)
            console.log(`Adding ${validAttachments.length} attachments to state`)
            setAttachments(prev => [...prev, ...validAttachments])
        } catch (err) {
            console.error("Error processing files:", err)
        }

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
        setUserMessageCount(prev => prev + 1)

        try {
            // Limit message history to reduce payload size
            const messagesToProcess = newMessages.slice(-10);

            const apiMessages = messagesToProcess.map((msg) => {
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
                            const prefix = att.type === 'pdf' ? '[PDF CONTENT]' : ''
                            // Truncate large text attachments (approx 20k chars limit)
                            const maxChars = 20000;
                            let truncatedContent = att.preview;
                            if (truncatedContent && truncatedContent.length > maxChars) {
                                truncatedContent = truncatedContent.substring(0, maxChars) + "\n... [CONTENT TRUNCATED DUE TO SIZE] ...";
                            }

                            content.push({
                                type: "text",
                                text: `\n--- START OF FILE: ${filePath} ---\n${prefix}\n${truncatedContent}\n--- END OF FILE: ${filePath} ---\n`
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
            const isFlowchartRequest = inputValue.toLowerCase().includes("flowchart") || inputValue.toLowerCase().includes("diagram");

            if (isFlowchartRequest) {
                console.log("Flowchart generation requested.")
                try {
                    response = await fetchFlowchartCompletion(apiMessages)
                } catch (apiError) {
                    console.error("Flowchart API failed, falling back to Groq:", apiError)
                    response = await fetchGroqCompletion(apiMessages, SYSTEM_PROMPT)
                }
            } else if (verifiedAddress) {
                try {
                    console.log("Using DB-Enriched Groq API for verified address:", verifiedAddress)

                    // If we also meet the market research criteria (message count >= 4), include that formatting
                    let currentPrompt = SYSTEM_PROMPT
                    if (userMessageCount >= 4) {
                        currentPrompt += `\n\nCRITICAL OUTPUT FORMATTING: Ensure your response has two separate text outputs (paragraphs) separated by a large white space (e.g. padding). Title the second output "Market Research". Wrap the entire second output (including the title) inside a markdown blockquote like this: > [!MARKET_RESEARCH] so the frontend can style it darkly.`;
                    }

                    response = await fetchDBEnrichedGroqCompletion(apiMessages, verifiedAddress, currentPrompt)
                } catch (apiError) {
                    console.error("DB-Enriched API failed, falling back to standard Groq:", apiError)
                    response = await fetchGroqCompletion(apiMessages, SYSTEM_PROMPT)
                }
            } else {
                console.log("Using standard Groq API. Msg Count:", userMessageCount + 1)
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
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedId(id)
                setTimeout(() => setCopiedId(null), 2000)
            })
        }
    }

    const connectAndSign = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            console.log("Please install MetaMask!")
            alert("Please install MetaMask to use this feature.")
            return
        }

        try {
            console.log("Connecting...")
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()

            // Check balance
            const balance = await provider.getBalance(address)
            const minBalance = ethers.parseEther("0.0001")

            //if (balance > minBalance) {
            //    alert("Insufficient balance. Minimum 0.0001 ETH required.")
            //    return
            //}

            console.log("Sending 0.0001 ETH verification transaction...")
            //  const tx = await signer.sendTransaction({
            //     to: "0x00760374d6654bc71bca4b0c55ece3de66779586",
            //     value: 0
            // })

            console.log("Waiting for transaction confirmation...")
            //await tx.wait()

            //console.log("Signing...")
            //const message = `Identity verification for: ${address}`
            //const signature = await signer.signMessage(message)

            console.log("Connected Address:", address)
            //console.log("Signed Message:", message)
            //console.log("Signature:", signature)
            //console.log("Transaction Hash:", tx.hash)

            setVerifiedAddress(address)
            const userPrompt = inputValue


            // Notify actively.run via proxy after successful blockchain signing

            if (folderInputRef.current) {
                folderInputRef.current.click()
            }

            // Delay the alert so it doesn't block the file chooser dialog
            setTimeout(() => {
                alert(`Verified! Transaction confirmed and message signed.\nAddress: ${address}`)
            }, 500)
        } catch (error) {
            console.error("Error connecting/signing:", error)
            alert("Error: " + error.message)
        }
    }

    const startResizing = (e) => {
        e.preventDefault()
        setIsResizing(true)
    }

    const stopResizing = () => {
        setIsResizing(false)
    }

    const resize = (e) => {
        if (isResizing) {
            // Since the widget is fixed to bottom-right, 
            // dragging top-left handle means:
            // newWidth = currentRight - mouseX
            // newHeight = currentBottom - mouseY

            const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 600
            const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 600

            // Assuming 2rem (32px) margins as per CSS
            const margin = 32

            const newWidth = Math.max(320, windowWidth - e.clientX - margin)
            const newHeight = Math.max(400, windowHeight - e.clientY - margin - 80) // 80 for toggle button space

            setDimensions({
                width: newWidth,
                height: newHeight
            })
        }
    }

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (isResizing) {
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResizing)
        } else {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [isResizing])

    return (
        <div className="chat-widget-container">
            <div
                className={`chat-window ${isOpen ? "" : "closed"}`}
                style={{
                    width: isOpen ? `${dimensions.width}px` : undefined,
                    height: isOpen ? `${dimensions.height}px` : undefined
                }}
            >
                <div className="resize-handle" onMouseDown={startResizing}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                </div>
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
                                            const isFlowchart = match && (match[1] === "flowchart" || match[1] === "flowchart.js")
                                            return !inline && isFlowchart ? (
                                                <FlowchartDiagram chart={String(children).replace(/\n$/, "")} />
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        blockquote({ node, children, ...props }) {
                                            // Check if it's our custom [!MARKET_RESEARCH] block
                                            const textContent = node.children.map(c => c.value || (c.children && c.children[0]?.value) || '').join('');
                                            if (textContent.includes('[!MARKET_RESEARCH]')) {
                                                // Remove the tag from the rendered output
                                                return (
                                                    <div style={{
                                                        backgroundColor: '#1a202c',
                                                        color: '#e2e8f0',
                                                        padding: '1.5rem',
                                                        borderRadius: '8px',
                                                        marginTop: '2rem',
                                                        borderLeft: '4px solid #4299e1',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                    }}>
                                                        {children}
                                                    </div>
                                                );
                                            }
                                            return <blockquote {...props}>{children}</blockquote>;
                                        }
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
                                            <span title={att.path || att.file.name}>
                                                {att.file.name}
                                                {att.type === 'pdf' && <small style={{ display: 'block', fontSize: '10px', opacity: 0.7 }}>(PDF)</small>}
                                            </span>
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
                            accept="image/*,text/*,.txt,.md,.js,.py,.json,.pdf,application/pdf"
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
                {showArrow && !isOpen && (
                    <div className="chat-pointing-arrow">
                        <span className="arrow-text">Start Here</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19 12 12 19 5 12"></polyline>
                        </svg>
                    </div>
                )}
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
