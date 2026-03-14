import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
})

export default async function handler(req, res) {
    const { action, userId, chatData, id } = req.body

    try {
        switch (action) {
            case "init":
                await pool.query(`
          CREATE TABLE IF NOT EXISTS chat_data (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            chat_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `)
                return res.status(200).json({ message: "Table initialized" })

            case "insert":
                const insertRes = await pool.query(
                    "INSERT INTO chat_data (user_id, chat_data) VALUES ($1, $2) RETURNING *",
                    [userId, chatData]
                )
                return res.status(201).json(insertRes.rows[0])

            case "get":
                const getRes = await pool.query("SELECT * FROM chat_data WHERE id = $1", [id])
                return res.status(200).json(getRes.rows[0])

            case "update":
                const updateRes = await pool.query(
                    "UPDATE chat_data SET chat_data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
                    [chatData, id]
                )
                return res.status(200).json(updateRes.rows[0])

            case "delete":
                await pool.query("DELETE FROM chat_data WHERE id = $1", [id])
                return res.status(200).json({ message: "Record deleted" })

            case "list":
                const listRes = await pool.query("SELECT * FROM chat_data WHERE user_id = $1", [userId])
                return res.status(200).json(listRes.rows)

            default:
                return res.status(400).json({ error: "Invalid action" })
        }
    } catch (error) {
        console.error("Database error:", error)
        return res.status(500).json({ error: error.message })
    }
}
