import { DESIGN_DECISIONS, DEMO_ROOM } from "@/data/content";
import {
  ArchitectureDiagram,
  PipelineTrace,
  ScaleBinding,
  FitEngine,
  SceneBackground,
  LoadingScreen,
  Reveal,
} from "@/components/ClientSections";
import NavLinks from "@/components/NavLinks";
import FooterLink from "@/components/FooterLink";

export default function Page() {
  return (
    <>
      <LoadingScreen />
      <SceneBackground />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20" style={{ background: "rgba(7,9,15,0.92)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <nav className="max-w-5xl mx-auto px-6 sm:px-10 h-13 flex items-center justify-between gap-4" style={{ height: 52 }}>
          <span className="font-mono text-[11px] font-semibold tracking-[0.2em] uppercase shrink-0" style={{ color: "#7dd3fc" }}>
            SCALE
          </span>
          <NavLinks />
        </nav>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pb-40">

        {/* ── Hero ── */}
        <section className="pt-32 pb-28" aria-labelledby="hero-heading">
          <Reveal>
            <p className="label mb-6">Full Scale</p>
          </Reveal>

          <Reveal delay={0.04}>
            <h1 id="hero-heading" className="display mb-8" style={{ maxWidth: 820 }}>
              Scan anything real.
              <br />
              <span style={{ color: "#7dd3fc" }}>Place&nbsp;it&nbsp;true.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="body-lg mb-14" style={{ maxWidth: 540 }}>
              Every room planner on the market is a catalog viewer with a camera attached.
              Scale reconstructs any physical object from a single photograph, binds the
              generated geometry to a metric LiDAR measurement, and renders it in a Quest
              headset at 1:1 scale. The catalog is an input, not the product.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="grid sm:grid-cols-2 gap-3" style={{ maxWidth: 640 }}>
              <Claim
                label="Spatial Reconstruction"
                title="Metric accuracy from a single photograph"
                body="Stable Fast 3D generates mesh topology. LiDAR measures the physical bounding box. A single scale binding aligns them, accurate to 1e-8 metres. Metric-scale monocular reconstruction is an open problem. This sidesteps it."
              />
              <Claim
                label="Cross-Modal Retrieval"
                title="Query what you own, not what they sell"
                body="SigLIP-2 encodes each object as a 768-dimensional vector. Integer-millimetre metadata enforces exact dimensional constraints. No competitor can issue this query because no competitor indexes what you own."
              />
            </div>
          </Reveal>
        </section>

        <div className="divider" />

        {/* ── Architecture ── */}
        <Section id="architecture" n="01" heading="System architecture">
          <p className="body mb-10" style={{ maxWidth: 500 }}>
            Three deployment zones over typed interfaces. Cloudflare handles public
            ingress, durable state, vector search, and SSE fan-out. Docker services
            behind a Cloudflare Tunnel handle inference, spatial solving, and live
            storefront extraction. No component reads another&apos;s internals.
          </p>
          <div className="card card-hover p-4 sm:p-6">
            <ArchitectureDiagram />
          </div>
        </Section>

        <div className="divider" />

        {/* ── Pipeline ── */}
        <Section id="pipeline" n="02" heading="Object scan pipeline">
          <p className="body mb-10" style={{ maxWidth: 500 }}>
            Seven state transitions from a LiDAR tap to a metric GLB in a WebXR headset.
            The perceived-latency fix is architectural:{" "}
            <code>state:&quot;measured&quot;</code> exists in the schema so the phone
            renders a dimensionally accurate wireframe in under one second while SF3D
            runs in the background.
          </p>
          <div className="card card-hover p-4 sm:p-6">
            <PipelineTrace />
          </div>
        </Section>

        <div className="divider" />

        {/* ── Scale binding ── */}
        <Section id="binding" n="03" heading="The scale binding">
          <p className="body mb-5" style={{ maxWidth: 500 }}>
            Generative models produce shape without scale. Depth sensors measure scale
            without shape. The binding step is ten lines of code that make them one
            object. Nothing downstream is allowed to rescale a GLB.
          </p>
          <blockquote
            className="mb-10 text-sm italic"
            style={{
              maxWidth: 420,
              color: "rgba(240,242,250,0.4)",
              borderLeft: "2px solid rgba(125,211,252,0.3)",
              paddingLeft: 16,
            }}
          >
            A consumer that applies its own scale factor is a bug, not a preference.
            <footer className="not-italic mt-1" style={{ fontSize: 11, color: "rgba(240,242,250,0.25)" }}>
              .claude/contracts.md
            </footer>
          </blockquote>
          <div className="card card-hover p-4 sm:p-6">
            <ScaleBinding />
          </div>
        </Section>

        <div className="divider" />

        {/* ── Fit engine ── */}
        <Section id="fitengine" n="04" heading="Fit engine">
          <p className="body mb-3" style={{ maxWidth: 500 }}>
            Two endpoints behind one constraint solver.{" "}
            <code>POST /fit</code> validates a layout against clearance corridors,
            door swing arcs, window occlusion, and wall adjacency.{" "}
            <code>POST /solve</code> converts natural-language intent through a
            language model to an objective function, then runs OR-Tools CP-SAT.
            The language model never emits coordinates.
          </p>
          <p className="caption mb-10">
            {DEMO_ROOM.label}&nbsp;·&nbsp;
            <code style={{ fontSize: 10 }}>fixtures/room-h.json</code>
          </p>
          <div className="card card-hover p-4 sm:p-6">
            <FitEngine />
          </div>
        </Section>

        <div className="divider" />

        {/* ── Design decisions ── */}
        <Section id="decisions" n="05" heading="Design decisions">
          <p className="body mb-10" style={{ maxWidth: 500 }}>
            Four invariants that hold the system together. Each one prevents an
            entire class of failure rather than a single bug.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
            {DESIGN_DECISIONS.map((d, i) => (
              <Reveal key={d.id} delay={0.04 * i}>
                <details className="card card-hover group h-full">
                  <summary className="flex items-start gap-3 p-5 focus-ring rounded-xl">
                    <span className="shrink-0 mt-0.5 text-xs transition-transform duration-200 group-open:rotate-90" style={{ color: "#7dd3fc" }}>▶</span>
                    <div>
                      <h3 className="text-sm font-semibold leading-snug" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "rgba(240,242,250,0.92)" }}>
                        {d.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(240,242,250,0.5)" }}>
                        {d.summary}
                      </p>
                    </div>
                  </summary>
                  <div className="px-5 pb-5 text-xs leading-relaxed" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,242,250,0.52)" }}>
                    <p className="mt-4">{d.detail}</p>
                    <p className="mt-3" style={{ color: "rgba(240,242,250,0.25)", fontSize: 10 }}>{d.source}</p>
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </Section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(7,9,15,0.8)" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between" style={{ fontSize: 12, color: "rgba(240,242,250,0.3)" }}>
          <span>
            <span style={{ color: "rgba(240,242,250,0.6)", fontWeight: 600 }}>Scale</span>
            {" · "}
            <FooterLink href="https://ca.linkedin.com/in/justin-tingxuan-wang">Justin</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/anirudh-dabas-ab3998229/">Ani</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/thomas-zhang-022a9b21b/">Thomas</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/pauligwe">Paul</FooterLink>
          </span>
          <span style={{ color: "rgba(240,242,250,0.15)" }}>Architecture · Pipeline · Binding · Fit</span>
        </div>
      </footer>
    </>
  );
}

/** Section wrapper with consistent spacing + reveal */
function Section({ id, n, heading, children }: { id: string; n: string; heading: string; children: React.ReactNode }) {
  return (
    <section id={id} className="pt-24 pb-20" aria-labelledby={`${id}-heading`}>
      <Reveal>
        <p className="label mb-3">{n}</p>
        <h2 id={`${id}-heading`} className="display-sm mb-4">{heading}</h2>
      </Reveal>
      <Reveal delay={0.06}>
        {children}
      </Reveal>
    </section>
  );
}

function Claim({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="card card-hover p-5">
      <p className="label mb-3">{label}</p>
      <h3 className="text-sm font-semibold mb-2 leading-snug"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "rgba(240,242,250,0.9)", fontSize: 14 }}>
        {title}
      </h3>
      <p className="body" style={{ fontSize: 13.5 }}>{body}</p>
    </div>
  );
}
