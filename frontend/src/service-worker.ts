import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

// Locally-typed override (rather than a project-wide `webworker` lib
// reference) so this file gets ServiceWorkerGlobalScope's shape without
// conflicting with the rest of the app's `dom` lib globals.
declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

interface PushPayload {
	title: string;
	body: string;
	url: string;
	icon?: string;
}

// Payload shape is whatever the backend sent in push.ts's JSON.stringify —
// see stelinfo/backend/src/push.ts.
self.addEventListener('push', (event) => {
	if (!event.data) return;

	let data: PushPayload;
	try {
		data = event.data.json();
	} catch {
		return;
	}

	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: data.icon ?? '/icons/icon.png',
			data: { url: data.url }
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';

	// Broadcast-started notifications link straight to chzzk.naver.com (see
	// stelinfo/backend/src/push.ts), not to a page of ours -- reusing an
	// already-open stelinfo tab for that would yank it away from whatever
	// the viewer was doing here, so cross-origin targets always get a fresh
	// tab instead of hijacking an existing client.
	const isSameOrigin = new URL(url, self.location.origin).origin === self.location.origin;

	event.waitUntil(
		(async () => {
			if (isSameOrigin) {
				const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
				const existing = clientList[0];
				if (existing) {
					await existing.navigate(url);
					await existing.focus();
					return;
				}
			}
			await self.clients.openWindow(url);
		})()
	);
});
