import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateJobStatus, createDocpack, supabase } from '$lib/supabase';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
	BUCKET_ACCESS_KEY_ID,
	BUCKET_SECRET_ACCESS_KEY,
	BUCKET_S3_ENDPOINT,
	DOCTOWN_BUILDER_SHARED_SECRET
} from '$env/static/private';

// Initialize S3 client for R2
const s3Client = new S3Client({
	region: 'auto',
	endpoint: BUCKET_S3_ENDPOINT,
	credentials: {
		accessKeyId: BUCKET_ACCESS_KEY_ID,
		secretAccessKey: BUCKET_SECRET_ACCESS_KEY
	}
});

const BUCKET_NAME = 'docpacks';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check authorization header
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${DOCTOWN_BUILDER_SHARED_SECRET}`;

		if (!authHeader || authHeader !== expectedAuth) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse multipart form data
		const formData = await request.formData();
		const jobId = formData.get('job_id') as string;
		const file = formData.get('file') as File;

		// Validate input
		if (!jobId || typeof jobId !== 'string') {
			return json({ error: 'Invalid or missing job_id' }, { status: 400 });
		}

		if (!file || !(file instanceof File)) {
			return json({ error: 'Invalid or missing file' }, { status: 400 });
		}

		// Verify job exists and is in 'building' status
		const { data: job, error: jobError } = await supabase
			.from('jobs')
			.select('*')
			.eq('id', jobId)
			.single();

		if (jobError || !job) {
			return json({ error: 'Job not found' }, { status: 404 });
		}

		if (job.status !== 'building') {
			return json(
				{ error: `Job is in ${job.status} status, expected building` },
				{ status: 400 }
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const filename = `${jobId}-${timestamp}.docpack`;

		// Upload file to R2
		const fileBuffer = await file.arrayBuffer();
		const uploadCommand = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: filename,
			Body: Buffer.from(fileBuffer),
			ContentType: 'application/zip'
		});

		await s3Client.send(uploadCommand);

		// Construct public URL
		const fileUrl = `${BUCKET_S3_ENDPOINT}/${BUCKET_NAME}/${filename}`;

		// Extract repo name from job.repo (e.g., "https://github.com/user/repo" -> "user/repo")
		const repoMatch = job.repo.match(/github\.com\/(.+?)(?:\.git)?$/);
		const fullName = repoMatch ? repoMatch[1] : job.repo;
		const name = fullName.split('/').pop() || 'unknown';

		// Create docpack entry in database
		const docpack = await createDocpack({
			job_id: jobId,
			name,
			full_name: fullName,
			description: null,
			file_url: fileUrl,
			public: false, // Default to private
			repo_url: job.repo,
			commit_hash: null, // Will be populated later when we have manifest parsing
			version: null,
			language: null
		});

		// Update job status to completed
		await updateJobStatus(jobId, 'completed');

		return json({
			success: true,
			docpack_id: docpack.id,
			file_url: fileUrl
		}, { status: 200 });
	} catch (error) {
		console.error('Error completing job:', error);
		return json({ error: 'Failed to complete job' }, { status: 500 });
	}
};
