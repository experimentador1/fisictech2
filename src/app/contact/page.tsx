'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Activity } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputClass =
    'w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:outline-none transition-all duration-150';
  const labelClass = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container max-w-lg mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
            <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black">
            Pose<span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Flow</span>
          </h1>
          <p className="text-gray-400 text-sm">
            ¿Tienes preguntas, sugerencias o quieres colaborar? Escríbenos.
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold">¡Mensaje enviado!</h2>
            <p className="text-gray-400 text-sm">Gracias por contactarnos, te responderemos pronto.</p>
            <button
              onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-150 cursor-pointer"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6 space-y-5"
          >
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tu nombre"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Mensaje</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Cuéntanos en qué podemos ayudarte..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={!form.name || !form.email || !form.message}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Send className="w-4 h-4" strokeWidth={2} />
              Enviar Mensaje
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
