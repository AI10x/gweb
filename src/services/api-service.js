import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GATSBY_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

const MAX_PAYLOAD_SIZE = 1000 * 1024; // ~1MB limit for safety

const getApproximateSize = (messages) => {
    try {
        return JSON.stringify(messages).length;
    } catch (e) {
        return 0;
    }
};

const truncateHistory = (messages) => {
    let currentMessages = [...messages];
    let size = getApproximateSize(currentMessages);

    if (size <= MAX_PAYLOAD_SIZE) return currentMessages;

    console.log(`Payload size (${(size / 1024).toFixed(2)} KB) exceeds limit. Truncating...`);

    // Keep the system message if it exists (usually at index 0 or not present in this array yet)
    // Keep the current message (the last one) as it's the most important
    const lastMessage = currentMessages.pop();

    // Process history: first pass, remove large file contents from old messages
    for (let i = 0; i < currentMessages.length; i++) {
        const msg = currentMessages[i];
        if (typeof msg.content === 'string' && msg.content.length > 5000) {
            // Check if it's a file content block
            if (msg.content.includes('--- START OF FILE:')) {
                const lines = msg.content.split('\n');
                const fileNameLine = lines.find(l => l.startsWith('--- START OF FILE:'));
                const fileName = fileNameLine ? fileNameLine.replace('--- START OF FILE: ', '').replace(' ---', '') : 'Unknown file';
                msg.content = `[File content of ${fileName} truncated to stay within API limits]`;
            } else {
                msg.content = msg.content.substring(0, 5000) + "... [truncated]";
            }
        } else if (Array.isArray(msg.content)) {
            msg.content = msg.content.map(part => {
                if (part.type === 'text' && part.text.length > 5000) {
                    return { ...part, text: part.text.substring(0, 5000) + "... [truncated]" };
                }
                return part;
            });
        }

        size = getApproximateSize([...currentMessages, lastMessage]);
        if (size <= MAX_PAYLOAD_SIZE) break;
    }

    // Second pass: if still too large, drop oldest messages (except system)
    while (size > MAX_PAYLOAD_SIZE && currentMessages.length > 1) {
        currentMessages.shift(); // Remove oldest
        // Note: In this specific app, the first message is a greeting. 
        // We might want to keep it if it's the only one, but here we prioritize size.
        size = getApproximateSize([...currentMessages, lastMessage]);
    }

    currentMessages.push(lastMessage);
    console.log(`Truncated payload size: ${(getApproximateSize(currentMessages) / 1024).toFixed(2)} KB`);
    return currentMessages;
};

export const fetchAdditionalApiCompletion = async (messages, address) => {
    // Truncate messages if needed to avoid 413 error
    const processedMessages = truncateHistory(messages);

    // Extract prompt safely, handling both string and array content (multi-modal)
    const lastMessage = processedMessages[processedMessages.length - 1];
    let promptText = "";
    if (typeof lastMessage.content === 'string') {
        promptText = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
        const textPart = lastMessage.content.find(part => part.type === 'text');
        promptText = textPart ? textPart.text : "";
    }

    console.log("Calling Groq Compound API for address:", address);
    console.log("Approximate Payload Size:", (getApproximateSize(processedMessages) / 1024).toFixed(2), "KB");

    try {
        const response = await groq.chat.completions.create({
            model: "groq/compound",
            messages: processedMessages,
        });

        console.log("Groq Compound API success response:", response);

        if (!response.choices || !response.choices[0] || !response.choices[0].message) {
            console.error("Groq Compound API returned unexpected format:", response);
            throw new Error("Invalid response format from Groq Compound API");
        }

        return response.choices[0].message;
    } catch (error) {
        if (error.status === 413) {
            console.error("CRITICAL: Payload still too large despite truncation efforts.");
        }
        console.error("Error in fetchAdditionalApiCompletion (Groq Compound):", error);
        throw error;
    }
};
