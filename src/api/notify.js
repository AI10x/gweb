export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { data, prompt } = req.body || {};

        console.log(`[NOTIFY] POSTing to https://actively.run — prompt: ${prompt}`);

        const response = await fetch("https://actively.run/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt, data }),
        });

        const responseText = await response.text();
        console.log(`[NOTIFY] Response ${response.status}: ${responseText}`);

        // Always return 200 to the frontend — we don't want a bad destination response
        // to surface as an error in the chat UI.
        return res.status(200).json({ ok: true, destinationStatus: response.status });
    } catch (error) {
        console.error("[NOTIFY] Error:", error.message);
        return res.status(200).json({ ok: false, error: error.message });
    }
}
