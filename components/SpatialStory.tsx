"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useMotionPreferences } from "./MotionPreferences";

const CHAPTERS = [
  { title: "Capture what you own.", label: "01 / Capture", body: "Start with a real object. A photograph captures its appearance; LiDAR supplies its physical dimensions.", value: "A measured bounding box", hint: "Shape and size, captured separately." },
  { title: "Give the mesh real dimensions.", label: "02 / Bind", body: "The generated geometry is scaled to the measured box, exactly once. From here on, every part of the system speaks metres.", value: "One scale binding", hint: "Geometry meets the measurement." },
  { title: "See it in your space.", label: "03 / Place", body: "Bring the bound object into a room. The fit engine checks the layout, and the headset shows the result at 1:1.", value: "True size. Shared everywhere.", hint: "The same object, now in context." },
];

export default function SpatialStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [available, setAvailable] = useState(true);
  const { enabled } = useMotionPreferences();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let pending = 0;
    const update = () => {
      pending = 0;
      const chapters = Array.from(section.querySelectorAll<HTMLElement>(".story-chapter"));
      const line = innerHeight * (innerWidth < 768 ? 0.75 : 0.5);
      const centers = chapters.map(el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
      let p = 0;
      if (line >= centers[2]) p = 1;
      else if (line > centers[0]) {
        const i = line >= centers[1] ? 1 : 0;
        p = (i + (line - centers[i]) / Math.max(1, centers[i + 1] - centers[i])) / 2;
      }
      progress.current = p;
      setActive(Math.min(2, Math.round(p * 2)));
    };
    const schedule = () => { if (!pending) pending = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(pending); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setAvailable(false); return; }
    setAvailable(true);
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x151c18, 1);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    scene.add(new THREE.HemisphereLight(0xf2eee6, 0x39483b, 3));
    const light = new THREE.DirectionalLight(0xffedd7, 4);
    light.position.set(3, 6, 4); scene.add(light);

    const object = new THREE.Group();
    const upholstery = new THREE.MeshStandardMaterial({ color: 0xc7ad87, roughness: 0.9, transparent: true });
    const legs = new THREE.MeshStandardMaterial({ color: 0x5e5043, roughness: 0.7, transparent: true });
    const parts: THREE.Mesh[] = [];
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, material = upholstery) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z); object.add(mesh); parts.push(mesh);
    };
    box(1.8, 0.2, 0.84, 0, 0.33, 0);
    box(1.8, 0.56, 0.17, 0, 0.66, -0.34);
    for (const x of [-0.82, 0.82]) box(0.16, 0.43, 0.84, x, 0.54, 0);
    for (const x of [-0.39, 0.39]) box(0.74, 0.12, 0.61, x, 0.47, 0.065);
    for (const x of [-0.7, 0.7]) for (const z of [-0.28, 0.28]) box(0.08, 0.23, 0.08, x, 0.12, z, legs);
    scene.add(object);

    const wireMaterial = new THREE.LineBasicMaterial({ color: 0xb7c9a8, transparent: true, opacity: 0.8 });
    parts.forEach(part => {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(part.geometry), wireMaterial);
      edges.position.copy(part.position); object.add(edges);
    });
    const boundsMaterial = new THREE.LineDashedMaterial({ color: 0xc5d7bc, dashSize: 0.06, gapSize: 0.035, transparent: true });
    const bounds = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.94, 1.04, 0.98)), boundsMaterial);
    bounds.position.y = 0.5; bounds.computeLineDistances(); object.add(bounds);

    const room = new THREE.Group();
    const roomMaterial = new THREE.MeshStandardMaterial({ color: 0x52614e, side: THREE.DoubleSide, transparent: true, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6), roomMaterial);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.025; room.add(floor);
    const grid = new THREE.GridHelper(4.4, 11, 0xa3b599, 0x697d65);
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true; room.add(grid);
    const wall = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.4, 2.5, 3.6)), new THREE.LineBasicMaterial({ color: 0xa3b599, transparent: true }));
    wall.position.y = 1.22; room.add(wall); scene.add(room);

    // Deterministic surface samples keep the capture stage stable between visits.
    const points: number[] = [];
    parts.forEach(part => {
      const size = (part.geometry as THREE.BoxGeometry).parameters;
      for (let i = 0; i < 80; i++) {
        const a = ((i * 37) % 79) / 79 - 0.5, b = ((i * 23) % 73) / 73 - 0.5;
        const face = i % 3;
        points.push(part.position.x + (face === 0 ? size.width * 0.5 : a * size.width), part.position.y + (face === 1 ? size.height * 0.5 : b * size.height), part.position.z + (face === 2 ? size.depth * 0.5 : b * size.depth));
      }
    });
    const pointMaterial = new THREE.PointsMaterial({ color: 0xd6e8c9, size: 0.022, transparent: true, depthWrite: false });
    const cloud = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(points, 3)), pointMaterial);
    object.add(cloud);

    let frame = 0, last = 0, smoothed = progress.current, visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "150px" });
    observer.observe(mount);
    const resize = new ResizeObserver(() => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight); camera.updateProjectionMatrix();
    });
    resize.observe(mount);
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || document.hidden || time - last < 32) return;
      last = time;
      const target = enabled ? progress.current : Math.round(progress.current * 2) / 2;
      smoothed = enabled ? THREE.MathUtils.lerp(smoothed, target, 0.12) : target;
      const solid = THREE.MathUtils.smoothstep(smoothed, 0.06, 0.43);
      const inRoom = THREE.MathUtils.smoothstep(smoothed, 0.52, 0.95);
      upholstery.opacity = legs.opacity = solid;
      wireMaterial.opacity = 0.65 * (1 - solid) + 0.12;
      pointMaterial.opacity = 1 - solid;
      cloud.visible = solid < 0.99;
      boundsMaterial.opacity = Math.max(0, 1 - Math.abs(smoothed - 0.45) * 2.6);
      roomMaterial.opacity = inRoom * 0.65; gridMaterial.opacity = inRoom * 0.3;
      (wall.material as THREE.LineBasicMaterial).opacity = inRoom * 0.35;
      room.visible = inRoom > 0.01;
      object.rotation.y = enabled ? -0.35 + smoothed * 0.85 : 0.1;
      object.position.y = (1 - inRoom) * 0.25;
      const distance = 4.3 + inRoom * 2.6;
      camera.position.set(distance * (0.75 - smoothed * 0.3), 2.5 + inRoom * 2.4, distance);
      camera.lookAt(0, 0.45, 0);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(node => { if (node instanceof THREE.Mesh || node instanceof THREE.LineSegments || node instanceof THREE.Points) { geometries.add(node.geometry); (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => materials.add(m)); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [enabled]);

  return (
    <section id="experience" ref={sectionRef} className="reading-surface spatial-story" aria-labelledby="experience-heading">
      <p className="eyebrow">From the physical to the spatial</p>
      <h2 id="experience-heading" className="display-sm mb-4">One object. Every dimension.</h2>
      <p className="body mb-8">Scroll to follow the journey, or select a step.</p>
      <div className="story-layout">
        <div className="story-stage">
          <div className="story-canvas" ref={mountRef} role="img" aria-label={`Illustrative sofa model. ${CHAPTERS[active].hint}`}>
            {!available && <div className="story-fallback"><span>1:1</span><p>{CHAPTERS[active].hint}</p></div>}
          </div>
          <div className="story-caption"><span>{CHAPTERS[active].value}</span><span className="caption">Illustrative model</span></div>
          <div className="story-tabs" role="group" aria-label="Object journey">
            {CHAPTERS.map((chapter, i) => <button key={chapter.label} className="focus-ring" aria-pressed={active === i} onClick={() => document.getElementById(`journey-${i}`)?.scrollIntoView({ behavior: enabled ? "smooth" : "instant", block: "center" })}>{chapter.label}</button>)}
          </div>
        </div>
        <div className="story-chapters">
          {CHAPTERS.map((chapter, i) => <article key={chapter.label} id={`journey-${i}`} className="story-chapter" data-active={active === i}>
            <p className="eyebrow">{chapter.label}</p><h3>{chapter.title}</h3><p className="body">{chapter.body}</p>
          </article>)}
        </div>
      </div>
      <a className="text-sm focus-ring story-next" href="#architecture">Explore the system behind it <span aria-hidden="true">↓</span></a>
    </section>
  );
}
