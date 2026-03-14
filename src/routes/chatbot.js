import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
});
router.post("/", async (req, res) => {
    const { message } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant for a coffee roastery management system. Answer questions about inventory, roasting schedules, and general coffee knowledge." },
                { role: "user", content: message }
            ]
        });
        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "AI error occurred" });
    }
});

export default router;
