# Graph Report - stelinfo  (2026-07-27)

## Corpus Check
- 38 files · ~45,092 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 249 nodes · 279 edges · 29 communities (15 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a852882d`
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
- devDependencies

## God Nodes (most connected - your core abstractions)
1. `$lib/types` - 16 edges
2. `compilerOptions` - 11 edges
3. `$lib/state/auth.svelte` - 11 edges
4. `compilerOptions` - 11 edges
5. `scripts` - 9 edges
6. `$lib/components/InfoDetail.svelte` - 8 edges
7. `$lib/state/streamerInfoCache` - 7 edges
8. `$lib/data/stellars` - 6 edges
9. `fetchLatestUpload()` - 5 edges
10. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Session` --references--> `ChzzkUser`  [EXTRACTED]
  backend/src/session.ts → backend/src/chzzkAuth.ts
- `getFollowSubscribeInfo()` --calls--> `getChatChannelId()`  [EXTRACTED]
  backend/src/chzzkProfile.ts → backend/src/chzzkBroadcast.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stellar Member Avatars** — frontend_static_images_stellars_akane_lize, frontend_static_images_stellars_aokumo_rin, frontend_static_images_stellars_arahashi_tabi, frontend_static_images_stellars_ayatsuno_yuni, frontend_static_images_stellars_gangzi, frontend_static_images_stellars_hanako_nana, frontend_static_images_stellars_neneko_mashiro, frontend_static_images_stellars_sakihane_huya, frontend_static_images_stellars_shirayuki_hina, frontend_static_images_stellars_tenko_shibuki, frontend_static_images_stellars_yuzuha_riko [EXTRACTED 1.00]

## Communities (29 total, 14 thin omitted)

### Community 0 - "Frontend Development Dependencies"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-svelte, devDependencies, eslint, eslint-config-prettier, @eslint/js (+31 more)

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
Cohesion: 0.08
Nodes (22): ../app.css, $lib/components/InfoDetail.svelte, followDateOnly, followDays, $lib/components/LoginScreen.svelte, $lib/components/RotateHint.svelte, $lib/components/StellarGrid.svelte, $lib/data/stellars (+14 more)

### Community 5 - "Backend TypeScript Configuration"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule, rootDir (+3 more)

### Community 6 - "Backend Express Dependencies"
Cohesion: 0.10
Nodes (19): dependencies, cookie-parser, cors, dotenv, express, @types/express, main, name (+11 more)

### Community 7 - "Frontend Project Documentation"
Cohesion: 0.40
Nodes (5): Frontend README, App Shell (HTML), Akane Lize Avatar, Stellog Demo Project, SvelteKit Framework

### Community 9 - "Global Layout and Styles"
Cohesion: 0.13
Nodes (20): buildAuthorizeUrl(), ChzzkEnvelope, ChzzkTokenResponse, ChzzkUser, consumeState(), exchangeCodeForToken(), fetchChzzkUser(), pendingStates (+12 more)

### Community 10 - "Backend Application Entry"
Cohesion: 0.21
Nodes (11): CHAT_CHANNEL_IDS, getChatChannelId(), getLatestBroadcast(), getSubserverBaseUrl(), LatestBroadcast, cache, FollowSubscribeInfo, getFollowSubscribeInfo() (+3 more)

### Community 26 - "Robots Exclusion Configuration"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, check, check:watch, dev, format (+5 more)

### Community 28 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, concurrently, @types/cookie-parser, @types/cors, @types/node, typescript, @types/node, typescript (+3 more)

## Knowledge Gaps
- **134 isolated node(s):** `name`, `version`, `private`, `main`, `build` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Frontend Development Dependencies` to `Robots Exclusion Configuration`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `$lib/state/auth.svelte` (e.g. with `check()` and `logout()`) actually correct?**
  _`$lib/state/auth.svelte` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Development Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Package Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Frontend TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Svelte UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07557354925775979 - nodes in this community are weakly interconnected._