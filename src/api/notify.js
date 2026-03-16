export default async function handler(req, res) {
    // Set CORS headers so the browser can call this endpoint
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const { prompt } = req.body || {}

        const response = await fetch("https://actively.run/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        })

        const text = await response.text()
        console.log(`[NOTIFY] actively.run responded ${response.status}: ${text}`)

        return res.status(200).json({ ok: true, status: response.status })
    } catch (error) {
        console.error("[NOTIFY] Error:", error.message)
        return res.status(200).json({ ok: false, error: error.message })
    }
}
