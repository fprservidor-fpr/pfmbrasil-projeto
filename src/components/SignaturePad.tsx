"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Save, X } from "lucide-react";

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export function SignaturePad({ onSave, onCancel, title = "Assinatura do Responsável" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 300;
        
        // Style defaults
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasContent(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;
    
    // Create a temporary canvas to save with a white background if needed, 
    // or just export the current one (transparent/black background)
    // The user image shows white/black theme, let's export as is.
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">{title}</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-zinc-500 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="relative bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-800 overflow-hidden cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full touch-none"
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-700 font-medium">
            Assine aqui com a caneta ou o dedo
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={clear}
          className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-zinc-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasContent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Assinatura
          </Button>
        </div>
      </div>
    </div>
  );
}
