'use client';

import { useEffect, useRef, useState } from 'react';
import { signAgreement } from '@/server/public';

type Agreement = NonNullable<Awaited<ReturnType<typeof import('@/server/public').getAgreement>>>;

type Stroke = { x: number; y: number; type: 'start' | 'draw' }[];

export function SignView({ agreement }: { agreement: Agreement }) {
  const alreadySigned = agreement.status === 'signed';
  const [signed, setSigned] = useState(alreadySigned);
  const [signaturePreview, setSignaturePreview] = useState(agreement.signature_url ?? '');
  const [signedAt, setSignedAt] = useState(
    agreement.signed_at ? new Date(agreement.signed_at).toLocaleString('en-US') : '',
  );
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke>([]);

  useEffect(() => {
    if (signed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1a0a3e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
  }, [signed]);

  function getPos(e: { clientX: number; clientY: number }) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(p: { clientX: number; clientY: number }) {
    if (!ctxRef.current) return;
    isDrawingRef.current = true;
    currentStrokeRef.current = [];
    const pos = getPos(p);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(pos.x, pos.y);
    currentStrokeRef.current.push({ ...pos, type: 'start' });
  }

  function draw(p: { clientX: number; clientY: number }) {
    if (!isDrawingRef.current || !ctxRef.current) return;
    const pos = getPos(p);
    ctxRef.current.lineTo(pos.x, pos.y);
    ctxRef.current.stroke();
    currentStrokeRef.current.push({ ...pos, type: 'draw' });
    if (!hasStrokes) setHasStrokes(true);
  }

  function endDraw() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }
  }

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (const stroke of strokesRef.current) {
      ctx.beginPath();
      for (const pt of stroke) {
        if (pt.type === 'start') ctx.moveTo(pt.x, pt.y);
        else {
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }
      }
    }
  }

  function handleUndo() {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    redraw();
    setHasStrokes(strokesRef.current.length > 0);
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    strokesRef.current = [];
    setHasStrokes(false);
  }

  async function handleSubmit() {
    if (!agreed || !hasStrokes || !canvasRef.current) return;
    setSubmitting(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const { signed_at } = await signAgreement(agreement.id, dataUrl);
      setSignaturePreview(dataUrl);
      setSignedAt(new Date(signed_at).toLocaleString('en-US'));
      setSigned(true);
    } catch (err) {
      alert('Failed to save signature: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900">Agreement Signed!</h2>
          <p className="mt-2 text-base text-gray-600">Thank you. Your signed agreement has been saved.</p>
          {signedAt && <p className="mt-1 text-xs text-gray-400">Signed at {signedAt}</p>}
          {signaturePreview && (
            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left">
              <div className="text-xs font-bold uppercase text-gray-400 mb-2">Your Signature</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signaturePreview} alt="Signature" className="w-full rounded-xl border bg-white" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a3e] to-[#2C0F73] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center mb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2c037]">
            <svg className="h-8 w-8 text-[#1a0a3e]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.06 9l.94.94L5.92 19H5v-.92L14.06 9m3.6-6c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83a.996.996 0 000-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-white">Digital Agreement</h1>
          <p className="text-sm text-white/60">Urban Mobile Grooming</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl space-y-5">
          <div>
            <div className="text-xs font-bold uppercase text-gray-400 mb-1">Agreement For</div>
            <div className="text-lg font-black text-gray-900">
              {agreement.clients?.first_name} {agreement.clients?.last_name}
            </div>
            <div className="text-sm text-gray-500">{agreement.agreement_templates?.name}</div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {agreement.agreement_templates?.body}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase text-gray-400">Draw Your Signature</div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="rounded-lg border px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 active:bg-gray-100"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 active:bg-gray-100"
                >
                  Clear
                </button>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 touch-none cursor-crosshair"
              style={{ height: '140px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                startDraw(e.nativeEvent);
              }}
              onMouseMove={(e) => {
                e.preventDefault();
                draw(e.nativeEvent);
              }}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={(e) => {
                e.preventDefault();
                const t = e.touches[0];
                startDraw({ clientX: t.clientX, clientY: t.clientY });
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const t = e.touches[0];
                draw({ clientX: t.clientX, clientY: t.clientY });
              }}
              onTouchEnd={endDraw}
            />
            {!hasStrokes && (
              <p className="mt-1 text-center text-xs text-gray-400">
                Sign above using your finger or mouse
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded accent-[#f2c037]"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I have read and agree to the terms of this agreement. I understand this is a legally
              binding digital signature.
            </span>
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!agreed || !hasStrokes || submitting}
            className="w-full rounded-2xl py-4 text-base font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#f2c037', color: '#1a0a3e' }}
          >
            {submitting ? 'Saving…' : 'Sign Agreement'}
          </button>
        </div>

        <p className="text-center text-xs text-white/40">urbanMG • Miami Mobile Pet Grooming</p>
      </div>
    </div>
  );
}
