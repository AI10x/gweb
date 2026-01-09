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

export const fetchGroqCompletion = async (messages) => {
    try {
        const completion = await client.chat.completions.create({
            messages: messages,
            model: "openai/gpt-oss-20B",
        })

        return completion.choices[0].message
    } catch (error) {
        console.error("Error fetching Groq completion:", error)
        throw error
    }
}