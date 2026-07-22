import { PUBLIC_SERVER_URL } from '$env/static/public';
import type { StreamerInfo } from '$lib/types';

// Fetched once on the select screen (while its tile shows a loading spinner)
// and read back instantly on the destination /stellar/[id] page, so that
// page doesn't need its own loading flash for the common "clicked a tile"
// path. Direct navigation (refresh, shared link) just falls back to
// fetching normally via the same function.
const cache = new Map<string, StreamerInfo>();

export async function fetchStreamerInfo(id: string): Promise<StreamerInfo | null> {
	const cached = cache.get(id);
	if (cached) return cached;

	const res = await fetch(`${PUBLIC_SERVER_URL}/streamer-info/${id}`, { credentials: 'include' });
	if (!res.ok) return null;

	const data: StreamerInfo = await res.json();
	cache.set(id, data);
	return data;
}

export function getCachedStreamerInfo(id: string): StreamerInfo | null {
	return cache.get(id) ?? null;
}
