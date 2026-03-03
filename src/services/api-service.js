import Groq from "groq-sdk";

export const fetchAdditionalApiCompletion = async (messages, address) => {
    const apiUrl = process.env.GATSBY_ADDITIONAL_API_URL || "";

    // Extract prompt safely, handling both string and array content (multi-modal)
    const lastMessage = messages[messages.length - 1];
    let promptText = "";
    if (typeof lastMessage.content === 'string') {
        promptText = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
        const textPart = lastMessage.content.find(part => part.type === 'text');
        promptText = textPart ? textPart.text : "";
    }

    const payload = {
        messages: messages,
        address: address,
        prompt: promptText
    };

    console.log("Calling Additional API:", apiUrl);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log("Additional API Status:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Additional API error details:", errorText);
            throw new Error(`Additional API error (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Additional API success response:", data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error("Additional API returned unexpected format:", data);
            throw new Error("Invalid response format from Additional API");
        }

        return data.choices[0].message;
    } catch (error) {
        console.error("Error in fetchAdditionalApiCompletion:", error);
        throw error;
    }
};

export const fetchMcpSearchCompletion = async (messages) => {
    const groq = new Groq({
        apiKey: process.env.GATSBY_GROQ_API_KEY,
        dangerouslyAllowBrowser: true
    });

    try {
        console.log("Calling Groq MCP Search API...");
        const response = await groq.chat.completions.create({
            model: "groq/compound",
            messages: messages,
        });

        console.log("Groq MCP Search success response");
        return response.choices[0].message;
    } catch (error) {
        console.error("Error in fetchMcpSearchCompletion:", error);
        throw error;
    }
};
