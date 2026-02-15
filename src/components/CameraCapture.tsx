import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Camera, X, RefreshCcw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

    const processImage = useCallback(async (imageSrc: string) => {
    setIsProcessing(true);
    const img = new Image();
    img.src = imageSrc;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Normalize size for processing
    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 1. Improved Binarization & Noise Reduction
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasContent = false;
    
    // Calculate adaptive-like threshold based on center area (where signature should be)
    let centerBrightness = 0;
    let count = 0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rw = canvas.width * 0.4;
    const rh = canvas.height * 0.2;
    
    for (let y = Math.floor(cy - rh); y < cy + rh; y++) {
      for (let x = Math.floor(cx - rw); x < cx + rw; x++) {
        const i = (y * canvas.width + x) * 4;
        centerBrightness += (data[i] + data[i+1] + data[i+2]) / 3;
        count++;
      }
    }
    const avgCenter = centerBrightness / count;
    const threshold = Math.min(avgCenter * 0.7, 130);

    // Ignore pixels near the extreme edges to avoid camera frame/shadows
    const edgeMargin = Math.floor(Math.min(canvas.width, canvas.height) * 0.08);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const gray = (data[i] + data[i+1] + data[i+2]) / 3;

        // Condition for signature pixel: 
        // 1. Dark enough
        // 2. Not at the very edge
        // 3. Simple neighbor check to avoid single-pixel noise
        const isDark = gray < threshold;
        const isNotEdge = x > edgeMargin && x < canvas.width - edgeMargin && 
                         y > edgeMargin && y < canvas.height - edgeMargin;

        if (isDark && isNotEdge) {
          // Check neighbors to filter out salt & pepper noise
          let neighbors = 0;
          if (x > 0 && (data[i-4]+data[i-3]+data[i-2])/3 < threshold) neighbors++;
          if (x < canvas.width-1 && (data[i+4]+data[i+5]+data[i+6])/3 < threshold) neighbors++;
          
          if (neighbors > 0) {
            data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 255;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            hasContent = true;
          } else {
            data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 0;
          }
        } else {
          data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 0;
        }
      }
    }

    if (!hasContent) {
      setIsProcessing(false);
      return;
    }

    // 2. Tight Crop with minimal padding
    const padding = 15;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropW = Math.min(canvas.width - cropX, (maxX - minX) + (padding * 2));
    const cropH = Math.min(canvas.height - cropY, (maxY - minY) + (padding * 2));

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = cropW;
    finalCanvas.height = cropH;
    const finalCtx = finalCanvas.getContext("2d");
    if (!finalCtx) return;

    // Apply processed data back
    ctx.putImageData(imageData, 0, 0);
    finalCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    setProcessedImage(finalCanvas.toDataURL("image/png"));
    setIsProcessing(false);
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      processImage(imageSrc);
    }
  }, [webcamRef, processImage]);

  const handleConfirm = () => {
    if (processedImage) {
      // Convert data URL to File
      fetch(processedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "signature.png", { type: "image/png" });
          onCapture(file);
        });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black flex flex-col items-center justify-center"
    >
      <div className="absolute top-6 right-6 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full bg-zinc-900/50 hover:bg-zinc-800 text-white h-12 w-12"
        >
          <X className="w-8 h-8" />
        </Button>
      </div>

      {!capturedImage ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={{
              facingMode: "environment",
              width: 1280,
              height: 720,
            }}
            className="w-full h-full object-cover"
          />

          {/* Overlay Guia */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div 
              className="border-4 border-[#EAB308] rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              style={{ width: '400px', height: '150px' }}
            />
            <p className="mt-6 text-white font-black uppercase tracking-widest text-sm drop-shadow-md">
              Posicione a assinatura dentro do retângulo
            </p>
          </div>

          <div className="absolute bottom-12 z-10">
            <button
              onClick={capture}
              className="w-20 h-20 bg-[#EAB308] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:scale-110 transition-transform"
            >
              <Camera className="w-10 h-10 text-black" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-zinc-950">
          <div className="text-center mb-8">
            <h3 className="text-white font-black uppercase tracking-tighter text-2xl">Preview da Assinatura</h3>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">Versão processada com fundo transparente</p>
          </div>

          <div className="bg-white rounded-[2rem] p-12 flex items-center justify-center border-4 border-zinc-800 min-h-[300px] w-full max-w-2xl shadow-2xl relative overflow-hidden">
             {/* Grid background to show transparency */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }} />
            
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
                <span className="text-zinc-900 font-black uppercase tracking-widest text-xs">Processando...</span>
              </div>
            ) : processedImage ? (
              <img src={processedImage} alt="Processed Signature" className="max-h-56 object-contain relative z-10" />
            ) : (
              <div className="text-red-500 font-bold">Falha ao processar assinatura. Tente novamente.</div>
            )}
          </div>

          <div className="flex gap-4 mt-12 w-full max-w-md">
            <Button
              variant="outline"
              onClick={() => {
                setCapturedImage(null);
                setProcessedImage(null);
              }}
              className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-400 h-16 rounded-2xl font-black uppercase text-sm tracking-widest hover:text-white"
            >
              <RefreshCcw className="w-5 h-5 mr-2" /> Refazer
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!processedImage || isProcessing}
              className="flex-[2] bg-[#EAB308] hover:bg-yellow-400 text-black h-16 rounded-2xl font-black uppercase text-sm tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.2)]"
            >
              <Check className="w-6 h-6 mr-2" /> Confirmar
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
