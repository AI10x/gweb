export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { prompt } = req.body || {};

        console.log(`[NOTIFY] POST https://actively.run — prompt: "${prompt}"`);

        const response = await fetch("https://actively.run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        const responseText = await response.text();
        console.log(`[NOTIFY] Response ${response.status}: ${responseText}`);

        return res.status(200).json({ ok: true, destinationStatus: response.status });
    } catch (error) {
        console.error("[NOTIFY] Error:", error.message);
        return res.status(200).json({ ok: false, error: error.message });
    }
}
