import { PUBLIC_SERVER_URL } from '$env/static/public';

export type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

function isSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

export function getNotificationPermission(): PermissionState {
	if (!isSupported()) return 'unsupported';
	return Notification.permission;
}

// applicationServerKey needs raw bytes, not the base64url string the VAPID
// key is transported as.
function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	const safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(safe);
	return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

let vapidKeyPromise: Promise<string> | null = null;
function getVapidPublicKey(): Promise<string> {
	vapidKeyPromise ??= fetch(`${PUBLIC_SERVER_URL}/push/vapid-public-key`)
		.then((res) => res.json())
		.then((body) => body.publicKey as string);
	return vapidKeyPromise;
}

async function getExistingSubscription(): Promise<PushSubscription | null> {
	if (!isSupported()) return null;
	const registration = await navigator.serviceWorker.ready;
	return registration.pushManager.getSubscription();
}

/** Which stellars this browser is currently subscribed to alerts for — used to seed toggle state on page load. */
export async function getEnabledStellarIds(): Promise<Set<string>> {
	const subscription = await getExistingSubscription();
	if (!subscription) return new Set();

	const res = await fetch(
		`${PUBLIC_SERVER_URL}/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
		{ credentials: 'include' }
	);
	if (!res.ok) return new Set();
	const body = await res.json();
	return new Set<string>(body.stellarIds ?? []);
}

/**
 * Turns on "방송 시작" alerts for one stellar. Requests notification
 * permission (and creates the browser's push subscription) on first use;
 * later calls just add another topic to the same subscription. Throws if
 * permission is denied or the browser doesn't support push at all.
 */
export async function enableStellarNotification(stellarId: string): Promise<void> {
	if (!isSupported()) throw new Error('unsupported');

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') throw new Error('permission-denied');

	const registration = await navigator.serviceWorker.ready;
	let subscription = await registration.pushManager.getSubscription();
	if (!subscription) {
		const publicKey = await getVapidPublicKey();
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			// lib.dom's PushManager typing wants a plain ArrayBuffer-backed
			// view; Uint8Array's own type is generic over ArrayBufferLike in
			// current TS, so it needs an explicit cast here.
			applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
		});
	}

	const json = subscription.toJSON();
	const res = await fetch(`${PUBLIC_SERVER_URL}/push/subscribe`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ subscription: { endpoint: json.endpoint, keys: json.keys }, stellarId })
	});
	if (!res.ok) throw new Error('subscribe-failed');
}

/** Turns off "방송 시작" alerts for one stellar (leaves the other topics/subscription itself alone). */
export async function disableStellarNotification(stellarId: string): Promise<void> {
	const subscription = await getExistingSubscription();
	if (!subscription) return;

	await fetch(`${PUBLIC_SERVER_URL}/push/subscribe`, {
		method: 'DELETE',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ endpoint: subscription.endpoint, stellarId })
	});
}
