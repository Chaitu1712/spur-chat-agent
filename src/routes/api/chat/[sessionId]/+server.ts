import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { sessionId } = params;

	try {
		const messages = await prisma.message.findMany({
			where: { sessionId },
			orderBy: { createdAt: 'asc' }
		});

		return json({ messages });
	} catch (error) {
		console.error('Fetch History Error:', error);
		return json({ error: 'Failed to fetch conversation history' }, { status: 500 });
	}
};