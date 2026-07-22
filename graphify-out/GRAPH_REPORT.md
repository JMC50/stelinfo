# Graph Report - stelinfo  (2026-07-23)

## Corpus Check
- 23 files · ~27,916 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 196 nodes · 192 edges · 28 communities (13 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28f0aa89`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Frontend Development Dependencies
- Package Metadata
- Frontend NPM Scripts
- Frontend TypeScript Configuration
- Svelte UI Components
- Backend TypeScript Configuration
- Backend Express Dependencies
- Frontend Project Documentation
- Global Layout and Styles
- Backend Application Entry
- ESLint Configuration File
- Prettier Configuration File
- Global Type Declarations
- Svelte Favicon Asset
- Aokumo Rin Avatar
- Arahashi Tabi Avatar
- Ayatsuno Yuni Avatar
- Gangzi Avatar
- Hanako Nana Avatar
- Neneko Mashiro Avatar
- Sakihane Huya Avatar
- Shirayuki Hina Avatar
- Tenko Shibuki Avatar
- Yuzuha Riko Avatar
- Robots Exclusion Configuration

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 11 edges
2. `$lib/types` - 11 edges
3. `compilerOptions` - 11 edges
4. `scripts` - 9 edges
5. `$lib/components/InfoDetail.svelte` - 6 edges
6. `fetchLatestUpload()` - 5 edges
7. `$lib/data/stellars` - 5 edges
8. `scripts` - 5 edges
9. `fetchPlaylistItems()` - 4 edges
10. `fetchLatestMusicVideo()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stellar Member Avatars** — frontend_static_images_stellars_akane_lize, frontend_static_images_stellars_aokumo_rin, frontend_static_images_stellars_arahashi_tabi, frontend_static_images_stellars_ayatsuno_yuni, frontend_static_images_stellars_gangzi, frontend_static_images_stellars_hanako_nana, frontend_static_images_stellars_neneko_mashiro, frontend_static_images_stellars_sakihane_huya, frontend_static_images_stellars_shirayuki_hina, frontend_static_images_stellars_tenko_shibuki, frontend_static_images_stellars_yuzuha_riko [EXTRACTED 1.00]

## Communities (28 total, 15 thin omitted)

### Community 0 - "Frontend Development Dependencies"
Cohesion: 0.06
Nodes (35): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-svelte, globals, prettier, prettier-plugin-svelte (+27 more)

### Community 1 - "Package Metadata"
Cohesion: 0.10
Nodes (19): author, bugs, url, description, homepage, keywords, license, main (+11 more)

### Community 2 - "Frontend NPM Scripts"
Cohesion: 0.22
Nodes (14): fetchLatestMusicVideo(), fetchLatestUpload(), fetchPlaylistItems(), getStellarYoutubeSummary(), mostRecent(), resolveUploadsPlaylistId(), StellarYoutubeConfig, StellarYoutubeSummary (+6 more)

### Community 3 - "Frontend TypeScript Configuration"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 4 - "Svelte UI Components"
Cohesion: 0.18
Nodes (12): $lib/components/InfoDetail.svelte, $lib/components/LoginScreen.svelte, $lib/components/StellarGrid.svelte, $lib/data/stellars, stellars, $lib/types, ChzzkUser, StellarLinks (+4 more)

### Community 5 - "Backend TypeScript Configuration"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule, rootDir (+3 more)

### Community 6 - "Backend Express Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, cookie-parser, cors, dotenv, express, got-scraping, playwright, @types/express (+12 more)

### Community 7 - "Frontend Project Documentation"
Cohesion: 0.40
Nodes (5): Frontend README, App Shell (HTML), Akane Lize Avatar, Stellog Demo Project, SvelteKit Framework

### Community 10 - "Backend Application Entry"
Cohesion: 0.12
Nodes (17): cache, captureChannelPage(), CapturedResponses, getBrowser(), getLatestBroadcast(), LatestBroadcast, stellarChannelIds, app (+9 more)

### Community 26 - "Robots Exclusion Configuration"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, check, check:watch, dev, format (+5 more)

## Knowledge Gaps
- **120 isolated node(s):** `@types/express`, `cookie-parser`, `cors`, `dotenv`, `express` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Frontend Development Dependencies` to `Robots Exclusion Configuration`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `@types/express`, `cookie-parser`, `cors` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Development Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Package Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Frontend TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Backend Express Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Backend Application Entry` be split into smaller, more focused modules?**
  _Cohesion score 0.12105263157894737 - nodes in this community are weakly interconnected._