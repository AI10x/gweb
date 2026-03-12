import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"

const IndexPage = () => (
  <Layout>
    <SEO title="AI10xTech" />
    <h1 className="text-3d">AI10xTech</h1>
    <p>Design‑thinking educators waste valuable workshop time manually creating prompts and spec sheets because existing tools are disjointed and not open‑source.</p>
    <p>Now come and build something great.</p>
    <div style={{ maxWidth: `300px`, marginBottom: `1.45rem` }}>
      <Image />
    </div>
    <Link to="/page-2/">Go to page 2</Link> <br />
    <Link to="/using-typescript/">Go to "Using TypeScript"</Link>
  </Layout>
)

export default IndexPage
