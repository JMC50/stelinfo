import { PUBLIC_SERVER_URL } from '$env/static/public';
import type { ChzzkUser } from '$lib/types';

// App-wide login state. Checked once (root layout, on mount) and read from
// wherever a route needs to know who's logged in — routes redirect based on
// `checked`/`user` instead of each doing their own /me fetch.
let user = $state<ChzzkUser | null>(null);
let checked = $state(false);

async function check(): Promise<void> {
	const res = await fetch(`${PUBLIC_SERVER_URL}/me`, { credentials: 'include' });
	user = res.ok ? await res.json() : null;
	checked = true;
}

async function logout(): Promise<void> {
	await fetch(`${PUBLIC_SERVER_URL}/logout`, { method: 'POST', credentials: 'include' });
	user = null;
}

export const auth = {
	get user() {
		return user;
	},
	get checked() {
		return checked;
	},
	check,
	logout
};
