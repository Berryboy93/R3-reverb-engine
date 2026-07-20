import React, { useRef, useEffect } from 'react';

interface SpaceCubeProps {
  size: number;
  decay: number;
  particleCount?: number;
}

export const SpaceCube: React.FC<SpaceCubeProps> = ({ size, decay, particleCount = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }>>([]);
  // Mirror live prop values into refs so the animation loop reads fresh values
  // WITHOUT tearing down and restarting the rAF loop on every knob movement.
  const sizeRef = useRef(size);
  const decayRef = useRef(decay);
  sizeRef.current = size;
  decayRef.current = decay;

  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * sizeRef.current,
      y: (Math.random() - 0.5) * sizeRef.current,
      z: (Math.random() - 0.5) * sizeRef.current,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.3,
      life: Math.random(),
    }));
  }, [particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let rotation = 0;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const project = (x: number, y: number, z: number) => {
      const scale = 400 / (400 + z);
      return { x: cx + x * scale, y: cy + y * scale, scale };
    };

    const rotate = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x1 = x * cos - z * sin;
      const z1 = x * sin + z * cos;
      const y2 = y * cos - z1 * sin;
      const z2 = y * sin + z1 * cos;
      return { x: x1, y: y2, z: z2 };
    };

    const draw = () => {
      const size = sizeRef.current;
      const decay = decayRef.current;
      rotation += 0.003 + (decay / 30) * 0.002;
      const cubeSize = size * (0.6 + (size / 100) * 0.4); // cube scales with Size parameter
      const hs = cubeSize / 2;

      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, w, h);

      // Grid background
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const y1 = project(i * 40, -120, -100).y;
        const y2 = project(i * 40, 120, -100).y;
        ctx.beginPath(); ctx.moveTo(cx + i * 40, y1); ctx.lineTo(cx + i * 40, y2); ctx.stroke();
      }

      // Cube vertices
      const vertices = [
        [-hs, -hs, -hs], [hs, -hs, -hs], [hs, hs, -hs], [-hs, hs, -hs],
        [-hs, -hs, hs], [hs, -hs, hs], [hs, hs, hs], [-hs, hs, hs],
      ].map(([x, y, z]) => rotate(x, y, z, rotation));

      const edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7],
      ];

      ctx.strokeStyle = '#B7FF00';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#B7FF00';
      ctx.shadowBlur = 8;

      edges.forEach(([a, b]) => {
        const p1 = project(vertices[a].x, vertices[a].y, vertices[a].z);
        const p2 = project(vertices[b].x, vertices[b].y, vertices[b].z);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Energy particles — density driven by decay
      const activeParticles = Math.floor(particlesRef.current.length * (0.3 + (decay / 30) * 0.7));
      particlesRef.current.forEach((p, i) => {
        if (i > activeParticles) return;
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        if (Math.abs(p.x) > hs) p.vx *= -1;
        if (Math.abs(p.y) > hs) p.vy *= -1;
        if (Math.abs(p.z) > hs) p.vz *= -1;
        p.life += 0.01;
        const alpha = 0.3 + 0.5 * Math.sin(p.life * 3) ** 2;
        const rp = rotate(p.x, p.y, p.z, rotation);
        const proj = project(rp.x, rp.y, rp.z);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 1.5 * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(183,255,0,${alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  // Mount-only: live values flow in through sizeRef/decayRef.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} width={320} height={150} style={{ width: '100%', height: 150, borderRadius: 10 }} />;
};
