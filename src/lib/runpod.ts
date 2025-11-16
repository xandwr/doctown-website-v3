import { RUNPOD_ENDPOINT_ID, RUNPOD_API_KEY } from '$env/static/private';

/**
 * Parameters for triggering a build on RunPod
 */
export interface TriggerBuildParams {
	job_id: string;
	repo: string;
	git_ref: string;
	token: string;
}

/**
 * Response from RunPod API when triggering a build
 */
export interface RunPodResponse {
	id: string;
	status: string;
}

/**
 * Trigger a documentation build on RunPod
 *
 * @param params - Build parameters including job_id, repo, git_ref, and GitHub token
 * @returns Response from RunPod API
 * @throws Error if the request fails
 */
export async function triggerBuild(params: TriggerBuildParams): Promise<RunPodResponse> {
	const { job_id, repo, git_ref, token } = params;

	// Construct the RunPod API endpoint URL
	const url = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${RUNPOD_API_KEY}`
			},
			body: JSON.stringify({
				input: {
					job_id,
					repo,
					git_ref,
					github_token: token
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`RunPod API request failed: ${response.status} ${response.statusText} - ${errorText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error triggering RunPod build:', error);
		throw error;
	}
}
