// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { MeResponse } from '$lib/api/types';

declare global {
  namespace App {
    interface Locals {
      user: MeResponse | null;
    }

    interface PageData {
      user: MeResponse | null;
    }

  }
}

export { };
