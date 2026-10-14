"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Real dimensions from docs/SYSTEM_STATE.md
const ROOM = { w: 4.72, h: 2.96, d: 2.76 };

// Real bboxMeters from .claude/contracts.md fixture
const OBJECTS = [
  { w: 0.3126, h: 0.0155, d: 0.2212, label: "MacBook Pro 14" },
  { w: 0.44,   h: 0.88,   d: 0.44,   label: "chair" },
  { w: 1.80,   h: 0.85,   d: 0.90,   label: "sofa" },
  { w: 0.80,   h: 0.75,   d: 0.40,   label: "desk" },
  { w: 0.12,   h: 1.40,   d: 0.12,   label: "lamp" },
];

const TEAL   = new THREE.Color(0x0fc4b8);
const WHITE  = new THREE.Color(0xffffff);
const PURPLE = new THREE.Color(0xa78bfa);

function edges(geo: THREE.BufferGeometry, color: THREE.Color, opacity: number) {
  const e = new THREE.EdgesGeometry(geo);
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineSegments(e, m);
}

export default function SceneBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(3.5, 3.5, 7);
    camera.lookAt(0, 1, 0);

    // ── Floor grid ────────────────────────────────────────────
    const grid = new THREE.GridHelper(12, 24, TEAL, TEAL);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.06;
    scene.add(grid);

    // ── Room wireframe (actual demo room dimensions) ──────────
    const room = edges(new THREE.BoxGeometry(ROOM.w, ROOM.h, ROOM.d), TEAL, 0.12);
    room.position.y = ROOM.h / 2;
    scene.add(room);

    // ── Floating scanned objects ──────────────────────────────
    const floaters: { mesh: THREE.LineSegments; vy: number; vr: number; phase: number }[] = [];
    OBJECTS.forEach((obj, i) => {
      const angle = (i / OBJECTS.length) * Math.PI * 2 - 0.4;
      const r = 2.2 + (i % 2) * 0.6;
      const mesh = edges(new THREE.BoxGeometry(obj.w, obj.h, obj.d), TEAL, 0.45);
      mesh.position.set(Math.cos(angle) * r, obj.h / 2 + 0.6, Math.sin(angle) * r);
      mesh.rotation.y = angle + 0.4;
      scene.add(mesh);
      floaters.push({ mesh, vy: 0.28 + i * 0.07, vr: 0.004 + i * 0.001, phase: i * 1.3 });
    });
    // Store base Y after positioning
    floaters.forEach(f => { f.mesh.userData.by = f.mesh.position.y; });

    // ── VR headset (Meta Quest style) ────────────────────────
    const vrGroup = new THREE.Group();
    vrGroup.add(edges(new THREE.BoxGeometry(0.20, 0.11, 0.10), WHITE, 0.22));

    // Two circular lenses
    for (const x of [-0.05, 0.05]) {
      const lens = edges(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 10), TEAL, 0.35);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, 0, -0.055);
      vrGroup.add(lens);
    }

    // Strap
    const strap = edges(new THREE.TorusGeometry(0.12, 0.008, 4, 16, Math.PI), WHITE, 0.14);
    strap.rotation.x = Math.PI / 2;
    strap.position.z = 0.06;
    vrGroup.add(strap);

    // Controllers
    for (const [cx, cz] of [[-0.2, 0.15], [0.2, 0.15]]) {
      const ctrl = new THREE.Group();
      ctrl.add(edges(new THREE.CylinderGeometry(0.018, 0.014, 0.12, 8), WHITE, 0.18));
      const ring = edges(new THREE.TorusGeometry(0.03, 0.005, 4, 10), WHITE, 0.15);
      ring.position.y = 0.05;
      ctrl.add(ring);
      ctrl.position.set(cx, -0.12, cz);
      ctrl.rotation.x = -0.5;
      vrGroup.add(ctrl);
    }

    vrGroup.position.set(-3.2, 2.2, -1.5);
    scene.add(vrGroup);

    // ── iPhone (Expo capture device) ─────────────────────────
    const phoneGroup = new THREE.Group();
    phoneGroup.add(edges(new THREE.BoxGeometry(0.075, 0.160, 0.008), WHITE, 0.20));

    // Camera island
    const cam = edges(new THREE.BoxGeometry(0.022, 0.022, 0.004), TEAL, 0.35);
    cam.position.set(0.018, 0.056, -0.006);
    phoneGroup.add(cam);

    // LiDAR dot
    const lidar = edges(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 8), TEAL, 0.5);
    lidar.rotation.x = Math.PI / 2;
    lidar.position.set(-0.016, 0.056, -0.006);
    phoneGroup.add(lidar);

    phoneGroup.position.set(3.4, 1.8, -1.0);
    phoneGroup.rotation.z = -0.18;
    scene.add(phoneGroup);

    // ── LiDAR scan beam from phone ────────────────────────────
    const beamMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.03, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), beamMat);
    beam.rotation.y = Math.PI / 2;
    beam.position.y = ROOM.h / 2;
    scene.add(beam);

    // Scan line (a brighter thin plane)
    const scanLineMat = new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(0.012, ROOM.h), scanLineMat);
    scanLine.rotation.y = Math.PI / 2;
    scanLine.position.y = ROOM.h / 2;
    scene.add(scanLine);

    // ── Point cloud (LiDAR dots on room surfaces) ─────────────
    const ptCount = 320;
    const ptPositions = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount; i++) {
      const face = Math.floor(Math.random() * 3);
      if (face === 0) { // floor
        ptPositions[i*3]   = (Math.random() - 0.5) * ROOM.w;
        ptPositions[i*3+1] = 0.01;
        ptPositions[i*3+2] = (Math.random() - 0.5) * ROOM.d;
      } else if (face === 1) { // back wall
        ptPositions[i*3]   = (Math.random() - 0.5) * ROOM.w;
        ptPositions[i*3+1] = Math.random() * ROOM.h;
        ptPositions[i*3+2] = -ROOM.d / 2;
      } else { // side wall
        ptPositions[i*3]   = -ROOM.w / 2;
        ptPositions[i*3+1] = Math.random() * ROOM.h;
        ptPositions[i*3+2] = (Math.random() - 0.5) * ROOM.d;
      }
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPositions, 3));
    const ptMat = new THREE.PointsMaterial({ color: TEAL, size: 0.025, transparent: true, opacity: 0.5 });
    const pointCloud = new THREE.Points(ptGeo, ptMat);
    scene.add(pointCloud);

    // ── Bounding box highlight (one object being "scanned") ───
    const highlightMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    const highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3126, 0.0155, 0.2212)),
      highlightMat
    );
    highlight.position.copy(floaters[0].mesh.position);
    scene.add(highlight);

    // ── Measurement dashes (3 axis lines from one corner) ─────
    const dashMat = new THREE.LineBasicMaterial({ color: PURPLE, transparent: true, opacity: 0.45 });
    const mk = (ax: THREE.Vector3, bx: THREE.Vector3) => {
      const g = new THREE.BufferGeometry().setFromPoints([ax, bx]);
      return new THREE.Line(g, dashMat);
    };
    const mBase = new THREE.Vector3(
      floaters[0].mesh.position.x - 0.3126 / 2,
      floaters[0].mesh.position.y - 0.0155 / 2,
      floaters[0].mesh.position.z - 0.2212 / 2
    );
    const mW = mk(mBase, mBase.clone().add(new THREE.Vector3(0.3126, 0, 0)));
    const mH = mk(mBase, mBase.clone().add(new THREE.Vector3(0, 0.0155, 0)));
    const mD = mk(mBase, mBase.clone().add(new THREE.Vector3(0, 0, 0.2212)));
    scene.add(mW, mH, mD);

    // ── Animate ───────────────────────────────────────────────
    let t = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.006;

      // Slow camera orbit
      camera.position.x = 3.5 * Math.cos(t * 0.12) + 0.5 * Math.sin(t * 0.07);
      camera.position.z = 7   * Math.sin(t * 0.12) + 0.5 * Math.cos(t * 0.07);
      camera.position.y = 3.5 + Math.sin(t * 0.08) * 0.4;
      camera.lookAt(0, 1.2, 0);

      // Room breathe
      room.material.opacity = 0.09 + Math.sin(t * 0.5) * 0.03;

      // Floaters
      floaters.forEach(f => {
        f.mesh.position.y = f.mesh.userData.by + Math.sin(t * f.vy + f.phase) * 0.18;
        f.mesh.rotation.y += f.vr;
      });

      // Highlight tracks floater 0
      highlight.position.copy(floaters[0].mesh.position);
      highlight.rotation.copy(floaters[0].mesh.rotation);
      highlight.material.opacity = 0.4 + Math.sin(t * 2.5) * 0.3;

      // Measurement lines track floater 0
      const hp = floaters[0].mesh.position;
      const hy = floaters[0].mesh.rotation.y;
      const cos = Math.cos(hy), sin = Math.sin(hy);
      const corner = new THREE.Vector3(hp.x - cos*0.3126/2 + sin*0.2212/2, hp.y - 0.0155/2, hp.z - sin*0.3126/2 - cos*0.2212/2);
      mW.geometry.setFromPoints([corner, corner.clone().add(new THREE.Vector3(cos*0.3126, 0, sin*0.3126))]);
      mH.geometry.setFromPoints([corner, corner.clone().add(new THREE.Vector3(0, 0.0155, 0))]);
      mD.geometry.setFromPoints([corner, corner.clone().add(new THREE.Vector3(-sin*0.2212, 0, cos*0.2212))]);

      // VR headset float + rotate
      vrGroup.position.y = 2.2 + Math.sin(t * 0.45) * 0.18;
      vrGroup.rotation.y = t * 0.18;

      // Phone float + tilt
      phoneGroup.position.y = 1.8 + Math.sin(t * 0.55 + 1.2) * 0.14;
      phoneGroup.rotation.z = -0.18 + Math.sin(t * 0.3) * 0.06;
      phoneGroup.rotation.x = Math.sin(t * 0.2) * 0.04;

      // Scan beam sweep
      const bx = Math.sin(t * 0.6) * (ROOM.w / 2);
      beam.position.x = bx;
      scanLine.position.x = bx;
      beamMat.opacity = 0.025 + Math.sin(t * 1.2) * 0.01;

      // Point cloud subtle rotation
      pointCloud.rotation.y = t * 0.01;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
