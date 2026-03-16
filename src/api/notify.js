export default async function handler(req, res) {
    console.log(`Notification handler hit with method: ${req.method}`);

    // Temporarily less strict for debugging 405
    if (req.method === "GET") {
        return res.status(200).json({ message: "Notification endpoint ready" });
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
