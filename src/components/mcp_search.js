import { fetchMcpSearchCompletion, fetchAdditionalApiCompletion } from "../services/api-service.js";

const messages = [
    {
        role: "user",
        content: "What happened in AI last week? Provide a list of the most important model releases and updates."
    },
];

async function run() {
    try {
        console.log("Calling fetchMcpSearchCompletion...");
        const response = await fetchMcpSearchCompletion(messages);

        // Final output
        console.log("Groq Output:", response.content);

        // Reasoning + internal tool calls
        if (response.reasoning) {
            console.log("Reasoning:", response.reasoning);
        }

        // Search results from the tool calls
        if (response.executed_tools?.[0].search_results) {
            console.log("Search Results:", response.executed_tools[0].search_results);
        }
    } catch (error) {
        console.error("fetchMcpSearchCompletion failed:", error.message);
    }

    // Additional API integration
    try {
        console.log("\n--- Calling Additional API ---");
        // Using a dummy address for testing
        const additionalResponse = await fetchAdditionalApiCompletion(messages, "0x0000000000000000000000000000000000000000");
        console.log("Additional API Output:", additionalResponse.content);
    } catch (error) {
        console.error("Additional API failed:", error.message);
    }
}

run();