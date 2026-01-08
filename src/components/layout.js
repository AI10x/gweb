/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
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

  // Minimal mode as requested: hide everything except video, chat, and avatar
  const isMinimalMode = true

  return (
    <>
      <BackgroundVideo />
      {!isMinimalMode && <Header siteTitle={data.site.siteMetadata.title} />}
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
          display: isMinimalMode ? 'none' : 'block'
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
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
