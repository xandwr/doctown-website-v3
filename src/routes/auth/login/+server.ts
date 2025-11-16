import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GITHUB_OAUTH_CLIENT_ID } from '$env/static/private';
import { dev } from '$app/environment';

export const GET: RequestHandler = async () => {
	// Generate state for CSRF protection
	const state = crypto.randomUUID();

	// Determine the redirect URI based on environment
	const redirectUri = dev
		? 'http://localhost:5173/auth/callback'
		: 'https://yourdomain.com/auth/callback'; // Update this for production

	// Build GitHub OAuth URL
	const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
	githubAuthUrl.searchParams.set('client_id', GITHUB_OAUTH_CLIENT_ID);
	githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
	githubAuthUrl.searchParams.set('scope', 'read:user user:email repo');
	githubAuthUrl.searchParams.set('state', state);

	throw redirect(302, githubAuthUrl.toString());
};
