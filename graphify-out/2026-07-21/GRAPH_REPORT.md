# Graph Report - .  (2026-07-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 140 nodes · 121 edges · 28 communities (11 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 647 input · 304 output

## Community Hubs (Navigation)
- Frontend Development Dependencies
- Package Metadata
- Frontend NPM Scripts
- Frontend TypeScript Configuration
- Svelte UI Components
- Backend TypeScript Configuration
- Backend Express Dependencies
- Frontend Project Documentation
- Project Lifecycle Scripts
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
2. `compilerOptions` - 10 edges
3. `scripts` - 9 edges
4. `scripts` - 5 edges
5. `repository` - 3 edges
6. `@types/express` - 2 edges
7. `express` - 2 edges
8. `@eslint/js` - 2 edges
9. `@sveltejs/adapter-auto` - 2 edges
10. `@sveltejs/kit` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stellar Member Avatars** — frontend_static_images_stellars_akane_lize, frontend_static_images_stellars_aokumo_rin, frontend_static_images_stellars_arahashi_tabi, frontend_static_images_stellars_ayatsuno_yuni, frontend_static_images_stellars_gangzi, frontend_static_images_stellars_hanako_nana, frontend_static_images_stellars_neneko_mashiro, frontend_static_images_stellars_sakihane_huya, frontend_static_images_stellars_shirayuki_hina, frontend_static_images_stellars_tenko_shibuki, frontend_static_images_stellars_yuzuha_riko [EXTRACTED 1.00]

## Communities (28 total, 17 thin omitted)

### Community 0 - "Frontend Development Dependencies"
Cohesion: 0.06
Nodes (33): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-svelte, devDependencies, eslint, eslint-config-prettier, @eslint/js (+25 more)

### Community 1 - "Package Metadata"
Cohesion: 0.13
Nodes (14): author, bugs, url, description, homepage, keywords, license, main (+6 more)

### Community 2 - "Frontend NPM Scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, check, check:watch, dev, format (+5 more)

### Community 3 - "Frontend TypeScript Configuration"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 4 - "Svelte UI Components"
Cohesion: 0.27
Nodes (4): dummyStreamerInfo, stellars, StellarProfile, StreamerInfo

### Community 5 - "Backend TypeScript Configuration"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, resolveJsonModule, rootDir, skipLibCheck (+2 more)

### Community 6 - "Backend Express Dependencies"
Cohesion: 0.33
Nodes (5): dependencies, express, @types/express, express, @types/express

### Community 7 - "Frontend Project Documentation"
Cohesion: 0.40
Nodes (5): Frontend README, App Shell (HTML), Akane Lize Avatar, Stellog Demo Project, SvelteKit Framework

### Community 8 - "Project Lifecycle Scripts"
Cohesion: 0.40
Nodes (5): scripts, start, start:backend, start:frontend, test

## Knowledge Gaps
- **89 isolated node(s):** `@types/express`, `express`, `app`, `target`, `module` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Frontend Development Dependencies` to `Frontend NPM Scripts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `@types/express`, `express`, `app` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Development Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Package Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Frontend NPM Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Frontend TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._