import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '../../../hooks.server';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('session_id');

	if (sessionId) {
		deleteSession(sessionId);
	}

	// Delete the session cookie
	cookies.delete('session_id', { path: '/' });

	throw redirect(303, '/');
};
