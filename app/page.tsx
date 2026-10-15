import { DESIGN_DECISIONS } from "@/data/content";
import {
  ArchitectureDiagram,
  PipelineTrace,
  ScaleBinding,
  FitEngine,
  SceneBackground,
  LoadingScreen,
  Reveal,
  ScrollReveal,
  HeroText,
  Marquee,
  GithubCard,
  SpatialStory,
} from "@/components/ClientSections";
import NavLinks from "@/components/NavLinks";
import FooterLink from "@/components/FooterLink";

export default function Page() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <LoadingScreen />
      <SceneBackground />

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: "rgba(17,21,18,0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <nav className="max-w-6xl mx-auto px-6 sm:px-10 flex items-center justify-between gap-4" style={{ height: 52 }}>
          <a href="#main-content" aria-label="Scale, back to top" className="focus-ring font-mono text-[11px] font-semibold tracking-[0.18em] uppercase shrink-0" style={{ color: "#b7c9a8" }}>
            SCALE
          </a>
          <NavLinks />
        </nav>
      </header>

      {/* ── Marquee. scrolling tech specs ── */}
      <div className="relative z-10">
        <Marquee />
      </div>

      <main id="main-content" tabIndex={-1} className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pb-20">

        {/* ── Hero. cinematic word-by-word entrance + parallax ── */}
        <section className="reading-surface hero-surface" aria-labelledby="hero-heading">

          {/* Word-by-word with scroll parallax */}
          <HeroText />

          <div className="hero-actions">
            <a href="#experience" className="btn-primary focus-ring hero-cta">Follow the object <span aria-hidden="true">↓</span></a>
            <a href="#architecture" className="focus-ring text-sm">Jump to the architecture <span aria-hidden="true">↗</span></a>
          </div>

          {/* Measurement readout. the most characteristic thing in Scale's world */}
          <Reveal delay={0.7}>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-10">
              <MeasureTag value="0.3126 × 0.0155 × 0.2212 m" label="MacBook Pro 14, LiDAR" />
              <MeasureTag value="< 1 s" label="to bboxMeters" />
              <MeasureTag value="1 × 10⁻⁸ m" label="binding accuracy" />
            </div>
          </Reveal>

          <Reveal delay={0.82}>
            <p className="body-lg mb-12" style={{ maxWidth: 520 }}>
              Every room planner on the market is a catalog viewer with a camera
              attached. Scale reconstructs any physical object from a single photograph,
              binds the generated geometry to a metric LiDAR measurement, and renders
              it in a Quest headset at 1:1 scale.
            </p>
          </Reveal>

          <Reveal delay={0.92}>
            <div
              className="grid sm:grid-cols-2 gap-px rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)", maxWidth: 640 }}
            >
              <FeatureCell
                tag="catalog-free ingest"
                title="Ingest an object for sale nowhere"
                body="Kreativ places IKEA SKUs. Houzz places Houzz SKUs. Scale takes the thing in your hand: the floor model, the family heirloom, anything."
              />
              <FeatureCell
                tag="hybrid retrieval"
                title="Retrieve over your own possessions"
                body="SigLIP-2 vectors for style, integer-millimetre filters for fit. No competitor can issue this query because no competitor indexes what you own."
              />
            </div>
          </Reveal>
        </section>



        <SpatialStory />

        {/* ── Architecture ── */}
        <section id="architecture" className="reading-surface" aria-labelledby="arch-heading">
          <ScrollReveal>
            <h2 id="arch-heading" className="display-sm mb-3">System architecture</h2>
            <p className="body mb-10" style={{ maxWidth: 520 }}>
              Three deployment zones. Cloudflare handles public ingress, durable state,
              vector search, and SSE fan-out. Docker services behind a Cloudflare Tunnel
              handle inference, spatial solving, and live storefront extraction.
              No component reads another&apos;s internals.
            </p>
          </ScrollReveal>
          <ScrollReveal y={24} delay={0.05}>
            <div style={{ background: "rgba(22,28,24,0.93)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, backdropFilter: "blur(8px)" }} className="p-4 sm:p-6">
              <ArchitectureDiagram />
            </div>
          </ScrollReveal>
        </section>



        {/* ── Pipeline ── */}
        <section id="pipeline" className="reading-surface" aria-labelledby="pipeline-heading">
          <ScrollReveal>
            <h2 id="pipeline-heading" className="display-sm mb-3">Object scan pipeline</h2>
            <p className="body mb-10" style={{ maxWidth: 520 }}>
              Seven state transitions from a LiDAR tap to a metric GLB in a WebXR headset.
              The perceived-latency fix is architectural:{" "}
              <code>state:&quot;measured&quot;</code> lives in the schema so the phone
              renders a dimensionally accurate wireframe in under one second while SF3D
              runs in the background.
            </p>
          </ScrollReveal>
          <ScrollReveal y={24} delay={0.05}>
            <div style={{ background: "rgba(22,28,24,0.93)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, backdropFilter: "blur(8px)" }} className="p-4 sm:p-6">
              <PipelineTrace />
            </div>
          </ScrollReveal>
        </section>



        {/* ── Scale binding ── */}
        <section id="binding" className="reading-surface" aria-labelledby="binding-heading">
          <ScrollReveal>
            <h2 id="binding-heading" className="display-sm mb-3">The scale binding</h2>

            {/* The math as the visual element */}
            <div className="flex flex-wrap gap-4 mb-7 font-mono text-sm" style={{ maxWidth: 480 }}>
              {[
                { axis: "sx", eq: "0.3126 / 1.64", result: "0.1906" },
                { axis: "sy", eq: "0.0155 / 1.00", result: "0.0155" },
                { axis: "sz", eq: "0.2212 / 1.12", result: "0.1975" },
              ].map(r => (
                <div key={r.axis} className="flex items-center gap-2">
                  <span style={{ color: "#b7c9a8", fontWeight: 600 }}>{r.axis}</span>
                  <span style={{ color: "#bec7be" }}>= {r.eq}</span>
                  <span style={{ color: "rgba(242,238,230,0.75)", fontWeight: 600 }}>= {r.result}</span>
                </div>
              ))}
            </div>

            <p className="body mb-5" style={{ maxWidth: 520 }}>
              Metric-scale monocular reconstruction is an unsolved general problem.
              Scale sidesteps it: a depth sensor measures the physical bounding box,
              a generative model constructs the mesh, and a post-process aligns them
              in a single binding step. Accurate to 1 × 10⁻⁸ m on the first live product.
            </p>
            <blockquote
              className="mb-10 text-sm"
              style={{ maxWidth: 440, color: "#bec7be", borderLeft: "2px solid rgba(183,201,168,0.22)", paddingLeft: 16 }}
            >
              A consumer that applies its own scale factor is a bug, not a preference.
            </blockquote>
          </ScrollReveal>
          <ScrollReveal y={24} delay={0.05}>
            <div style={{ background: "rgba(22,28,24,0.93)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, backdropFilter: "blur(8px)" }} className="p-4 sm:p-6">
              <ScaleBinding />
            </div>
          </ScrollReveal>
        </section>



        {/* ── Fit engine ── */}
        <section id="fitengine" className="reading-surface" aria-labelledby="fit-heading">
          <ScrollReveal>
            <h2 id="fit-heading" className="display-sm mb-3">Fit engine</h2>
            <p className="body mb-3" style={{ maxWidth: 520 }}>
              <code>POST /fit</code> validates a layout: clearance corridors, door swing
              arcs, window occlusion, wall adjacency.{" "}
              <code>POST /solve</code> converts natural-language intent to an objective
              function, then runs OR-Tools CP-SAT. The language model never emits
              coordinates.
            </p>
            <p className="caption mb-10">Interactive example: a 4.0 × 3.5 m room. Drag the sofa or use the slider.</p>
          </ScrollReveal>
          <ScrollReveal y={24} delay={0.05}>
            <div style={{ background: "rgba(22,28,24,0.93)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, backdropFilter: "blur(8px)" }} className="p-4 sm:p-6">
              <FitEngine />
            </div>
          </ScrollReveal>
        </section>



        {/* ── Design decisions ── */}
        <section id="decisions" className="reading-surface" aria-labelledby="decisions-heading">
          <ScrollReveal>
            <h2 id="decisions-heading" className="display-sm mb-3">Design decisions</h2>
            <p className="body mb-10" style={{ maxWidth: 520 }}>
              Four invariants. Each prevents a class of failure, not a single bug.
            </p>
          </ScrollReveal>
          <div
            className="grid sm:grid-cols-2 gap-px rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {DESIGN_DECISIONS.map((d, i) => (
              <ScrollReveal key={d.id} y={16} delay={0.04 * i}>
                <details style={{ background: "#1b211d" }} className="group h-full">
                  <summary className="flex items-start gap-3 p-5 cursor-pointer focus-ring">
                    <span
                      className="shrink-0 mt-0.5 text-xs transition-transform duration-200 group-open:rotate-90"
                      style={{ color: "#b7c9a8" }}
                    >▶</span>
                    <div>
                      <h3
                        className="text-sm font-semibold leading-snug"
                        style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(242,238,230,0.92)" }}
                      >
                        {d.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "#bec7be" }}>
                        {d.summary}
                      </p>
                    </div>
                  </summary>
                  <div
                    className="px-5 pb-5 text-xs leading-relaxed"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#bec7be" }}
                  >
                    <p className="mt-4">{d.detail}</p>
                    <p className="mt-3" style={{ color: "#bec7be", fontSize: 10 }}>{d.source}</p>
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </section>



        {/* ── Source + team ── */}
        <section className="reading-surface" aria-label="Source code">
          <ScrollReveal>
            {/* Team names */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span style={{ fontSize: 13, color: "#bec7be" }}>Built by</span>
              <FooterLink href="https://ca.linkedin.com/in/justin-tingxuan-wang">Justin</FooterLink>
              <span style={{ color: "#bec7be", fontSize: 13 }}>·</span>
              <FooterLink href="https://www.linkedin.com/in/anirudh-dabas-ab3998229/">Ani</FooterLink>
              <span style={{ color: "#bec7be", fontSize: 13 }}>·</span>
              <FooterLink href="https://www.linkedin.com/in/thomas-zhang-022a9b21b/">Thomas</FooterLink>
              <span style={{ color: "#bec7be", fontSize: 13 }}>·</span>
              <FooterLink href="https://www.linkedin.com/in/pauligwe">Paul</FooterLink>
            </div>
            <div style={{ maxWidth: 640 }}>
              <GithubCard />
            </div>
          </ScrollReveal>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#111512" }}>
        <div
          className="max-w-6xl mx-auto px-6 sm:px-10 py-4"
          style={{ fontSize: 12, color: "#bec7be" }}
        >
          Scale
        </div>
      </footer>
    </>
  );
}

function MeasureTag({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="font-mono font-semibold" style={{ fontSize: 14, color: "#f2eee6", letterSpacing: "-0.01em" }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: "#bec7be" }}>{label}</span>
    </div>
  );
}

function FeatureCell({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div style={{ background: "#1b211d" }} className="p-6">
      <p className="font-mono mb-3" style={{ fontSize: 11, color: "#b7c9a8", letterSpacing: "0.03em" }}>{tag}</p>
      <p
        className="font-semibold mb-2"
        style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(242,238,230,0.9)", lineHeight: 1.35 }}
      >
        {title}
      </p>
      <p className="body" style={{ fontSize: 13.5 }}>{body}</p>
    </div>
  );
}
