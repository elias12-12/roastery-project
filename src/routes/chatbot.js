import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

const openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});
router.post("/", async (req, res) => {
    const { message } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "user", content: message }
            ]
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: "AI error occurred" });
    }
});

export default router;
