import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_SECRET } from '$env/static/private';
import { dev } from '$app/environment';
import { upsertUser, createSession } from '$lib/supabase';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code) {
		throw error(400, 'Missing authorization code');
	}

	// Exchange code for access token
	const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify({
			client_id: GITHUB_OAUTH_CLIENT_ID,
			client_secret: GITHUB_OAUTH_SECRET,
			code
		})
	});

	const tokenData = await tokenResponse.json();

	if (tokenData.error) {
		throw error(400, tokenData.error_description || 'Failed to get access token');
	}

	const accessToken = tokenData.access_token;

	// Fetch user data from GitHub
	const userResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github.v3+json'
		}
	});

	if (!userResponse.ok) {
		throw error(500, 'Failed to fetch user data');
	}

	const userData = await userResponse.json();

	try {
		// Upsert user in database (create or update)
		const user = await upsertUser({
			github_id: userData.id,
			github_login: userData.login,
			name: userData.name,
			avatar_url: userData.avatar_url,
			html_url: userData.html_url,
			access_token: accessToken
		});

		// Create session in database
		const session = await createSession(user.id);

		// Set session cookie
		cookies.set('session_id', session.session_token, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});
	} catch (err) {
		console.error('Error creating session:', err);
		throw error(500, 'Failed to create session');
	}

	throw redirect(303, '/');
};
