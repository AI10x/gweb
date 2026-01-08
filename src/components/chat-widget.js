import React, { useState, useEffect, useRef } from "react"
import "./chat-widget.css"

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! How can I help you today?", sender: "support" },
    ])
    const [inputValue, setInputValue] = useState("")
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isOpen])

    const handleToggle = () => setIsOpen(!isOpen)

    const handleSend = (e) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        const newMessage = {
            id: Date.now(),
            text: inputValue,
            sender: "user",
        }

        setMessages([...messages, newMessage])
        setInputValue("")

        // Mock response
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    text: "Thanks for reaching out! Our team will get back to you soon.",
                    sender: "support",
                },
            ])
        }, 1000)
    }

    return (
        <div className="chat-widget-container">
            <div className={`chat-window ${isOpen ? "" : "closed"}`}>
                <div className="chat-header">
                    <div className="chat-header-info">
                        <span className="chat-header-title">Premium Support</span>
                        <span className="chat-header-status">Online</span>
                    </div>
                    <button onClick={handleToggle} className="send-button" style={{ color: 'white' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`message ${msg.sender === "user" ? "message-sent" : "message-received"
                                }`}
                        >
                            {msg.text}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button type="submit" className="send-button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>

            <button className="chat-toggle-button" onClick={handleToggle} aria-label="Open chat">
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
    )
}

export default ChatWidget
