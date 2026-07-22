<script lang="ts">
	import { tick, onDestroy, untrack } from 'svelte';
	import type { StellarProfile } from '$lib/types';

	let { stellars }: { stellars: StellarProfile[] } = $props();

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
	// `stellars` is only ever read here for this one-time initial build (see
	// the comment above) — untrack() makes that intentional "read once, not
	// reactively" choice explicit instead of tripping Svelte's warning about
	// reading state outside a reactive context.
	let scene = $state(untrack(() => buildScene(stellars, false, FALLBACK_W, FALLBACK_H)));
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

	// Press-and-drag physics for each avatar: `x`/`y` is the live offset from
	// the avatar's laid-out (cx, cy) spot, `vx`/`vy` its velocity in px/frame.
	// Kept as a plain (non-reactive) array — like the float bob below, it's
	// driven imperatively from the rAF loop for performance, not through
	// Svelte state.
	interface Physics {
		x: number;
		y: number;
		vx: number;
		vy: number;
		dragging: boolean;
	}
	let physics: Physics[] = [];
	const FRICTION = 0.95;
	const BOUNCE_DAMPING = 0.2;
	const MIN_VELOCITY = 0.03;
	const MAX_VELOCITY = 45;
	// How much a single pointermove sample can shift the tracked velocity.
	// Low, so one jumpy/low-dt sample right before release can't fling the
	// avatar off at an unrealistic speed — velocity instead reflects the
	// gesture's overall speed rather than its last instant.
	const VELOCITY_SMOOTHING = 0.25;
	// If the pointer has been still this long (ms) when it's released, treat
	// it as "placed" rather than "thrown".
	const STILL_THRESHOLD_MS = 80;

	function resetPhysics(count: number) {
		physics = Array.from({ length: count }, () => ({
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			dragging: false
		}));
	}
	untrack(() => resetPhysics(stellars.length));

	// Tracks the single in-progress pointer drag, if any. Pointer capture
	// (see handlePointerDown) guarantees move/up events for this pointerId
	// keep arriving on the same element even once the finger/cursor leaves it.
	let dragState: { pointerId: number; index: number; lastX: number; lastY: number; lastT: number } | null =
		null;

	function handlePointerDown(i: number, e: PointerEvent) {
		const el = e.currentTarget as HTMLElement;
		el.setPointerCapture(e.pointerId);
		el.parentElement?.classList.add('is-dragging');
		const p = physics[i];
		p.dragging = true;
		p.vx = 0;
		p.vy = 0;
		dragState = { pointerId: e.pointerId, index: i, lastX: e.clientX, lastY: e.clientY, lastT: performance.now() };
		e.preventDefault();
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragState || e.pointerId !== dragState.pointerId) return;
		const p = physics[dragState.index];
		const now = performance.now();
		const dt = Math.max(1, now - dragState.lastT);
		const dx = e.clientX - dragState.lastX;
		const dy = e.clientY - dragState.lastY;
		p.x += dx;
		p.y += dy;
		// Blend each sample into a running velocity estimate (in roughly
		// px/frame at ~60fps) instead of overwriting it — smooths out the
		// jittery per-event timing of pointermove so the throw reflects the
		// overall gesture speed, not whatever the single last sample was.
		const instVx = (dx / dt) * 16.6;
		const instVy = (dy / dt) * 16.6;
		p.vx = p.vx + (instVx - p.vx) * VELOCITY_SMOOTHING;
		p.vy = p.vy + (instVy - p.vy) * VELOCITY_SMOOTHING;
		dragState.lastX = e.clientX;
		dragState.lastY = e.clientY;
		dragState.lastT = now;
		e.preventDefault();
	}

	function handlePointerUp(e: PointerEvent) {
		if (!dragState || e.pointerId !== dragState.pointerId) return;
		(e.currentTarget as HTMLElement).parentElement?.classList.remove('is-dragging');
		const p = physics[dragState.index];
		p.dragging = false;

		// No pointermove fires while the pointer sits still, so lastT stays
		// at the time of the last *actual* movement. If that was a while
		// ago, the user paused in place before lifting — drop the stale
		// velocity from the earlier motion instead of flinging it.
		const idleMs = performance.now() - dragState.lastT;
		if (idleMs > STILL_THRESHOLD_MS) {
			p.vx = 0;
			p.vy = 0;
		} else {
			// Cap the release speed so one erratic pointermove sample can't
			// send the avatar flying unrealistically far.
			const speed = Math.hypot(p.vx, p.vy);
			if (speed > MAX_VELOCITY) {
				const scale = MAX_VELOCITY / speed;
				p.vx *= scale;
				p.vy *= scale;
			}
		}
		dragState = null;
	}

	// A single rAF loop drives the draw-on line, each avatar's float bob, and
	// now the drag/throw physics, all from the same clock, and rewrites the
	// polyline's points every frame from the avatars' live positions. That's
	// the only way the line's vertices can stay glued to the avatars even
	// *while* they're being thrown around — a CSS transition has no way to
	// know about a separate CSS animation's (or a drag's) current position,
	// so driving everything from one JS source is what keeps them in
	// lockstep at every instant, not just once settled.
	function startAnimation(el: SVGPolylineElement) {
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const pathLength = el.getTotalLength();
		el.style.strokeDasharray = `${pathLength}`;
		el.style.strokeDashoffset = reduceMotion ? '0' : `${pathLength}`;

		if (!reduceMotion) photoEls.forEach((p) => p?.classList.add('is-synced'));

		function frame() {
			const t = performance.now() / 1000 - mountTime;

			const points: string[] = [];
			for (let i = 0; i < scene.items.length; i++) {
				const item = scene.items[i];
				const p = physics[i];

				let offsetY = 0;
				if (!reduceMotion) {
					const elapsed = t - item.floatDelay;
					if (elapsed > 0) {
						const cyclePos =
							((elapsed % item.floatDuration) + item.floatDuration) % item.floatDuration;
						const progress = cyclePos / item.floatDuration;
						offsetY = -item.floatAmplitude * 0.5 * (1 - Math.cos(2 * Math.PI * progress));
					}
				}

				// Coast the thrown avatar on its last velocity, with friction,
				// bouncing softly off the orbit canvas edges so it never
				// permanently flies off-screen.
				if (!p.dragging && (Math.abs(p.vx) > MIN_VELOCITY || Math.abs(p.vy) > MIN_VELOCITY)) {
					p.x += p.vx;
					p.y += p.vy;
					p.vx *= FRICTION;
					p.vy *= FRICTION;

					const half = item.size / 2;
					const minX = half - item.cx;
					const maxX = orbitW - half - item.cx;
					const minY = half - item.cy;
					const maxY = orbitH - half - item.cy;

					if (p.x < minX) {
						p.x = minX;
						p.vx = Math.abs(p.vx) * BOUNCE_DAMPING;
					} else if (p.x > maxX) {
						p.x = maxX;
						p.vx = -Math.abs(p.vx) * BOUNCE_DAMPING;
					}
					if (p.y < minY) {
						p.y = minY;
						p.vy = Math.abs(p.vy) * BOUNCE_DAMPING;
					} else if (p.y > maxY) {
						p.y = maxY;
						p.vy = -Math.abs(p.vy) * BOUNCE_DAMPING;
					}
				} else if (!p.dragging) {
					p.vx = 0;
					p.vy = 0;
				}

				const photoEl = photoEls[i];
				if (photoEl)
					photoEl.style.transform = `translate(${p.x.toFixed(2)}px, ${(offsetY + p.y).toFixed(2)}px)`;
				points.push(`${item.cx + p.x},${item.cy + offsetY + p.y}`);
			}
			points.push(points[0]);
			el.setAttribute('points', points.join(' '));

			// Re-measure every frame: dragging an avatar changes the polyline's
			// actual total length, so a dasharray fixed at the original length
			// would fall out of sync and make the dash pattern repeat along the
			// now-longer (or shorter) path — which reads as the line randomly
			// breaking or vanishing partway through.
			const currentPathLength = el.getTotalLength();
			el.style.strokeDasharray = `${currentPathLength}`;

			if (!reduceMotion) {
				if (t < DRAW_DELAY) {
					el.style.strokeDashoffset = `${currentPathLength}`;
				} else if (t < DRAW_DELAY + DRAW_DURATION) {
					const drawProgress = easeInOutCubic((t - DRAW_DELAY) / DRAW_DURATION);
					el.style.strokeDashoffset = `${currentPathLength * (1 - drawProgress)}`;
				} else {
					el.style.strokeDashoffset = '0';
				}
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
		resetPhysics(scene.items.length);
		tick().then(() => {
			if (pathEl) startAnimation(pathEl);
		});
	});
</script>

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
				draggable="false"
				onpointerdown={(e) => handlePointerDown(i, e)}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
			/>
		</div>
	{/each}
</div>

<style>
	.orbit {
		position: relative;
		flex: 1;
		width: 100%;
		/* No fixed floor: flex items default to min-height:auto, which would
		   otherwise refuse to shrink below whatever this needs, forcing the
		   page taller than the viewport on short screens. min-height:0 lets
		   it shrink to fill exactly whatever space is actually left. */
		min-height: 0;
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

	.orbit-item:global(.is-dragging) {
		z-index: 5;
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
		touch-action: none;
		-webkit-user-drag: none;
		user-select: none;
		cursor: grab;
	}

	.orbit-item:global(.is-dragging) .orbit-photo {
		cursor: grabbing;
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
</style>
