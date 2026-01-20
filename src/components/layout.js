/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
import ChatWidget from "./chat-widget"
import BackgroundVideo from "./video-background"
import "./layout.css"

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  const [isMobile, setIsMobile] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobileMatch = window.matchMedia("(max-width: 768px)").matches
      const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobileMatch || userAgentMobile)
    }

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    checkMobile()
    checkOrientation()

    window.addEventListener("resize", checkOrientation)
    window.addEventListener("orientationchange", checkOrientation)

    // Attempt to lock orientation if on mobile
    if (isMobile && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(err => {
        console.warn("Orientation lock failed:", err)
      })
    }

    return () => {
      window.removeEventListener("resize", checkOrientation)
      window.removeEventListener("orientationchange", checkOrientation)
    }
  }, [isMobile])

  // Minimal mode as requested: hide everything except video, chat, and avatar
  const isMinimalMode = true

  return (
    <div className={`layout-wrapper ${isMobile ? "is-mobile" : ""} ${isPortrait ? "is-portrait" : ""}`}>
      {isMobile && isPortrait && (
        <div className="orientation-overlay">
          <div className="orientation-message">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M16.48 2.52c3.27 1.55 5.61 4.72 5.97 8.48h2C24 4.46 18.73 0 12 0c-3.11 0-5.92 1.16-8.07 3.07L1 0v7h7L5.42 4.42C7.15 2.88 9.47 2 12 2c1.61 0 3.12.42 4.44 1.14l.04-.62zM23 17l-7 3h2.58C16.85 21.12 14.53 22 12 22s-4.85-.88-6.58-2.58l-2.42 2.42L3 17h7L7.42 19.58C9.15 21.12 11.47 22 12 22c3.11 0 5.92-1.16 8.07-3.07L23 22v-5zM2.52 7.52C1.55 10.79 2.52 14.06 4.48 16.48l1.45-1.45C4.42 13.12 4 11.61 4 10c0-2.53.88-4.85 2.58-6.58L4.16 1.44zM21.48 16.48c.97-3.27 0-6.54-1.96-8.96l-1.45 1.45C19.58 10.88 20 12.39 20 14c0 2.53-.88 4.85-2.58 6.58l2.42 2.42z" />
            </svg>
            <p>Please, use on desktop (not smartphone) - rotate your device to landscape mode - to preview features</p>
          </div>
        </div>
      )}
      <BackgroundVideo />
      {!isMinimalMode && <Header siteTitle={data.site.siteMetadata.title} />}
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
          display: isMinimalMode ? "none" : "block",
        }}
      >
        <main>{children}</main>
        {!isMinimalMode && (
          <footer>
            © {new Date().getFullYear()}, Built with
            {` `}
            <a href="https://www.gatsbyjs.org">Gatsby</a>
          </footer>
        )}
      </div>
      <ChatWidget />
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
