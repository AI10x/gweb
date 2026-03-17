import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GATSBY_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});



export const fetchAdditionalApiCompletion = async (messages, address, systemPrompt) => {
    // Extract prompt safely, handling both string and array content (multi-modal)
    const lastMessage = messages[messages.length - 1];
    let promptText = "";
    if (typeof lastMessage.content === 'string') {
        promptText = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
        const textPart = lastMessage.content.find(part => part.type === 'text');
        promptText = textPart ? textPart.text : "";
    }

    console.log("Calling Groq Compound API for address:", address);

    try {
        const apiMessages = systemPrompt
            ? [{ role: "system", content: systemPrompt }, ...messages]
            : messages

        const response = await groq.chat.completions.create({
            model: "groq/compound",
            messages: apiMessages,
        });

        console.log("Groq Compound API success response:", response);


        if (!response.choices || !response.choices[0] || !response.choices[0].message) {
            console.error("Groq Compound API returned unexpected format:", response);
            throw new Error("Invalid response format from Groq Compound API");
        }

        return response.choices[0].message;
    } catch (error) {
        console.error("Error in fetchAdditionalApiCompletion (Groq Compound):", error);
        throw error;
    }
};

export const fetchFlowchartCompletion = async (messages) => {
    const summaryPrompt = `You are an expert system architect and visualizer.
Your objective is to review the entire prior conversation context and output a concise summary as an ASCII flowchart block diagram.
IMPORTANT: You MUST ONLY output strict flowchart.js syntax (e.g., \`st=>start: Start\`), enclosed in a markdown code block with the \`flowchart\` language identifier (i.e., \`\`\`flowchart ... \`\`\`). Do NOT output any other text, explanations, or markdown outside the code block.`;

    console.log("Calling API to generate flowchart from context");

    try {
        const apiMessages = [
            { role: "system", content: summaryPrompt },
            ...messages,
            { role: "user", content: "Please summarize our entire conversation above into an ASCII flowchart block diagram using flowchart.js syntax. Output ONLY the markdown code block." }
        ];

        const response = await groq.chat.completions.create({
            model: "groq/compound", // Assuming this is set up
            messages: apiMessages,
        });


        return response.choices[0].message;

    } catch (error) {
        console.error("Error generating flowchart summary:", error);
        throw error;
    }
};

export const fetchChatStorage = async (payload) => {
    try {
        const response = await fetch("/api/chat-storage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            return data;
        } else {
            const text = await response.text();
            console.error("Non-JSON response from /api/chat-storage:", text);
            throw new Error(`Server returned non-JSON response: ${response.status}`);
        }
    } catch (error) {
        console.error("Error in fetchChatStorage:", error);
        throw error;
    }
};

export const fetchDBEnrichedGroqCompletion = async (messages, address, systemPrompt) => {
    console.log("Fetching DB-enriched Groq completion for address:", address);
    const lastMessage = messages[messages.length - 1];
    let promptText = "";
    if (typeof lastMessage.content === 'string') {
        promptText = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
        const textPart = lastMessage.content.find(part => part.type === 'text');
        promptText = textPart ? textPart.text : "";
    }
    try {
        // 1. Fetch all chat records for this user

        const response = await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "prompt": `${promptText}`, "key": `${address}` }),
        }).catch(err => console.error("[NOTIFY] proxy error:", err.message))
        const data = await response.text();
        console.log("Notify API response:", data);
        return data;
    } catch (error) {
        console.error("Error in fetchDBEnrichedGroqCompletion:", error);
        throw error;
    }
};
