import React from "react"
import "./avatar.css"

const Avatar = ({ thought, isBubbleVisible }) => {
    return (
        <div className="avatar-container">
            <div className={`thought-bubble ${isBubbleVisible ? "active" : ""}`}>
                {thought}
            </div>
            <svg className="avatar-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Robot Body */}
                <circle cx="50" cy="75" r="20" fill="url(#bodyGradient)" />
                <path d="M35 75C35 68 40 60 50 60C60 60 65 68 65 75" stroke="#4facfe" strokeWidth="2" strokeLinecap="round" />

                {/* Robot Head */}
                <g className="robot-head">
                    <rect x="25" y="25" width="50" height="40" rx="15" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                    <rect x="30" y="30" width="40" height="30" rx="10" fill="#1f2937" />

                    {/* Eyes */}
                    <circle className="robot-eye" cx="40" cy="45" r="4" fill="#00f2fe" shadow="0 0 5px #00f2fe" />
                    <circle className="robot-eye" cx="60" cy="45" r="4" fill="#00f2fe" shadow="0 0 5px #00f2fe" />

                    {/* Antenna */}
                    <line x1="50" y1="25" x2="50" y2="15" stroke="#4facfe" strokeWidth="2" />
                    <circle cx="50" cy="15" r="3" fill="#00f2fe" />
                </g>

                <defs>
                    <linearGradient id="bodyGradient" x1="50" y1="55" x2="50" y2="95" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4facfe" />
                        <stop offset="1" stopColor="#00f2fe" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    )
}

export default Avatar
