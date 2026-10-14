import { DESIGN_DECISIONS, DEMO_ROOM } from "@/data/content";
import {
  ArchitectureDiagram,
  PipelineTrace,
  ScaleBinding,
  FitEngine,
  Particles,
} from "@/components/ClientSections";
import NavLinks from "@/components/NavLinks";

export default function Page() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#06090f]" aria-hidden="true" />
      <Particles />

      {/* ── Navigation ── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "rgba(6,9,15,0.75)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
        }}
      >
        <nav
          className="max-w-5xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between gap-4"
          aria-label="Page sections"
        >
          <span
            className="font-mono text-xs font-semibold tracking-[0.18em] uppercase shrink-0"
            style={{ color: "rgba(15,196,184,0.8)" }}
          >
            SCALE
          </span>
          <NavLinks />
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-10 pb-32">
        {/* ── Hero ── */}
        <section className="pt-28 pb-24 text-center" aria-labelledby="hero-heading">
          <p className="label mb-6">Full Scale</p>

          <h1
            id="hero-heading"
            className="display mx-auto mb-8"
            style={{ maxWidth: "820px" }}
          >
            Scan anything real.
            <br />
            <span style={{ color: "#0fc4b8" }}>Place it true.</span>
          </h1>

          <p
            className="body-lg mx-auto mb-14"
            style={{ maxWidth: "560px" }}
          >
            Every room planner on the market is a catalog viewer with a camera attached.
            Scale reconstructs any physical object from a single photograph, binds the
            generated geometry to a metric LiDAR measurement, and renders it in a Quest
            headset at 1:1 scale. The catalog is an input, not the product.
          </p>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <Claim
              label="Spatial Reconstruction"
              title="Metric accuracy from a single photograph"
              body="Stable Fast 3D generates mesh topology. The LiDAR sensor measures the physical bounding box. A post-process binds the two: accurate to 1e-8 metres on the first live product measured. Metric-scale monocular reconstruction is an open problem. This sidesteps it."
            />
            <Claim
              label="Cross-Modal Retrieval"
              title="Query what you own, not what they sell"
              body="SigLIP-2 encodes each object as a 768-dimensional vector capturing visual style. Integer-millimetre metadata enforces exact dimensional constraints. A single query retrieves furniture that both matches the aesthetic and fits the gap. No competitor can issue this query because no competitor indexes what you own."
            />
          </div>
        </section>

        <div className="divider" />

        {/* ── Architecture ── */}
        <section id="architecture" className="pt-24 pb-20 text-center" aria-labelledby="arch-heading">
          <p className="label mb-4">01</p>
          <h2 id="arch-heading" className="heading mb-4">
            System architecture
          </h2>
          <p className="body mx-auto mb-12" style={{ maxWidth: "520px" }}>
            Three deployment zones communicate over typed interfaces. Cloudflare handles
            public ingress, durable state, vector search, and SSE fan-out. Docker services
            behind a Cloudflare Tunnel handle inference, spatial solving, and live storefront
            extraction. No component reads another component&apos;s internals.
          </p>
          <div className="card p-5 sm:p-7 text-left">
            <ArchitectureDiagram />
          </div>
        </section>

        <div className="divider" />

        {/* ── Pipeline ── */}
        <section id="pipeline" className="pt-24 pb-20 text-center" aria-labelledby="pipeline-heading">
          <p className="label mb-4">02</p>
          <h2 id="pipeline-heading" className="heading mb-4">
            Object scan pipeline
          </h2>
          <p className="body mx-auto mb-12" style={{ maxWidth: "520px" }}>
            Seven state transitions from a LiDAR tap to a metric GLB in a WebXR headset.
            The perceived-latency fix is architectural: <code>state:&quot;measured&quot;</code> exists
            in the schema so the phone renders a dimensionally accurate wireframe in under
            one second while SF3D runs in the background.
          </p>
          <div className="card p-5 sm:p-7 text-left">
            <PipelineTrace />
          </div>
        </section>

        <div className="divider" />

        {/* ── Scale binding ── */}
        <section id="binding" className="pt-24 pb-20 text-center" aria-labelledby="binding-heading">
          <p className="label mb-4">03</p>
          <h2 id="binding-heading" className="heading mb-4">
            The scale binding
          </h2>
          <p className="body mx-auto mb-6" style={{ maxWidth: "520px" }}>
            Generative models produce shape without scale. Depth sensors measure scale
            without shape. The binding step is ten lines of code that make them one object.
            It is the single most load-bearing invariant in the system: nothing downstream
            is allowed to rescale a GLB.
          </p>
          <blockquote
            className="mx-auto mb-12 text-sm italic"
            style={{
              maxWidth: "420px",
              color: "rgba(240,244,255,0.3)",
              borderLeft: "2px solid rgba(15,196,184,0.3)",
              paddingLeft: "16px",
              textAlign: "left",
            }}
          >
            A consumer that applies its own scale factor is a bug, not a preference.
            <footer
              className="not-italic mt-1"
              style={{ fontSize: "11px", color: "rgba(240,244,255,0.2)" }}
            >
              .claude/contracts.md, Mesh normalisation contract
            </footer>
          </blockquote>
          <div className="card p-5 sm:p-7 text-left">
            <ScaleBinding />
          </div>
        </section>

        <div className="divider" />

        {/* ── Fit engine ── */}
        <section id="fitengine" className="pt-24 pb-20 text-center" aria-labelledby="fit-heading">
          <p className="label mb-4">04</p>
          <h2 id="fit-heading" className="heading mb-4">
            Fit engine
          </h2>
          <p className="body mx-auto mb-3" style={{ maxWidth: "520px" }}>
            Two endpoints behind one constraint solver. <code>POST /fit</code> validates
            a proposed layout against clearance corridors, door swing arcs, window
            occlusion, and wall adjacency. <code>POST /solve</code> takes a natural-language
            intent, converts it to an objective function via a language model, and runs
            OR-Tools CP-SAT to find a valid placement. The language model never emits
            coordinates.
          </p>
          <p className="caption mx-auto mb-12">
            Demo room: {DEMO_ROOM.label} &nbsp;·&nbsp; committed as{" "}
            <code style={{ color: "rgba(240,244,255,0.3)" }}>fixtures/room-h.json</code>
          </p>
          <div className="card p-5 sm:p-7 text-left">
            <FitEngine />
          </div>
        </section>

        <div className="divider" />

        {/* ── Design decisions ── */}
        <section id="decisions" className="pt-24 pb-16 text-center" aria-labelledby="decisions-heading">
          <p className="label mb-4">05</p>
          <h2 id="decisions-heading" className="heading mb-4">
            Design decisions
          </h2>
          <p className="body mx-auto mb-12" style={{ maxWidth: "520px" }}>
            Four invariants that hold the system together. Each one prevents an entire
            class of failure rather than a single bug.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto text-left">
            {DESIGN_DECISIONS.map((d) => (
              <details key={d.id} className="card group">
                <summary className="flex items-start gap-3 p-5 focus-ring rounded-2xl">
                  <span
                    className="shrink-0 mt-0.5 text-xs transition-transform duration-200 group-open:rotate-90"
                    style={{ color: "#0fc4b8" }}
                  >
                    ▶
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "rgba(240,244,255,0.9)" }}>
                      {d.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(240,244,255,0.4)" }}>
                      {d.summary}
                    </p>
                  </div>
                </summary>
                <div
                  className="px-5 pb-5 text-xs leading-relaxed"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(240,244,255,0.4)",
                  }}
                >
                  <p className="mt-4">{d.detail}</p>
                  <p className="mt-3" style={{ color: "rgba(240,244,255,0.2)", fontSize: "10px" }}>
                    Source: {d.source}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.055)",
          background: "rgba(6,9,15,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          className="max-w-5xl mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center gap-3 justify-between text-center sm:text-left"
          style={{ fontSize: "12px", color: "rgba(240,244,255,0.25)" }}
        >
          <span>
            <span style={{ color: "rgba(240,244,255,0.5)", fontWeight: 600 }}>Scale</span>
            {" "}by Justin, Ani, Thomas, and Paul.
          </span>
          <span style={{ color: "rgba(240,244,255,0.15)" }}>
            Architecture · Pipeline · Binding · Fit
          </span>
        </div>
      </footer>
    </>
  );
}

function Claim({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-5">
      <p className="label mb-3">{label}</p>
      <h3
        className="text-sm font-semibold mb-2 leading-snug"
        style={{ color: "rgba(240,244,255,0.9)" }}
      >
        {title}
      </h3>
      <p className="body" style={{ fontSize: "13.5px" }}>
        {body}
      </p>
    </div>
  );
}
