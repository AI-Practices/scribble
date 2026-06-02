import { useCallback, useEffect, useRef, useState } from "react";
import { api, type CanvasState } from "../services/api";

interface Point {
  x: number;
  y: number;
}

interface LocalStroke {
  points: Point[];
}

interface Props {
  amDrawer: boolean;
  roomCode: string;
  participantId: string;
  canvasState: CanvasState | null;
}

export function DrawingCanvas({ amDrawer, roomCode, participantId, canvasState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const localStrokes = useRef<LocalStroke[]>([]);
  const lastSyncCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(400);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasWidth(Math.floor(rect.width));
      setCanvasHeight(Math.floor(Math.max(rect.height, 400)));
    }
  }, []);

  const drawStrokes = useCallback((ctx: CanvasRenderingContext2D, strokes: LocalStroke[]) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    if (amDrawer || !canvasState || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const strokes: LocalStroke[] = canvasState.strokes.map((s) => ({
      points: s.points.map((p) => ({ x: p.x, y: p.y }))
    }));

    drawStrokes(ctx, strokes);
  }, [amDrawer, canvasState, drawStrokes]);

  useEffect(() => {
    if (!amDrawer || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    drawStrokes(ctx, localStrokes.current);
  }, [amDrawer, drawStrokes, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!amDrawer) return;

    const interval = setInterval(async () => {
      if (localStrokes.current.length > lastSyncCount.current) {
        const newStrokes = localStrokes.current.slice(lastSyncCount.current);
        try {
          await api.canvasSync(roomCode, participantId, newStrokes.map((s) => ({ points: s.points })), false);
          lastSyncCount.current = localStrokes.current.length;
        } catch {
          // sync failure handled gracefully
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [amDrawer, roomCode, participantId]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    const me = e as React.MouseEvent;
    return {
      x: me.clientX - rect.left,
      y: me.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!amDrawer) return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    currentStroke.current = [pos];
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !amDrawer) return;
    e.preventDefault();

    const pos = getPos(e);
    currentStroke.current.push(pos);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(currentStroke.current[currentStroke.current.length - 2].x, currentStroke.current[currentStroke.current.length - 2].y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !amDrawer) return;
    e.preventDefault();
    isDrawing.current = false;

    if (currentStroke.current.length >= 2) {
      localStrokes.current.push({ points: [...currentStroke.current] });
    }
    currentStroke.current = [];
  };

  const handleClear = async () => {
    if (!amDrawer) return;
    localStrokes.current = [];
    lastSyncCount.current = 0;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    try {
      await api.canvasSync(roomCode, participantId, [], true);
    } catch {
      // clear sync failure handled gracefully
    }
  };

  if (!amDrawer) {
    return (
      <div ref={containerRef} className="drawing-canvas" style={{ width: "100%", minHeight: 400 }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ display: "block", width: "100%", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", cursor: "default" }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="drawing-canvas" style={{ width: "100%", minHeight: 400 }}>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ display: "block", width: "100%", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", cursor: amDrawer ? "crosshair" : "default", touchAction: "none" }}
      />
      <button className="button button--secondary" onClick={handleClear} style={{ marginTop: 8 }}>
        Clear Canvas
      </button>
    </div>
  );
}
