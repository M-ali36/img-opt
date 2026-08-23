"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import JSZip from "jszip";
import { ZoomIn, ZoomOut } from "react-feather";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, increment } from "firebase/firestore";

export default function BatchWebpConverter({
  defaultAspect = "original",
  defaultScale = "original",
  defaultQuality = 84,
  isFixed = false
}) {
  const [uid, setUid] = useState(null);
  const [aspect, setAspect] = useState(defaultAspect);
  const [scale, setScale] = useState(defaultScale);
  const [quality, setQuality] = useState(Number(defaultQuality));

  useEffect(() => setAspect(defaultAspect), [defaultAspect]);
  useEffect(() => setScale(defaultScale), [defaultScale]);
  useEffect(() => setQuality(Number(defaultQuality)), [defaultQuality]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });

    return () => unsub();
  }, []);

  const sanitizeFileName = (name) =>
    name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 100);

  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  const [processed, setProcessed] = useState([]);
  const [singleImageFile, setSingleImageFile] = useState(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropPreview, setCropPreview] = useState(null);
  const [cropImageUrl, setCropImageUrl] = useState(null);

  const cropContainerRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels);
  }, []);

  const bytesToNice = (n) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  };

  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });

  const getAspect = () => {
    if (aspect === "original") return null;

    const [w, h] = aspect.split("/").map(Number);
    return w / h;
  };

  const getFixedAspectRatio = (img) => {
    if (aspect === "original") return img.width / img.height;

    const [rw, rh] = aspect.split("/").map(Number);
    return rw / rh;
  };

  const getExportQuality = () => {
    const parsed = Number(quality);

    if (!Number.isFinite(parsed)) return 0.82;

    return Math.min(1, Math.max(0, parsed / 100));
  };

  const createCanvas = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
  };

  const getCanvasContext = (canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    return ctx;
  };

  const resizeImageHighQuality = (sourceCanvas, targetW, targetH) => {
    const finalTargetW = Math.max(1, Math.round(targetW));
    const finalTargetH = Math.max(1, Math.round(targetH));

    let currentCanvas = sourceCanvas;
    let currentW = sourceCanvas.width;
    let currentH = sourceCanvas.height;

    while (currentW * 0.5 > finalTargetW && currentH * 0.5 > finalTargetH) {
      const nextW = Math.max(finalTargetW, Math.round(currentW * 0.5));
      const nextH = Math.max(finalTargetH, Math.round(currentH * 0.5));

      const tempCanvas = createCanvas(nextW, nextH);
      const tempCtx = getCanvasContext(tempCanvas);

      tempCtx.drawImage(
        currentCanvas,
        0,
        0,
        currentW,
        currentH,
        0,
        0,
        nextW,
        nextH
      );

      currentCanvas = tempCanvas;
      currentW = nextW;
      currentH = nextH;
    }

    if (currentW === finalTargetW && currentH === finalTargetH) {
      return currentCanvas;
    }

    const finalCanvas = createCanvas(finalTargetW, finalTargetH);
    const finalCtx = getCanvasContext(finalCanvas);

    finalCtx.drawImage(
      currentCanvas,
      0,
      0,
      currentW,
      currentH,
      0,
      0,
      finalTargetW,
      finalTargetH
    );

    return finalCanvas;
  };

  const imageToSourceCanvas = (img) => {
    const sourceCanvas = createCanvas(img.width, img.height);
    const sourceCtx = getCanvasContext(sourceCanvas);

    sourceCtx.drawImage(img, 0, 0, img.width, img.height);

    return sourceCanvas;
  };

  const cropSourceToCanvas = (img, sx, sy, sw, sh) => {
    const cropCanvas = createCanvas(sw, sh);
    const cropCtx = getCanvasContext(cropCanvas);

    cropCtx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      cropCanvas.width,
      cropCanvas.height
    );

    return cropCanvas;
  };

  const canvasToWebpBlob = (canvas) =>
    new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", getExportQuality());
    });

  const processOriginalNoCrop = async (file) => {
    const img = await loadImage(file);
    const sourceCanvas = imageToSourceCanvas(img);

    const targetW = scale === "original" ? img.width : parseInt(scale, 10);
    const targetH = Math.round((img.height / img.width) * targetW);

    const finalCanvas =
      sourceCanvas.width === targetW && sourceCanvas.height === targetH
        ? sourceCanvas
        : resizeImageHighQuality(sourceCanvas, targetW, targetH);

    const blob = await canvasToWebpBlob(finalCanvas);

    return {
      name: sanitizeFileName(file.name) + ".webp",
      blob,
      size: blob.size
    };
  };

  const processFixedMode = async (file) => {
    const img = await loadImage(file);

    const ratio = getFixedAspectRatio(img);
    const outW = scale === "original" ? img.width : parseInt(scale, 10);
    const outH = Math.round(outW / ratio);

    const finalCanvas = createCanvas(outW, outH);
    const ctx = getCanvasContext(finalCanvas);

    ctx.clearRect(0, 0, outW, outH);

    const padX = 20;
    const padY = 5;

    const drawW = Math.max(1, outW - padX * 2);
    const drawH = Math.max(1, outH - padY * 2);

    const imgRatio = img.width / img.height;
    const drawRatio = drawW / drawH;

    let finalW;
    let finalH;

    if (imgRatio > drawRatio) {
      finalW = drawW;
      finalH = finalW / imgRatio;
    } else {
      finalH = drawH;
      finalW = finalH * imgRatio;
    }

    const dx = (outW - finalW) / 2;
    const dy = (outH - finalH) / 2;

    const sourceCanvas = imageToSourceCanvas(img);
    const resizedCanvas = resizeImageHighQuality(sourceCanvas, finalW, finalH);

    ctx.drawImage(resizedCanvas, dx, dy, finalW, finalH);

    const blob = await canvasToWebpBlob(finalCanvas);

    return {
      name: sanitizeFileName(file.name) + ".webp",
      blob,
      size: blob.size
    };
  };

  const getCroppedImage = async (file, pixelCrop) => {
    if (!pixelCrop) return null;

    const img = await loadImage(file);

    const targetW =
      scale === "original" ? Math.round(pixelCrop.width) : parseInt(scale, 10);

    const targetH = Math.round((pixelCrop.height / pixelCrop.width) * targetW);

    const cropCanvas = cropSourceToCanvas(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    const finalCanvas =
      cropCanvas.width === targetW && cropCanvas.height === targetH
        ? cropCanvas
        : resizeImageHighQuality(cropCanvas, targetW, targetH);

    return canvasToWebpBlob(finalCanvas);
  };

  const applyCrop = async () => {
    if (!singleImageFile || !croppedPixels) return;

    const blob = await getCroppedImage(singleImageFile, croppedPixels);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    setCropPreview({ blob, url });
  };

  const useCropped = async () => {
    if (!singleImageFile || !cropPreview?.blob) return;

    const item = {
      name: sanitizeFileName(singleImageFile.name) + ".webp",
      blob: cropPreview.blob,
      size: cropPreview.blob.size
    };

    setProcessed([item]);
    setCropPreview(null);
    setCropMode(false);

    if (uid) {
      const ref = doc(db, "users", uid);

      await updateDoc(ref, {
        converted_images: increment(1)
      });
    }
  };

  const getCropBox = (imgW, imgH, ratio) => {
    if (ratio === "original") {
      return {
        sx: 0,
        sy: 0,
        sw: imgW,
        sh: imgH
      };
    }

    const [rw, rh] = ratio.split("/").map(Number);
    const desired = rw / rh;
    const imageAspect = imgW / imgH;

    if (imageAspect > desired) {
      const sw = Math.round(imgH * desired);
      const sx = Math.round((imgW - sw) / 2);

      return {
        sx,
        sy: 0,
        sw,
        sh: imgH
      };
    }

    const sh = Math.round(imgW / desired);
    const sy = Math.round((imgH - sh) / 2);

    return {
      sx: 0,
      sy,
      sw: imgW,
      sh
    };
  };

  const computeSize = (sw, sh, scaleWidth) => {
    if (scaleWidth === "original") {
      return {
        outW: sw,
        outH: sh
      };
    }

    const outW = parseInt(scaleWidth, 10);
    const outH = Math.round((sh / sw) * outW);

    return {
      outW,
      outH
    };
  };

  const drawCanvasHighQuality = (img, sx, sy, sw, sh, outW, outH) => {
    const cropCanvas = cropSourceToCanvas(img, sx, sy, sw, sh);

    const finalCanvas =
      cropCanvas.width === outW && cropCanvas.height === outH
        ? cropCanvas
        : resizeImageHighQuality(cropCanvas, outW, outH);

    const canvas = canvasRef.current;

    canvas.width = finalCanvas.width;
    canvas.height = finalCanvas.height;

    const ctx = getCanvasContext(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(finalCanvas, 0, 0);
  };

  const processFiles = async () => {
    const files = Array.from(inputRef.current.files || []);

    if (!files.length) return;

    setProcessed([]);
    setCropPreview(null);

    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl);
      setCropImageUrl(null);
    }

    if (files.length === 1) {
      if (isFixed) {
        const result = await processFixedMode(files[0]);

        setProcessed([result]);
        setCropMode(false);

        if (uid) {
          const ref = doc(db, "users", uid);

          await updateDoc(ref, {
            converted_images: increment(1)
          });
        }

        return;
      }

      if (aspect === "original") {
        const result = await processOriginalNoCrop(files[0]);

        setProcessed([result]);
        setCropMode(false);
        setSingleImageFile(null);
        setCroppedPixels(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);

        if (uid) {
          const ref = doc(db, "users", uid);

          await updateDoc(ref, {
            converted_images: increment(1)
          });
        }

        return;
      }

      const previewUrl = URL.createObjectURL(files[0]);

      setSingleImageFile(files[0]);
      setCropImageUrl(previewUrl);
      setCropMode(true);
      setCroppedPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      return;
    }

    setCropMode(false);
    setSingleImageFile(null);
    setCroppedPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    const list = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (isFixed) {
        const fixed = await processFixedMode(file);
        list.push(fixed);
        continue;
      }

      if (aspect === "original") {
        const original = await processOriginalNoCrop(file);
        list.push(original);
        continue;
      }

      const img = await loadImage(file);
      const { sx, sy, sw, sh } = getCropBox(img.width, img.height, aspect);
      const { outW, outH } = computeSize(sw, sh, scale);

      drawCanvasHighQuality(img, sx, sy, sw, sh, outW, outH);

      const blob = await canvasToWebpBlob(canvasRef.current);

      list.push({
        name: sanitizeFileName(file.name) + ".webp",
        blob,
        size: blob.size
      });
    }

    setProcessed(list);

    if (uid) {
      const ref = doc(db, "users", uid);

      await updateDoc(ref, {
        converted_images: increment(list.length)
      });
    }
  };

  const triggerDownload = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = name;
    a.click();

    URL.revokeObjectURL(url);
  };

  const downloadFiles = async () => {
    if (!processed.length) return;

    if (processed.length === 1) {
      triggerDownload(processed[0].blob, processed[0].name);
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder("converted");

    processed.forEach((item) => {
      folder.file(item.name, item.blob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerDownload(zipBlob, `converted_${Date.now()}.zip`);
  };

  useEffect(() => {
    return () => {
      if (cropImageUrl) {
        URL.revokeObjectURL(cropImageUrl);
      }

      if (cropPreview?.url) {
        URL.revokeObjectURL(cropPreview.url);
      }
    };
  }, [cropImageUrl, cropPreview]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50">
      <h2 className="text-xl font-bold text-center mb-4">
        Batch Upload, Crop, Scale & Convert to WebP
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <label className="font-semibold">Select Images</label>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="w-full border p-2 rounded mt-2"
          />
        </div>

        <div className="bg-white border rounded-lg p-4 space-y-3">
          <div>
            <label className="font-semibold">Aspect Ratio</label>

            <select
              className="w-full border p-2 rounded mt-1"
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              disabled={isFixed}
            >
              <option value="original">Original - No Crop</option>
              <option value="16/9">Landscape (16:9)</option>
              <option value="5/4">Monitor (5:4)</option>
              <option value="1/1">Boxed (1:1)</option>
              <option value="4/5">Tablet (4:5)</option>
              <option value="9/16">Portrait (9:16)</option>
              <option value="370/113">Client Logos (370:113)</option>
              <option value="270/113">Partners Logos (270:113)</option>
            </select>

            {aspect === "original" && !isFixed && (
              <p className="text-xs text-gray-500 mt-1">
                Original keeps the image aspect ratio and skips the cropper.
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold">Scale Width</label>

            <select
              className="w-full border p-2 rounded mt-1"
              value={scale}
              onChange={(e) => setScale(e.target.value)}
            >
              <option value="original">Original</option>
              <option value="1920">1920px</option>
              <option value="1440">1440px</option>
              <option value="1024">1024px</option>
              <option value="720">720px</option>
              <option value="370">370px</option>
              <option value="270">270px</option>
              <option value="225">225px</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="font-semibold">Quality (WebP)</label>
              <span className="text-sm font-medium text-gray-700">
                {quality}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="2"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full mt-2"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>Default: 82%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={processFiles}
        className="mt-4 w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
      >
        Process Files
      </button>

      {cropMode && !isFixed && aspect !== "original" && !cropPreview && cropImageUrl && (
        <div className="mt-6 bg-white border rounded-lg p-4 relative">
          <h3 className="font-semibold mb-3">Adjust Crop</h3>

          <div
            ref={cropContainerRef}
            className="relative w-full h-[450px] bg-black"
          >
            <Cropper
              image={cropImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={getAspect()}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />

            <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => setZoom((z) => z + 0.1)}
                className="bg-white/80 rounded-full p-2 shadow"
              >
                <ZoomIn size={20} />
              </button>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                className="bg-white/80 rounded-full p-2 shadow"
              >
                <ZoomOut size={20} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={applyCrop}
            className="mt-4 w-full bg-green-600 text-white rounded py-2 hover:bg-green-700"
          >
            Apply Crop
          </button>
        </div>
      )}

      {cropPreview && (
        <div className="mt-6 bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Preview</h3>

          <img
            src={cropPreview.url}
            alt="Crop preview"
            className="rounded border mb-4 max-h-[400px] mx-auto"
          />

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCropPreview(null)}
              className="flex-1 bg-gray-200 py-2 rounded"
            >
              Crop Again
            </button>

            <button
              type="button"
              onClick={useCropped}
              className="flex-1 bg-blue-600 text-white py-2 rounded"
            >
              Use This
            </button>
          </div>
        </div>
      )}

      {processed.length > 0 && !cropMode && !cropPreview && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Preview Results</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {processed.map((item, i) => {
              const previewUrl = URL.createObjectURL(item.blob);

              return (
                <div key={i} className="bg-white border rounded p-3 shadow-sm">
                  <img
                    src={previewUrl}
                    alt={item.name}
                    className="w-full rounded border mb-2 bg-gray-100"
                  />

                  <div className="text-sm font-medium">{item.name}</div>

                  <div className="text-xs text-gray-500 mb-2">
                    {bytesToNice(item.size)}
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDownload(item.blob, item.name)}
                    className="w-full bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 text-sm"
                  >
                    Download
                  </button>
                </div>
              );
            })}
          </div>

          {processed.length > 1 && (
            <button
              type="button"
              onClick={downloadFiles}
              className="mt-5 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Download All as ZIP
            </button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}