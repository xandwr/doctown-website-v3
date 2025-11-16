// Docpack status represents the lifecycle of a documentation package
export type DocpackStatus = "pending" | "valid" | "public" | "failed";

// Extended docpack interface with status and versioning
export interface Docpack {
	id: string;
	name: string;
	full_name: string;
	description?: string;
	updated_at: string;
	status: DocpackStatus;
	repo_url: string;
	commit_hash?: string;
	version?: string;
	is_private?: boolean;
	language?: string | null;
}

// Status badge configuration
export const STATUS_CONFIG: Record<DocpackStatus, { color: string; label: string; description: string }> = {
	pending: {
		color: "orange",
		label: "Pending",
		description: "Docpack is awaiting generation. Click to configure and make public."
	},
	valid: {
		color: "green",
		label: "Valid",
		description: "Docpack has been generated and validated. Ready to publish."
	},
	public: {
		color: "cyan",
		label: "Public",
		description: "Docpack is live and accessible globally in the commons."
	},
	failed: {
		color: "red",
		label: "Failed",
		description: "Docpack generation failed. Check logs for details."
	}
};
