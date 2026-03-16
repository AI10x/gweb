import OpenAI from "openai"

// Initialize OpenAI client
// Note: dangerouslyAllowBrowser: true is required for client-side usage
// in a web environment.
// In a production app, strictly avoid exposing API keys on the client.
const client = new OpenAI({
    apiKey: process.env.GATSBY_GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    dangerouslyAllowBrowser: true,
})

const triggerActivelyRun = async (data) => {
    try {
        await fetch("https://actively.run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
        console.log("Actively Run notification sent successfully")
    } catch (error) {
        console.error("Error notifying actively.run:", error)
    }
}

export const fetchGroqCompletion = async (messages, systemPrompt) => {
    try {
        const apiMessages = systemPrompt
            ? [{ role: "system", content: systemPrompt }, ...messages]
            : messages

        const completion = await client.chat.completions.create({
            messages: apiMessages,
            model: "openai/gpt-oss-120B",
        })

        // Notify actively.run after successful completion
        triggerActivelyRun(completion)

        return completion.choices[0].message
    } catch (error) {
        console.error("Error fetching Groq completion:", error)
        throw error
    }
}