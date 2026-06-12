'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fileToDataUrl, processBatch, generateGifPreview, compressDataUrl } from '@/lib/mediapipe/image-processor';
import { AnimatedPreview } from '@/components/common/animated-preview';
import { useExercisesStore, buildExercisePose } from '@/hooks/use-exercises-store';
import {
  ExerciseCategory, DifficultyLevel, Exercise, ExercisePose, PRECISION_THRESHOLD,
} from '@/types/poseflow';
import { ImageProcessingResult } from '@/types/poseflow';
import { v4 as uuidv4 } from 'uuid';
import {
  Upload, ChevronUp, ChevronDown, X, Cpu, Download, Plus,
  CheckCircle2, AlertTriangle, XCircle, Dumbbell, Trash2,
  ArrowRight, SquareCheckBig, Info, Camera,
} from 'lucide-react';

// ─── Tipos internos de la UI ──────────────────────────────────

interface UploadedImage {
  id: string;
  file: File;
  dataUrl: string;
  poseName: string;
  holdTime: number;
  repetitions: number;
}

type Step = 'upload' | 'processing' | 'configure' | 'preview' | 'done';

const CATEGORIES: ExerciseCategory[] = ['pilates', 'rehabilitation', 'spinning'];
const DIFFICULTIES: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

const CAT_LABELS: Record<ExerciseCategory, string> = {
  pilates: 'Pilates', rehabilitation: 'Rehabilitación', spinning: 'Spinning',
};
const DIFF_LABELS: Record<DifficultyLevel, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado',
};

// ─── Componente principal ──────────────────────────────────────

export default function TrainingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedResults, setProcessedResults] = useState<ImageProcessingResult[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Metadatos del ejercicio
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('pilates');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [transitionTime, setTransitionTime] = useState(3);
  const [createdBy, setCreatedBy] = useState('');

  const [savedExercise, setSavedExercise] = useState<Exercise | null>(null);
  const [generatedJson, setGeneratedJson] = useState<string>('');

  // Selección y borrado de ejercicios
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { addExercise, exercises, deleteExercise } = useExercisesStore();

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteExercise(id));
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // ─── Upload ─────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      // Comprimir al subir: localStorage tiene cuota de ~5 MB
      const dataUrl = await compressDataUrl(await fileToDataUrl(file));
      newImages.push({
        id: uuidv4(),
        file,
        dataUrl,
        poseName: `Pose ${images.length + newImages.length + 1}`,
        holdTime: 10,
        repetitions: 1,
      });
    }
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = (id: string) =>
    setImages(prev => prev.filter(img => img.id !== id));

  const moveImage = (id: string, dir: -1 | 1) => {
    setImages(prev => {
      const idx = prev.findIndex(img => img.id === id);
      if (idx < 0) return prev;
      const newArr = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= newArr.length) return prev;
      [newArr[idx], newArr[swap]] = [newArr[swap]!, newArr[idx]!];
      return newArr;
    });
  };

  // ─── Procesar con MediaPipe ──────────────────────────────────

  const handleProcess = useCallback(async () => {
    if (images.length < 1) return;
    setStep('processing');
    setProcessingProgress(0);
    setProcessingError(null);

    try {
      const dataUrls = images.map(img => img.dataUrl);
      const results = await processBatch(dataUrls, (done, total) =>
        setProcessingProgress(Math.round((done / total) * 100))
      );
      setProcessedResults(results);
      setStep('configure');
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : 'Error al procesar imágenes');
      setStep('upload');
    }
  }, [images]);

  // ─── Generar y guardar ejercicio ─────────────────────────────

  const handleSave = useCallback(() => {
    if (!exerciseName.trim()) return;

    const poses: ExercisePose[] = processedResults.map((result, i) =>
      buildExercisePose({
        id: uuidv4(),
        order: i + 1,
        name: images[i]?.poseName ?? `Pose ${i + 1}`,
        holdTime: images[i]?.holdTime ?? 10,
        repetitions: images[i]?.repetitions ?? 1,
        imageDataUrl: result.imageDataUrl,
        landmarks: result.landmarks,
        worldLandmarks: result.worldLandmarks,
        angles: result.angles,
        detectedLandmarks: result.detectedLandmarks,
      })
    );

    const now = new Date().toISOString();
    const allDataUrls = images.map(img => img.dataUrl);

    const exercise = addExercise({
      name: exerciseName.trim(),
      description: exerciseDescription.trim(),
      category,
      difficulty,
      transitionTime,
      poses,
      createdBy: createdBy.trim() || 'Instructor',
      published: true,
      precisionThreshold: PRECISION_THRESHOLD,
      gifDataUrl: images[0]?.dataUrl, // se actualiza async abajo
    });

    // Generar sprite animado en background y actualizar el ejercicio
    generateGifPreview(allDataUrls).then(spriteUrl => {
      if (spriteUrl && spriteUrl !== allDataUrls[0]) {
        useExercisesStore.getState().updateExercise(exercise.id, { gifDataUrl: spriteUrl });
      }
    });

    const json = JSON.stringify(
      {
        exercise: {
          id: exercise.id,
          name: exercise.name,
          description: exercise.description,
          category: exercise.category,
          difficulty: exercise.difficulty,
          transitionTime: exercise.transitionTime,
          precisionThreshold: exercise.precisionThreshold,
          createdBy: exercise.createdBy,
          createdAt: exercise.createdAt,
          poses: exercise.poses.map(p => ({
            id: p.id,
            order: p.order,
            name: p.name,
            holdTime: p.holdTime,
            detectedLandmarks: p.detectedLandmarks,
            angles: p.angles,
            tolerances: p.tolerances,
            landmarks: p.landmarks.map(lm => ({
              x: Math.round(lm.x * 10000) / 10000,
              y: Math.round(lm.y * 10000) / 10000,
              z: Math.round(lm.z * 10000) / 10000,
              visibility: Math.round((lm.visibility ?? 1) * 1000) / 1000,
            })),
          })),
        },
      },
      null,
      2
    );

    setSavedExercise(exercise);
    setGeneratedJson(json);
    setStep('done');
  }, [
    processedResults, images, exerciseName, exerciseDescription,
    category, difficulty, transitionTime, createdBy, addExercise,
  ]);

  const downloadJson = () => {
    const blob = new Blob([generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${savedExercise?.name.replace(/\s+/g, '_') ?? 'ejercicio'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStep('upload');
    setImages([]);
    setProcessedResults([]);
    setProcessingProgress(0);
    setExerciseName('');
    setExerciseDescription('');
    setSavedExercise(null);
    setGeneratedJson('');
  };

  // ─── RENDER ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold uppercase tracking-wider mb-2">
              <Dumbbell className="w-3.5 h-3.5" strokeWidth={2} />
              Módulo 1 · Cargar Lección
            </div>
            <h1 className="text-3xl font-bold text-white">Crear Ejercicio para Lecciones</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Sube imágenes → MediaPipe extrae 33 landmarks → Genera JSON
            </p>
          </div>

          {/* Stepper */}
          <div className="hidden md:flex items-center gap-1.5">
            {(['Subir', 'Procesar', 'Configurar', 'Listo'] as const).map((label, i) => {
              const steps = ['upload', 'processing', 'configure', 'done'];
              const currentIdx = steps.indexOf(step);
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200',
                    active ? 'bg-blue-600 text-white' :
                    done   ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                             'bg-gray-800 text-gray-500'
                  )}>
                    {done && <CheckCircle2 className="w-3 h-3" />}
                    {label}
                  </div>
                  {i < 3 && <div className="w-4 h-px bg-gray-700" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP: UPLOAD ──────────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-6">
            {processingError && (
              <div className="flex items-start gap-3 bg-red-950/50 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
                {processingError}
              </div>
            )}

            {/* Drop zone */}
            <div
              className="group border-2 border-dashed border-white/[0.08] hover:border-blue-500/50 rounded-2xl p-14 text-center cursor-pointer transition-all duration-200 hover:bg-blue-500/[0.03]"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors duration-200">
                <Upload className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-gray-200 mb-1">
                Arrastra tus imágenes aquí
              </p>
              <p className="text-sm text-gray-500">
                JPG, PNG · Máx. 5 MB · 1–20 imágenes por ejercicio
              </p>
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm text-gray-300 transition-all duration-200 cursor-pointer">
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Seleccionar archivos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* Lista de imágenes */}
            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-200">
                    Secuencia de Poses ({images.length})
                  </h2>
                  <span className="text-xs text-gray-500">
                    Usa ▲▼ para reordenar
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-3 bg-white/[0.02] rounded-xl border border-white/[0.06] hover:border-white/10 p-3 transition-colors duration-150"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                      </div>

                      {/* Orden badge */}
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
                        {i + 1}
                      </span>

                      {/* Nombre de pose */}
                      <input
                        type="text"
                        value={img.poseName}
                        onChange={e =>
                          setImages(prev =>
                            prev.map(p => p.id === img.id ? { ...p, poseName: e.target.value } : p)
                          )
                        }
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:outline-none transition-all duration-150"
                        placeholder="Nombre de la pose"
                      />

                      {/* Tiempo */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={5} max={120}
                          value={img.holdTime}
                          onChange={e =>
                            setImages(prev =>
                              prev.map(p => p.id === img.id ? { ...p, holdTime: Number(e.target.value) } : p)
                            )
                          }
                          className="w-14 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-center text-white focus:border-blue-500/50 focus:outline-none transition-all duration-150"
                        />
                        <span className="text-xs text-gray-600">seg</span>
                      </div>

                      {/* Separador */}
                      <div className="w-px h-6 bg-white/[0.06] shrink-0" />

                      {/* Repeticiones */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={1} max={30}
                          value={img.repetitions}
                          onChange={e =>
                            setImages(prev =>
                              prev.map(p => p.id === img.id ? { ...p, repetitions: Number(e.target.value) } : p)
                            )
                          }
                          className="w-12 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-center text-white focus:border-violet-500/50 focus:outline-none transition-all duration-150"
                        />
                        <span className="text-xs text-gray-600">rep</span>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          onClick={() => moveImage(img.id, -1)}
                          disabled={i === 0}
                          className="p-1.5 rounded-lg hover:bg-white/[0.08] disabled:opacity-25 text-gray-400 hover:text-gray-200 transition-all duration-150 cursor-pointer"
                        >
                          <ChevronUp className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => moveImage(img.id, 1)}
                          disabled={i === images.length - 1}
                          className="p-1.5 rounded-lg hover:bg-white/[0.08] disabled:opacity-25 text-gray-400 hover:text-gray-200 transition-all duration-150 cursor-pointer"
                        >
                          <ChevronDown className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all duration-150 cursor-pointer"
                        >
                          <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setImages([])}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors duration-150 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    Limpiar todo
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={images.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
                  >
                    <Cpu className="w-4 h-4" strokeWidth={2} />
                    Procesar con MediaPipe
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}

            {/* Biblioteca de ejercicios guardados */}
            {exercises.length > 0 && (
              <div className="mt-10 pt-8 border-t border-white/[0.06]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Ejercicios existentes
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 text-xs font-normal normal-case tracking-normal">
                      {exercises.length}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    {selectionMode && selectedIds.size > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        Eliminar ({selectedIds.size})
                      </button>
                    )}
                    <button
                      onClick={selectionMode ? exitSelectionMode : () => setSelectionMode(true)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer border',
                        selectionMode
                          ? 'bg-white/[0.06] border-white/10 text-gray-300 hover:bg-white/[0.10]'
                          : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]'
                      )}
                    >
                      {selectionMode
                        ? <><X className="w-3.5 h-3.5" strokeWidth={2} /> Cancelar</>
                        : <><SquareCheckBig className="w-3.5 h-3.5" strokeWidth={2} /> Seleccionar</>
                      }
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {exercises.map(ex => {
                    const isSelected = selectedIds.has(ex.id);
                    return (
                      <div
                        key={ex.id}
                        onClick={() => selectionMode && toggleSelect(ex.id)}
                        className={cn(
                          'group rounded-xl border p-3 transition-all duration-200',
                          selectionMode ? 'cursor-pointer' : '',
                          isSelected
                            ? 'border-red-500/50 ring-1 ring-red-500/30 bg-red-500/[0.05]'
                            : selectionMode
                              ? 'border-white/[0.08] hover:border-white/20 bg-white/[0.02]'
                              : 'border-white/[0.06] hover:border-white/10 bg-white/[0.02]'
                        )}
                      >
                        <div className="relative aspect-video bg-gray-800 rounded-lg mb-2.5 overflow-hidden">
                          <AnimatedPreview
                            gifDataUrl={ex.gifDataUrl}
                            className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          {selectionMode && (
                            <div className={cn(
                              'absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150',
                              isSelected
                                ? 'bg-red-500 border-red-500'
                                : 'bg-black/50 border-gray-400'
                            )}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-white truncate">{ex.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ex.poses.length} poses · {CAT_LABELS[ex.category]}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Barra de confirmación de borrado */}
                {selectionMode && selectedIds.size > 0 && (
                  <div className="mt-4 flex items-center justify-between bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-300/80">
                      <span className="font-semibold text-red-300">{selectedIds.size}</span> ejercicio{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={exitSelectionMode}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-gray-300 hover:bg-white/[0.10] text-sm transition-all duration-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        Eliminar {selectedIds.size} ejercicio{selectedIds.size !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: PROCESSING ──────────────────────────────── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="text-6xl animate-pulse">🤖</div>
            <h2 className="text-2xl font-bold">Procesando imágenes con MediaPipe</h2>
            <p className="text-gray-400 text-sm">
              Extrayendo 33 landmarks por pose y calculando ángulos articulares...
            </p>
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                <span>Progreso</span>
                <span>{processingProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <Info className="w-3 h-3" strokeWidth={2} />
              La primera vez puede tardar hasta 30 s mientras se descarga el modelo WASM
            </p>
          </div>
        )}

        {/* ── STEP: CONFIGURE ───────────────────────────────── */}
        {step === 'configure' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resultados de MediaPipe */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-200 uppercase tracking-wider">Resultados de Detección</h2>
              <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                {processedResults.map((result, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-3 rounded-xl border p-3 transition-colors duration-150',
                      result.error
                        ? 'bg-red-950/20 border-red-500/20'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    )}
                  >
                    <div className="w-18 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0" style={{ width: 72, height: 56 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result.imageDataUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white">{images[i]?.poseName}</p>
                      {result.error ? (
                        <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" strokeWidth={2} />
                          {result.error}
                        </p>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          <p>
                            <span className={cn(
                              'font-semibold',
                              result.detectedLandmarks >= 20 ? 'text-green-400' :
                              result.detectedLandmarks >= 10 ? 'text-yellow-400' : 'text-red-400'
                            )}>
                              {result.detectedLandmarks}/33
                            </span>{' '}landmarks &middot; Confianza{' '}
                            <span className="text-gray-300">{result.confidence}%</span>
                          </p>
                        </div>
                      )}
                    </div>
                    {!result.error && (
                      <div className={cn(
                        'shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                        result.detectedLandmarks >= 20 ? 'bg-green-500/10 text-green-400' :
                        result.detectedLandmarks >= 10 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                      )}>
                        {result.detectedLandmarks >= 20
                          ? <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                          : result.detectedLandmarks >= 10
                            ? <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                            : <XCircle className="w-4 h-4" strokeWidth={2} />
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Nota sobre poses de suelo */}
              <div className="flex items-start gap-2.5 bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300/80">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" strokeWidth={2} />
                <span>
                  Las poses en posición supina pueden tener menor precisión en MediaPipe.
                  Se recomienda usar <strong className="text-amber-300">tolerancias amplias (≥ 20°)</strong>.
                </span>
              </div>
            </div>

            {/* Configuración del ejercicio */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-200 uppercase tracking-wider">Configuración del Ejercicio</h2>
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5 space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nombre del ejercicio *
                  </label>
                  <input
                    type="text"
                    value={exerciseName}
                    onChange={e => setExerciseName(e.target.value)}
                    placeholder="ej. Apertura de Brazos, Roll Up..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:outline-none text-sm transition-all duration-150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={exerciseDescription}
                    onChange={e => setExerciseDescription(e.target.value)}
                    placeholder="Describe el ejercicio, músculos trabajados, beneficios..."
                    rows={2}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:outline-none text-sm resize-none transition-all duration-150"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Categoría</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as ExerciseCategory)}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer transition-all duration-150"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{CAT_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Dificultad</label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:outline-none cursor-pointer transition-all duration-150"
                    >
                      {DIFFICULTIES.map(d => (
                        <option key={d} value={d}>{DIFF_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Transición (seg)
                    </label>
                    <input
                      type="number" min={1} max={10}
                      value={transitionTime}
                      onChange={e => setTransitionTime(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:outline-none transition-all duration-150"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Instructor / Creador
                    </label>
                    <input
                      type="text"
                      value={createdBy}
                      onChange={e => setCreatedBy(e.target.value)}
                      placeholder="Nombre del instructor"
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none text-sm transition-all duration-150"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-blue-950/30 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300/80">
                  <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" strokeWidth={2} />
                  <span>
                    Umbral: <strong className="text-blue-300">≥{PRECISION_THRESHOLD}%</strong> Correcto &nbsp;·&nbsp;
                    70–{PRECISION_THRESHOLD - 1}% Ajustar &nbsp;·&nbsp; &lt;70% Corregir
                  </span>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep('upload')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm text-gray-300 transition-all duration-200 cursor-pointer"
                  >
                    ← Volver
                  </button>
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
                    onClick={handleSave}
                    disabled={!exerciseName.trim()}
                  >
                    <Download className="w-4 h-4" strokeWidth={2} />
                    Guardar y Generar JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ────────────────────────────────────── */}
        {step === 'done' && savedExercise && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">¡Ejercicio Creado!</h2>
                <p className="text-gray-400 text-sm">{savedExercise.name} · {savedExercise.poses.length} poses</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resumen */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
                <h3 className="font-semibold text-gray-200">Resumen del Ejercicio</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Categoría</p><p className="text-white font-medium">{CAT_LABELS[savedExercise.category]}</p></div>
                  <div><p className="text-gray-500">Dificultad</p><p className="text-white font-medium">{DIFF_LABELS[savedExercise.difficulty]}</p></div>
                  <div><p className="text-gray-500">Poses</p><p className="text-white font-medium">{savedExercise.poses.length}</p></div>
                  <div><p className="text-gray-500">Transición</p><p className="text-white font-medium">{savedExercise.transitionTime}s</p></div>
                  <div><p className="text-gray-500">Umbral precisión</p><p className="text-green-400 font-medium">{savedExercise.precisionThreshold}%</p></div>
                  <div><p className="text-gray-500">Instructor</p><p className="text-white font-medium">{savedExercise.createdBy}</p></div>
                </div>
                <div className="space-y-2">
                  {savedExercise.poses.map(pose => (
                    <div key={pose.id} className="flex items-center gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-900/50 border border-blue-700 flex items-center justify-center text-xs font-bold text-blue-300">
                        {pose.order}
                      </span>
                      <span className="text-white flex-1">{pose.name}</span>
                      <span className="text-gray-400">{pose.holdTime}s</span>
                      <span className="text-gray-500">×{pose.repetitions ?? 1}</span>
                      <span className={cn(
                        'text-xs font-medium',
                        (pose.detectedLandmarks ?? 0) >= 20 ? 'text-green-400' :
                        (pose.detectedLandmarks ?? 0) >= 10 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {pose.detectedLandmarks ?? 0}/33 lm
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON Preview */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-200 text-sm">JSON Generado · Módulo 1 → Módulo 2</h3>
                  <button
                    onClick={downloadJson}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-xs text-gray-300 font-medium transition-all duration-200 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    Descargar JSON
                  </button>
                </div>
                <pre className="bg-gray-950/60 rounded-lg p-3 text-xs text-green-400/80 overflow-auto max-h-64 font-mono leading-relaxed border border-white/[0.04]">
                  {generatedJson.slice(0, 2000)}{generatedJson.length > 2000 ? '\n...(truncado)' : ''}
                </pre>
                <p className="text-xs text-gray-600">
                  {savedExercise.poses.length} poses con landmarks · Importa este JSON en el Módulo 2.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm text-gray-300 font-medium transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Crear otro ejercicio
              </button>
              <button
                onClick={() => window.location.href = '/evaluation'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <Camera className="w-4 h-4" strokeWidth={2} />
                Probar en Módulo 2
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
