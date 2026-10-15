import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TAU = Math.PI * 2;
const PALETTE = ['#38BDF8', '#74C947', '#34D399', '#A78BFA', '#FFB224', '#FF7A9C'];
const CODES = ['DSA', 'OS', 'DBMS', 'CN', 'AI', 'SE'];
const TEACHERS = ['Dr. Mehta', 'Prof. Rao', 'Dr. Kaur', 'Dr. Fern', 'Prof. Haq', 'Dr. Iyer', 'Dr. Dharma', 'Prof. Sen'];
const ROOMS = ['R-201', 'R-204', 'LAB-1', 'R-118', 'LAB-2', 'R-09'];
const N = 24;

// 24 anchors spread across middle, corners, and roaming zones
const BLOCK_SEEDS = [
  // 8 Middle & Center blocks (foreground and mid-depth, bobbing prominently in front and around the center)
  { bx: -1.8, by:  1.5, bz:  1.8, vx:  0.28, vy:  0.32, vz:  0.36, ampX: 1.4, ampY: 1.1, ampZ: 0.8 },
  { bx:  1.8, by:  1.4, bz:  1.6, vx: -0.26, vy:  0.29, vz:  0.31, ampX: 1.3, ampY: 1.0, ampZ: 0.7 },
  { bx: -2.3, by: -0.2, bz:  2.0, vx:  0.31, vy: -0.27, vz:  0.34, ampX: 1.2, ampY: 1.2, ampZ: 0.9 },
  { bx:  2.4, by: -0.3, bz:  1.7, vx: -0.29, vy: -0.30, vz:  0.30, ampX: 1.4, ampY: 1.0, ampZ: 0.8 },
  { bx: -1.4, by: -2.1, bz:  1.9, vx:  0.33, vy:  0.25, vz: -0.28, ampX: 1.3, ampY: 1.1, ampZ: 0.7 },
  { bx:  1.5, by: -2.0, bz:  1.5, vx: -0.30, vy:  0.31, vz:  0.33, ampX: 1.2, ampY: 1.2, ampZ: 0.8 },
  { bx: -0.2, by:  2.6, bz:  1.4, vx:  0.27, vy: -0.28, vz:  0.29, ampX: 1.5, ampY: 0.9, ampZ: 0.6 },
  { bx:  0.3, by: -2.7, bz:  1.6, vx: -0.32, vy:  0.26, vz: -0.31, ampX: 1.3, ampY: 1.0, ampZ: 0.7 },

  // 8 Corner & Far Perimeter blocks (reaching top-left, top-right, bottom-left, bottom-right, screen edges)
  { bx: -5.7, by:  3.2, bz: -0.4, vx:  0.22, vy:  0.21, vz:  0.24, ampX: 1.5, ampY: 1.2, ampZ: 0.9 },
  { bx:  5.7, by:  3.2, bz: -0.4, vx: -0.24, vy:  0.23, vz: -0.22, ampX: 1.5, ampY: 1.2, ampZ: 0.9 },
  { bx: -5.8, by: -3.0, bz: -0.6, vx:  0.25, vy: -0.22, vz:  0.25, ampX: 1.4, ampY: 1.3, ampZ: 0.8 },
  { bx:  5.8, by: -3.0, bz: -0.6, vx: -0.23, vy: -0.24, vz: -0.21, ampX: 1.4, ampY: 1.3, ampZ: 0.8 },
  { bx: -6.4, by:  0.4, bz:  0.3, vx:  0.20, vy:  0.26, vz:  0.23, ampX: 1.6, ampY: 1.4, ampZ: 0.9 },
  { bx:  6.4, by:  0.4, bz:  0.3, vx: -0.21, vy: -0.25, vz: -0.24, ampX: 1.6, ampY: 1.4, ampZ: 0.9 },
  { bx: -3.9, by:  3.4, bz: -0.3, vx:  0.27, vy: -0.20, vz:  0.22, ampX: 1.3, ampY: 1.1, ampZ: 0.7 },
  { bx:  3.9, by:  3.4, bz: -0.3, vx: -0.26, vy:  0.22, vz: -0.24, ampX: 1.3, ampY: 1.1, ampZ: 0.7 },

  // 8 Intermediate Roaming blocks (filling midground, circling and floating between center and corners)
  { bx: -3.7, by:  1.6, bz:  0.6, vx: -0.28, vy:  0.27, vz:  0.28, ampX: 1.4, ampY: 1.2, ampZ: 0.8 },
  { bx:  3.7, by:  1.5, bz:  0.6, vx:  0.29, vy: -0.28, vz: -0.26, ampX: 1.4, ampY: 1.2, ampZ: 0.8 },
  { bx: -3.9, by: -1.7, bz:  0.8, vx:  0.31, vy:  0.24, vz:  0.29, ampX: 1.3, ampY: 1.3, ampZ: 0.9 },
  { bx:  3.9, by: -1.8, bz:  0.8, vx: -0.30, vy: -0.28, vz: -0.27, ampX: 1.3, ampY: 1.3, ampZ: 0.9 },
  { bx: -3.7, by: -3.3, bz:  0.2, vx:  0.24, vy:  0.26, vz:  0.21, ampX: 1.5, ampY: 1.1, ampZ: 0.7 },
  { bx:  3.7, by: -3.3, bz:  0.2, vx: -0.25, vy: -0.23, vz: -0.22, ampX: 1.5, ampY: 1.1, ampZ: 0.7 },
  { bx: -2.9, by:  0.3, bz: -1.0, vx:  0.26, vy: -0.29, vz:  0.31, ampX: 1.4, ampY: 1.2, ampZ: 0.9 },
  { bx:  2.9, by: -0.3, bz: -1.0, vx: -0.27, vy:  0.28, vz: -0.29, ampX: 1.4, ampY: 1.2, ampZ: 0.9 },
];

function roundRectPath(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.lineTo(a + w - r, b);
  x.arcTo(a + w, b, a + w, b + r, r);
  x.lineTo(a + w, b + h - r);
  x.arcTo(a + w, b + h, a + w - r, b + h, r);
  x.lineTo(a + r, b + h);
  x.arcTo(a, b + h, a, b + h - r, r);
  x.lineTo(a, b + r);
  x.arcTo(a, b, a + r, b, r);
  x.closePath();
}

function shade(hex: string, lum: number) {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  let r = (num >> 16) + Math.round(255 * lum);
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * lum);
  let b = (num & 0x0000FF) + Math.round(255 * lum);
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `rgb(${r},${g},${b})`;
}

export default function ThreeBackground({ blur = false }: { blur?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Subtle Ambient + Directional Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 10);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0x74c947, 0.6);
    dir2.position.set(-6, -4, 4);
    scene.add(dir2);

    const geom = new THREE.BoxGeometry(1.04, 0.68, 0.32);

    // Helper to generate a realistic schedule block mesh
    const createBlockMesh = (idx: number, isOrbital = false) => {
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 336;
      const ctx = cv.getContext('2d')!;
      const col = PALETTE[idx % PALETTE.length];
      const code = CODES[idx % CODES.length];
      const teacher = TEACHERS[idx % TEACHERS.length];
      const room = ROOMS[idx % ROOMS.length];

      // Face styling
      ctx.fillStyle = '#FCFBF7';
      ctx.fillRect(0, 0, 512, 336);
      ctx.strokeStyle = 'rgba(16,22,36,0.85)';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 506, 330);
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, isOrbital ? 32 : 24, 336);
      ctx.textAlign = 'left';
      ctx.fillStyle = shade(col, -0.2);
      ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(code, 56, 118);
      ctx.fillStyle = '#252D42';
      ctx.font = '600 36px "IBM Plex Mono", monospace';
      ctx.fillText(teacher, 56, 186);
      ctx.font = '600 32px "IBM Plex Mono", monospace';
      const w = ctx.measureText(room).width + 40;
      ctx.fillStyle = 'rgba(18,24,40,0.08)';
      roundRectPath(ctx, 56, 214, w, 58, 14);
      ctx.fill();
      ctx.fillStyle = 'rgba(18,24,40,0.7)';
      ctx.fillText(room, 76, 254);

      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const frontMat = new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: isOrbital ? 0.42 : 0.32,
        roughness: 0.45,
        metalness: 0,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(col).multiplyScalar(0.55),
        roughness: 0.55,
      });
      const tileArr = [sideMat, sideMat, sideMat, sideMat, frontMat, frontMat];
      const mesh = new THREE.Mesh(geom, tileArr);
      mesh.frustumCulled = false;
      worldGroup.add(mesh);
      return mesh;
    };

    // 1. Existing 24 Roaming & Tumbling blocks across center and corners (RETAINED)
    const roamTiles: { mesh: THREE.Mesh; i: number }[] = [];
    for (let i = 0; i < N; i++) {
      const mesh = createBlockMesh(i, false);
      roamTiles.push({ mesh, i });
    }

    // 2. NEW Dedicated Orbital blocks following a specified path around the central box (ADDED NOT REPLACED)
    const N_ORBIT = 10;
    const orbitTiles: { mesh: THREE.Mesh; j: number }[] = [];
    for (let j = 0; j < N_ORBIT; j++) {
      const mesh = createBlockMesh(j + 5, true);
      orbitTiles.push({ mesh, j });
    }

    let tmx = 0, tmy = 0;
    const handleMouseMove = (e: MouseEvent) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    let animId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = (now - startTime) / 1000;

      // Animate roaming blocks: full screen roaming + bouncing
      roamTiles.forEach(({ mesh, i }) => {
        const s = BLOCK_SEEDS[i % BLOCK_SEEDS.length];

        // Wide Lissajous roaming trajectory
        const roamX = Math.sin(t * s.vx + i * 1.7) * s.ampX + Math.cos(t * 0.16 + i * 0.9) * 0.7;
        const roamY = Math.cos(t * s.vy + i * 2.3) * s.ampY + Math.sin(t * 0.14 + i * 1.4) * 0.6;
        const roamZ = Math.sin(t * s.vz + i * 1.2) * s.ampZ + Math.cos(t * 0.20 + i * 2.5) * 0.5;

        // Dynamic random bouncing going here and there
        const bounceX = Math.sin(t * 1.35 + i * 3.1) * 0.40;
        const bounceY = Math.cos(t * 1.55 + i * 2.7) * 0.45;
        const bounceZ = Math.sin(t * 1.15 + i * 2.2) * 0.35;

        const x = s.bx + roamX + bounceX;
        const y = s.by + roamY + bounceY;
        const z = s.bz + roamZ + bounceZ;

        // Tumbling 3D rotations on X, Y, Z
        const rx = Math.sin(t * 0.75 + i * 1.3) * 0.55 + Math.cos(t * 0.35 + i) * 0.30;
        const ry = Math.cos(t * 0.65 + i * 1.8) * 0.70 + Math.sin(t * 0.25 + i * 2.1) * 0.40;
        const rz = Math.sin(t * 0.55 + i * 2.4) * 0.40;

        mesh.position.set(x, y, z);
        mesh.rotation.set(rx, ry, rz);
      });

      // Animate orbital blocks: smooth revolving path strictly encircling the center card
      const orbitSpeed = 0.32;
      orbitTiles.forEach(({ mesh, j }) => {
        const phase = (j / N_ORBIT) * Math.PI * 2;
        const angle = t * orbitSpeed + phase;

        // Elliptical track around the center login/content box (Rx=4.4, Ry=2.8)
        const u = Math.cos(angle) * 4.4;
        const v = Math.sin(angle) * 2.7;

        // Slight 3D tilt so the path weaves in front of and around the box
        const tiltAngleX = 0.28;
        const tiltAngleY = -0.22;

        const ox = u * Math.cos(tiltAngleY) + Math.sin(angle * 2) * 0.12;
        const oy = v * Math.cos(tiltAngleX) - u * Math.sin(tiltAngleY) * 0.25;
        const oz = u * Math.sin(tiltAngleY) + v * Math.sin(tiltAngleX) + 1.1;

        mesh.position.set(ox, oy, oz);

        // Keep faces readable as they orbit with smooth directional banking
        const rotX = Math.sin(angle) * 0.22;
        const rotY = Math.sin(angle * 0.8) * 0.35;
        const rotZ = Math.sin(t * 0.4 + phase) * 0.12;

        mesh.rotation.set(rotX, rotY, rotZ);
      });

      // Camera gentle sway + parallax
      const camR = 12.0;
      const sway = Math.sin(t * 0.16) * 0.04;
      const az = sway + tmx * 0.11;
      const el = 0.12 - tmy * 0.08;

      camera.position.set(
        Math.sin(az) * Math.cos(el) * camR,
        Math.sin(el) * camR + 0.1,
        Math.cos(az) * Math.cos(el) * camR
      );
      camera.lookAt(0, 0.05, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      geom.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 w-full h-full block pointer-events-none z-0 ${
          blur ? 'filter blur-[12px] opacity-40 transition-all duration-700' : 'opacity-100 transition-opacity duration-700'
        }`}
      />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
