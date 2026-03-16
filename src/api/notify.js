export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        console.log("Proxying request to actively.run");
        const { data, prompt } = req.body;
        console.log("Proxying request to actively.run with prompt:", prompt);
        const response = await fetch("https://actively.run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt, data }),
        });

        // We don't necessarily need to wait for a successful response from actively.run
        // but we'll return a 200 to our frontend if the fetch itself didn't throw.
        return res.status(200).json({ message: "Notification proxied" });
    } catch (error) {
        console.error("Error in proxy notify:", error);
        return res.status(500).json({ error: "Failed to proxy notification" });
    }
}
