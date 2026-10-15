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
        <nav className="max-w-5xl mx-auto px-6 sm:px-10 flex items-center justify-between gap-4" style={{ height: 52 }}>
          <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase shrink-0" style={{ color: "#7dd3fc" }}>
            SCALE
          </span>
          <NavLinks />
        </nav>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pb-40">

        {/* ── Hero — the ONE orchestrated entrance ── */}
        <section className="pt-32 pb-28" aria-labelledby="hero-heading">

          <Reveal>
            <h1 id="hero-heading" className="display mb-7" style={{ maxWidth: 800 }}>
              Scan anything real.
              <br />
              <span style={{ color: "#7dd3fc" }}>Place&nbsp;it&nbsp;true.</span>
            </h1>
          </Reveal>

          {/* Measurement readout — the most characteristic thing about Scale */}
          <Reveal delay={0.06}>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-10">
              <MeasureTag value="0.3126 × 0.0155 × 0.2212 m" label="MacBook Pro 14, LiDAR" />
              <MeasureTag value="< 1 s" label="to bboxMeters" />
              <MeasureTag value="1 × 10⁻⁸ m" label="binding accuracy" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="body-lg mb-12" style={{ maxWidth: 520 }}>
              Every room planner on the market is a catalog viewer with a camera
              attached. Scale reconstructs any physical object from a single photograph,
              binds the generated geometry to a metric LiDAR measurement, and renders
              it in a Quest headset at 1:1 scale.
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <div className="grid sm:grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.07)", maxWidth: 640 }}>
              <div style={{ background: "#0d1120" }} className="p-6">
                <p className="text-xs font-mono mb-3" style={{ color: "#7dd3fc" }}>catalog-free ingest</p>
                <p className="text-sm font-semibold mb-2" style={{ fontFamily: "'Bricolage Grotesque',sans-serif", color: "rgba(240,242,250,0.9)", lineHeight: 1.3 }}>
                  Ingest an object for sale nowhere
                </p>
                <p className="body" style={{ fontSize: 13.5 }}>
                  Kreativ places IKEA SKUs. Houzz places Houzz Shop SKUs.
                  Scale takes the thing in your hand.
                </p>
              </div>
              <div style={{ background: "#0d1120" }} className="p-6">
                <p className="text-xs font-mono mb-3" style={{ color: "#7dd3fc" }}>hybrid retrieval</p>
                <p className="text-sm font-semibold mb-2" style={{ fontFamily: "'Bricolage Grotesque',sans-serif", color: "rgba(240,242,250,0.9)", lineHeight: 1.3 }}>
                  Retrieve over your own possessions
                </p>
                <p className="body" style={{ fontSize: 13.5 }}>
                  SigLIP-2 vectors for style, integer-millimetre filters for fit.
                  No competitor indexes what you own.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <div className="divider" />

        {/* ── Architecture — full width, no card wrapper ── */}
        <section id="architecture" className="pt-24 pb-20" aria-labelledby="arch-heading">
          <h2 id="arch-heading" className="display-sm mb-3">System architecture</h2>
          <p className="body mb-10" style={{ maxWidth: 520 }}>
            Three deployment zones. Cloudflare handles public ingress, durable state,
            vector search, and SSE fan-out. Docker services behind a Cloudflare Tunnel
            handle inference, spatial solving, and live storefront extraction.
          </p>
          <div style={{ background: "#0d1120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }} className="p-4 sm:p-6">
            <ArchitectureDiagram />
          </div>
        </section>

        <div className="divider" />

        {/* ── Pipeline — step trace ── */}
        <section id="pipeline" className="pt-24 pb-20" aria-labelledby="pipeline-heading">
          <h2 id="pipeline-heading" className="display-sm mb-3">Object scan pipeline</h2>
          <p className="body mb-10" style={{ maxWidth: 520 }}>
            Seven state transitions from a LiDAR tap to a metric GLB in a WebXR headset.
            The perceived-latency fix is in the schema:{" "}
            <code>state:&quot;measured&quot;</code> exists so the phone renders a
            dimensionally accurate box in under one second while SF3D runs in the background.
          </p>
          <div style={{ background: "#0d1120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }} className="p-4 sm:p-6">
            <PipelineTrace />
          </div>
        </section>

        <div className="divider" />

        {/* ── Scale binding — the technical thesis ── */}
        <section id="binding" className="pt-24 pb-20" aria-labelledby="binding-heading">
          <h2 id="binding-heading" className="display-sm mb-3">The scale binding</h2>

          {/* The math IS the visual — show it prominently */}
          <div className="flex flex-wrap gap-4 mb-8 font-mono text-sm" style={{ maxWidth: 480 }}>
            {[
              { axis: "sx", eq: "0.3126 / 1.64", result: "0.1906" },
              { axis: "sy", eq: "0.0155 / 1.00", result: "0.0155" },
              { axis: "sz", eq: "0.2212 / 1.12", result: "0.1975" },
            ].map(r => (
              <div key={r.axis} className="flex items-center gap-2">
                <span style={{ color: "#7dd3fc", fontWeight: 600 }}>{r.axis}</span>
                <span style={{ color: "rgba(240,242,250,0.35)" }}>= {r.eq}</span>
                <span style={{ color: "rgba(240,242,250,0.75)", fontWeight: 600 }}>= {r.result}</span>
              </div>
            ))}
          </div>

          <p className="body mb-5" style={{ maxWidth: 520 }}>
            Metric-scale monocular reconstruction is an unsolved general problem.
            Scale sidesteps it: a depth sensor measures the physical bounding box,
            a generative model constructs the mesh, and a post-process aligns them
            in a single scale binding. Accurate to 1 × 10⁻⁸ m on the first live product measured.
          </p>

          <blockquote className="mb-10 text-sm" style={{ maxWidth: 440, color: "rgba(240,242,250,0.38)", borderLeft: "2px solid rgba(125,211,252,0.25)", paddingLeft: 16 }}>
            A consumer that applies its own scale factor is a bug, not a preference.
          </blockquote>

          <div style={{ background: "#0d1120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }} className="p-4 sm:p-6">
            <ScaleBinding />
          </div>
        </section>

        <div className="divider" />

        {/* ── Fit engine ── */}
        <section id="fitengine" className="pt-24 pb-20" aria-labelledby="fit-heading">
          <h2 id="fit-heading" className="display-sm mb-3">Fit engine</h2>
          <p className="body mb-3" style={{ maxWidth: 520 }}>
            <code>POST /fit</code> validates a layout against clearance corridors,
            door swing arcs, window occlusion, and wall adjacency.{" "}
            <code>POST /solve</code> converts natural-language intent to an objective
            function via a language model, then runs OR-Tools CP-SAT to find a valid placement.
            The language model never emits coordinates.
          </p>
          <p className="caption mb-10">{DEMO_ROOM.label}</p>
          <div style={{ background: "#0d1120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }} className="p-4 sm:p-6">
            <FitEngine />
          </div>
        </section>

        <div className="divider" />

        {/* ── Design decisions ── */}
        <section id="decisions" className="pt-24 pb-16" aria-labelledby="decisions-heading">
          <h2 id="decisions-heading" className="display-sm mb-3">Design decisions</h2>
          <p className="body mb-10" style={{ maxWidth: 520 }}>
            Four invariants that hold the system together. Each prevents a class of
            failure rather than a single bug.
          </p>
          <div className="grid sm:grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            {DESIGN_DECISIONS.map((d) => (
              <details key={d.id} style={{ background: "#0d1120" }} className="group">
                <summary className="flex items-start gap-3 p-5 cursor-pointer focus-ring">
                  <span className="shrink-0 mt-0.5 text-xs transition-transform duration-200 group-open:rotate-90" style={{ color: "#7dd3fc" }}>▶</span>
                  <div>
                    <h3 className="text-sm font-semibold leading-snug" style={{ fontFamily: "'Bricolage Grotesque',sans-serif", color: "rgba(240,242,250,0.92)" }}>
                      {d.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(240,242,250,0.5)" }}>{d.summary}</p>
                  </div>
                </summary>
                <div className="px-5 pb-5 text-xs leading-relaxed" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,242,250,0.52)" }}>
                  <p className="mt-4">{d.detail}</p>
                  <p className="mt-3" style={{ color: "rgba(240,242,250,0.25)", fontSize: 10 }}>{d.source}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#07090f" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between" style={{ fontSize: 12, color: "rgba(240,242,250,0.28)" }}>
          <span>
            <span style={{ color: "rgba(240,242,250,0.55)", fontWeight: 600 }}>Scale</span>
            {" — "}
            <FooterLink href="https://ca.linkedin.com/in/justin-tingxuan-wang">Justin</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/anirudh-dabas-ab3998229/">Ani</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/thomas-zhang-022a9b21b/">Thomas</FooterLink>
            {", "}
            <FooterLink href="https://www.linkedin.com/in/pauligwe">Paul</FooterLink>
          </span>
        </div>
      </footer>
    </>
  );
}

/** Measurement tag — the most characteristic visual in this brief */
function MeasureTag({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono font-semibold" style={{ fontSize: 15, color: "#f0f2fa", letterSpacing: "-0.01em" }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: "rgba(240,242,250,0.35)" }}>{label}</span>
    </div>
  );
}
