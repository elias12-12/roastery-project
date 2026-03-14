import express from 'express';
import OpenAI from 'openai';
import { ProductsServices } from '../services/ProductsServices.js';
import { ProductsRepository } from '../domain/repositories/ProductsRepository.js';

const router = express.Router();

// Initialize Products service
const productsRepository = new ProductsRepository();
const productsService = new ProductsServices(productsRepository);

// Initialize OpenAI client
const openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

// Simple intent detection based on keywords
function detectIntent(message) {
    const msg = message.toLowerCase();
    if (msg.includes("product") || msg.includes("available") || msg.includes("stock") || msg.includes("inventory") || msg.includes("catalog")) {
        return "products";
    }
    return "general";
}

// Chatbot POST route
router.post("/", async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === "") {
        return res.json({ reply: "Please type a message first." });
    }

    try {
        // Detect user intent
        const intent = detectIntent(message);
        let productData = "";

        // Fetch full products data if needed
        if (intent === "products") {
            try {
                const products = await productsService.getAllProducts();
                if (products.length > 0) {
                    productData = JSON.stringify(products);
                } else {
                    productData = "No products available at the moment.";
                }
            } catch (dbError) {
                console.error("Error fetching products:", dbError);
                productData = "Error fetching products from the database.";
            }
        }

        // Prepare system message for AI
        const systemContent = intent === "products"
            ? `You are a Roastery AI assistant. Use this full product data to answer the user:\n${productData}`
            : "You are a Roastery AI assistant. You can only answer questions about products.";

        // Call the AI
        let aiReply = "Sorry, I couldn't generate a response.";
        try {
            const aiResponse = await openai.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemContent },
                    { role: "user", content: message }
                ]
            });
            aiReply = aiResponse.choices[0].message.content;
        } catch (aiError) {
            console.error("Error calling OpenAI API:", aiError);
            aiReply = "AI service error occurred. Please try again later.";
        }

        // Send response back to frontend
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("Unexpected error in chatbot route:", error);
        res.status(500).json({ error: "Unexpected server error." });
    }
});

export default router;