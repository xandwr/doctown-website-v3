// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from "$lib/supabase";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: User;
      accessToken?: string;
      hasActiveSubscription?: boolean;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
