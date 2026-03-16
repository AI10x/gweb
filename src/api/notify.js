export default async function handler(req, res) {
    console.log(`--- Notification Proxy Request ---`);
    console.log(`Method: ${req.method}`);
    console.log(`Content-Type: ${req.headers["content-type"]}`);

    // Temporarily less strict for debugging 405
    if (req.method === "GET") {
        return res.status(200).json({ message: "Notification endpoint ready" });
    }

    try {
        // Log the body to see if it's being parsed correctly
        console.log("Raw Request Body:", req.body);

        const { data, prompt } = req.body || {};

        if (!data && !prompt) {
            console.warn("Warning: Received notification request with empty data and prompt.");
        }

        console.log(`Proxying to actively.run for prompt: ${prompt || "N/A"}`);

        const response = await fetch("https://actively.run/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt, data }),
        });

        console.log(`actively.run response status: ${response.status} ${response.statusText}`);

        // Return the actual status from the destination to our frontend for better debugging
        return res.status(response.status).json({
            message: "Notification proxied",
            destinationStatus: response.status
        });
    } catch (error) {
        console.error("Error in proxy notify:", error);
        return res.status(500).json({ error: "Failed to proxy notification", detail: error.message });
    }
}
