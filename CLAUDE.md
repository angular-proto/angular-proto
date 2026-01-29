# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

angular-proto is an Angular library providing unstyled, accessible UI primitives built on composable atomic behaviors. It uses an Nx monorepo with pnpm.

**Stack:** Angular 21 (next), TypeScript 5.9, Nx 22, Vitest 4, Vite 7, ng-packagr, Playwright (e2e)

## Commands

```bash
pnpm install                          # Install dependencies
pnpm test                             # Run all tests (nx run-many -t test)
pnpm lint                             # Lint all projects
pnpm build                            # Build all projects
pnpm fix                              # Format + fix lint errors
pnpm start                            # Serve docs app

# Single project targets
nx test core                          # Test core library only
nx test primitives                    # Test primitives library only
nx lint core                          # Lint core library only
nx build core                         # Build core library only

# Single test file (via vitest)
nx test core -- --testPathPattern=hover
```

## Architecture

### Two-tier library structure

```
primitives (@angular-proto/primitives)    ← depends on core
  └── core (@angular-proto/core)          ← no external lib dependencies
```

Enforced via `@nx/enforce-module-boundaries` ESLint rule with tags: `core` has no deps, `primitives` depends on `core`, `app` depends on both.

### The Proto System (`src/core/src/lib/proto.ts`)

The central abstraction is `createProto<T, N, C>()` which creates a protocol for any directive/component. It returns a `Proto` object providing:

- **`provideState()`** — Angular provider that creates `ProtoState` (signal + metadata) and registers the directive in the ancestry chain
- **`initState(instance)`** — Called once in a directive's constructor; wraps all `InputSignal` properties into `ControlledInput` signals, sets the state, and runs hooks
- **`injectState()`** — Retrieves the proto state from DI
- **`provideConfig()` / `injectConfig()`** — Hierarchical configuration that merges parent config with overrides
- **`hooks()`** — Provider for lifecycle hooks that run after init

`ProtoState<T, N, C>` is a `Signal<ProtoDirective<T>>` combined with `ProtoMetadata` (protoId, protoName, protoType, config, ancestry, injector, elementRef).

### Ancestry (`src/core/src/lib/proto-ancestry.ts`)

Protos track their hierarchy via `PROTO_ANCESTRY_CHAIN` injection token. Each proto appends itself to the chain, enabling parent/ancestor lookups by token type. This is how composed directives discover and interact with each other.

### Controlled Inputs (`src/core/utils/`)

`controlledInput()` wraps Angular `InputSignal` with programmatic control: `control(value)`, `reset()`, `isControlled`, `templateValue`, `controlValue`. This enables both template binding and imperative state management.

### Directive Pattern

Each core directive (focus, hover, press, button, disable) follows this pattern:

1. Define a proto via `createProto({ name, type, config })`
2. Inject config and dependencies
3. Declare inputs/outputs as signals
4. Call `Proto.initState(this)` in the constructor
5. Use `afterRenderEffect` for DOM lifecycle with cleanup
6. Set data attributes (`data-hover`, `data-focus`) for styling hooks

### Path Aliases

Imports use `@angular-proto/core`, `@angular-proto/core/focus`, `@angular-proto/core/utils`, `@angular-proto/primitives`, etc. (defined in `tsconfig.base.json`).

## Testing

- **Framework:** Vitest with `@analogjs/vitest-angular` and `@testing-library/angular`
- **Environment:** jsdom
- **Setup files:** `test-setup.ts` in each library root
- Tests use `render()` from `@testing-library/angular`, `screen` queries, and direct signal assertions on proto state objects

## Code Conventions

- Standalone components/directives (no NgModules)
- OnPush change detection required
- Signals preferred over RxJS observables
- `no-public` explicit member accessibility (`private`/`protected` required, `public` keyword forbidden)
- No `any` in library code (allowed in tests)
- Prefix unused variables with `_`
- Prettier: single quotes, semicolons, trailing commas, 100 char width, arrow parens avoided
- Selector prefix: `proto` for core, `primitive` for primitives

## Implementation Excellence Standards

When implementing new primitives or features, follow the **ProtoAnchor gold standard**:

### 1. Research First

- Use **Ref MCP tool** to get latest documentation on web platform APIs
- Research how established libraries (Angular CDK, Radix UI, Floating UI) solve similar problems
- Prefer modern web platform features (CSS anchor positioning, Popover API, etc.) over JS-heavy solutions

### 2. API Design

- Design the API based on user's specified pattern before implementing
- Favor structural directives (`*protoX`) when show/hide logic can be encapsulated
- Use `exportAs` for template reference access to directive methods
- Provide both declarative (inputs) and imperative (methods/signals) control

### 3. Comprehensive Examples

- Create **10+ examples** in `apps/docs/src/app/` demonstrating all features
- Include examples for: basic usage, all configuration options, edge cases, accessibility patterns
- Add proper CSS styles to make examples visually clear and useful

### 4. Thorough Testing

- Write **40+ tests** for complex features
- Test: basic functionality, state management, accessibility attributes, CSS properties, edge cases
- Use `@testing-library/angular` patterns

### 5. Visual Verification

- Run `nx serve docs` and verify examples in Chrome browser
- Test interactive behaviors (click, hover, keyboard)
- Check browser console for errors
- Verify CSS is applying correctly

### Reference Implementation

See `src/core/anchor/` (ProtoAnchor) as the exemplar for this standard.
