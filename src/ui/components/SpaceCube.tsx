import { useRef, useEffect, useState } from 'react';

interface SpaceCubeProps {
  size: number;
  decay: number;
  particleCount?: number;
  height?: number;
}

export function SpaceCube({ size, decay, particleCount = 60, height = 150 }: SpaceCubeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(220);
  const particlesRef = useRef<Array<{
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    life: number;
  }>>([]);
  const sizeRef = useRef(size);
  const decayRef = useRef(decay);
  const visibleRef = useRef(true);

  sizeRef.current = size;
  decayRef.current = decay;

  // ResizeObserver to fill container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setCanvasWidth(Math.floor(w));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Regenerate particles when size prop changes significantly
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * sizeRef.current,
      y: (Math.random() - 0.5) * sizeRef.current,
      z: (Math.random() - 0.5) * sizeRef.current,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.3,
      life: Math.random() * Math.PI * 2,
    }));
  }, [particleCount, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(canvas);

    let animId: number;
    let rotation = 0;
    let rotY = 0;
    const cx = canvasWidth / 2;
    const cy = height / 2;

    const project = (x: number, y: number, z: number) => {
      const fov = 350;
      const scale = fov / (fov + z);
      return { x: cx + x * scale, y: cy + y * scale, scale };
    };

    const rotateY = (x: number, y: number, z: number, a: number) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
    };

    const rotateX = (x: number, y: number, z: number, a: number) => {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x, y: y * cos - z * sin, z: y * sin + z * cos };
    };

    const transform = (x: number, y: number, z: number) => {
      const r1 = rotateY(x, y, z, rotation);
      return rotateX(r1.x, r1.y, r1.z, rotY);
    };

    const draw = () => {
      if (!visibleRef.current) {
        animId = requestAnimationFrame(draw);
        return;
      }

      const sz = sizeRef.current;
      const dc = decayRef.current;
      rotation += 0.003 + (dc / 30) * 0.002;
      rotY += 0.001;

      const cubeSize = sz * (0.5 + (sz / 100) * 0.4);
      const hs = cubeSize / 2;

      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, canvasWidth, height);

      const verts = [
        [-hs, -hs, -hs], [hs, -hs, -hs], [hs, hs, -hs], [-hs, hs, -hs],
        [-hs, -hs, hs], [hs, -hs, hs], [hs, hs, hs], [-hs, hs, hs],
      ].map(([x, y, z]) => transform(x, y, z));
      const proj = verts.map(v => project(v.x, v.y, v.z));

      const edges: [number, number][] = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7],
      ];

      const faces: [number, number, number, number][] = [
        [0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5],
      ];
      faces.forEach(([a, b, c, d]) => {
        ctx.beginPath();
        ctx.moveTo(proj[a].x, proj[a].y);
        ctx.lineTo(proj[b].x, proj[b].y);
        ctx.lineTo(proj[c].x, proj[c].y);
        ctx.lineTo(proj[d].x, proj[d].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(201,168,76,0.02)';
        ctx.fill();
      });

      ctx.lineCap = 'round';
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(proj[a].x, proj[a].y);
        ctx.lineTo(proj[b].x, proj[b].y);
        ctx.strokeStyle = 'rgba(201,168,76,0.08)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(proj[a].x, proj[a].y);
        ctx.lineTo(proj[b].x, proj[b].y);
        ctx.strokeStyle = 'rgba(201,168,76,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      proj.forEach(({ x, y, scale }) => {
        const r = 2 * scale;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,168,76,0.6)';
        ctx.fill();
      });

      const inner = hs * 0.35;
      const oct = [
        [0, -inner, 0], [0, inner, 0],
        [-inner, 0, 0], [inner, 0, 0],
        [0, 0, -inner], [0, 0, inner],
      ].map(([x, y, z]) => {
        const t = transform(x, y, z);
        return project(t.x, t.y, t.z);
      });
      const octEdges: [number, number][] = [
        [0,2],[0,3],[0,4],[0,5],
        [1,2],[1,3],[1,4],[1,5],
        [2,4],[4,3],[3,5],[5,2],
      ];
      ctx.strokeStyle = 'rgba(201,168,76,0.1)';
      ctx.lineWidth = 0.6;
      ctx.setLineDash([2, 3]);
      octEdges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(oct[a].x, oct[a].y);
        ctx.lineTo(oct[b].x, oct[b].y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      const speed = 0.6 + (dc / 30) * 0.8;
      const active = Math.floor(particlesRef.current.length * (0.2 + (dc / 30) * 0.6));
      particlesRef.current.forEach((p, i) => {
        if (i >= active) return;
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        p.z += p.vz * speed;
        p.life += 0.01;
        if (Math.abs(p.x) > hs) p.vx *= -1;
        if (Math.abs(p.y) > hs) p.vy *= -1;
        if (Math.abs(p.z) > hs) p.vz *= -1;

        const alpha = 0.2 + 0.4 * Math.abs(Math.sin(p.life));
        const t = transform(p.x, p.y, p.z);
        const pr = project(t.x, t.y, t.z);
        const r = Math.max(0.5, 1.2 * pr.scale);

        ctx.beginPath();
        ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); observer.disconnect(); };
  }, [height, canvasWidth]);

  return (
    <div ref={containerRef} style={{ width: '100%', height, borderRadius: 6, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: canvasWidth, height, display: 'block' }}
      />
    </div>
  );
}
