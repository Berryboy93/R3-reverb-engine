/**
 * @component SpaceCube
 * @origin Replit
 * @integrated 2026-07-20
 * @integrated-by r3v
 * @tier All
 * @audit-status Phase10
 * @deferred-findings none
 *
 * 3-D wireframe space visualizer with:
 * - Glowing vertex nodes at each corner
 * - Inner octahedron resonance structure
 * - Multi-layer HDR edge glow (diffuse + bright core)
 * - Decay-driven particle density and speed
 * - Size-driven cube scale with face fill depth
 */
import React, { useRef, useEffect } from 'react';

interface SpaceCubeProps {
  size: number;
  decay: number;
  particleCount?: number;
  height?: number;
}

export const SpaceCube: React.FC<SpaceCubeProps> = ({ size, decay, particleCount = 90, height = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    life: number; speed: number;
  }>>([]);

  // Live prop mirrors — allow animation loop to read fresh values without restart
  const sizeRef = useRef(size);
  const decayRef = useRef(decay);
  sizeRef.current = size;
  decayRef.current = decay;

  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * sizeRef.current,
      y: (Math.random() - 0.5) * sizeRef.current,
      z: (Math.random() - 0.5) * sizeRef.current,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: (Math.random() - 0.5) * 0.4,
      life: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
    }));
  }, [particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let rotation = 0;
    let rotY = 0;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const project = (x: number, y: number, z: number) => {
      const fov = 420;
      const scale = fov / (fov + z);
      return { x: cx + x * scale, y: cy + y * scale, scale };
    };

    /** Rotate around Y-axis (yaw) */
    const rotateY = (x: number, y: number, z: number, a: number) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
    };

    /** Rotate around X-axis (pitch) */
    const rotateX = (x: number, y: number, z: number, a: number) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x, y: y * cos - z * sin, z: y * sin + z * cos };
    };

    const transformVertex = (x: number, y: number, z: number) => {
      const r1 = rotateY(x, y, z, rotation);
      const r2 = rotateX(r1.x, r1.y, r1.z, rotY);
      return r2;
    };

    const draw = () => {
      const sz = sizeRef.current;
      const dc = decayRef.current;

      rotation += 0.004 + (dc / 30) * 0.003;
      rotY += 0.0015;

      const cubeSize = sz * (0.55 + (sz / 100) * 0.45);
      const hs = cubeSize / 2;

      // ── Background ──────────────────────────────────────────────
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, w, h);

      // ── Subtle grid floor ────────────────────────────────────────
      ctx.strokeStyle = 'rgba(40,40,40,0.6)';
      ctx.lineWidth = 0.5;
      for (let i = -4; i <= 4; i++) {
        const step = w / 8;
        ctx.beginPath();
        ctx.moveTo(cx + i * step, 0);
        ctx.lineTo(cx + i * step, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, cy + i * step);
        ctx.lineTo(w, cy + i * step);
        ctx.stroke();
      }

      // ── Cube vertices ────────────────────────────────────────────
      const rawVerts: [number, number, number][] = [
        [-hs, -hs, -hs], [hs, -hs, -hs], [hs, hs, -hs], [-hs, hs, -hs],
        [-hs, -hs,  hs], [hs, -hs,  hs], [hs, hs,  hs], [-hs, hs,  hs],
      ];
      const verts = rawVerts.map(([x, y, z]) => transformVertex(x, y, z));
      const projVerts = verts.map(v => project(v.x, v.y, v.z));

      const edges: [number, number][] = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7],
      ];

      // ── Subtle face fill for depth ────────────────────────────────
      const faces: [number, number, number, number][] = [
        [0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5],
      ];
      faces.forEach(([a, b, c, d]) => {
        ctx.beginPath();
        ctx.moveTo(projVerts[a].x, projVerts[a].y);
        ctx.lineTo(projVerts[b].x, projVerts[b].y);
        ctx.lineTo(projVerts[c].x, projVerts[c].y);
        ctx.lineTo(projVerts[d].x, projVerts[d].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(183,255,0,0.015)';
        ctx.fill();
      });

      // ── Edge glow — wide diffuse ──────────────────────────────────
      ctx.strokeStyle = 'rgba(183,255,0,0.06)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(projVerts[a].x, projVerts[a].y);
        ctx.lineTo(projVerts[b].x, projVerts[b].y);
        ctx.stroke();
      });

      // ── Edge glow — mid corona ────────────────────────────────────
      ctx.strokeStyle = 'rgba(183,255,0,0.18)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#B7FF00';
      ctx.shadowBlur = 8;
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(projVerts[a].x, projVerts[a].y);
        ctx.lineTo(projVerts[b].x, projVerts[b].y);
        ctx.stroke();
      });

      // ── Edge bright core ─────────────────────────────────────────
      ctx.strokeStyle = '#B7FF00';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#B7FF00';
      ctx.shadowBlur = 4;
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(projVerts[a].x, projVerts[a].y);
        ctx.lineTo(projVerts[b].x, projVerts[b].y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // ── Vertex nodes ─────────────────────────────────────────────
      projVerts.forEach(({ x, y, scale }) => {
        const nodeR = 2.5 * scale;

        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, nodeR * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(183,255,0,0.08)';
        ctx.fill();

        // Bright node
        const ng = ctx.createRadialGradient(x - nodeR * 0.3, y - nodeR * 0.3, 0, x, y, nodeR);
        ng.addColorStop(0, 'rgba(230,255,140,1)');
        ng.addColorStop(0.5, 'rgba(183,255,0,0.8)');
        ng.addColorStop(1, 'rgba(80,160,0,0)');
        ctx.beginPath();
        ctx.arc(x, y, nodeR, 0, Math.PI * 2);
        ctx.fillStyle = ng;
        ctx.shadowColor = '#B7FF00';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── Inner octahedron (resonance structure) ───────────────────
      const innerScale = hs * 0.42;
      const octVerts = [
        [0, -innerScale, 0], [0, innerScale, 0],
        [-innerScale, 0, 0], [innerScale, 0, 0],
        [0, 0, -innerScale], [0, 0, innerScale],
      ].map(([x, y, z]) => {
        const t = transformVertex(x, y, z);
        return project(t.x, t.y, t.z);
      });
      const octEdges: [number, number][] = [
        [0,2],[0,3],[0,4],[0,5],
        [1,2],[1,3],[1,4],[1,5],
        [2,4],[4,3],[3,5],[5,2],
      ];
      ctx.strokeStyle = 'rgba(183,255,0,0.12)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 4]);
      octEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(octVerts[a].x, octVerts[a].y);
        ctx.lineTo(octVerts[b].x, octVerts[b].y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // ── Energy particles ─────────────────────────────────────────
      const speedMult = 0.8 + (dc / 30) * 1.2;
      const activeCount = Math.floor(particlesRef.current.length * (0.25 + (dc / 30) * 0.75));

      particlesRef.current.forEach((p, i) => {
        if (i >= activeCount) return;

        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;
        p.z += p.vz * speedMult;
        p.life += 0.012 * p.speed;

        if (Math.abs(p.x) > hs) p.vx *= -1;
        if (Math.abs(p.y) > hs) p.vy *= -1;
        if (Math.abs(p.z) > hs) p.vz *= -1;

        const alpha = 0.25 + 0.55 * Math.abs(Math.sin(p.life));
        const rp = transformVertex(p.x, p.y, p.z);
        const proj = project(rp.x, rp.y, rp.z);
        const r = Math.max(0.5, 1.8 * proj.scale);

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183,255,0,${alpha})`;
        ctx.shadowColor = '#B7FF00';
        ctx.shadowBlur = 4;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
    // Mount-only: live values flow in via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={height}
      style={{ width: '100%', height, borderRadius: 10, display: 'block' }}
    />
  );
};
