import type { Handle } from '@sveltejs/kit';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_SECRET } from '$env/static/private';

// In-memory session store (for production, use Redis or a database)
const sessions = new Map<string, { user: GitHubUser; accessToken: string; expiresAt: number }>();

interface GitHubUser {
	id: number;
	login: string;
	name: string | null;
	avatar_url: string;
	html_url: string;
}

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		const session = sessions.get(sessionId);
		if (session && session.expiresAt > Date.now()) {
			event.locals.user = session.user;
			event.locals.accessToken = session.accessToken;
		} else if (session) {
			// Clean up expired session
			sessions.delete(sessionId);
			event.cookies.delete('session_id', { path: '/' });
		}
	}

	return resolve(event);
};

// Export session management functions
export function createSession(user: GitHubUser, accessToken: string): string {
	const sessionId = crypto.randomUUID();
	const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
	sessions.set(sessionId, { user, accessToken, expiresAt });
	return sessionId;
}

export function deleteSession(sessionId: string): void {
	sessions.delete(sessionId);
}

export function getSession(sessionId: string) {
	return sessions.get(sessionId);
}
