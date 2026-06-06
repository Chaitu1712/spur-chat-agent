import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateReply } from '$lib/server/llm';

export const POST = async ({ request }) => {
    try {
        const { message, sessionId: incomingSessionId } = await request.json();
        let sessionId = incomingSessionId;

        if (!message || typeof message !== 'string') {
            return json({ error: "Invalid message format" }, { status: 400 });
        }

        const trimmedMessage = message.trim().slice(0, 1000);

        if (trimmedMessage.length === 0) {
            return json({ error: "Message is empty" }, { status: 400 });
        }

        const injectionPatterns = [
            "ignore all previous instructions",
            "ignore above instructions",
            "system prompt",
            "you are now a",
            "new role:"
        ];

        const potentialInjection = injectionPatterns.some(p => 
            trimmedMessage.toLowerCase().includes(p)
        );

        if (potentialInjection) {
            console.warn(`[Security] Potential prompt injection detected: ${trimmedMessage}`);
        }

        if (!sessionId) {
            const newSession = await prisma.session.create({ data: {} });
            sessionId = newSession.id;
        }

        await prisma.message.create({
            data: { sessionId, role: 'user', content: trimmedMessage }
        });

        const history = await prisma.message.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: 10
        });

        const aiReply = await generateReply(history.slice(0, -1), trimmedMessage);

        await prisma.message.create({
            data: { sessionId, role: 'ai', content: aiReply }
        });

        return json({ reply: aiReply, sessionId });

    } catch (error: any) {
        console.error("API ERROR:", error);
        return json({ error: "I'm having trouble processing that right now." }, { status: 500 });
    }
};