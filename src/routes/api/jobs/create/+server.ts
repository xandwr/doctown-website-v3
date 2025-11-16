import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createJob } from '$lib/supabase';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { repo, git_ref } = body;

		// Validate input
		if (!repo || typeof repo !== 'string') {
			return json({ error: 'Invalid or missing repo' }, { status: 400 });
		}

		if (!git_ref || typeof git_ref !== 'string') {
			return json({ error: 'Invalid or missing git_ref' }, { status: 400 });
		}

		// Create job in database
		const job = await createJob({
			user_id: locals.user.id,
			repo,
			git_ref
		});

		// Return job ID and initial status
		return json({
			job_id: job.id,
			status: job.status,
			created_at: job.created_at
		}, { status: 201 });
	} catch (error) {
		console.error('Error creating job:', error);
		return json({ error: 'Failed to create job' }, { status: 500 });
	}
};
