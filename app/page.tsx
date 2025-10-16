"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { AnalysisResult } from "@/lib/analyzer";
import { analyzeImageData } from "@/lib/analyzer";

interface UploadState {
  previewUrl: string | null;
  fileName: string | null;
}

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    previewUrl: null,
    fileName: null
  });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose a CT or MRI image (PNG, JPG, JPEG).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      await renderImageToCanvas(dataUrl, canvasRef);
      const context = canvasRef.current?.getContext("2d");

      if (!context) {
        throw new Error("Could not access 2D canvas context.");
      }

      const { width, height } = context.canvas;
      const imageData = context.getImageData(0, 0, width, height);
      const result = analyzeImageData(imageData);

      setAnalysis(result);
      setUploadState({ previewUrl: dataUrl, fileName: file.name });
    } catch (err) {
      console.error(err);
      setError("We could not analyse this file. Please try a different image.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await handleFile(file);
    },
    [handleFile]
  );

  const probabilityLabel = useMemo(() => {
    if (!analysis) return null;
    const pct = Math.round(analysis.probability * 100);
    return analysis.label === "CT" ? `${pct}% CT likelihood` : `${100 - pct}% MRI likelihood`;
  }, [analysis]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12 md:py-20">
      <header className="space-y-4 text-center md:text-left">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Medical Imaging AI</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          CT vs MRI Classifier
        </h1>
        <p className="max-w-3xl text-lg text-slate-300">
          Upload a medical imaging slice and our lightweight on-device model will estimate whether
          it&apos;s generated from a CT scanner or MRI acquisition. Feature attribution explains the
          decision in transparent language.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl shadow-black/30">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 text-sm text-slate-300">
              <label
                htmlFor="image-input"
                className="block font-semibold uppercase tracking-wide text-slate-200"
              >
                Upload Imaging Slice
              </label>
              <input
                id="image-input"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="w-full cursor-pointer rounded-lg border border-dashed border-brand-400/60 bg-slate-950/60 p-5 text-center text-sm text-slate-300 outline-none transition hover:border-brand-300 focus-visible:border-brand-200"
                onChange={handleInputChange}
              />
              <p>
                The image never leaves your browser. For best results, use an axial slice exported
                as JPG or PNG.
              </p>
            </div>

            {isLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
                <div className="h-2 w-2 animate-ping rounded-full bg-brand-400" />
                Analysing image with machine learning...
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {analysis && uploadState.previewUrl && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prediction</p>
                  <p className="text-2xl font-semibold text-white">
                    {analysis.label === "CT" ? "Computed Tomography" : "Magnetic Resonance Imaging"}
                  </p>
                  <p className="text-sm text-brand-200">{probabilityLabel}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Model Explanation
                  </p>
                  <ul className="space-y-2 text-sm text-slate-200">
                    {analysis.rationale.map((line, index) => (
                      <li key={index} className="rounded-lg bg-slate-800/80 px-4 py-3">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Feature Contributions
                  </p>
                  <div className="overflow-hidden rounded-xl border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                      <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-4 py-3 text-left">Feature</th>
                          <th className="px-4 py-3 text-left">Value</th>
                          <th className="px-4 py-3 text-left">Effect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/70">
                        {analysis.contributions
                          .filter((item) => item.feature !== "bias")
                          .map((item) => (
                            <tr key={item.feature.toString()}>
                              <td className="px-4 py-3 font-medium capitalize">
                                {humanizeFeature(item.feature.toString())}
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {item.value.toFixed(3)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    item.contribution >= 0
                                      ? "bg-brand-500/20 text-brand-200"
                                      : "bg-purple-500/20 text-purple-200"
                                  }`}
                                >
                                  {item.contribution >= 0 ? "CT evidence" : "MRI evidence"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl shadow-black/20">
            <div className="border-b border-slate-800 bg-slate-900/80 px-5 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Uploaded Slice
            </div>
            <div className="flex h-[360px] items-center justify-center bg-slate-950">
              {uploadState.previewUrl ? (
                <img
                  src={uploadState.previewUrl}
                  alt={uploadState.fileName ?? "Uploaded imaging slice"}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center text-sm text-slate-500">
                  <span className="text-5xl">🩻</span>
                  Drop a CT or MRI slice to begin
                </div>
              )}
            </div>
            {uploadState.fileName && (
              <p className="truncate px-5 py-3 text-xs text-slate-500">
                {uploadState.fileName}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-300">
            <h2 className="mb-3 text-base font-semibold text-white">How the model works</h2>
            <p>
              The analyser extracts six texture descriptors from the image directly in your browser.
              A calibrated logistic regression model then weighs the evidence to estimate whether
              the slice matches CT or MRI characteristics.
            </p>
          </div>
        </aside>
      </section>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}

function humanizeFeature(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (char) => char.toUpperCase())
    .trim();
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unexpected binary result"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function renderImageToCanvas(
  dataUrl: string,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const img = document.createElement("img");
  img.src = dataUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = canvasRef.current;
  if (!canvas) {
    throw new Error("Canvas not ready");
  }

  const maxSize = 512;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const width = Math.max(64, Math.round(img.width * scale));
  const height = Math.max(64, Math.round(img.height * scale));

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to get 2D context");
  }
  context.clearRect(0, 0, width, height);
  context.drawImage(img, 0, 0, width, height);
}
