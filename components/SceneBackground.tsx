"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { useMotionPreferences } from "./MotionPreferences";

const ROOM = { w: 4.72, h: 2.96, d: 2.76 };
const TEAL   = 0xb7c9a8;
const TEAL_C = new THREE.Color(TEAL);

export default function SceneBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { enabled } = useMotionPreferences();

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !enabled) return;
    const test = document.createElement("canvas");
    if (!test.getContext("webgl2") && !test.getContext("webgl")) return;

    try {
      // ── Renderer ────────────────────────────────────────────
      const W = window.innerWidth, H = window.innerHeight;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, W < 768 ? 1 : 1.25));
      renderer.setSize(W, H);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
      camera.position.set(2.5, 2.8, 6.5);

      // ── Bloom via EffectComposer (graceful fallback) ─────────
      let disposed = false;
      let composer: EffectComposer | null = null;
      Promise.all([
        import("three/examples/jsm/postprocessing/EffectComposer.js"),
        import("three/examples/jsm/postprocessing/RenderPass.js"),
        import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
        import("three/examples/jsm/postprocessing/OutputPass.js"),
      ]).then(([{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }]) => {
        if (disposed) return;
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.18, 0.7, 0.5);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
      }).catch(() => {});

      // ── Lights ──────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xd0e8ff, 0.9));

      const sun = new THREE.DirectionalLight(0xffffff, 1.8);
      sun.position.set(4, 8, 5);
      sun.castShadow = true;
      scene.add(sun);

      const tealFill = new THREE.DirectionalLight(0xb7c9a8, 1.2);
      tealFill.position.set(-5, 4, 2);
      scene.add(tealFill);

      const warmBack = new THREE.DirectionalLight(0xfff0e0, 0.7);
      warmBack.position.set(0, 3, -7);
      scene.add(warmBack);

      const movingPt = new THREE.PointLight(0xb7c9a8, 3.5, 10);
      movingPt.position.set(0, 2, 0);
      scene.add(movingPt);

      // ── Helpers ─────────────────────────────────────────────
      const emissiveMat = (color: number, intensity: number, opacity = 1) =>
        new THREE.MeshStandardMaterial({
          color,
          emissive: new THREE.Color(color),
          emissiveIntensity: intensity,
          transparent: opacity < 1,
          opacity,
          roughness: 0.4,
          metalness: 0.1,
        });

      const solidMat = (color: number, metal = 0, rough = 0.65, emissInt = 0.06) =>
        new THREE.MeshStandardMaterial({
          color,
          metalness: metal,
          roughness: rough,
          emissive: new THREE.Color(color),
          emissiveIntensity: emissInt,
        });

      const mkBox  = (w: number, h: number, d: number, mat: THREE.Material) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.castShadow = true; m.receiveShadow = true; return m;
      };
      const mkCyl  = (rt: number, rb: number, h: number, seg: number, mat: THREE.Material) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
        m.castShadow = true; return m;
      };

      // ── Floor ───────────────────────────────────────────────
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 16),
        solidMat(0x080e1c, 0, 0.95, 0)
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      // Neon grid (bright teal, bloom will make it glow)
      const grid = new THREE.GridHelper(14, 22, TEAL, TEAL);
      const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
      gridMats.forEach(m => {
        m.transparent = true;
        (m as THREE.LineBasicMaterial).opacity = 0.18;
      });
      scene.add(grid);

      // ── Pulse rings on floor ─────────────────────────────────
      const rings: Array<{ mesh: THREE.Mesh; phase: number }> = [];
      for (let i = 0; i < 4; i++) {
        const rGeo = new THREE.RingGeometry(1, 1.015, 80);
        const rMat = new THREE.MeshBasicMaterial({
          color: TEAL,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        });
        const r = new THREE.Mesh(rGeo, rMat);
        r.rotation.x = -Math.PI / 2;
        r.position.y = 0.005;
        scene.add(r);
        rings.push({ mesh: r, phase: i / 4 });
      }

      // ── Room boundary wireframe ──────────────────────────────
      const roomEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(ROOM.w, ROOM.h, ROOM.d)),
        new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.2 })
      );
      roomEdge.position.y = ROOM.h / 2;
      scene.add(roomEdge);

      // ── Scan plane (custom glow shader) ─────────────────────
      const scanShader = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: TEAL_C },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uColor;
          void main() {
            float edge = smoothstep(0.47, 0.5, abs(vUv.x - 0.5)) * 4.0;
            float scanLine = pow(abs(sin(vUv.y * 28.0 + uTime * 2.5)), 12.0) * 0.15;
            float body = (1.0 - edge) * 0.06;
            float alpha = edge + scanLine + body;
            gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, ROOM.h, 1, 80), scanShader);
      scanPlane.rotation.y = Math.PI / 2;
      scanPlane.position.y = ROOM.h / 2;
      scene.add(scanPlane);

      // Bright scan edge line (extra bloom)
      const scanLineMat = new THREE.LineBasicMaterial({ color: TEAL });
      const scanLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, ROOM.h, 0),
      ]);
      const scanLineObj = new THREE.Line(scanLineGeo, scanLineMat);
      scene.add(scanLineObj);

      // ── Progressive point cloud ──────────────────────────────
      const PT_COUNT = 900;
      const ptPositions = new Float32Array(PT_COUNT * 3);
      const ptColors    = new Float32Array(PT_COUNT * 3);
      const ptAlphas    = new Float32Array(PT_COUNT); // target alpha per point

      // Arrange points in furniture-like clusters
      const ptDefs = [
        // Floor plane
        ...Array.from({ length: 200 }, () => ({
          x: (Math.random() - 0.5) * ROOM.w,
          y: 0.02 + Math.random() * 0.05,
          z: (Math.random() - 0.5) * ROOM.d,
        })),
        // Sofa cluster
        ...Array.from({ length: 160 }, () => ({
          x: 0.6 + (Math.random() - 0.5) * 2.0,
          y: Math.random() * 0.9,
          z: -0.6 + (Math.random() - 0.5) * 1.0,
        })),
        // Desk cluster
        ...Array.from({ length: 120 }, () => ({
          x: 2.0 + (Math.random() - 0.5) * 0.9,
          y: Math.random() * 0.75,
          z: 0.8 + (Math.random() - 0.5) * 0.55,
        })),
        // Walls
        ...Array.from({ length: 200 }, () => {
          const face = Math.floor(Math.random() * 3);
          return face === 0
            ? { x: (Math.random() - 0.5) * ROOM.w, y: Math.random() * ROOM.h, z: -ROOM.d / 2 }
            : face === 1
            ? { x: -ROOM.w / 2, y: Math.random() * ROOM.h, z: (Math.random() - 0.5) * ROOM.d }
            : { x: ROOM.w / 2, y: Math.random() * ROOM.h, z: (Math.random() - 0.5) * ROOM.d };
        }),
        // Ceiling
        ...Array.from({ length: 120 }, () => ({
          x: (Math.random() - 0.5) * ROOM.w,
          y: ROOM.h - 0.05,
          z: (Math.random() - 0.5) * ROOM.d,
        })),
        // MacBook cluster
        ...Array.from({ length: 100 }, () => ({
          x: -1.4 + (Math.random() - 0.5) * 0.45,
          y: 0.5 + Math.random() * 0.25,
          z: 0.2 + (Math.random() - 0.5) * 0.3,
        })),
      ].slice(0, PT_COUNT);

      ptDefs.forEach((p, i) => {
        ptPositions[i * 3]     = p.x;
        ptPositions[i * 3 + 1] = p.y;
        ptPositions[i * 3 + 2] = p.z;
        // Color: teal to white gradient based on height
        const t = Math.min(p.y / ROOM.h, 1);
        ptColors[i * 3]     = 0.49 + t * 0.3;
        ptColors[i * 3 + 1] = 0.83 + t * 0.1;
        ptColors[i * 3 + 2] = 0.99;
        ptAlphas[i] = 0;
      });

      const ptGeo = new THREE.BufferGeometry();
      ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPositions, 3));
      const ptOpacity = new THREE.BufferAttribute(new Float32Array(PT_COUNT), 1);
      ptGeo.setAttribute("opacity", ptOpacity);
      // Use "ptColor". "color" is reserved by Three.js when vertexColors is set
      ptGeo.setAttribute("ptColor", new THREE.BufferAttribute(ptColors, 3));

      const ptMat = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: `
          attribute float opacity;
          attribute vec3 ptColor;
          varying float vOpacity;
          varying vec3 vColor;
          void main() {
            vOpacity = opacity;
            vColor = ptColor;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = clamp(300.0 / -mvPos.z, 1.5, 6.0);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          varying float vOpacity;
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = (1.0 - d * 1.8) * vOpacity;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
      });
      const points = new THREE.Points(ptGeo, ptMat);
      scene.add(points);

      // ── MacBook Pro 14 ──────────────────────────────────────
      const mac = new THREE.Group();

      mac.add(mkBox(0.3126, 0.0155, 0.2212, solidMat(0x4a4a50, 0.75, 0.2, 0.08)));

      const lid = mkBox(0.300, 0.196, 0.005, solidMat(0x38383c, 0.75, 0.2, 0.08));
      lid.position.set(0, 0.106, -0.108);
      lid.rotation.x = -1.22;
      mac.add(lid);

      // Glowing screen (HIGH emissive for bloom)
      const scrn = mkBox(0.262, 0.164, 0.001,
        emissiveMat(0x2060a0, 2.2)
      );
      scrn.position.copy(lid.position);
      scrn.rotation.copy(lid.rotation);
      scrn.translateZ(0.004);
      mac.add(scrn);

      mac.scale.setScalar(1.5);
      mac.position.set(-1.6, 0.012, 0.3);
      mac.rotation.y = 0.7;
      scene.add(mac);

      // Dimension lines around MacBook (thin LineSegments)
      const dimMat = new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.7 });
      const dimPts = [
        // Width line
        new THREE.Vector3(-0.3126 / 2, -0.01, 0),
        new THREE.Vector3( 0.3126 / 2, -0.01, 0),
        // Depth line
        new THREE.Vector3(0, -0.01, -0.2212 / 2),
        new THREE.Vector3(0, -0.01,  0.2212 / 2),
      ];
      // Split into two separate lines
      [[0,1],[2,3]].forEach(([a,b]) => {
        const g = new THREE.BufferGeometry().setFromPoints([dimPts[a], dimPts[b]]);
        const l = new THREE.Line(g, dimMat);
        mac.add(l);
      });

      // ── Meta Quest 3 ─────────────────────────────────────────
      const quest = new THREE.Group();
      quest.add(mkBox(0.19, 0.115, 0.10, solidMat(0xf5f2ee, 0.05, 0.5, 0.04)));

      for (const xOff of [-0.05, 0.05]) {
        const housing = mkCyl(0.035, 0.035, 0.018, 24, solidMat(0x1a1a1a, 0.3, 0.7, 0.04));
        housing.rotation.x = Math.PI / 2;
        housing.position.set(xOff, 0, -0.058);
        quest.add(housing);

        // Very high emissive lenses = dramatic bloom glow
        const lens = mkCyl(0.029, 0.029, 0.004, 24,
          emissiveMat(0x3399ff, 2.8, 0.85)
        );
        lens.rotation.x = Math.PI / 2;
        lens.position.set(xOff, 0, -0.066);
        quest.add(lens);
      }

      const strapL = mkBox(0.14, 0.042, 0.022, solidMat(0xdedad5, 0, 0.8, 0.04));
      strapL.position.set(-0.165, 0, 0);
      quest.add(strapL);
      const strapR = strapL.clone();
      strapR.position.set(0.165, 0, 0);
      quest.add(strapR);

      for (const [cx, cz] of [[-0.29, 0.06], [0.29, 0.06]]) {
        const cg = new THREE.Group();
        cg.add(mkCyl(0.019, 0.015, 0.13, 12, solidMat(0xe8e5e0, 0.05, 0.55, 0.04)));
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.033, 0.005, 8, 22),
          solidMat(0xccc9c4, 0.1, 0.5, 0.04)
        );
        ring.position.y = 0.056;
        ring.rotation.x = 0.2;
        cg.add(ring);
        cg.position.set(cx as number, -0.15, cz as number);
        cg.rotation.x = -0.5;
        quest.add(cg);
      }

      quest.scale.setScalar(1.4);
      quest.position.set(-2.8, 1.75, -0.5);
      quest.rotation.y = 0.55;
      scene.add(quest);

      // ── iPhone ───────────────────────────────────────────────
      const phone = new THREE.Group();
      phone.add(mkBox(0.0712, 0.1494, 0.0083, solidMat(0x9090a0, 0.85, 0.15, 0.05)));
      phone.add(mkBox(0.063, 0.137, 0.001, solidMat(0x0a0a0e, 0, 1, 0)));

      // High emissive screen
      const pScr = mkBox(0.058, 0.128, 0.001, emissiveMat(0x1855aa, 2.2));
      pScr.position.z = 0.005;
      phone.add(pScr);

      const camIsland = mkBox(0.027, 0.027, 0.004, solidMat(0x606070, 0.9, 0.2));
      camIsland.position.set(0.018, 0.054, -0.005);
      phone.add(camIsland);

      for (const [lx, ly] of [[0, 0.006], [-0.009, -0.006], [0.009, -0.006]]) {
        const cl = mkCyl(0.0046, 0.0046, 0.003, 12, solidMat(0x111111, 0.3, 0.4));
        cl.rotation.x = Math.PI / 2;
        cl.position.set(0.018 + (lx as number), 0.054 + (ly as number), -0.006);
        phone.add(cl);
      }

      phone.scale.setScalar(1.8);
      phone.position.set(3.1, 1.7, -0.8);
      phone.rotation.y = -0.5;
      phone.rotation.z = 0.08;
      scene.add(phone);

      // ── Sofa ─────────────────────────────────────────────────
      const sofa = new THREE.Group();
      const seat = mkBox(1.8, 0.18, 0.70, solidMat(0xa08060, 0, 0.85, 0.04));
      seat.position.set(0, 0.38, 0); sofa.add(seat);
      const sofaBack = mkBox(1.8, 0.52, 0.18, solidMat(0x8a6e50, 0, 0.85, 0.04));
      sofaBack.position.set(0, 0.71, -0.26); sofa.add(sofaBack);
      const sofaBase = mkBox(1.84, 0.28, 0.76, solidMat(0x6a5040, 0, 0.9));
      sofaBase.position.set(0, 0.14, 0); sofa.add(sofaBase);
      for (const x of [-0.84, 0.84]) {
        const arm = mkBox(0.12, 0.55, 0.70, solidMat(0x806050, 0, 0.85, 0.04));
        arm.position.set(x, 0.375, 0); sofa.add(arm);
      }
      sofa.position.set(0.9, 0, -1.0);
      sofa.rotation.y = -0.25;
      scene.add(sofa);

      // ── Floating particles ────────────────────────────────────
      const sparks = 60;
      const spkPos = new Float32Array(sparks * 3);
      const spkVel = Array.from({ length: sparks }, () => ({
        vx: (Math.random() - 0.5) * 0.004,
        vy: Math.random() * 0.003 + 0.001,
        vz: (Math.random() - 0.5) * 0.004,
      }));
      for (let i = 0; i < sparks; i++) {
        spkPos[i * 3]     = (Math.random() - 0.5) * ROOM.w;
        spkPos[i * 3 + 1] = Math.random() * ROOM.h;
        spkPos[i * 3 + 2] = (Math.random() - 0.5) * ROOM.d;
      }
      const spkGeo = new THREE.BufferGeometry();
      spkGeo.setAttribute("position", new THREE.BufferAttribute(spkPos, 3));
      scene.add(new THREE.Points(spkGeo,
        new THREE.PointsMaterial({ color: TEAL, size: 0.018, transparent: true, opacity: 0.7, sizeAttenuation: true })
      ));

      // ── Camera spline path ───────────────────────────────────
      const camPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.5, 2.8, 6.5),
        new THREE.Vector3(-1.0, 3.2, 6.0),
        new THREE.Vector3(-3.5, 2.4, 3.0),
        new THREE.Vector3(-2.0, 1.8, -1.0),
        new THREE.Vector3( 2.0, 2.2, -1.5),
        new THREE.Vector3( 4.0, 3.0, 2.5),
        new THREE.Vector3( 3.0, 2.5, 5.5),
      ], true);

      // ── Bounding box on MacBook ──────────────────────────────
      const bbMat = new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.9 });
      const bb = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3126 * 1.5, 0.0155 * 1.5, 0.2212 * 1.5)),
        bbMat
      );
      scene.add(bb);

      // ── Animate ──────────────────────────────────────────────
      // ── Scroll-driven camera waypoints ──────────────────────
      // Each waypoint corresponds to a page section
      const scrollWaypoints = [
        { pos: new THREE.Vector3( 2.5, 2.8,  6.5), look: new THREE.Vector3( 0,   1.2,  0) },   // Hero
        { pos: new THREE.Vector3(-1.5, 2.8,  5.5), look: new THREE.Vector3( 0,   1.5,  0) },   // Architecture
        { pos: new THREE.Vector3( 3.0, 1.8,  4.5), look: new THREE.Vector3( 0,   1.0, -0.5) }, // Pipeline
        { pos: new THREE.Vector3(-0.8, 1.5,  3.5), look: new THREE.Vector3(-1.6, 0.8,  0.3) }, // Binding. close to MacBook
        { pos: new THREE.Vector3( 0.5, 5.5,  1.0), look: new THREE.Vector3( 0,   0.5,  0) },   // Fit engine. top-down
        { pos: new THREE.Vector3( 2.5, 2.8,  6.5), look: new THREE.Vector3( 0,   1.2,  0) },   // Decisions. back to start
      ];

      let sectionTops: number[] = [];
      const measureSections = () => {
        sectionTops = ["main-content", "architecture", "pipeline", "binding", "fitengine", "decisions"].map(id => {
          const section = document.getElementById(id);
          return section ? section.getBoundingClientRect().top + scrollY : 0;
        });
      };
      const layoutObserver = new ResizeObserver(measureSections);
      layoutObserver.observe(document.body);
      measureSections();
      let lastFrame = 0;
      let t = 0;
      let animId: number;
      const macBaseY   = mac.position.y;
      const questBaseY = quest.position.y;
      const phoneBaseY = phone.position.y;

      const camPos     = new THREE.Vector3().copy(scrollWaypoints[0].pos);
      const camLook    = new THREE.Vector3().copy(scrollWaypoints[0].look);
      const targetPos  = new THREE.Vector3();
      const targetLook = new THREE.Vector3();

      const animate = (now: number) => {
        animId = requestAnimationFrame(animate);
        if (document.hidden || now - lastFrame < 32) return;
        lastFrame = now;
        t += 0.008;

        // ── Scroll → camera waypoint interpolation ────────────
        const segCount = scrollWaypoints.length - 1;
        const scrollPosition = scrollY + innerHeight * 0.25;
        let segIdx = 0;
        while (segIdx < segCount - 1 && scrollPosition >= sectionTops[segIdx + 1]) segIdx++;
        const segT = THREE.MathUtils.clamp((scrollPosition - sectionTops[segIdx]) / Math.max(1, sectionTops[segIdx + 1] - sectionTops[segIdx]), 0, 1);
        const s = (segIdx + segT) / segCount;
        const wA = scrollWaypoints[segIdx];
        const wB = scrollWaypoints[Math.min(segIdx + 1, segCount)];

        targetPos.lerpVectors(wA.pos, wB.pos, segT);
        targetLook.lerpVectors(wA.look, wB.look, segT);

        // Blend with subtle idle drift (weaker at higher scroll)
        const driftAmt = 0.25 * (1 - s * 0.5);
        targetPos.x += Math.sin(t * 0.12) * driftAmt;
        targetPos.y += Math.sin(t * 0.08) * driftAmt * 0.5;

        camPos.lerp(targetPos, 0.028);
        camLook.lerp(targetLook, 0.028);
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        // ── Moving point light orbits the MacBook ─────────────
        movingPt.position.set(
          mac.position.x + Math.sin(t * 0.9) * 1.2,
          mac.position.y + 1.2 + Math.sin(t * 0.6) * 0.4,
          mac.position.z + Math.cos(t * 0.9) * 1.2
        );
        movingPt.intensity = 2.5 + Math.sin(t * 1.8) * 0.8;

        // ── Scan beam sweeps ───────────────────────────────────
        const scanX = Math.sin(t * 0.5) * (ROOM.w / 2);
        scanPlane.position.x = scanX;
        scanLineObj.position.x = scanX;
        (scanShader.uniforms.uTime as { value: number }).value = t;

        // ── Progressive point cloud reveal ────────────────────
        for (let i = 0; i < PT_COUNT; i++) {
          const px = ptPositions[i * 3];
          if (Math.abs(px - scanX) < 0.25) {
            // Reveal rapidly when scan beam is near
            ptAlphas[i] = Math.min(ptAlphas[i] + 0.06, 1);
          } else if (ptAlphas[i] > 0 && Math.abs(px - scanX) > 1.0) {
            // Slowly fade distant points
            ptAlphas[i] = Math.max(ptAlphas[i] - 0.002, 0.1);
          }
          ptOpacity.setX(i, ptAlphas[i]);
        }
        ptOpacity.needsUpdate = true;

        // ── Pulse rings ───────────────────────────────────────
        rings.forEach(({ mesh, phase }) => {
          const p = ((t * 0.25 + phase) % 1);
          const r = p * 5.5;
          mesh.scale.setScalar(r);
          (mesh.material as THREE.MeshBasicMaterial).opacity = p < 0.5 ? p * 1.2 : (1 - p) * 1.2;
        });

        // ── Objects float ─────────────────────────────────────
        mac.position.y  = macBaseY   + Math.sin(t * 0.7) * 0.14;
        mac.rotation.y += 0.003;
        quest.position.y = questBaseY + Math.sin(t * 0.5 + 1.1) * 0.18;
        quest.rotation.y += 0.005;
        phone.position.y = phoneBaseY + Math.sin(t * 0.6 + 2.2) * 0.14;
        phone.rotation.y -= 0.003;
        phone.rotation.z = 0.08 + Math.sin(t * 0.35) * 0.04;

        // ── Bounding box tracks MacBook ───────────────────────
        bb.position.set(mac.position.x, mac.position.y + 0.011, mac.position.z);
        bb.rotation.y = mac.rotation.y;
        bbMat.opacity = 0.5 + Math.sin(t * 2.2) * 0.4;

        // ── Floating sparks ───────────────────────────────────
        for (let i = 0; i < sparks; i++) {
          spkPos[i * 3]     += spkVel[i].vx;
          spkPos[i * 3 + 1] += spkVel[i].vy;
          spkPos[i * 3 + 2] += spkVel[i].vz;
          // Wrap
          if (spkPos[i * 3 + 1] > ROOM.h + 0.5) spkPos[i * 3 + 1] = -0.2;
          if (spkPos[i * 3] >  ROOM.w / 2 + 0.5) spkPos[i * 3] = -ROOM.w / 2;
          if (spkPos[i * 3] < -ROOM.w / 2 - 0.5) spkPos[i * 3] =  ROOM.w / 2;
        }
        (spkGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

        if (composer) {
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
      };

      animId = requestAnimationFrame(animate);

      const onResize = () => {
        const nW = window.innerWidth, nH = window.innerHeight;
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
        if (composer) composer.setSize(nW, nH);
      };
      window.addEventListener("resize", onResize, { passive: true });

      return () => {
        disposed = true;
        cancelAnimationFrame(animId);
        layoutObserver.disconnect();
        composer?.passes.forEach(pass => pass.dispose());
        composer?.dispose();
        const geometries = new Set<THREE.BufferGeometry>();
        const materials = new Set<THREE.Material>();
        scene.traverse(node => {
          if (node instanceof THREE.Mesh || node instanceof THREE.LineSegments || node instanceof THREE.Line || node instanceof THREE.Points) {
            geometries.add(node.geometry);
            (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => materials.add(m));
          }
        });
        geometries.forEach(g => g.dispose());
        materials.forEach(m => m.dispose());
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      };
    } catch (err) {
      console.warn("SceneBackground:", err);
    }
  }, [enabled]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.32, filter: "saturate(0.35)" }}
      aria-hidden="true"
    />
  );
}
