// Source authority: BUILD_DOC.md, .claude/contracts.md, docs/SYSTEM_STATE.md

export const DEMO_OBJECT = {
  name: "MacBook Pro 14",
  category: "laptop",
  bboxMeters: { w: 0.3126, h: 0.0155, d: 0.2212 },
  palette: ["#3a3a3c", "#8e8e93"],
};

// Judging Room H. Source: docs/SYSTEM_STATE.md
export const DEMO_ROOM = {
  id: "ccff7dec-1fc1-493e-96e3-3ab6f6ddfb2a",
  dimensions: { w: 2.76, l: 4.72, h: 2.96 },
  label: "Room H: 2.76 x 4.72 x 2.96 m",
};

// Measured on the first live catalogue product. Source: docs/SYSTEM_STATE.md
export const BINDING_ACCURACY_M = 1e-8;

export const PIPELINE_STEPS = [
  {
    id: 1,
    label: "01",
    title: "Tap to measure",
    subtitle: "Apple LiDAR returns bboxMeters in under 1 second",
    body: "A single tap on the iPhone fires the LiDAR scanner. RoomPlan returns the object's axis-aligned bounding box in metres in under one second, before any image has left the device. The phone renders a dimensionally accurate wireframe immediately. This is the perceived-latency fix: the measurement is real before the mesh exists.",
    technical:
      "POST /objects returns Object v1 with state:\"measured\", a real bboxMeters, and glbUrl: null. The client renders the box at those exact dimensions. The state machine is in the schema, not in UI code, which prevents it from being independently reinvented across the phone, the headset, and the backend.",
    dataOut: `Object v1 {
  state: "measured",
  bboxMeters: { w: 0.3126, h: 0.0155, d: 0.2212 },
  glbUrl: null,
  measure: { method: "lidar", confidence: 0.97 }
}`,
    visual: "lidar",
  },
  {
    id: 2,
    label: "02",
    title: "Upload frames",
    subtitle: "Capture frames to R2 via presigned PUT",
    body: "The phone uploads the best frames from the capture orbit directly to Cloudflare R2 via presigned PUT URLs. The Worker mints the upload slot and signs the URL. The bytes go straight to R2 without passing back through the Worker, which keeps the orchestration layer out of the data path.",
    technical:
      "POST /uploads {kind: \"objectFrame\"} returns {key, putUrl}. The PUT hits the Worker's own URL, which streams the body into R2 using the R2 binding. Frame keys land on the object row as frameKeys[]. The generation workflow reads them directly.",
    dataOut: `POST /uploads → { key: "objects/{id}/frames/0.jpg", putUrl: "…" }
PUT {putUrl} ← raw JPEG bytes (streamed, no body buffering)`,
    visual: "upload",
  },
  {
    id: 3,
    label: "03",
    title: "Queue generation",
    subtitle: "Cloudflare Queue to MeshDispatcher to GenerateMeshWorkflow",
    body: "The phone triggers mesh generation. The Worker writes a job record, enqueues it, and returns a jobId immediately. A one-minute Cron Trigger drains the queue through a MeshDispatcher that enforces one active generation slot at a time, preventing cold-start contention on Baseten.",
    technical:
      "POST /objects/{id}/generate {tier:\"live\"} returns {jobId}. GenerateMeshWorkflow runs inside Workers and holds the only copy of the Baseten credential. The adapter URL and API key are Worker secrets. The browser never touches the generation path directly.",
    dataOut: `POST /objects/{id}/generate → { jobId: "uuid" }
1-min Cron → Queue → MeshDispatcher (1 slot) → Workflow`,
    visual: "queue",
  },
  {
    id: 4,
    label: "04",
    title: "SF3D generates mesh",
    subtitle: "Single photograph to textured GLB via Stable Fast 3D",
    body: "The gen adapter selects the sharpest frame and submits it to Stable Fast 3D on Baseten. SF3D produces a textured mesh in roughly 10-20 seconds on a warm L4 GPU. The output is geometrically accurate but dimensionlessly normalised, coming out at roughly plus-or-minus one on every axis with no metric units attached.",
    technical:
      "Model ID: 3mzlyd6w, deployment qe95lkp, L4:4x16. The Worker sends bbox_meters in the request body alongside the image. GenerateMeshWorkflow refuses any response tagged kind:\"raw_sf3d_unscaled\" or a bare glb_base64. The adapter is not optional, and its absence is detectable at the schema level.",
    dataOut: `Raw SF3D output (example, MacBook):
  x: [-0.82, +0.82]  extent: 1.64  (dimensionless)
  y: [ 0.00, +1.00]  extent: 1.00
  z: [-0.56, +0.56]  extent: 1.12
No metric units. Shape only.`,
    visual: "sf3d",
  },
  {
    id: 5,
    label: "05",
    title: "Scale binding",
    subtitle: "Ten lines of code. Accurate to 1e-8 metres on the first live product",
    body: "Metric-scale monocular 3D reconstruction is an unsolved general problem. Scale sidesteps it entirely. The generative model gives shape; the depth sensor gives size. A post-process computes one scale factor per axis and rescales the generated mesh so its bounding box exactly matches the LiDAR measurement. This is the architectural invariant the entire system depends on.",
    technical:
      "sx = bboxMeters.w / rawExtent.x, sy = bboxMeters.h / rawExtent.y, sz = bboxMeters.d / rawExtent.z. Origin is moved to bottom-centre, +Y up, -Z front. GLB node scale is written as 1.0. Measured on the first live catalogue product: bound extents match the D1 row to 1e-8 m. Any downstream component that applies its own scale factor corrupts the result and violates the contract.",
    dataOut: `sx = 0.3126 / 1.64 = 0.1906
sy = 0.0155 / 1.00 = 0.0155
sz = 0.2212 / 1.12 = 0.1975

Bound bbox: w=0.3126m h=0.0155m d=0.2212m ✓
Matches LiDAR to 1×10⁻⁸ m`,
    visual: "binding",
  },
  {
    id: 6,
    label: "06",
    title: "Store and notify",
    subtitle: "GLB to R2, then SSE to all room subscribers via Durable Object",
    body: "The bound GLB lands at objects/{id}/mesh.glb. The Worker validates the GLB header, transitions the object row to state:\"ready\", and notifies the room's Durable Object. One Durable Object per room fans the event over SSE to every subscriber simultaneously. The Quest receives the mesh within seconds without polling.",
    technical:
      "The Worker validates GLB magic bytes and declared length before accepting. A malformed or unscaled mesh returns 422 not_a_glb and leaves the row at state:\"measured\". The Durable Object SSE stream (GET /sync/{roomId}) is the single fan-out point. Both the phone and the headset subscribe, and both receive the transition event.",
    dataOut: `SSE event: object
{
  state: "ready",
  glbUrl: "/v1/assets/objects/{id}/mesh.glb",
  bboxMeters: { w: 0.3126, h: 0.0155, d: 0.2212 }
}`,
    visual: "sse",
  },
  {
    id: 7,
    label: "07",
    title: "Place in headset",
    subtitle: "GLB loaded at scale 1.0, origin on the floor",
    body: "The WebXR runtime receives the SSE event and loads the GLB by URL. Because the mesh normalisation contract guarantees origin at bottom-centre and +Y up, setting position.y = 0 places the object exactly on the floor. Scale is 1.0. No downstream component touches scale. The constraint is enforced at the schema level: Placement v1 has a scale field, the fit engine emits a warning if it is anything other than 1.0.",
    technical:
      "Mesh normalisation contract (guaranteed by the gen adapter): (1) axis-aligned bbox equals bboxMeters to 1 mm, (2) origin at bottom-centre, (3) +Y up, -Z front face, (4) glTF node scale = 1.0. A consumer that scales after loading has misread the contract. The fit engine reads only bboxMeters; it never loads a mesh.",
    dataOut: `Placement v1 {
  objectId: "…",
  p: [1.2, 0.0, 0.8],   // metres, +Y up
  yawDeg: 45.0,
  scale: 1.0             // enforced by contract
}`,
    visual: "place",
  },
];

export const DESIGN_DECISIONS = [
  {
    id: "metres",
    title: "Metres everywhere, without exception",
    summary: "One unit system across every schema, column, and variable. Converted only at the UI boundary.",
    detail:
      "A mixed-unit system fails silently. A value in centimetres that crosses a component boundary corrupts every calculation it touches, and the error only surfaces when an object renders at ten times its correct size in a headset. The single exception is the Vectorize metadata, which stores w_mm, h_mm, d_mm as integers for efficient numeric range filtering. The suffix makes the exception unambiguous.",
    source: ".claude/contracts.md, Global conventions",
  },
  {
    id: "json",
    title: "JSON transport, not USDZ",
    summary: "Rooms are serialised as wall transforms and opening rectangles. The WebXR runtime rebuilds them from primitives.",
    detail:
      "USDZ to GLB conversion introduces coordinate convention mismatches, unit scaling ambiguities, material loss, and requires a headless Blender instance in a container. Each failure mode is obscure and appears only at integration time. RoomCapture v1 carries typed wall transforms, opening rectangles with hinge data, and per-category object proxies. Three.js reconstructs the room from those primitives. The failure surface is a JSON schema error, not a coordinate space mystery.",
    source: "BUILD_DOC.md, Contracts section",
  },
  {
    id: "state-measured",
    title: "Perceived latency is an architectural decision",
    summary: "state: measured exists in the schema. The phone renders a true bounding box in under one second while generation runs.",
    detail:
      "Generative mesh creation takes 10-20 seconds. If the UI waits for the mesh, that is 10-20 seconds of nothing. Object v1 defines four explicit states: measured, generating, ready, failed. The phone returns state:\"measured\" with a real bboxMeters and a null glbUrl in under one second. The client renders the measured box at those exact dimensions immediately. The mesh arrives later via SSE. Encoding this in the schema rather than the UI prevents three independent teams from solving the same latency problem three different ways.",
    source: ".claude/contracts.md, Object v1",
  },
  {
    id: "fail-loud",
    title: "Schema mismatches surface as exceptions, not corrupted state",
    summary: "Every consumer validates schemaVersion on read and raises explicitly on mismatch.",
    detail:
      "Rename bboxMeters to bbox and the downstream obj.bboxMeters.w becomes undefined. undefined multiplied by any scale factor is NaN. A NaN fed into a three.js matrix does not throw: the object disappears, or renders at the scene origin, and the engineer debugs the renderer for an hour for a bug that is not in it. Every consumer validates schemaVersion on read and raises with the field name and expected value. The error is attributable and actionable in the first stack frame.",
    source: "CLAUDE.md, Standing rules; .claude/contracts.md, Changing a schema",
  },
];
