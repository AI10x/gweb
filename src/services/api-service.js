export const fetchAdditionalApiCompletion = async (messages, address) => {
    const apiUrl = process.env.GATSBY_ADDITIONAL_API_URL || "http://170.64.238.7:80/api/chat"; // Placeholder URL

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                address: address,
                prompt: messages[messages.length - 1].content // Including the prompt as requested
            }),
        });

        if (!response.ok) {
            throw new Error(`Additional API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message;
    } catch (error) {
        console.error("Error fetching Additional API completion:", error);
        throw error;
    }
};
