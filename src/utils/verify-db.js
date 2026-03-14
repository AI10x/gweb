const fetch = require("node-fetch")

async function testDatabase() {
    const API_URL = "http://localhost:8000/api/chat-storage"

    console.log("--- Testing Database Storage Gatsby Function ---")

    // 1. Initialize Table
    console.log("1. Initializing table...")
    const initRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init" }),
    })
    console.log("Result:", await initRes.json())

    // 2. Insert Chat Data
    console.log("\n2. Inserting chat data...")
    const insertRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "insert",
            userId: "user_123",
            chatData: { messages: [{ role: "user", content: "Hello" }] },
        }),
    })
    const insertedData = await insertRes.json()
    console.log("Result:", insertedData)

    const chatId = insertedData.id

    // 3. Get Chat Data
    console.log(`\n3. Getting chat data (ID: ${chatId})...`)
    const getRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", id: chatId }),
    })
    console.log("Result:", await getRes.json())

    // 4. Update Chat Data
    console.log(`\n4. Updating chat data (ID: ${chatId})...`)
    const updateRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "update",
            id: chatId,
            chatData: { messages: [{ role: "user", content: "Hello Updated" }] },
        }),
    })
    console.log("Result:", await updateRes.json())

    // 5. List Chat Data
    console.log("\n5. Listing all chat data for user_123...")
    const listRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", userId: "user_123" }),
    })
    console.log("Result:", await listRes.json())

    // 6. Delete Chat Data
    console.log(`\n6. Deleting chat data (ID: ${chatId})...`)
    const deleteRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: chatId }),
    })
    console.log("Result:", await deleteRes.json())
}

// testDatabase().catch(console.error)
