'use client';

import { usePosesStore } from '@/hooks/use-poses-store';
import { Button } from '@/components/ui/button';
import { EvaluationSession } from '@/types/mediapipe';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';

function SessionCard({
  session,
  onDelete,
}: {
  session: EvaluationSession;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    session.averageScore >= 80
      ? 'text-green-400'
      : session.averageScore >= 50
        ? 'text-yellow-400'
        : 'text-red-400';

  const chartData = session.frames
    .filter((_, i) => i % 10 === 0)
    .map((f, i) => ({
      frame: i,
      score: f.evaluation.overallScore,
    }));

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[48px]">
            <p className={`text-2xl font-bold ${scoreColor}`}>
              {session.averageScore}
            </p>
            <p className="text-xs text-gray-500">score</p>
          </div>
          <div>
            <p className="font-semibold text-white">{session.referencePoseName}</p>
            <p className="text-sm text-gray-400">
              {session.studentName ?? 'Anónimo'} ·{' '}
              {new Date(session.startedAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm text-gray-400">
            <p>{Math.floor(session.duration / 60)}m {session.duration % 60}s</p>
            <p>{session.frames.length} frames</p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={e => {
              e.stopPropagation();
              onDelete(session.id);
            }}
          >
            ✕
          </Button>
          <span className="text-gray-500">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && chartData.length > 1 && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-4">
          <p className="text-sm text-gray-400 mb-3">Evolución del score en la sesión</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="frame"
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                label={{ value: 'Frames', position: 'insideBottom', fill: '#6b7280', fontSize: 10 }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  const { sessions, deleteSession } = usePosesStore();

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const avgGlobal =
    sessions.length > 0
      ? Math.round(sessions.reduce((s, sess) => s + sess.averageScore, 0) / sessions.length)
      : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Historial de Sesiones</h1>
          <p className="text-gray-400 mt-1">Seguimiento del progreso de evaluaciones</p>
        </div>

        {/* Stats globales */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
              <p className="text-3xl font-bold text-blue-400">{sessions.length}</p>
              <p className="text-sm text-gray-400 mt-1">Sesiones totales</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
              <p className="text-3xl font-bold text-green-400">{avgGlobal}</p>
              <p className="text-sm text-gray-400 mt-1">Score promedio</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
              <p className="text-3xl font-bold text-purple-400">
                {Math.round(
                  sessions.reduce((s, sess) => s + sess.duration, 0) / 60
                )}
                m
              </p>
              <p className="text-sm text-gray-400 mt-1">Tiempo total</p>
            </div>
          </div>
        )}

        {/* Lista de sesiones */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
            <span className="text-6xl mb-4">📊</span>
            <p className="text-lg font-medium">No hay sesiones registradas</p>
            <p className="text-sm mt-1">
              Inicia una evaluación para ver tu historial aquí
            </p>
            <Button
              className="mt-4"
              onClick={() => (window.location.href = '/evaluation')}
            >
              Ir a Evaluación
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={deleteSession}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
