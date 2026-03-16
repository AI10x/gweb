import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GATSBY_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

const triggerActivelyRun = async (data, prompt) => {
    try {
        await fetch("https://actively.run/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        })
    } catch (error) {
        console.error("Error notifying actively.run:", error)
    }
}



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

        // Notify actively.run
        triggerActivelyRun(response, promptText)


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

        const lastMessage = messages[messages.length - 1];
        const promptText = typeof lastMessage.content === 'string' ? lastMessage.content : "Flowchart generation requested";

        // Notify actively.run
        triggerActivelyRun(response, promptText)

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

    try {
        // 1. Fetch all chat records for this user
        const history = await fetchChatStorage({ action: "list", userId: address });

        // 2. Format the history as context
        let dbContext = "";
        if (history && history.length > 0) {
            dbContext = "\n\n--- USER'S DATABASE CHAT HISTORY ---\n";
            history.forEach((record, index) => {
                const date = new Date(record.created_at).toLocaleDateString();
                dbContext += `Session ${index + 1} (${date}):\n`;
                if (record.chat_data && record.chat_data.messages) {
                    record.chat_data.messages.forEach(m => {
                        dbContext += `  [${m.sender.toUpperCase()}]: ${m.text.substring(0, 500)}${m.text.length > 500 ? "..." : ""}\n`;
                    });
                }
                dbContext += "---\n";
            });
            dbContext += "\n--- END OF DATABASE HISTORY ---\n";
        }

        // 3. Construct the enriched system prompt
        const enrichedPrompt = (systemPrompt || "") + dbContext +
            "\n\n[System Instruction: You have been provided with the user's historical chat data from the database. Use this context to provide personalized responses and remember previous interactions.]";

        // 4. Call Groq
        const apiMessages = [{ role: "system", content: enrichedPrompt }, ...messages];

        const response = await groq.chat.completions.create({
            model: "groq/compound",
            messages: apiMessages,
        });

        const lastMessage = messages[messages.length - 1];
        const promptText = lastMessage.text || (typeof lastMessage.content === 'string' ? lastMessage.content : "");

        // Notify actively.run
        triggerActivelyRun(response, promptText)

        return response.choices[0].message;

    } catch (error) {
        console.error("Error in fetchDBEnrichedGroqCompletion:", error);
        throw error;
    }
};
