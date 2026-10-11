import { PUBLIC_SERVER_URL } from '$env/static/public';

// Badge images come straight from pstatic.net, which doesn't send
// CORS headers html-to-image needs to embed a cross-origin image when
// exporting the share card as a PNG — route them through our own backend
// (same-origin) instead. Used everywhere a badge is rendered, not just the
// share card, so the two stay visually identical and this doesn't need
// re-deriving if export ever gets added elsewhere too.
export function badgeImageUrl(originalUrl: string): string {
	return `${PUBLIC_SERVER_URL}/badge-image?url=${encodeURIComponent(originalUrl)}`;
}
