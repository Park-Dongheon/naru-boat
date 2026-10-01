# Design QA

## Comparison targets

- Source visual truth:
  - `/workspace/source-captures/naru3-mobile.png`
  - `/workspace/source-captures/naru3-flow-1.png`
  - `/workspace/source-captures/naru3-admin-desktop.png`
  - `/workspace/source-captures/naru3-admin-mobile.png`
- Implementation screenshots:
  - `/workspace/naru-boat/qa/final-guest-welcome-mobile.png`
  - `/workspace/naru-boat/qa/final-guest-ride-mobile.png`
  - `/workspace/naru-boat/qa/final-admin-desktop.png`
  - `/workspace/naru-boat/qa/final-admin-mobile.png`
- Combined comparison evidence:
  - `/workspace/naru-boat/qa/compare-guest.png`
  - `/workspace/naru-boat/qa/compare-admin.png`

## Viewports and normalization

- Mobile source and implementation: 390 × 844 CSS px, device scale factor 1, screenshots compared at 390 × 844 px.
- Desktop source and implementation: 1440 × 1000 CSS px, device scale factor 1, screenshots compared at 1440 × 1000 px.
- States compared: passenger onboarding, passenger in-trip experience, live operator dashboard, responsive mobile operator dashboard.
- Browser-rendered implementation: Chromium via Playwright against `http://127.0.0.1:4173/`.

## Full-view comparison

The implementation preserves the selected proposal's defining visual system: warm ivory passenger background, rounded white cards, deep teal typography, amber primary actions, deep navy operator map, turquoise live state, amber warnings, and glass-like operational panels. The mobile onboarding hierarchy, field proportions, card radius, top brand bar and fixed role switch match the source closely. The desktop operator screen preserves the source's map-first composition, left tool rail, work panel, floating status chips, warning banner, boat pins and safety-zone language.

Intentional product extensions include a persistent four-item passenger navigation, complete reservation and accessibility screens, five operational work areas, meaningful live status content, and friendlier production copy in place of source-only simulation labels.

## Focused-region comparison

- Passenger onboarding card: typography hierarchy, input height, consent control, disabled CTA and footer action align with the source. The implementation slightly increases copy separation for readability.
- Passenger trip cards: the story, audio control, GPS card, trip facts and horizontal place cards retain the source visual treatment while adding persistent navigation.
- Operator work panel: fleet sorting, selected-row treatment, telemetry grid and device actions reproduce the source interaction density and semantic colors.
- Operator map: zones, routes, boat markers, status HUD and event drawer preserve the source's visual hierarchy. Geometry is responsive rather than pixel-fixed so controls remain usable on tablet and mobile.

## Required fidelity surfaces

- Fonts and typography: local Pretendard Variable font; matching weight hierarchy, compact dashboard labels and high-legibility passenger text.
- Spacing and layout rhythm: source card radii, pill controls, panel density and mobile vertical rhythm retained. No horizontal overflow at 390 px.
- Colors and visual tokens: ivory, deep teal, turquoise, amber and red mapped to reusable CSS variables and semantic states.
- Image and asset fidelity: Phosphor icons are used consistently; no hotlinked assets or placeholder imagery. Source visual language is recreated with responsive UI surfaces.
- Copy and content: project-specific Korean copy covers official passenger, safety, GPS, SMS, content and operator workflows without exposing prompt or development meta-context.

## Browser and interaction checks

- Passenger: onboarding review shortcut, three safety confirmations, trip start, all four bottom tabs, audio play/pause and action feedback.
- Operator: role switch, all seven work tabs, boat selection, event drawer and acknowledgement flow.
- Extended passenger flow: date/slot, boat type, passenger limit, six assistance choices, booking change and cancellation.
- Extended operator flow: reservation filters, approval/cancellation, boat assignment, bulk notice, boat-type availability, capacity/accessibility, slots, maintenance buffer, battery threshold and weather policy.
- Console and page errors: 0 after fixes.
- Mobile horizontal overflow: fixed; document width equals viewport width at 390 px.
- Lint and production build: passed.

## Comparison history

1. First implementation capture found a P2 mobile horizontal overflow caused by the horizontal place carousel's intrinsic grid width, and a P2 missing favicon request.
2. Added explicit grid min-width containment, bounded the carousel to the viewport and embedded an empty favicon.
3. Post-fix browser run confirmed 390 px document width on passenger and operator screens, zero console errors, and successful navigation through every primary tab.
4. Service-completeness iteration added end-to-end reservation and configurable operations. Mobile regression found the event bar covering the last settings action; an 84 px panel safe area fixed it. Post-fix interaction tests passed with zero console errors and no horizontal overflow.

## Findings

No actionable P0, P1 or P2 issues remain. The implementation intentionally expands the reference beyond its original demo state while retaining its core visual language.

## Follow-up polish

- P3: connect live GPS, SMS and device commands when backend contracts become available.
- P3: replace demo timetable and telemetry with production data sources.

final result: passed
