# Scale — Technical Explainer

Interactive walkthrough of the Full Scale system built at Hack the North 2026.

## Local development

```
npm install
npm run dev       # http://localhost:3000
```

## Production build

```
npm run build     # outputs to out/ (static export)
npm run typecheck # TypeScript check without emitting
```

## Vercel deployment

Push to a Vercel project. The `vercel.json` specifies the Next.js framework.
No environment variables required — fully static.

## What's inside

| Section | What it teaches |
| --- | --- |
| Architecture | Interactive SVG system map — select a data flow, click any component |
| Object scan pipeline | Seven-step trace from LiDAR tap to GLB in the headset |
| Scale binding | Interactive calculator: raw SF3D mesh → bboxMeters |
| Fit engine | Draggable room layout with live door-swing violation |
| Design decisions | The four choices that hold the system together |

## Sources

All factual claims are grounded in:
- `BUILD_DOC.md` — design doc
- `.claude/contracts.md` — schema and API authority
- `docs/SYSTEM_STATE.md` — what is actually deployed
