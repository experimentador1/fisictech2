'use client';

import { useState } from 'react';
import { useExercisesStore } from '@/hooks/use-exercises-store';
import { PracticeSession, PRECISION_THRESHOLD, ADJUST_THRESHOLD } from '@/types/poseflow';
import { cn } from '@/lib/utils';
import {
  BarChart2, Camera, Clock, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, Activity,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

function scoreColor(score: number) {
  if (score >= PRECISION_THRESHOLD) return '#22c55e';
  if (score >= ADJUST_THRESHOLD) return '#eab308';
  return '#ef4444';
}
function scoreTextClass(score: number) {
  if (score >= PRECISION_THRESHOLD) return 'text-green-400';
  if (score >= ADJUST_THRESHOLD) return 'text-yellow-400';
  return 'text-red-400';
}
function ScoreIcon({ score }: { score: number }) {
  if (score >= PRECISION_THRESHOLD) return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" strokeWidth={2} />;
  if (score >= ADJUST_THRESHOLD) return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" strokeWidth={2} />;
  return <XCircle className="w-3.5 h-3.5 text-red-400" strokeWidth={2} />;
}

function SessionCard({ session, onDelete }: { session: PracticeSession; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const chartData = session.poseResults.map(r => ({
    name: r.poseName.length > 8 ? r.poseName.slice(0, 8) + '…' : r.poseName,
    score: r.averageScore,
  }));

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors duration-150">
      {/* Row header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {/* Score badge */}
          <div className="text-center min-w-[52px]">
            <p className={cn('text-2xl font-black leading-none', scoreTextClass(session.globalScore))}>
              {session.globalScore}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">score</p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white text-sm truncate">{session.exerciseName}</p>
              <ScoreIcon score={session.globalScore} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {session.studentName ?? 'Anónimo'} ·{' '}
              {new Date(session.startedAt).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-medium">
              {Math.floor(session.durationSecs / 60)}m {session.durationSecs % 60}s
            </p>
            <p className="text-xs text-gray-600">{session.poseResults.length} poses</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(session.id); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all duration-150 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2} />
            : <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2} />
          }
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-4 space-y-4">
          {/* Score por pose */}
          {chartData.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Score por pose</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#4b5563" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Lista de poses */}
          <div className="space-y-1.5">
            {session.poseResults.map(r => (
              <div key={r.poseId} className="flex items-center gap-3 text-xs">
                <span className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-500 font-medium shrink-0">
                  {r.order}
                </span>
                <span className="flex-1 text-gray-300">{r.poseName}</span>
                {(r.repetitionsTotal ?? 1) > 1 && (
                  <span className="text-violet-400 font-medium shrink-0">
                    ×{r.repetitionsDone}/{r.repetitionsTotal}
                  </span>
                )}
                <ScoreIcon score={r.averageScore} />
                <span className={cn('font-semibold w-9 text-right', scoreTextClass(r.averageScore))}>
                  {r.averageScore}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  const { sessions, deleteSession } = useExercisesStore();

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const avgGlobal =
    sessions.length > 0
      ? Math.round(sessions.reduce((s, sess) => s + sess.globalScore, 0) / sessions.length)
      : 0;

  const totalMins = Math.round(
    sessions.reduce((s, sess) => s + sess.durationSecs, 0) / 60
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">
              <BarChart2 className="w-3.5 h-3.5" strokeWidth={2} />
              Historial de Sesiones
            </div>
            <h1 className="text-2xl font-bold text-white">Progreso del Alumno</h1>
            <p className="text-gray-500 text-sm mt-0.5">Seguimiento de evaluaciones completadas</p>
          </div>
        </div>

        {/* Stats globales */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Activity, value: sessions.length, label: 'Sesiones totales', color: 'text-blue-400' },
              { icon: CheckCircle2, value: `${avgGlobal}%`, label: 'Score promedio', color: scoreTextClass(avgGlobal) },
              { icon: Clock, value: `${totalMins}m`, label: 'Tiempo total', color: 'text-violet-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 text-center">
                <stat.icon className={cn('w-4 h-4 mx-auto mb-2', stat.color)} strokeWidth={1.5} />
                <p className={cn('text-2xl font-black leading-none', stat.color)}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lista de sesiones */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600 border border-dashed border-white/[0.06] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6 text-gray-700" strokeWidth={1} />
            </div>
            <p className="text-base font-semibold text-gray-400">No hay sesiones registradas</p>
            <p className="text-sm mt-1 text-gray-600">Inicia una evaluación para ver tu progreso aquí</p>
            <button
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer"
              onClick={() => (window.location.href = '/evaluation')}
            >
              <Camera className="w-4 h-4" strokeWidth={2} />
              Ir a Evaluación
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(session => (
              <SessionCard key={session.id} session={session} onDelete={deleteSession} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
