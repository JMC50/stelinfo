<script lang="ts">
	import { tick, onDestroy } from 'svelte';
	import type { StellarProfile } from '$lib/types';
	import { stellars } from '$lib/data/stellars';

	let { onLogin }: { onLogin: () => void } = $props();

	let loggingIn = $state(false);

	function shuffle(list: StellarProfile[]): StellarProfile[] {
		const copy = [...list];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	// Fallback canvas used only for the SSR-safe deterministic first paint,
	// before the real container size is known.
	const FALLBACK_W = 340;
	const FALLBACK_H = 280;
	const GAP = 8;

	// Finds the best available spot for a circle of the given size: cheap
	// random sampling first, then an exhaustive grid scan that is guaranteed
	// to find a fully clear spot if one exists anywhere on the canvas (random
	// sampling alone can miss it on a small/crowded canvas). If no spot
	// clears the required gap, it still returns whichever candidate had the
	// most breathing room, so overlap is minimized rather than left to luck.
	function findSpot(
		size: number,
		canvasW: number,
		canvasH: number,
		placed: { cx: number; cy: number; size: number }[]
	): { cx: number; cy: number; gap: number } {
		const gapAt = (cx: number, cy: number) =>
			placed.reduce((acc, p) => {
				const dist = Math.hypot(p.cx - cx, p.cy - cy) - p.size / 2 - size / 2;
				return Math.min(acc, dist);
			}, Infinity);

		for (let attempt = 0; attempt < 80; attempt++) {
			const cx = size / 2 + Math.random() * Math.max(1, canvasW - size);
			const cy = size / 2 + Math.random() * Math.max(1, canvasH - size);
			if (gapAt(cx, cy) >= GAP) return { cx, cy, gap: GAP };
		}

		let best = { cx: canvasW / 2, cy: canvasH / 2, gap: -Infinity };
		const step = Math.max(3, size / 8);
		for (let y = size / 2; y <= canvasH - size / 2; y += step) {
			for (let x = size / 2; x <= canvasW - size / 2; x += step) {
				const gap = gapAt(x, y);
				if (gap > best.gap) best = { cx: x, cy: y, gap };
				if (gap >= GAP) return best;
			}
		}
		return best;
	}

	// Tries the avatar at full size first, then shrinks it in steps until it
	// finds a spot with a clean gap — a smaller avatar beats an overlapping one.
	function scatterPosition(
		baseSize: number,
		canvasW: number,
		canvasH: number,
		placed: { cx: number; cy: number; size: number }[]
	): { cx: number; cy: number; size: number } {
		const sizeSteps = [baseSize, baseSize * 0.85, baseSize * 0.7, baseSize * 0.55];
		let fallback = { cx: canvasW / 2, cy: canvasH / 2, size: sizeSteps[sizeSteps.length - 1] };
		for (const size of sizeSteps) {
			const spot = findSpot(size, canvasW, canvasH, placed);
			if (spot.gap >= GAP) return { cx: spot.cx, cy: spot.cy, size };
			fallback = { cx: spot.cx, cy: spot.cy, size };
		}
		return fallback;
	}

	function buildOrbitItems(
		list: StellarProfile[],
		randomize: boolean,
		canvasW: number,
		canvasH: number
	) {
		const ordered = randomize ? shuffle(list) : list;
		const cols = 5;
		const placed: { cx: number; cy: number; size: number }[] = [];

		return ordered.map((stellar, i) => {
			let cx: number;
			let cy: number;
			let size: number;
			if (randomize) {
				const baseSize = 32 + Math.round(Math.random() * 16);
				({ cx, cy, size } = scatterPosition(baseSize, canvasW, canvasH, placed));
			} else {
				// Deterministic grid for the SSR-rendered first paint.
				size = 40;
				const col = i % cols;
				const row = Math.floor(i / cols);
				cx = (col + 0.5) * (canvasW / cols);
				cy = (row + 0.5) * (canvasH / 2);
			}
			placed.push({ cx, cy, size });

			return {
				stellar,
				cx,
				cy,
				leftPct: (cx / canvasW) * 100,
				topPct: (cy / canvasH) * 100,
				size,
				enterDelay: i * 0.035,
				floatDelay: randomize ? Math.random() * 1.4 : 0,
				floatDuration: randomize ? 3.6 + Math.random() * 1.8 : 4.4,
				floatAmplitude: randomize ? 6 + Math.random() * 4 : 8
			};
		});
	}

	// One continuous "single stroke" loop: start at one stellar, visit every
	// other stellar exactly once, then return to the starting point. The
	// polyline's viewBox is matched 1:1 to the container's real pixel size
	// (see orbitW/orbitH below) so no axis gets stretched unevenly — an
	// anisotropic (non-uniform) scale combined with a dash-offset animation
	// made browsers redraw the wrong dash segments each frame, which looked
	// like earlier parts of the line getting erased as new parts appeared.
	function buildScene(
		list: StellarProfile[],
		randomize: boolean,
		canvasW: number,
		canvasH: number
	) {
		const items = buildOrbitItems(list, randomize, canvasW, canvasH);
		const loop = [...items, items[0]];
		const pathPoints = loop.map((it) => `${it.cx},${it.cy}`).join(' ');
		return { items, pathPoints, canvasW, canvasH };
	}

	// Math.random() must not run during the initial render: SSR and the client
	// hydration pass would each pick a different shuffle, leaving image `src`
	// and `--tint` paired from two different orders. Render a fixed order first,
	// then reshuffle once mounted in the browser.
	let scene = $state(buildScene(stellars, false, FALLBACK_W, FALLBACK_H));
	let pathEl: SVGPolylineElement | undefined = $state();
	let photoEls: (HTMLImageElement | undefined)[] = $state([]);
	let orbitW = $state(0);
	let orbitH = $state(0);
	let hasRandomized = false;
	let rafId = 0;
	let mountTime = 0;

	function easeInOutCubic(x: number): number {
		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
	}

	const DRAW_DELAY = 0.4;
	const DRAW_DURATION = 2.6;

	// A single rAF loop drives both the draw-on line and each avatar's float
	// bob from the same clock, and rewrites the polyline's points every frame
	// from the avatars' live offsets. That's the only way the line's vertices
	// can stay glued to the avatars even *while* the line is still being
	// drawn — a CSS transition has no way to know about a separate CSS
	// animation's current position, so driving both from one JS source is
	// what keeps them in lockstep at every instant, not just once settled.
	function startAnimation(el: SVGPolylineElement) {
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const pathLength = el.getTotalLength();
		el.style.strokeDasharray = `${pathLength}`;

		if (reduceMotion) {
			el.style.strokeDashoffset = '0';
			return;
		}

		photoEls.forEach((p) => p?.classList.add('is-synced'));
		el.style.strokeDashoffset = `${pathLength}`;

		function frame() {
			const t = performance.now() / 1000 - mountTime;

			const points: string[] = [];
			for (let i = 0; i < scene.items.length; i++) {
				const item = scene.items[i];
				const elapsed = t - item.floatDelay;
				let offsetY = 0;
				if (elapsed > 0) {
					const cyclePos =
						((elapsed % item.floatDuration) + item.floatDuration) % item.floatDuration;
					const progress = cyclePos / item.floatDuration;
					offsetY = -item.floatAmplitude * 0.5 * (1 - Math.cos(2 * Math.PI * progress));
				}
				const photoEl = photoEls[i];
				if (photoEl) photoEl.style.transform = `translateY(${offsetY.toFixed(2)}px)`;
				points.push(`${item.cx},${item.cy + offsetY}`);
			}
			points.push(points[0]);
			el.setAttribute('points', points.join(' '));

			if (t < DRAW_DELAY) {
				el.style.strokeDashoffset = `${pathLength}`;
			} else if (t < DRAW_DELAY + DRAW_DURATION) {
				const drawProgress = easeInOutCubic((t - DRAW_DELAY) / DRAW_DURATION);
				el.style.strokeDashoffset = `${pathLength * (1 - drawProgress)}`;
			} else {
				el.style.strokeDashoffset = '0';
			}

			rafId = requestAnimationFrame(frame);
		}
		rafId = requestAnimationFrame(frame);
	}

	onDestroy(() => {
		if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(rafId);
	});

	// Waits for bind:clientWidth/clientHeight on .orbit to report the real,
	// rendered size before building the randomized scene against it.
	$effect(() => {
		if (hasRandomized || !orbitW || !orbitH) return;
		hasRandomized = true;
		mountTime = performance.now() / 1000;
		scene = buildScene(stellars, true, orbitW, orbitH);
		tick().then(() => {
			if (pathEl) startAnimation(pathEl);
		});
	});

	function handleClick() {
		if (loggingIn) return;
		loggingIn = true;
		setTimeout(() => {
			onLogin();
		}, 700);
	}
</script>

<section class="login">
	<div class="brand">
		<span class="brand-mark">STELLOG</span>
		<p class="brand-sub">스텔라이브 팔로우 확인 서비스</p>
	</div>

	<div class="orbit" aria-hidden="true" bind:clientWidth={orbitW} bind:clientHeight={orbitH}>
		<div class="orbit-glow"></div>
		<svg class="orbit-lines" viewBox={`0 0 ${scene.canvasW} ${scene.canvasH}`}>
			<polyline bind:this={pathEl} class="constellation-path" points={scene.pathPoints} />
		</svg>
		{#each scene.items as item, i (item.stellar.id)}
			<div
				class="orbit-item"
				style={`--left-pct:${item.leftPct}%; --top-pct:${item.topPct}%; --size:${item.size}px; --enter-delay:${item.enterDelay}s`}
			>
				<img
					bind:this={photoEls[i]}
					class="orbit-photo"
					style={`--tint:${item.stellar.color}; --float-delay:${item.floatDelay}s; --float-duration:${item.floatDuration}s`}
					src={item.stellar.image}
					alt=""
				/>
			</div>
		{/each}
	</div>

	<div class="login-box">
		<h1>스텔로그에 오신 것을 환영해요</h1>
		<p class="desc">치지직 계정으로 로그인 후<br />스텔라의 팔로우 정보를 확인해보세요.</p>
		<button class="chzzk-btn" onclick={handleClick} disabled={loggingIn}>
			{#if loggingIn}
				<span class="spinner" aria-hidden="true"></span>
				연동하는 중...
			{:else}
				<span class="chzzk-dot" aria-hidden="true"></span>
				치지직 로그인
			{/if}
		</button>
		<p class="disclaimer">본 서비스는 디자인 검토용 데모이며, 모든 데이터는 더미입니다.</p>
	</div>
</section>

<style>
	.login {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.brand {
		margin-top: 12px;
	}

	.brand-mark {
		font-size: 28px;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: var(--color-primary);
	}

	.brand-sub {
		margin-top: 6px;
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.orbit {
		position: relative;
		flex: 1;
		width: 100%;
		min-height: 280px;
		margin: 20px 0;
	}

	.orbit-glow {
		position: absolute;
		inset: 10% 15%;
		border-radius: 50%;
		background: radial-gradient(circle, var(--color-bg-soft) 0%, rgba(218, 224, 252, 0) 70%);
		z-index: 0;
		pointer-events: none;
	}

	.orbit-lines {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		pointer-events: none;
	}

	.constellation-path {
		fill: none;
		stroke: var(--color-primary);
		stroke-opacity: 0.18;
		stroke-width: 1;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.orbit-item {
		position: absolute;
		z-index: 2;
		width: var(--size, 56px);
		height: var(--size, 56px);
		left: calc(var(--left-pct, 50%) - var(--size) / 2);
		top: calc(var(--top-pct, 50%) - var(--size) / 2);
		opacity: 0;
		animation: orbit-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) var(--enter-delay, 0s) both;
	}

	.orbit-photo {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--tint, #fff);
		box-shadow:
			0 6px 14px rgba(134, 127, 219, 0.16),
			0 0 16px 3px color-mix(in srgb, var(--tint, #fff) 40%, transparent);
		animation: orbit-float var(--float-duration, 4s) ease-in-out var(--float-delay, 0s) infinite;
	}

	/* Once the constellation line finishes drawing, the float motion switches
	   to JS (see startFloatSync) so the line's vertices can track it exactly;
	   the CSS animation must step aside so it stops fighting that transform. */
	.orbit-photo:global(.is-synced) {
		animation: none;
	}

	@keyframes orbit-in {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 0.92;
			transform: scale(1);
		}
	}

	@keyframes orbit-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.orbit-item {
			animation: none;
			opacity: 0.92;
		}
		.orbit-photo {
			animation: none;
		}
	}

	.login-box {
		width: 100%;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-soft);
		padding: 28px 22px calc(24px + var(--safe-bottom));
	}

	.login-box h1 {
		font-size: 19px;
		font-weight: 700;
	}

	.desc {
		margin-top: 10px;
		font-size: 14px;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.chzzk-btn {
		margin-top: 22px;
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: none;
		border-radius: var(--radius-sm);
		padding: 15px 18px;
		background: #15181b;
		color: #ffffff;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.chzzk-btn:active {
		transform: scale(0.98);
	}

	.chzzk-btn:disabled {
		opacity: 0.75;
		cursor: default;
	}

	.chzzk-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #00ffa3;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: #ffffff;
		animation: spin 0.8s linear infinite;
	}

	.disclaimer {
		margin-top: 14px;
		font-size: 11px;
		color: var(--color-text-muted);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
