# Graph Report - stellog-demo  (2026-07-21)

## Corpus Check
- 21 files · ~22,843 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 142 nodes · 123 edges · 28 communities (11 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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
2. `compilerOptions` - 10 edges
3. `scripts` - 9 edges
4. `$lib/types` - 8 edges
5. `$lib/data/stellars` - 5 edges
6. `$lib/data/dummy` - 5 edges
7. `scripts` - 5 edges
8. `$lib/components/InfoDetail.svelte` - 3 edges
9. `$lib/components/LoginScreen.svelte` - 3 edges
10. `repository` - 3 edges

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
Cohesion: 0.10
Nodes (19): author, bugs, url, description, homepage, keywords, license, main (+11 more)

### Community 2 - "Frontend NPM Scripts"
Cohesion: 0.14
Nodes (13): name, private, scripts, build, check, check:watch, dev, format (+5 more)

### Community 3 - "Frontend TypeScript Configuration"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, rewriteRelativeImportExtensions (+5 more)

### Community 4 - "Svelte UI Components"
Cohesion: 0.26
Nodes (10): $lib/components/InfoDetail.svelte, $lib/components/LoginScreen.svelte, $lib/components/StellarGrid.svelte, $lib/data/dummy, dummyStreamerInfo, $lib/data/stellars, stellars, $lib/types (+2 more)

### Community 5 - "Backend TypeScript Configuration"
Cohesion: 0.18
Nodes (10): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, resolveJsonModule, rootDir, skipLibCheck (+2 more)

### Community 6 - "Backend Express Dependencies"
Cohesion: 0.33
Nodes (5): dependencies, express, @types/express, express, @types/express

### Community 7 - "Frontend Project Documentation"
Cohesion: 0.40
Nodes (5): Frontend README, App Shell (HTML), Akane Lize Avatar, Stellog Demo Project, SvelteKit Framework

## Knowledge Gaps
- **89 isolated node(s):** `@types/express`, `express`, `app`, `target`, `module` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Frontend Development Dependencies` to `Frontend NPM Scripts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `@types/express`, `express`, `app` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Development Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Package Metadata` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Frontend NPM Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Frontend TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._