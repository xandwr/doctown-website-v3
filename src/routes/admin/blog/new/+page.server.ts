import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, "/auth/login");
  }

  const username = locals.user.login || locals.user.github_login;
  if (username !== "xandwr") {
    throw redirect(303, "/");
  }

  return {};
};
