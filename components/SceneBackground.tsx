"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Real dimensions: docs/SYSTEM_STATE.md — Room H
const ROOM = { w: 4.72, h: 2.96, d: 2.76 };

export default function SceneBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(4, 3.5, 8);
    camera.lookAt(0, 1.2, 0);

    // ── Lighting ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xddeeff, 0.55));

    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(6, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    // Soft fill from left — sky-blue tint
    const fill = new THREE.DirectionalLight(0x7dd3fc, 0.35);
    fill.position.set(-5, 4, 2);
    scene.add(fill);

    // Subtle back light
    const back = new THREE.DirectionalLight(0xffffff, 0.2);
    back.position.set(0, 3, -6);
    scene.add(back);

    // ── Helpers ───────────────────────────────────────────────
    const mat = (color: number, opacity = 1, metal = 0, rough = 0.7) =>
      new THREE.MeshStandardMaterial({ color, opacity, transparent: opacity < 1, metalness: metal, roughness: rough });

    const box = (w: number, h: number, d: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const cyl = (rt: number, rb: number, h: number, seg: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
      mesh.castShadow = true;
      return mesh;
    };

    // ── Room ─────────────────────────────────────────────────
    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.w, ROOM.d),
      mat(0x1a2235, 0.55, 0, 0.9)
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor grid lines
    const gridHelper = new THREE.GridHelper(ROOM.w, 12, 0x7dd3fc, 0x7dd3fc);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.08;
    scene.add(gridHelper);

    // Thin room boundary wire (just the floor outline)
    const roomEdge = new THREE.EdgesGeometry(new THREE.BoxGeometry(ROOM.w, 0.005, ROOM.d));
    const roomLine = new THREE.LineSegments(
      roomEdge,
      new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.25 })
    );
    scene.add(roomLine);

    // ── MacBook Pro 14 (real dims: 0.3126 × 0.0155 × 0.2212 m) ──
    const macGroup = new THREE.Group();

    // Base (aluminium space grey)
    const macBase = box(0.3126, 0.0155, 0.2212, mat(0x3a3a3c, 1, 0.6, 0.3));
    macGroup.add(macBase);

    // Screen lid (slightly tilted open)
    const macLid = box(0.3026, 0.195, 0.006, mat(0x2e2e30, 1, 0.6, 0.3));
    macLid.position.set(0, 0.105, -0.107);
    macLid.rotation.x = -1.25; // 72° open
    macGroup.add(macLid);

    // Screen bezel inside
    const screen = box(0.274, 0.172, 0.002, mat(0x111418, 1, 0, 0.95));
    screen.position.set(0, 0.105, -0.107);
    screen.rotation.x = -1.25;
    screen.position.z += 0.0045;
    macGroup.add(screen);

    // Screen glow (emissive)
    const screenGlow = box(0.268, 0.166, 0.001,
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, emissive: new THREE.Color(0x1e3a5f), emissiveIntensity: 0.6, roughness: 1 })
    );
    screenGlow.position.copy(screen.position);
    screenGlow.rotation.copy(screen.rotation);
    screenGlow.position.z += 0.002;
    macGroup.add(screenGlow);

    macGroup.position.set(-1.2, 0.0078, 0.3);
    macGroup.rotation.y = 0.6;
    scene.add(macGroup);

    // ── Meta Quest 3 ─────────────────────────────────────────
    const questGroup = new THREE.Group();

    // Main body — white
    const questBody = box(0.19, 0.11, 0.10, mat(0xf0eeea, 1, 0.05, 0.55));
    questGroup.add(questBody);

    // Lens housings (two circles on front)
    for (const xOff of [-0.048, 0.048]) {
      const housing = cyl(0.034, 0.034, 0.018, 20, mat(0x1a1a1a, 1, 0.2, 0.7));
      housing.rotation.x = Math.PI / 2;
      housing.position.set(xOff, 0, -0.056);
      questGroup.add(housing);

      // Lens glass (blue tinted)
      const lens = cyl(0.028, 0.028, 0.004, 20,
        new THREE.MeshStandardMaterial({ color: 0x3a7bd5, transparent: true, opacity: 0.7, metalness: 0.1, roughness: 0.0 })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(xOff, 0, -0.064);
      questGroup.add(lens);
    }

    // Strap (rubber-like)
    const strapL = box(0.14, 0.04, 0.02, mat(0xd6d3ce, 1, 0, 0.8));
    strapL.position.set(-0.165, 0, 0.01);
    questGroup.add(strapL);
    const strapR = box(0.14, 0.04, 0.02, mat(0xd6d3ce, 1, 0, 0.8));
    strapR.position.set(0.165, 0, 0.01);
    questGroup.add(strapR);

    // Controllers
    for (const [cx, cz] of [[-0.28, 0.08], [0.28, 0.08]]) {
      const ctrlGroup = new THREE.Group();
      const grip = cyl(0.018, 0.014, 0.13, 10, mat(0xe8e6e2, 1, 0.05, 0.6));
      ctrlGroup.add(grip);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.032, 0.005, 8, 20),
        mat(0xd0cec9, 1, 0.1, 0.5)
      );
      ring.position.y = 0.055;
      ring.rotation.x = 0.2;
      ctrlGroup.add(ring);
      ctrlGroup.position.set(cx as number, -0.14, cz as number);
      ctrlGroup.rotation.x = -0.5;
      questGroup.add(ctrlGroup);
    }

    questGroup.position.set(-2.8, 1.8, -0.5);
    questGroup.rotation.y = 0.5;
    scene.add(questGroup);

    // ── iPhone 15 Pro ──────────────────────────────────────────
    const phoneGroup = new THREE.Group();

    // Body — titanium
    const phoneBody = box(0.0712, 0.1494, 0.0083,
      new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 0.75, roughness: 0.25 })
    );
    phoneGroup.add(phoneBody);

    // Screen face
    const phoneFace = box(0.063, 0.137, 0.001, mat(0x0c0c0e, 1, 0, 0.9));
    phoneFace.position.z = 0.0047;
    phoneGroup.add(phoneFace);

    // Screen glow
    const phoneScreen = box(0.058, 0.128, 0.001,
      new THREE.MeshStandardMaterial({
        color: 0x0d2540,
        emissive: new THREE.Color(0x0d2540),
        emissiveIntensity: 0.8,
        roughness: 1,
      })
    );
    phoneScreen.position.z = 0.0052;
    phoneGroup.add(phoneScreen);

    // Camera island (titanium)
    const camIsland = box(0.026, 0.026, 0.004, mat(0x6a6a6a, 1, 0.8, 0.3));
    camIsland.position.set(0.018, 0.054, -0.0046);
    phoneGroup.add(camIsland);

    // 3 camera lenses
    for (const [lx, ly] of [[0, 0.006], [-0.008, -0.006], [0.008, -0.006]]) {
      const camLens = cyl(0.0045, 0.0045, 0.003, 12,
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.3, roughness: 0.4 })
      );
      camLens.rotation.x = Math.PI / 2;
      camLens.position.set(0.018 + (lx as number), 0.054 + (ly as number), -0.006);
      phoneGroup.add(camLens);
    }

    phoneGroup.position.set(3.0, 1.6, -0.8);
    phoneGroup.rotation.y = -0.5;
    phoneGroup.rotation.z = 0.08;
    scene.add(phoneGroup);

    // ── Sofa (scanned object) ─────────────────────────────────
    const sofaGroup = new THREE.Group();

    // Seat cushion
    const seat = box(1.80, 0.18, 0.70, mat(0x8b7355, 1, 0, 0.85));
    seat.position.y = 0.38;
    sofaGroup.add(seat);

    // Back cushion
    const back2 = box(1.80, 0.52, 0.18, mat(0x7a6348, 1, 0, 0.85));
    back2.position.set(0, 0.71, -0.26);
    sofaGroup.add(back2);

    // Frame / base
    const base2 = box(1.84, 0.28, 0.76, mat(0x5c4a36, 1, 0, 0.9));
    base2.position.y = 0.14;
    sofaGroup.add(base2);

    // Arms
    for (const x of [-0.84, 0.84]) {
      const arm = box(0.12, 0.55, 0.70, mat(0x6b5240, 1, 0, 0.85));
      arm.position.set(x, 0.375, 0);
      sofaGroup.add(arm);
    }

    sofaGroup.position.set(0.8, 0, -0.9);
    sofaGroup.rotation.y = -0.3;
    scene.add(sofaGroup);

    // ── Desk / side table ─────────────────────────────────────
    const tableGroup = new THREE.Group();
    const tabletop = box(0.80, 0.04, 0.50, mat(0xc8a87a, 1, 0.1, 0.6));
    tabletop.position.y = 0.72;
    tableGroup.add(tabletop);
    for (const [tx, tz] of [[-0.34, -0.20], [0.34, -0.20], [-0.34, 0.20], [0.34, 0.20]]) {
      const leg = box(0.04, 0.70, 0.04, mat(0xb09060, 1, 0, 0.8));
      leg.position.set(tx as number, 0.35, tz as number);
      tableGroup.add(leg);
    }
    tableGroup.position.set(2.2, 0, 1.0);
    tableGroup.rotation.y = 0.4;
    scene.add(tableGroup);

    // ── LiDAR scan beam (phone → room) ────────────────────────
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), beamMat);
    beam.rotation.y = Math.PI / 2;
    beam.position.y = ROOM.h / 2;
    scene.add(beam);

    const scanLineMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
    const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(0.008, ROOM.h), scanLineMat);
    scanLine.rotation.y = Math.PI / 2;
    scanLine.position.y = ROOM.h / 2;
    scene.add(scanLine);

    // ── Bounding box highlight on MacBook ─────────────────────
    const bbMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.6 });
    const bb = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3126, 0.0155, 0.2212)),
      bbMat
    );
    scene.add(bb);

    // ── Point cloud ───────────────────────────────────────────
    const ptCount = 280;
    const pos = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount; i++) {
      const face = i % 3;
      if (face === 0) {
        pos[i*3] = (Math.random()-.5)*ROOM.w; pos[i*3+1] = 0.005; pos[i*3+2] = (Math.random()-.5)*ROOM.d;
      } else if (face === 1) {
        pos[i*3] = (Math.random()-.5)*ROOM.w; pos[i*3+1] = Math.random()*ROOM.h; pos[i*3+2] = -ROOM.d/2;
      } else {
        pos[i*3] = -ROOM.w/2; pos[i*3+1] = Math.random()*ROOM.h; pos[i*3+2] = (Math.random()-.5)*ROOM.d;
      }
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(ptGeo, new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.022, transparent: true, opacity: 0.45 })));

    // ── Animate ───────────────────────────────────────────────
    let t = 0, animId: number;
    const macBaseY = macGroup.position.y;
    const questBaseY = questGroup.position.y;
    const phoneBaseY = phoneGroup.position.y;
    const sofaBaseY = sofaGroup.position.y;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.005;

      // Camera slow orbit
      camera.position.x = 4   * Math.cos(t * 0.1) + 0.6 * Math.sin(t * 0.07);
      camera.position.z = 8   * Math.sin(t * 0.1) + 0.4 * Math.cos(t * 0.06);
      camera.position.y = 3.5 + Math.sin(t * 0.08) * 0.35;
      camera.lookAt(0, 1.2, 0);

      // MacBook floats and spins
      macGroup.position.y = macBaseY + Math.sin(t * 0.7) * 0.14;
      macGroup.rotation.y += 0.004;

      // Quest floats
      questGroup.position.y = questBaseY + Math.sin(t * 0.55 + 1.1) * 0.16;
      questGroup.rotation.y += 0.006;

      // Phone floats
      phoneGroup.position.y = phoneBaseY + Math.sin(t * 0.65 + 2.2) * 0.13;
      phoneGroup.rotation.y -= 0.003;

      // Sofa gentle bob (it's heavy!)
      sofaGroup.position.y = sofaBaseY + Math.sin(t * 0.3 + 0.5) * 0.04;

      // Bounding box tracks MacBook
      bb.position.copy(macGroup.position);
      bb.position.y += 0.0078;
      bb.rotation.y = macGroup.rotation.y;
      bbMat.opacity = 0.35 + Math.sin(t * 2.5) * 0.25;

      // Scan beam sweeps
      const bx = Math.sin(t * 0.55) * (ROOM.w / 2);
      beam.position.x = bx;
      scanLine.position.x = bx;

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
