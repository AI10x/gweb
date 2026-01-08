import React from "react"

const BackgroundVideo = () => {
    return (
        <div className="video-background-container">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="video-background-element"
            >
                <source
                    src="https://assets.mixkit.co/videos/4809/4809-720.mp4"
                    type="video/mp4"
                />
                Your browser does not support the video tag.
            </video>
            <div className="video-overlay" />
        </div>
    )
}

export default BackgroundVideo
