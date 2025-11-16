import { json, type RequestHandler } from '@sveltejs/kit';
import { getUserDocpacks, getPublicDocpacks } from '$lib/supabase';

export const GET: RequestHandler = async ({ locals, url }) => {
	const publicOnly = url.searchParams.get('public') === 'true';

	try {
		if (publicOnly) {
			// Fetch public docpacks - no authentication required
			const docpacks = await getPublicDocpacks();
			return json({ docpacks });
		} else {
			// Fetch user's docpacks - authentication required
			if (!locals.user) {
				return json(
					{ error: 'Unauthorized' },
					{ status: 401 }
				);
			}

			const docpacks = await getUserDocpacks(locals.user.id);
			return json({ docpacks });
		}
	} catch (error) {
		console.error('Error fetching docpacks:', error);
		return json(
			{ error: 'Failed to fetch docpacks' },
			{ status: 500 }
		);
	}
};
