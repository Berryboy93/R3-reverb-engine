# R3V4 Universal Engineering Standard

**Living Component Development, Audit, Integration & Verification Specification**

- Version: Living Document (Auto Increment) — Revision 2.0
- Project: R3V4 / R3 Native
- Status: Production Standard
- Classification: Internal Engineering Specification
- Last Revised: 2026-07-20
- Applies To: Entire Repository (Frontend, Backend, Shared Packages, Assets, Services, Infrastructure, Documentation, External Integrations, Replit Deployments, Local Builds)

-----

## REVISION HISTORY

|Rev|Date      |Author               |Summary                                                                                                                                                                                                      |
|---|----------|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|1.0|Original  |Ty (DJ Ernesto / r3v)|Initial universal engineering standard established                                                                                                                                                           |
|2.0|2026-07-20|Ty (DJ Ernesto / r3v)|Expanded with active session context: monorepo stack, plugin architecture, security audit history, Replit integration protocol, future module registry, component origin tracking, and living integration map|

-----

## PURPOSE

This document establishes the permanent engineering workflow for every existing and future component within the R3V4 / R3 Native project.

Its purpose is to ensure every modification reaches production-grade quality before completion while maintaining consistency across the entire codebase — including components built on Replit, developed locally on ChromeOS Crostini (hostname: penguin, username: r3v), developed in Termux on Android, or deployed via Railway.

This document supersedes informal prompts and should be treated as the universal engineering standard for UI, UX, backend services, APIs, state management, audio processing, plugin architecture, infrastructure, documentation, testing, and deployment.

**Every implementation must be considered production ready before completion.**

-----

## PRIMARY OBJECTIVE

Every task must satisfy these requirements:

- Production Grade
- Industry Standard
- Modular
- Maintainable
- Scalable
- High Performance
- Accessibility Compliant
- Responsive
- Type Safe
- Memory Efficient
- Zero Regression
- Zero Dead Code
- Zero Placeholder Logic
- Fully Integrated
- Repository Consistent

**Never implement isolated solutions.**

Every modification must improve the project as a whole.

-----

## SINGLE SOURCE OF TRUTH

Only reference documentation that already exists inside the local R3V4 repository.

Do not invent architecture.

Do not create conflicting implementations.

Do not reference external documentation as authoritative when equivalent project documentation exists.

If multiple internal specifications exist, merge their intent while preserving backward compatibility.

**Repository documentation always takes precedence.**

For components originating outside the monorepo (Replit prototypes, Termux builds, external experiments), they must be audited and reconciled against this standard before integration. External origin does not grant exception from any quality gate.

-----

## LIVING DOCUMENT REQUIREMENTS

This specification is perpetual.

Each engineering cycle shall automatically:

- Update revision timestamp
- Record modified modules
- Record affected packages
- Record implementation status
- Record integration status
- Record verification status
- Record unresolved risks
- Record completed audits
- Record component origin (Replit / Local / Railway / Termux / External)
- Record integration readiness status for future modules

Maintain chronological engineering history.

**Never overwrite previous revisions. Append new revisions.**

-----

## ACTIVE PROJECT CONTEXT

> This section documents the living state of R3 Native as of Revision 2.0. It must be updated with each engineering cycle.

### Identity

|Field                  |Value                                                     |
|-----------------------|----------------------------------------------------------|
|Project Name           |R3 Native                                                 |
|Developer              |Ty (alias: DJ Ernesto, handle: r3v)                       |
|GitHub                 |revibe25/r3v4, Berryboy93                                 |
|Brand                  |R3 NATIVE                                                 |
|Artist Name            |DJ Ernesto                                                |
|Base Location          |El Dorado, AR                                             |
|Primary Dev Machine    |ChromeOS Crostini Linux (hostname: penguin, username: r3v)|
|Secondary Dev          |Termux on Android                                         |
|Canonical Project Path |~/Stable                                                  |
|Deployment Platform    |Railway                                                   |
|External Build Platform|Replit                                                    |

### Monorepo Stack (Canonical)

|Layer             |Technology                                     |
|------------------|-----------------------------------------------|
|Package Manager   |pnpm (workspace)                               |
|Frontend Framework|React 19                                       |
|Language          |TypeScript                                     |
|Build Tool        |Vite 8 (Rolldown optimizer)                    |
|Styling           |Tailwind CSS 4                                 |
|Backend           |Express                                        |
|API Layer         |tRPC                                           |
|ORM               |Drizzle ORM                                    |
|Database          |PostgreSQL                                     |
|State Management  |Zustand ONLY (no Redux — hard prohibition)     |
|Routing           |Wouter (no react-router-dom — hard prohibition)|
|Logging           |Pino (no console.log — hard prohibition)       |
|Billing           |Stripe                                         |
|Governance        |CLAUDE.md (hard guards enforced)               |

### CLAUDE.md Hard Guards (Always Enforced)

- No `any` TypeScript type
- No `console.log`
- No Redux
- No react-router-dom
- No placeholder logic
- No dead code
- No hardcoded colors or spacing
- Zustand only for state
- Wouter only for routing
- Pino only for logging

### Active Versions and Key Files

|File / Path                     |Purpose                                                                     |
|--------------------------------|----------------------------------------------------------------------------|
|~/Stable                        |Canonical monorepo root                                                     |
|~/Stable/CLAUDE.md              |Engineering governance hard guards                                          |
|~/Stable/scripts/r3dev.sh       |Dev environment helper (process cleanup, memory management)                 |
|R3_PLUGIN_ARCHITECTURE_v1.0     |Plugin architecture spec (Web Worker sandboxing, Admin install, tier access)|
|WIRE_RESPONSE_MUTATION_REPLAY.md|Mutation Trace and Replay System spec                                       |

### Known Environment Constraints

- ChromeOS Crostini RAM: 2.7GB, no swap — memory efficiency is critical
- Vite 8 Rolldown optimizer: Tone.js must NOT be in `optimizeDeps.exclude` (causes empty module object bug — verified and resolved)
- Railway Postgres: historically crash-prone; monitor and handle gracefully
- GitHub Actions: requires `security-events: write` for SARIF upload

-----

## SUBSCRIPTION TIER MODEL

All features, plugins, and access controls must respect the tier hierarchy:

|Tier      |Access Level                         |
|----------|-------------------------------------|
|Explorer  |Base tier — limited features         |
|Creator   |Mid tier                             |
|Pro Artist|Full feature access including plugins|
|Founder   |All access — 10 slots, Discord CTA   |
|Enterprise|Full access + custom arrangements    |

Plugin installation is Admin-only. Tier enforcement must be present at every access point — API, UI, and state.

-----

## CORE ARCHITECTURE — LLPTE PIPELINE

The AI processing backbone of R3 Native. Every audio intelligence feature threads through this pipeline.

```
inputRouter → spectralAnalyzer → aiMixEngine → transitionGraph → outputBus
```

|Parameter        |Target      |
|-----------------|------------|
|Inference Latency|≤15ms p50   |
|Confidence Gate  |0.65 minimum|

All Mix Suggestion Reasoning, AI Auto-Leveling, Smart Transitions, and VocalSpectra DSP must route through LLPTE. No bypass implementations.

-----

## VIRTUAL COMPOSER MACHINE (VCM)

Part of the R3 Native Intelligent Composer specification.

|Component           |Description                             |
|--------------------|----------------------------------------|
|Performance Grid    |8×8                                     |
|Smart Touch Encoders|Included                                |
|Timeline Engine     |Included                                |
|AI Jam Mode         |Included                                |
|AI Agents           |Harmony, Melody, Bass, Drum, Arrangement|

VCM components built on Replit or locally must register in the Future Module Registry before integration.

-----

## SECURITY BASELINE

### Mythos Security Audit History

A formal security audit (Mythos framework, 11 findings, 7 requiring remediation) was executed across two phases.

|Phase  |Status                                                                   |
|-------|-------------------------------------------------------------------------|
|Phase 1|Complete — CSP unsafe-inline fixed, free-tier TOCTOU race condition fixed|
|Phase 2|Complete — 5 defense-in-depth fixes confirmed already in place           |

### Deferred Findings (On SLA — Not Yet Resolved)

|Finding|Severity|Status           |
|-------|--------|-----------------|
|F-08   |Critical|Deferred — on SLA|
|F-09   |Critical|Deferred — on SLA|
|F-10   |Critical|Deferred — on SLA|

**No new feature must be considered production-ready until F-08, F-09, F-10 are resolved or explicitly re-triaged.**

### Security Requirements (All Components)

- Input sanitization
- Output validation
- Dependency safety
- Environment variable isolation
- Secrets handling (no secrets in source)
- Injection prevention
- Access control (tier-enforced)
- CSRF protection
- XSS prevention
- Safe serialization

-----

## REPLIT INTEGRATION PROTOCOL

Replit is an approved external build environment for R3 Native prototyping and component development. Components originating from Replit must follow this protocol before being merged into ~/Stable.

### Replit Component Lifecycle

```
Replit Prototype
      ↓
Context Discovery Audit (Phase 1)
      ↓
Architectural Reconciliation against ~/Stable monorepo
      ↓
Stack Alignment Check (React 19, TypeScript, Vite, Tailwind 4, Zustand, Wouter, Pino)
      ↓
CLAUDE.md Guard Verification
      ↓
LLPTE Integration Check (if audio-related)
      ↓
Tier Access Audit (if feature-gated)
      ↓
Security Audit (Phases 8)
      ↓
Regression Audit (Phase 9)
      ↓
Production Verification (Phase 10)
      ↓
Register in Future Module Registry
      ↓
Merge to ~/Stable
```

### Replit Component Requirements

Every Replit-origin component must:

- Be converted to TypeScript if prototyped in JavaScript
- Replace any `console.log` with Pino logging
- Replace any local state patterns with Zustand stores
- Replace any react-router-dom usage with Wouter
- Strip any hardcoded colors and map to theme tokens
- Strip any hardcoded spacing and map to design system scale
- Pass full lint, type check, and build in the monorepo before merge
- Include a component origin comment header (see below)

### Component Origin Header (Required for all Replit imports)

```typescript
/**
 * @component ComponentName
 * @origin Replit
 * @replit-project [project name or URL if applicable]
 * @integrated 2026-XX-XX
 * @integrated-by r3v
 * @tier Explorer | Creator | ProArtist | Founder | Enterprise | All
 * @llpte-connected true | false
 * @vcm-connected true | false
 * @plugin-host-connected true | false
 * @audit-status Phase1 | Phase2 | ... | Phase10 | Complete
 * @deferred-findings [list any open findings or "none"]
 */
```

-----

## LOCAL BUILD INTEGRATION PROTOCOL

Components developed locally (ChromeOS Crostini, Termux, Kali Linux) follow a similar but abbreviated protocol since they share closer proximity to the canonical monorepo.

### Local Component Requirements

- Developed against ~/Stable canonical environment only
- Must pass `r3dev.sh` environment checks before submission
- Must not introduce swap-triggering memory allocations (2.7GB RAM ceiling)
- Must not add Tone.js to `optimizeDeps.exclude`
- Must include component origin header with `@origin Local`

### Component Origin Header (Local)

```typescript
/**
 * @component ComponentName
 * @origin Local
 * @dev-machine ChromeOS-Crostini | Termux | Kali
 * @integrated 2026-XX-XX
 * @integrated-by r3v
 * @tier [tier]
 * @llpte-connected true | false
 * @vcm-connected true | false
 * @plugin-host-connected true | false
 * @audit-status Complete
 * @deferred-findings none
 */
```

-----

## FUTURE MODULE REGISTRY

All planned, in-progress, or prototype components must be registered here. This registry is the integration roadmap and prevents duplicate implementations.

Update this registry every engineering cycle.

|Module                            |Origin|Status     |Tier                   |LLPTE|VCM|Plugin Host|Notes                                  |
|----------------------------------|------|-----------|-----------------------|-----|---|-----------|---------------------------------------|
|R3 Native Intelligent Composer    |Local |Specified  |ProArtist+             |Yes  |Yes|No         |VCM spec complete                      |
|Plugin Architecture v1.0          |Local |In Progress|Admin/ProArtist/Founder|No   |No |Yes        |12-week phased roadmap                 |
|Mix Suggestions Reasoning         |Local |Implemented|Creator+               |Yes  |No |No         |Meter data + reasoning strings threaded|
|VocalSpectra DSP                  |Local |Specified  |ProArtist+             |Yes  |No |No         |                                       |
|AI Auto-Leveling                  |Local |Specified  |Creator+               |Yes  |No |No         |                                       |
|Smart Transitions                 |Local |Specified  |Creator+               |Yes  |No |No         |                                       |
|Mutation Trace & Replay System    |Local |Specified  |Admin                  |No   |No |No         |WIRE_RESPONSE_MUTATION_REPLAY.md       |
|Latency Monitoring Dashboard      |Local |Implemented|Admin                  |No   |No |No         |Recharts, p50/p99/p99.9, 24h/7d        |
|WebSocket Collaboration           |Local |Specified  |ProArtist+             |No   |No |No         |                                       |
|Founder Program Promotional System|Local |Implemented|Founder                |No   |No |No         |10 slots, Discord CTA                  |
|Remote Dev Agent (r3agent.py)     |Local |Implemented|Admin                  |No   |No |No         |Telegram-based dispatch                |
|Admin Agent Suite                 |Local |Implemented|Admin                  |No   |No |No         |                                       |
|Agi-Suite                         |Local |Active     |Admin                  |No   |No |No         |Port 3001/5176, admin/monitoring       |
|Agent-OS                          |Local |~75% M0    |Admin                  |No   |No |No         |Port varies, SDK/server routes pending |
|diagnostic_findings table         |Local |Implemented|Admin                  |No   |No |No         |DB schema                              |
|Color System Integration Package  |Local |Implemented|All                    |No   |No |No         |Stable monorepo                        |


> All future Replit-originated components must be added to this table upon prototype completion, before integration begins.

-----

## THREE-LAYER AGENT PIPELINE

The agent orchestration architecture connecting the three active projects.

```
Agent-OS → Agi-Suite → R3 v4
```

|Layer           |Project         |Port       |Protocol        |
|----------------|----------------|-----------|----------------|
|Orchestration   |Agent-OS        |Varies     |tRPC + WebSocket|
|Admin/Monitoring|Agi-Suite       |3001 / 5176|tRPC            |
|DAW Core        |R3 v4 (~/Stable)|3000       |tRPC + WebSocket|

All new components that interact with any of these three layers must document their connection point in their origin header.

-----

## BRAND STANDARDS REFERENCE

R3 Native brand standards are locked. All UI components must use these values exclusively via theme tokens — never hardcoded.

|Token          |Value  |Use                    |
|---------------|-------|-----------------------|
|Neon Green     |#B7FF00|Primary accent         |
|Midnight Black |#080808|Primary background     |
|Graphite       |#242424|Surface / panel        |
|Titanium Silver|#E6E6E6|Secondary text / detail|

### Typography

|Role             |Font      |
|-----------------|----------|
|Display / Headers|Bebas Neue|
|Body / UI        |Montserrat|

No other fonts may be introduced without explicit architectural approval.

-----

## PLUGIN ARCHITECTURE REFERENCE

Governed by R3_PLUGIN_ARCHITECTURE_v1.0 (internal document — consult before any plugin-related work).

|Parameter     |Value                      |
|--------------|---------------------------|
|Sandboxing    |Web Worker                 |
|Installation  |Admin-only                 |
|Tier Access   |Pro Artist and Founder only|
|Phased Roadmap|12 weeks                   |

All plugin work must reference R3_PLUGIN_ARCHITECTURE_v1.0 as the single source of truth. Do not implement plugin behavior not specified in that document.

-----

## WIRE PROTOCOL

All data mutation and state operations must follow WIRE protocol discipline.

|Rule                   |Description                                                         |
|-----------------------|--------------------------------------------------------------------|
|Read-Before-Write      |Always read current state before mutating                           |
|Anchor-Count Assertions|Verify record counts before and after mutations                     |
|Timestamped Backups    |Backup before destructive operations                                |
|Dry-Run Defaults       |Default to dry-run; require explicit confirmation for live mutations|

The Mutation Trace and Replay System (WIRE_RESPONSE_MUTATION_REPLAY.md) extends WIRE for frontend engineering. Consult that document for frontend mutation patterns.

-----

## UNIVERSAL DEVELOPMENT PIPELINE

Every implementation shall complete the following phases before being considered finished.

### Phase 1 — Context Discovery

Identify:

- Existing component
- Related services
- Dependencies
- Shared hooks
- Shared utilities
- Design system references
- Theme tokens
- Existing documentation
- Existing APIs
- Existing stores
- Existing tests
- Component origin (Replit / Local / Railway)
- Future Module Registry entry

### Phase 2 — Architectural Audit

Verify:

- Component hierarchy
- Folder organization
- Naming consistency
- Dependency graph
- Import integrity
- Circular dependencies
- Shared component usage
- Context usage
- State ownership
- Rendering strategy
- Lazy loading opportunities
- Tree shaking compatibility
- Bundle optimization
- Stack alignment (React 19, TypeScript, Vite 8, Tailwind 4, Zustand, Wouter, Pino)

### Phase 3 — Visual Audit

Verify:

- Alignment
- Spacing
- Typography (Bebas Neue / Montserrat only)
- Color consistency (brand palette via tokens only)
- Shadow consistency
- Elevation
- Visual hierarchy
- Iconography
- Knob realism
- Switch realism
- Panel realism
- Lighting direction
- Texture consistency
- Glass effects
- Borders
- Radius
- Hover states
- Focus states
- Pressed states
- Disabled states
- Animations
- Micro interactions
- Professional DAW appearance

### Phase 4 — Functional Audit

Verify:

- All controls function
- No dead UI
- No fake buttons
- No disconnected controls
- No missing callbacks
- No placeholder handlers
- No broken events
- No orphaned state
- No invalid props
- No console warnings
- No runtime exceptions
- No React warnings
- No hydration issues

### Phase 5 — Backend Audit

Verify:

- API contracts
- Validation
- Authentication
- Authorization (tier-enforced)
- Rate limiting
- Database consistency
- Type safety
- Caching
- Pino logging (no console.log)
- Monitoring hooks
- Error handling
- Retry behavior
- Timeout handling
- LLPTE integration correctness (if audio-related)

### Phase 6 — Integration Audit

Verify compatibility with:

- Shared Components
- Audio Engine
- LLPTE Pipeline
- Plugin Host
- Effects Rack
- Transport
- Mixer
- Timeline
- Automation
- Zustand State Store
- Settings
- Theme Engine
- Asset Pipeline
- Build System
- Wouter Routing
- Persistence
- Cloud Sync
- Offline Mode
- PWA
- Agent-OS
- Agi-Suite
- Three-Layer Agent Pipeline
- Future modules (consult Future Module Registry)

### Phase 7 — Performance Audit

Measure:

- Render frequency
- Memory allocation (must stay within 2.7GB ceiling on Crostini)
- Audio latency (LLPTE target ≤15ms p50)
- Bundle size
- FPS
- Repaint frequency
- Layout thrashing
- Garbage collection
- Component mount cost
- Re-render causes
- Animation performance
- GPU utilization

### Phase 8 — Security Audit

Verify:

- Input sanitization
- Output validation
- Dependency safety
- Environment variables
- Secrets handling (no secrets in source)
- Injection prevention
- Tier-based access control
- CSRF protection
- XSS prevention
- Safe serialization
- Deferred findings F-08, F-09, F-10 not worsened or exposed

### Phase 9 — Regression Audit

Verify no regressions in:

- Frontend
- Backend
- Shared Packages
- Build Process
- Wouter Routing
- Theme
- Audio / LLPTE
- MIDI
- Automation
- Cloud
- Authentication
- Database (PostgreSQL / Drizzle)
- Agi-Suite connectivity
- Agent-OS connectivity

### Phase 10 — Production Verification

Every completed task must satisfy:

- ✓ Build passes
- ✓ Lint passes
- ✓ Type checking passes (no `any`, zero TS errors)
- ✓ Unit tests pass
- ✓ Integration tests pass
- ✓ UI verification passes
- ✓ Accessibility passes
- ✓ Performance passes
- ✓ Repository consistency passes
- ✓ Component origin header present
- ✓ Future Module Registry updated
- ✓ Replit integration protocol satisfied (if applicable)
- ✓ CLAUDE.md guards all satisfied

-----

## UNIVERSAL QUALITY GATES

Every component must achieve:

- Professional appearance
- Realistic interaction
- Consistent spacing
- Consistent typography
- Realistic controls
- Zero visual artifacts
- Zero layout shifts
- Zero dead space
- Zero clipping
- Zero overflow
- Zero misalignment
- Zero duplicate logic
- Zero duplicated styling
- Zero duplicated state
- Zero duplicated utilities

-----

## COMPONENT-SPECIFIC DESIGN DIRECTIVE

When updating the component represented by the approved design reference:

**Preserve:**

- All existing knobs
- All existing switches
- All functionality
- Signal flow
- Parameter mapping
- Automation compatibility

Do not remove any existing control.

**Only modify:**

- Visual theme
- Surface materials
- Lighting
- Texture
- Panel styling
- Color palette (via tokens only)
- Visual realism
- Graph dimensions
- Spectrum visualization proportions
- Cube graph sizing
- Overall professional finish

-----

## COLLAPSIBLE CONTROL ORGANIZATION

Move secondary controls into collapsible sections while preserving functionality.

Suggested groups:

- General
- Filters
- Dynamics
- Modulation
- Delay
- Reverb
- Saturation
- Stereo
- Analysis
- Utilities
- Advanced
- Developer
- Debug
- Automation
- Diagnostics

Collapsing sections must not alter state or parameter behavior.

-----

## HEADER REDESIGN

- Condense header height
- Increase usable workspace
- Improve visual hierarchy
- Reduce unnecessary padding
- Keep branding consistent
- Improve accessibility

-----

## ACTION BAR IMPROVEMENTS

- Convert all applicable toolbar actions into compact button groups
- Maintain icon consistency
- Maintain keyboard shortcuts
- Maintain responsive layouts
- Improve discoverability
- Preserve existing functionality

-----

## UNIVERSAL UI REQUIREMENTS

Every interface must maintain:

- Consistent spacing scale
- Consistent radius system
- Consistent shadow system
- Consistent typography (Bebas Neue / Montserrat)
- Consistent icon sizing
- Consistent animations
- Consistent transitions
- Consistent interaction timing
- Consistent accessibility
- Consistent responsiveness
- Consistent theme tokens (never hardcoded values)

-----

## CODE QUALITY REQUIREMENTS

- No TODO placeholders
- No temporary code
- No commented-out production logic
- No duplicated logic
- No unnecessary abstraction
- No hidden side effects
- No magic numbers
- No hardcoded colors
- No hardcoded spacing
- No unused imports
- No unused variables
- No unreachable code
- No dead branches
- No `any` TypeScript type
- No `console.log` (use Pino)
- No Redux
- No react-router-dom (use Wouter)

-----

## AUTOMATED REVIEW CHECKLIST

Every implementation must complete:

- [ ] Context Verification
- [ ] Architecture Review
- [ ] Dependency Review
- [ ] Visual Review
- [ ] Accessibility Review
- [ ] Interaction Review
- [ ] Performance Review
- [ ] Backend Review
- [ ] Security Review
- [ ] Integration Review
- [ ] Regression Review
- [ ] Documentation Review
- [ ] Repository Consistency Review
- [ ] Replit / Local Origin Protocol (if applicable)
- [ ] Future Module Registry Update
- [ ] CLAUDE.md Guard Verification
- [ ] Component Origin Header Verification
- [ ] Release Readiness Review
- [ ] Final Engineering Sign-Off

-----

## CONTINUOUS IMPROVEMENT POLICY

Every future modification shall:

- Improve maintainability
- Reduce complexity
- Increase consistency
- Improve realism
- Improve usability
- Improve accessibility
- Improve performance
- Improve scalability
- Improve documentation
- Strengthen integration
- Reduce technical debt
- Eliminate architectural drift
- Update the Future Module Registry
- Append to this living document’s revision history

-----

## ENGINEERING ACCEPTANCE CRITERIA

No implementation is considered complete until:

1. It aligns with the existing R3V4 repository architecture
1. It preserves existing functionality unless an approved architectural change explicitly requires otherwise
1. It integrates cleanly with current frontend, backend, shared packages, and build systems
1. It introduces no regressions, unresolved defects, placeholder logic, or unsupported dependencies
1. All relevant audits and quality gates defined in this document have been satisfied and documented
1. The component origin header is present and accurate
1. The Future Module Registry has been updated
1. All Replit or local integration protocol steps have been completed (if applicable)
1. Deferred security findings F-08, F-09, F-10 have not been worsened or newly exposed
1. All CLAUDE.md hard guards are satisfied

-----

## APPENDIX A — KNOWN RESOLVED ISSUES (Reference Only)

|Issue                                        |Resolution                                                                       |
|---------------------------------------------|---------------------------------------------------------------------------------|
|Tone.js empty module object in Vite 8        |Removed `tone` from `optimizeDeps.exclude`                                       |
|TS6305 / TS6306 composite mode errors        |Root tsconfig converted to solution file with `"files": []` and `references` only|
|GitHub Actions SARIF upload failure          |Added `security-events: write` permission                                        |
|Railway Postgres crashes                     |Stabilized; monitor ongoing                                                      |
|CSP unsafe-inline (Mythos F-01)              |Fixed in Phase 1                                                                 |
|Free-tier TOCTOU race condition (Mythos F-02)|Fixed in Phase 1                                                                 |
|Missing `app` declaration (Railway)          |Fixed                                                                            |
|Broken migration hooks (Railway)             |Fixed                                                                            |
|tsconfig path alias issues (Railway)         |Fixed                                                                            |

-----

## APPENDIX B — INTEGRATION REFERENCE MAP

This map documents which systems connect to which. Use when planning any new component to identify all required integration points.

```
R3 v4 (~/Stable, :3000)
├── LLPTE Pipeline
│   ├── inputRouter
│   ├── spectralAnalyzer
│   ├── aiMixEngine
│   ├── transitionGraph
│   └── outputBus
├── Plugin Host (R3_PLUGIN_ARCHITECTURE_v1.0)
│   └── Web Worker Sandbox
├── Virtual Composer Machine
│   ├── 8×8 Performance Grid
│   ├── Smart Touch Encoders
│   ├── Timeline Engine
│   ├── AI Jam Mode
│   └── AI Agents (Harmony, Melody, Bass, Drum, Arrangement)
├── Zustand State Store
├── Wouter Routing
├── Drizzle ORM → PostgreSQL
├── Stripe Billing (tier enforcement)
├── tRPC API Layer
├── WebSocket (collaboration + agent comms)
├── Theme Engine (brand tokens)
├── PWA / Offline Mode
└── Monitoring (Latency Dashboard, diagnostic_findings)

Agi-Suite (:3001 / :5176)
├── Admin Console
├── Monitoring Dashboard
└── tRPC ↔ R3 v4

Agent-OS
├── SDK (pending M0)
├── Server Routes (pending M0)
└── tRPC + WebSocket ↔ Agi-Suite ↔ R3 v4

Replit (External)
└── Prototype Components → Integration Protocol → ~/Stable
```

-----

*This specification is intended to evolve with the project and shall serve as the permanent engineering baseline for all future R3V4 / R3 Native development.*

*Revision 2.0 — 2026-07-20 — Appended by Ty (DJ Ernesto / r3v)*