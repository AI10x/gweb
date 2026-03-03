import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GATSBY_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

export const fetchAdditionalApiCompletion = async (messages, address) => {
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
        const response = await groq.chat.completions.create({
            model: "groq/compound",
            messages: messages,
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
