import express from 'express';
import OpenAI from 'openai';
import { ProductsServices } from '../services/ProductsServices.js';
import { ProductsRepository } from '../domain/repositories/ProductsRepository.js';
import { SalesServices } from '../services/SalesServices.js';
import { SalesRepository } from '../domain/repositories/SalesRepository.js';

const router = express.Router();


const productsRepository = new ProductsRepository();
const productsService = new ProductsServices(productsRepository);

const salesRepository = new SalesRepository();
const salesService = new SalesServices(salesRepository);

// Initialize OpenAI-compatible client (Groq)
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

// Very small in-memory rate limiter (per IP). Good enough for a course project/demo.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 min
const RATE_LIMIT_MAX = 20; // 20 req/min per IP
const requestsByIp = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const timestamps = requestsByIp.get(ip) || [];
    const next = timestamps.filter(ts => ts >= windowStart);
    next.push(now);
    requestsByIp.set(ip, next);
    return next.length > RATE_LIMIT_MAX;
}

function sanitizeHistory(history, maxMessages = 8) {
    if (!Array.isArray(history)) return [];
    const trimmed = history
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
    return trimmed.slice(-maxMessages);
}

function buildSystemPrompt({ currentUser }) {
    const role = currentUser?.role || 'guest';
    const name = currentUser?.first_name ? `${currentUser.first_name}` : null;

    return [
        `You are "Roastery AI Assistant" inside a coffee roastery management web app.`,
        `User role: ${role}${name ? ` (name: ${name})` : ''}.`,
        `You have access to tools for retrieving real data from the app.`,
        `Rules:`,
        `- Use tools when you need product/order data; do not invent database results.`,
        `- Keep answers concise and actionable.`,
        `- If a request is out of scope (e.g., unrelated topics), politely redirect to what you can do in this app.`,
        role === 'guest'
            ? `- Guest users: only answer general questions about products and store features; do not claim to access "my orders".`
            : `- Logged-in users: you may access "my recent orders" via tools when helpful.`,
    ].join('\n');
}

const TOOL_DEFS = [
    {
        type: "function",
        function: {
            name: "search_products",
            description: "Search the product catalog using optional filters.",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    query: { type: "string", description: "Search text (name/description)" },
                    minPrice: { anyOf: [{ type: "number" }, { type: "string" }], description: "Minimum unit price" },
                    maxPrice: { anyOf: [{ type: "number" }, { type: "string" }], description: "Maximum unit price" },
                    productType: { type: "string", description: "Exact product type" },
                    status: { type: "string", description: "Product status, e.g. 'available'" },
                    limit: { anyOf: [{ type: "number" }, { type: "string" }], description: "Max results (1-25)" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_product_by_id",
            description: "Get a product by its ID.",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    product_id: { anyOf: [{ type: "number" }, { type: "string" }] },
                },
                required: ["product_id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_my_recent_orders",
            description: "Get the current logged-in user's most recent orders (sales).",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    limit: { anyOf: [{ type: "number" }, { type: "string" }], description: "Max results (1-10)" },
                },
            },
        },
    },
];

async function runTool({ toolName, args, req }) {
    switch (toolName) {
        case "search_products": {
            const products = await productsService.searchProducts({
                query: args?.query,
                minPrice: args?.minPrice != null && args?.minPrice !== '' ? Number(args.minPrice) : undefined,
                maxPrice: args?.maxPrice != null && args?.maxPrice !== '' ? Number(args.maxPrice) : undefined,
                productType: args?.productType,
                status: args?.status,
                limit: args?.limit != null && args?.limit !== '' ? Number(args.limit) : undefined,
            });
            return products.map(p => ({
                product_id: p.product_id,
                product_name: p.product_name,
                description: p.description,
                unit_price: p.unit_price,
                product_type: p.product_type,
                status: p.status,
            }));
        }
        case "get_product_by_id": {
            const product = await productsService.getProductById(Number(args?.product_id));
            return product
                ? {
                    product_id: product.product_id,
                    product_name: product.product_name,
                    description: product.description,
                    unit_price: product.unit_price,
                    product_type: product.product_type,
                    status: product.status,
                }
                : null;
        }
        case "get_my_recent_orders": {
            const userId = req.session?.user?.user_id;
            if (!userId) {
                return { error: "NOT_AUTHENTICATED" };
            }
            const limit = Math.min(Math.max(parseInt(String(args?.limit ?? ''), 10) || 5, 1), 10);
            const orders = await salesService.getSalesByCustomer(userId);
            return orders.slice(0, limit).map(o => ({
                sale_id: o.sale_id,
                sale_date: o.sale_date,
                total_amount: o.total_amount,
                subtotal: o.subtotal,
                discount_percentage: o.discount_percentage,
            }));
        }
        default:
            return { error: "UNKNOWN_TOOL" };
    }
}

// Chatbot POST route
router.post("/", async (req, res) => {
    const { message, history } = req.body;

    if (!message || message.trim() === "") {
        return res.json({ reply: "Please type a message first." });
    }

    if (message.length > 1000) {
        return res.status(400).json({ reply: "Message is too long. Please keep it under 1000 characters." });
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
        return res.status(429).json({ reply: "Too many requests. Please wait a moment and try again." });
    }

    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ reply: "Chatbot is not configured (missing GROQ_API_KEY)." });
        }

        const currentUser = req.session?.user || null;
        const safeHistory = sanitizeHistory(history);

        const baseMessages = [
            { role: "system", content: buildSystemPrompt({ currentUser }) },
            ...safeHistory,
            { role: "user", content: message.trim() },
        ];

        // 1) First model call: allow tool selection
        const first = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: baseMessages,
            tools: TOOL_DEFS,
            tool_choice: "auto",
            temperature: 0.4,
        });

        const firstMsg = first.choices?.[0]?.message;
        const toolCalls = firstMsg?.tool_calls || [];

        // If no tools needed, return direct response
        if (!toolCalls.length) {
            const direct = firstMsg?.content?.trim() || "Sorry, I couldn't generate a response.";
            return res.json({ reply: direct });
        }

        // 2) Execute tool calls and send tool outputs back
        const toolMessages = [];
        for (const call of toolCalls) {
            const toolName = call?.function?.name;
            let args = {};
            try {
                args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
            } catch {
                args = {};
            }

            try {
                const result = await runTool({ toolName, args, req });
                toolMessages.push({
                    role: "tool",
                    tool_call_id: call.id,
                    content: JSON.stringify(result),
                });
            } catch (toolErr) {
                toolMessages.push({
                    role: "tool",
                    tool_call_id: call.id,
                    content: JSON.stringify({ error: "TOOL_EXECUTION_FAILED", message: toolErr?.message || String(toolErr) }),
                });
            }
        }

        const second = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [...baseMessages, firstMsg, ...toolMessages],
            temperature: 0.4,
        });

        const finalReply = second.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";
        res.json({ reply: finalReply });

    } catch (error) {
        console.error("Unexpected error in chatbot route:", error);
        res.status(500).json({ error: "Unexpected server error." });
    }
});
    
export default router;