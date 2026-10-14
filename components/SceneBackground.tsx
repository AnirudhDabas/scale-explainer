"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const ROOM = { w: 4.72, h: 2.96, d: 2.76 };

export default function SceneBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(2.5, 2.8, 6.0);
    camera.lookAt(0, 1.0, 0);

    // ── Lighting — much stronger ───────────────────────────────
    scene.add(new THREE.AmbientLight(0xd0e8ff, 2.2));

    const sun = new THREE.DirectionalLight(0xffffff, 4.5);
    sun.position.set(5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);

    // Sky-blue rim from left
    const fill = new THREE.DirectionalLight(0x7dd3fc, 2.8);
    fill.position.set(-6, 5, 3);
    scene.add(fill);

    // Warm back key
    const back = new THREE.DirectionalLight(0xfff0e0, 1.2);
    back.position.set(0, 4, -7);
    scene.add(back);

    // Point light near objects for close-up glow
    const pt = new THREE.PointLight(0x7dd3fc, 3.5, 8);
    pt.position.set(0, 3, 2);
    scene.add(pt);

    // ── Material helpers ───────────────────────────────────────
    const std = (color: number, opts: {
      metalness?: number; roughness?: number; emissive?: number; emissiveIntensity?: number; opacity?: number;
    } = {}) =>
      new THREE.MeshStandardMaterial({
        color,
        metalness:         opts.metalness         ?? 0,
        roughness:         opts.roughness          ?? 0.65,
        emissive:          new THREE.Color(opts.emissive ?? color),
        emissiveIntensity: opts.emissiveIntensity  ?? 0.06,
        transparent:       (opts.opacity ?? 1) < 1,
        opacity:           opts.opacity            ?? 1,
      });

    const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = shadow;
      m.receiveShadow = shadow;
      return m;
    };
    const box  = (w: number, h: number, d: number, mat: THREE.Material) => mesh(new THREE.BoxGeometry(w, h, d), mat);
    const cyl  = (rt: number, rb: number, h: number, seg: number, mat: THREE.Material) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);

    // ── Floor + grid ───────────────────────────────────────────
    const floor = mesh(new THREE.PlaneGeometry(14, 14), std(0x101828, { roughness: 0.9, emissiveIntensity: 0 }), false);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(12, 18, 0x7dd3fc, 0x7dd3fc);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.14;
    scene.add(grid);

    // Room boundary edge (floor outline)
    const roomLine = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(ROOM.w, 0.004, ROOM.d)),
      new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.4 })
    );
    scene.add(roomLine);

    // ── MacBook Pro 14 ─────────────────────────────────────────
    const mac = new THREE.Group();

    const macBase = box(0.3126, 0.0155, 0.2212,
      std(0x4a4a50, { metalness: 0.75, roughness: 0.2, emissiveIntensity: 0.08 }));
    mac.add(macBase);

    const lid = box(0.300, 0.196, 0.005,
      std(0x38383c, { metalness: 0.75, roughness: 0.2, emissiveIntensity: 0.08 }));
    lid.position.set(0, 0.106, -0.108);
    lid.rotation.x = -1.22;
    mac.add(lid);

    const bezel = box(0.274, 0.173, 0.002, std(0x101014, { roughness: 1, emissiveIntensity: 0 }));
    bezel.position.copy(lid.position);
    bezel.rotation.copy(lid.rotation);
    bezel.position.z += 0.004;
    mac.add(bezel);

    const scrn = box(0.262, 0.164, 0.001,
      new THREE.MeshStandardMaterial({
        color: 0x1a4060,
        emissive: new THREE.Color(0x2060a0),
        emissiveIntensity: 1.8,
        roughness: 1,
      }));
    scrn.position.copy(bezel.position);
    scrn.rotation.copy(bezel.rotation);
    scrn.position.z += 0.003;
    mac.add(scrn);

    mac.scale.setScalar(1.5);
    mac.position.set(-1.6, 0.012, 0.4);
    mac.rotation.y = 0.7;
    scene.add(mac);

    // ── Meta Quest 3 ───────────────────────────────────────────
    const quest = new THREE.Group();

    quest.add(box(0.19, 0.115, 0.10, std(0xf5f2ee, { roughness: 0.5, emissiveIntensity: 0.04 })));

    for (const xOff of [-0.05, 0.05]) {
      // Lens housing
      const h2 = cyl(0.035, 0.035, 0.018, 24, std(0x1a1a1a, { roughness: 0.7, metalness: 0.3 }));
      h2.rotation.x = Math.PI / 2;
      h2.position.set(xOff, 0, -0.058);
      quest.add(h2);
      // Lens glass — glowing blue
      const lg = cyl(0.029, 0.029, 0.004, 24,
        new THREE.MeshStandardMaterial({ color: 0x2255aa, emissive: new THREE.Color(0x3399ff), emissiveIntensity: 2.5, transparent: true, opacity: 0.85, roughness: 0 }));
      lg.rotation.x = Math.PI / 2;
      lg.position.set(xOff, 0, -0.066);
      quest.add(lg);
    }

    // Strap pieces
    for (const x of [-0.165, 0.165]) {
      quest.add(Object.assign(box(0.14, 0.042, 0.022, std(0xdedad5, { roughness: 0.8 })), { position: new THREE.Vector3(x, 0, 0) }));
    }

    // Controllers
    for (const [cx, cz] of [[-0.29, 0.06], [0.29, 0.06]]) {
      const cg = new THREE.Group();
      cg.add(cyl(0.019, 0.015, 0.13, 12, std(0xe8e5e0, { roughness: 0.55, emissiveIntensity: 0.04 })));
      const ring = mesh(new THREE.TorusGeometry(0.033, 0.005, 8, 22),
        std(0xccc9c4, { roughness: 0.5, emissiveIntensity: 0.04 }));
      ring.position.y = 0.056;
      ring.rotation.x = 0.2;
      cg.add(ring);
      cg.position.set(cx as number, -0.15, cz as number);
      cg.rotation.x = -0.5;
      quest.add(cg);
    }

    quest.scale.setScalar(1.4);
    quest.position.set(-2.9, 1.75, -0.5);
    quest.rotation.y = 0.55;
    scene.add(quest);

    // ── iPhone 15 Pro ──────────────────────────────────────────
    const phone = new THREE.Group();

    phone.add(box(0.0712, 0.1494, 0.0083,
      std(0x9090a0, { metalness: 0.85, roughness: 0.15, emissiveIntensity: 0.05 })));

    phone.add(box(0.063, 0.137, 0.001, std(0x0a0a0e, { roughness: 1, emissiveIntensity: 0 })));

    const pScreen = box(0.058, 0.128, 0.001,
      new THREE.MeshStandardMaterial({ color: 0x0d2a50, emissive: new THREE.Color(0x1855aa), emissiveIntensity: 2.2, roughness: 1 }));
    pScreen.position.z = 0.0053;
    phone.add(pScreen);

    const camIsland = box(0.027, 0.027, 0.004,
      std(0x606070, { metalness: 0.9, roughness: 0.2 }));
    camIsland.position.set(0.018, 0.054, -0.0045);
    phone.add(camIsland);

    for (const [lx, ly] of [[0, 0.006], [-0.009, -0.006], [0.009, -0.006]]) {
      const cl = cyl(0.0046, 0.0046, 0.003, 12,
        std(0x111111, { metalness: 0.3, roughness: 0.4 }));
      cl.rotation.x = Math.PI / 2;
      cl.position.set(0.018 + (lx as number), 0.054 + (ly as number), -0.006);
      phone.add(cl);
    }

    phone.scale.setScalar(1.8);
    phone.position.set(3.1, 1.7, -0.8);
    phone.rotation.y = -0.5;
    phone.rotation.z = 0.1;
    scene.add(phone);

    // ── Sofa ───────────────────────────────────────────────────
    const sofa = new THREE.Group();

    sofa.add(Object.assign(box(1.8, 0.18, 0.70, std(0xa08060, { roughness: 0.85, emissiveIntensity: 0.04 })),
      { position: new THREE.Vector3(0, 0.38, 0) }));
    sofa.add(Object.assign(box(1.8, 0.52, 0.18, std(0x8a6e50, { roughness: 0.85, emissiveIntensity: 0.04 })),
      { position: new THREE.Vector3(0, 0.71, -0.26) }));
    sofa.add(Object.assign(box(1.84, 0.28, 0.76, std(0x6a5040, { roughness: 0.9 })),
      { position: new THREE.Vector3(0, 0.14, 0) }));
    for (const x of [-0.84, 0.84]) {
      sofa.add(Object.assign(box(0.12, 0.55, 0.70, std(0x806050, { roughness: 0.85, emissiveIntensity: 0.04 })),
        { position: new THREE.Vector3(x, 0.375, 0) }));
    }

    sofa.position.set(0.9, 0, -1.0);
    sofa.rotation.y = -0.25;
    scene.add(sofa);

    // ── Desk ───────────────────────────────────────────────────
    const desk = new THREE.Group();
    desk.add(Object.assign(box(0.80, 0.04, 0.50, std(0xd4a86a, { roughness: 0.55, metalness: 0.05, emissiveIntensity: 0.04 })),
      { position: new THREE.Vector3(0, 0.72, 0) }));
    for (const [tx, tz] of [[-0.34,-0.20],[0.34,-0.20],[-0.34,0.20],[0.34,0.20]]) {
      desk.add(Object.assign(box(0.04, 0.70, 0.04, std(0xb88c50, { roughness: 0.7 })),
        { position: new THREE.Vector3(tx as number, 0.35, tz as number) }));
    }
    desk.position.set(2.3, 0, 1.0);
    desk.rotation.y = 0.35;
    scene.add(desk);

    // ── Scan beam ──────────────────────────────────────────────
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
    const beam = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.h), beamMat, false);
    beam.rotation.y = Math.PI / 2;
    beam.position.y = ROOM.h / 2;
    scene.add(beam);

    const scanMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const scanLine = mesh(new THREE.PlaneGeometry(0.006, ROOM.h), scanMat, false);
    scanLine.rotation.y = Math.PI / 2;
    scanLine.position.y = ROOM.h / 2;
    scene.add(scanLine);

    // ── Bounding box on MacBook ────────────────────────────────
    const bbMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.9 });
    const bb = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3126 * 1.5, 0.0155 * 1.5, 0.2212 * 1.5)),
      bbMat
    );
    scene.add(bb);

    // ── Point cloud ────────────────────────────────────────────
    const ptCount = 300;
    const ptPos = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount; i++) {
      const f = i % 3;
      ptPos[i*3]   = f===0 ? (Math.random()-.5)*ROOM.w : f===1 ? (Math.random()-.5)*ROOM.w : -ROOM.w/2;
      ptPos[i*3+1] = f===0 ? 0.01 : Math.random()*ROOM.h;
      ptPos[i*3+2] = f===0 ? (Math.random()-.5)*ROOM.d : f===1 ? -ROOM.d/2 : (Math.random()-.5)*ROOM.d;
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPos, 3));
    scene.add(new THREE.Points(ptGeo,
      new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.028, transparent: true, opacity: 0.65 })));

    // ── Animate ────────────────────────────────────────────────
    let t = 0, animId: number;
    const macBaseY  = mac.position.y;
    const questBaseY = quest.position.y;
    const phoneBaseY = phone.position.y;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.005;

      camera.position.x = 2.5 * Math.cos(t * 0.1) + 0.5 * Math.sin(t * 0.07);
      camera.position.z = 6.0 + 0.8 * Math.sin(t * 0.1);
      camera.position.y = 2.8 + 0.3 * Math.sin(t * 0.08);
      camera.lookAt(0, 1.0, 0);

      mac.position.y   = macBaseY   + Math.sin(t * 0.7)         * 0.16;
      mac.rotation.y  += 0.004;
      quest.position.y = questBaseY + Math.sin(t * 0.55 + 1.1)  * 0.18;
      quest.rotation.y += 0.006;
      phone.position.y = phoneBaseY + Math.sin(t * 0.65 + 2.2)  * 0.15;
      phone.rotation.y -= 0.003;

      bb.position.set(mac.position.x, mac.position.y + 0.012, mac.position.z);
      bb.rotation.y = mac.rotation.y;
      bbMat.opacity = 0.55 + Math.sin(t * 2.5) * 0.35;

      const bx = Math.sin(t * 0.55) * (ROOM.w / 2);
      beam.position.x = bx;
      scanLine.position.x = bx;

      // Point light pulses with scan
      pt.intensity = 2.5 + Math.sin(t * 1.2) * 1.0;

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
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={mountRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />
  );
}
