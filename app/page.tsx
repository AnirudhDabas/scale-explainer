import { DESIGN_DECISIONS, DEMO_ROOM } from "@/data/content";
import {
  ArchitectureDiagram,
  PipelineTrace,
  ScaleBinding,
  FitEngine,
  SceneBackground,
  Reveal,
} from "@/components/ClientSections";
import NavLinks from "@/components/NavLinks";
import FooterLink from "@/components/FooterLink";

export default function Page() {
  return (
    <>
      {/* 3D scene sits at z-0, content at z-10 */}
      <SceneBackground />

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "rgba(4,6,9,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <nav className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between gap-4">
          <span
            className="font-mono text-xs font-semibold tracking-[0.18em] uppercase shrink-0"
            style={{ color: "rgba(110,210,200,0.75)" }}
          >
            SCALE
          </span>
          <NavLinks />
        </nav>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pb-32">

        {/* ── Hero ── */}
        <section className="pt-28 pb-24 text-center" aria-labelledby="hero-heading">
          <Reveal>
            <p className="label mb-5">Full Scale</p>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 id="hero-heading" className="display mx-auto mb-7" style={{ maxWidth: 780 }}>
              Scan anything real.
              <br />
              <span style={{ color: "rgb(110,210,200)" }}>Place it true.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="body-lg mx-auto mb-14" style={{ maxWidth: 520 }}>
              Every room planner on the market is a catalog viewer with a camera
              attached. Scale reconstructs any physical object from a single photograph,
              binds the generated geometry to a metric LiDAR measurement, and renders it
              in a Quest headset at 1:1 scale. The catalog is an input, not the product.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <Claim
                label="Spatial Reconstruction"
                title="Metric accuracy from a single photograph"
                body="Stable Fast 3D generates mesh topology. LiDAR measures the physical bounding box. A single scale binding aligns them, accurate to 1e-8 metres. Metric-scale monocular reconstruction is an open problem. This sidesteps it."
              />
              <Claim
                label="Cross-Modal Retrieval"
                title="Query what you own, not what they sell"
                body="SigLIP-2 encodes each object as a 768-dimensional vector capturing visual style. Integer-millimetre metadata enforces exact dimensional constraints. No competitor can issue this query because no competitor indexes what you own."
              />
            </div>
          </Reveal>
        </section>

        <div className="divider" />

        {/* ── Architecture ── */}
        <section id="architecture" className="pt-24 pb-20 text-center" aria-labelledby="arch-heading">
          <Reveal>
            <p className="label mb-4">01</p>
            <h2 id="arch-heading" className="heading mb-4">System architecture</h2>
            <p className="body mx-auto mb-10" style={{ maxWidth: 500 }}>
              Three deployment zones over typed interfaces. Cloudflare handles public
              ingress, durable state, vector search, and SSE fan-out. Docker services
              behind a Cloudflare Tunnel handle inference, spatial solving, and live
              storefront extraction. No component reads another component&apos;s internals.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card p-4 sm:p-6 text-left">
              <ArchitectureDiagram />
            </div>
          </Reveal>
        </section>

        <div className="divider" />

        {/* ── Pipeline ── */}
        <section id="pipeline" className="pt-24 pb-20 text-center" aria-labelledby="pipeline-heading">
          <Reveal>
            <p className="label mb-4">02</p>
            <h2 id="pipeline-heading" className="heading mb-4">Object scan pipeline</h2>
            <p className="body mx-auto mb-10" style={{ maxWidth: 500 }}>
              Seven state transitions from a LiDAR tap to a metric GLB in a WebXR headset.
              The perceived-latency fix is architectural:{" "}
              <code>state:&quot;measured&quot;</code> exists in the schema so the phone
              renders a dimensionally accurate wireframe in under one second while SF3D
              runs in the background.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card p-4 sm:p-6 text-left">
              <PipelineTrace />
            </div>
          </Reveal>
        </section>

        <div className="divider" />

        {/* ── Scale binding ── */}
        <section id="binding" className="pt-24 pb-20 text-center" aria-labelledby="binding-heading">
          <Reveal>
            <p className="label mb-4">03</p>
            <h2 id="binding-heading" className="heading mb-4">The scale binding</h2>
            <p className="body mx-auto mb-5" style={{ maxWidth: 500 }}>
              Generative models produce shape without scale. Depth sensors measure scale
              without shape. The binding step is ten lines of code that make them one
              object. It is the single most load-bearing invariant in the system: nothing
              downstream is allowed to rescale a GLB.
            </p>
            <blockquote
              className="mx-auto mb-10 text-sm italic"
              style={{
                maxWidth: 400,
                color: "rgba(238,240,246,0.28)",
                borderLeft: "2px solid rgba(110,210,200,0.25)",
                paddingLeft: 16,
                textAlign: "left",
              }}
            >
              A consumer that applies its own scale factor is a bug, not a preference.
              <footer
                className="not-italic mt-1"
                style={{ fontSize: 11, color: "rgba(238,240,246,0.18)" }}
              >
                .claude/contracts.md, Mesh normalisation contract
              </footer>
            </blockquote>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card p-4 sm:p-6 text-left">
              <ScaleBinding />
            </div>
          </Reveal>
        </section>

        <div className="divider" />

        {/* ── Fit engine ── */}
        <section id="fitengine" className="pt-24 pb-20 text-center" aria-labelledby="fit-heading">
          <Reveal>
            <p className="label mb-4">04</p>
            <h2 id="fit-heading" className="heading mb-4">Fit engine</h2>
            <p className="body mx-auto mb-3" style={{ maxWidth: 500 }}>
              Two endpoints behind one constraint solver.{" "}
              <code>POST /fit</code> validates a proposed layout against clearance corridors,
              door swing arcs, window occlusion, and wall adjacency.{" "}
              <code>POST /solve</code> converts natural-language intent through a language
              model to an objective function, then runs OR-Tools CP-SAT. The language model
              never emits coordinates.
            </p>
            <p className="caption mx-auto mb-10">
              Demo room: {DEMO_ROOM.label}&nbsp;·&nbsp;
              <code style={{ color: "rgba(238,240,246,0.28)" }}>fixtures/room-h.json</code>
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card p-4 sm:p-6 text-left">
              <FitEngine />
            </div>
          </Reveal>
        </section>

        <div className="divider" />

        {/* ── Design decisions ── */}
        <section id="decisions" className="pt-24 pb-16 text-center" aria-labelledby="decisions-heading">
          <Reveal>
            <p className="label mb-4">05</p>
            <h2 id="decisions-heading" className="heading mb-4">Design decisions</h2>
            <p className="body mx-auto mb-12" style={{ maxWidth: 500 }}>
              Four invariants that hold the system together. Each one prevents an entire
              class of failure rather than a single bug.
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto text-left">
            {DESIGN_DECISIONS.map((d, i) => (
              <Reveal key={d.id} delay={0.06 * i}>
                <details className="card group h-full">
                  <summary className="flex items-start gap-3 p-5 focus-ring rounded-2xl">
                    <span
                      className="shrink-0 mt-0.5 text-xs transition-transform duration-200 group-open:rotate-90"
                      style={{ color: "rgb(110,210,200)" }}
                    >
                      ▶
                    </span>
                    <div>
                      <h3
                        className="text-sm font-semibold leading-snug"
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "rgba(238,240,246,0.9)" }}
                      >
                        {d.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(238,240,246,0.38)" }}>
                        {d.summary}
                      </p>
                    </div>
                  </summary>
                  <div
                    className="px-5 pb-5 text-xs leading-relaxed"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.055)", color: "rgba(238,240,246,0.38)" }}
                  >
                    <p className="mt-4">{d.detail}</p>
                    <p className="mt-3" style={{ color: "rgba(238,240,246,0.18)", fontSize: 10 }}>
                      {d.source}
                    </p>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

      </main>

      <footer
        className="relative z-10"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(4,6,9,0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          className="max-w-5xl mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center gap-2 justify-between text-center sm:text-left"
          style={{ fontSize: 12, color: "rgba(238,240,246,0.22)" }}
        >
          <span style={{ color: "rgba(238,240,246,0.38)" }}>
            <span style={{ color: "rgba(238,240,246,0.5)", fontWeight: 600 }}>Scale</span>
            {" "}by{" "}
            <FooterLink href="https://ca.linkedin.com/in/justin-tingxuan-wang">Justin</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/anirudh-dabas-ab3998229/">Ani</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/thomas-zhang-022a9b21b/">Thomas</FooterLink>
            {", and "}
            <FooterLink href="https://www.linkedin.com/in/pauligwe">Paul</FooterLink>
            {"."}
          </span>
          <span style={{ color: "rgba(238,240,246,0.12)" }}>
            Architecture · Pipeline · Binding · Fit
          </span>
        </div>
      </footer>
    </>
  );
}

function Claim({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="card p-5">
      <p className="label mb-3">{label}</p>
      <h3
        className="text-sm font-semibold mb-2 leading-snug"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "rgba(238,240,246,0.88)" }}
      >
        {title}
      </h3>
      <p className="body" style={{ fontSize: 13.5 }}>{body}</p>
    </div>
  );
}
