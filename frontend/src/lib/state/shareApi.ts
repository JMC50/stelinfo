import { PUBLIC_SERVER_URL } from '$env/static/public';
import type { ShareRecord, VerifyResult } from '$lib/types';

export async function createShare(stellarId: string, claimedHandle: string): Promise<ShareRecord> {
	const res = await fetch(`${PUBLIC_SERVER_URL}/streamer-info/${stellarId}/share`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ claimedHandle })
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.error ?? '공유 카드 생성에 실패했어요.');
	}
	return res.json();
}

export async function listMyShares(): Promise<ShareRecord[]> {
	const res = await fetch(`${PUBLIC_SERVER_URL}/me/shares`, { credentials: 'include' });
	if (!res.ok) return [];
	return res.json();
}

export async function revokeShare(id: string): Promise<boolean> {
	const res = await fetch(`${PUBLIC_SERVER_URL}/me/shares/${id}`, {
		method: 'DELETE',
		credentials: 'include'
	});
	return res.ok;
}

export async function verifyBatch(
	ids: string[],
	minFollowDays: number | null,
	minSubscribeMonths: number | null,
	stellarId: string | null
): Promise<VerifyResult[]> {
	const res = await fetch(`${PUBLIC_SERVER_URL}/verify/batch`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			ids,
			minFollowDays: minFollowDays ?? undefined,
			minSubscribeMonths: minSubscribeMonths ?? undefined,
			stellarId: stellarId ?? undefined
		})
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(body?.error ?? '조회에 실패했어요.');
	}
	return res.json();
}
