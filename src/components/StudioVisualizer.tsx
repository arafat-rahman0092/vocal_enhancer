import React, { useEffect, useRef } from 'react';
import { DSPGraphNodes, VocalDSPSettings } from '../audio/dspEngine';

interface StudioVisualizerProps {
  graphNodes: DSPGraphNodes | null;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  settings: VocalDSPSettings;
  onSeek: (timeSec: number) => void;
  gainReductionDb: number;
}

export const StudioVisualizer: React.FC<StudioVisualizerProps> = ({
  graphNodes,
  audioBuffer,
  currentTime,
  duration,
  isPlaying,
  settings,
  onSeek,
  gainReductionDb,
}) => {
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const peaksRef = useRef<Float32Array | null>(null);

  // Precompute waveform peaks whenever audioBuffer changes
  useEffect(() => {
    if (!audioBuffer) {
      peaksRef.current = null;
      return;
    }
    const ch0 = audioBuffer.getChannelData(0);
    const numBuckets = 320;
    const bucketSize = Math.max(1, Math.floor(ch0.length / numBuckets));
    const peaks = new Float32Array(numBuckets);

    for (let b = 0; b < numBuckets; b++) {
      let max = 0;
      const start = b * bucketSize;
      const end = Math.min(ch0.length, start + bucketSize);
      for (let i = start; i < end; i += 2) {
        const abs = Math.abs(ch0[i]);
        if (abs > max) max = abs;
      }
      peaks[b] = max;
    }
    peaksRef.current = peaks;
  }, [audioBuffer]);

  // Draw Spectrum Analyzer + Composite EQ Transfer Curve at 60fps
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const numCurvePoints = 240;
    const freqs = new Float32Array(numCurvePoints);
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    for (let i = 0; i < numCurvePoints; i++) {
      const t = i / (numCurvePoints - 1);
      freqs[i] = Math.pow(10, minLog + t * (maxLog - minLog));
    }

    const inData = new Uint8Array(1024);
    const outData = new Uint8Array(1024);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;

      // Clear background
      ctx.fillStyle = '#0D131F';
      ctx.fillRect(0, 0, w, h);

      // Subtle logarithmic frequency grid
      const gridFreqs = [50, 100, 200, 360, 1000, 3400, 6800, 10000];
      ctx.lineWidth = 1;
      ctx.font = '500 10px "JetBrains Mono", monospace';

      for (const gf of gridFreqs) {
        const x = ((Math.log10(gf) - minLog) / (maxLog - minLog)) * w;
        ctx.strokeStyle = gf === 155 || gf === 3400 || gf === 50 ? 'rgba(245, 158, 11, 0.14)' : 'rgba(148, 163, 184, 0.08)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.48)';
        const label = gf >= 1000 ? `${(gf / 1000).toFixed(gf % 1000 === 0 ? 0 : 1)}k` : `${gf}Hz`;
        ctx.fillText(label, x + 4, h - 8);
      }

      // Horizontal dB lines (+12dB, +6dB, 0dB, -6dB, -12dB)
      const dbMarkers = [12, 6, 0, -6, -12];
      for (const db of dbMarkers) {
        const y = h / 2 - (db / 18) * (h / 2);
        ctx.strokeStyle = db === 0 ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.07)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.42)';
        ctx.fillText(`${db > 0 ? `+${db}` : db} dB`, 8, y - 4);
      }

      // Live FFT Spectrums if playing
      if (graphNodes) {
        graphNodes.analyserInput.getByteFrequencyData(inData);
        graphNodes.analyserOutput.getByteFrequencyData(outData);
        const sampleRate = graphNodes.analyserOutput.context.sampleRate;
        const binCount = inData.length;

        // 1. Raw Input Spectrum (slate outline)
        ctx.beginPath();
        for (let i = 0; i < numCurvePoints; i++) {
          const f = freqs[i];
          const bin = Math.min(binCount - 1, Math.max(1, Math.round((f / (sampleRate / 2)) * binCount)));
          const norm = inData[bin] / 255;
          const x = (i / (numCurvePoints - 1)) * w;
          const y = h - norm * (h * 0.82);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1.25;
        ctx.stroke();

        // 2. Enhanced Output Spectrum (warm amber fill + line)
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i < numCurvePoints; i++) {
          const f = freqs[i];
          const bin = Math.min(binCount - 1, Math.max(1, Math.round((f / (sampleRate / 2)) * binCount)));
          const norm = outData[bin] / 255;
          const x = (i / (numCurvePoints - 1)) * w;
          const y = h - norm * (h * 0.85);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, settings.bypass ? 'rgba(148, 163, 184, 0.18)' : 'rgba(245, 158, 11, 0.28)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0.01)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw Composite EQ + Noise Filter Curve Overlay
        const eqDb = graphNodes.getCompositeEqResponse(freqs);
        ctx.beginPath();
        for (let i = 0; i < numCurvePoints; i++) {
          const x = (i / (numCurvePoints - 1)) * w;
          const db = settings.bypass ? 0 : Math.max(-18, Math.min(18, eqDb[i]));
          const y = h / 2 - (db / 18) * (h / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = settings.bypass ? 'rgba(148, 163, 184, 0.5)' : '#F59E0B';
        ctx.lineWidth = 2.25;
        ctx.stroke();

        // Draw Node Markers for Warmth (155Hz), Mud Cut (360Hz), S/T Presence (3.4kHz), De-Esser (6.8kHz), Air (9.8kHz)
        if (!settings.bypass) {
          const nodes = [
            { f: 155, db: settings.warmthGainDb, label: 'Warmth' },
            { f: 360, db: settings.mudCutGainDb, label: 'De-Mud' },
            { f: 3400, db: settings.presenceGainDb, label: 'S/T Clarity' },
            { f: 6800, db: -settings.deEsserAmountDb, label: 'De-Ess' },
            { f: 9800, db: settings.airGainDb, label: 'Air' },
          ];

          for (const nd of nodes) {
            const nx = ((Math.log10(nd.f) - minLog) / (maxLog - minLog)) * w;
            const ny = h / 2 - (Math.max(-16, Math.min(16, nd.db)) / 18) * (h / 2);

            ctx.fillStyle = '#0D131F';
            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(nx, ny, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#FDE68A';
            ctx.fillText(nd.label, nx - 18, ny - 9);
          }
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [graphNodes, settings, isPlaying]);

  // Draw Waveform Scrubber
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#0D131F';
    ctx.fillRect(0, 0, w, h);

    const peaks = peaksRef.current;
    if (peaks && peaks.length > 0) {
      const progress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
      const barWidth = w / peaks.length;
      const gainScale = settings.bypass ? 1.0 : Math.min(1.45, Math.pow(10, settings.outputGainDb / 35));

      for (let i = 0; i < peaks.length; i++) {
        const normX = i / peaks.length;
        const amp = Math.min(0.95, peaks[i] * gainScale);
        const barH = Math.max(3, amp * (h * 0.82));
        const x = i * barWidth;
        const y = (h - barH) / 2;

        if (normX <= progress) {
          ctx.fillStyle = settings.bypass ? '#94A3B8' : '#F59E0B';
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.24)';
        }
        ctx.fillRect(x + 0.5, y, Math.max(1.2, barWidth - 1.2), barH);
      }

      // Playhead line
      const playheadX = progress * w;
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
    }

    ctx.restore();
  }, [audioBuffer, currentTime, duration, settings.bypass, settings.outputGainDb]);

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(clickRatio * duration);
  };

  return (
    <div className="space-y-4">
      {/* Real-Time Spectrum & EQ Curve Canvas */}
      <div className="border border-slate-800 rounded-lg bg-[#0D131F] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Real-Time Spectral Response & EQ Curve</span>
            <span aria-hidden="true">·</span>
            <span>20 Hz – 20 kHz Logarithmic</span>
            <span aria-hidden="true">·</span>
            <span>{settings.bypass ? 'Bypassed (Raw Signal)' : 'Active Vocal DSP + Noise Filter'}</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-400">
            <span>
              Hum Notch: {settings.humFilterEnabled ? `${settings.humFreqHz} Hz / ${settings.humFreqHz * 2} Hz` : 'Off'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Comp Gain Reduction: <strong className="text-amber-400">{gainReductionDb.toFixed(1)} dB</strong>
            </span>
          </div>
        </div>
        <canvas
          ref={spectrumCanvasRef}
          className="w-full h-52 rounded block"
          aria-label="Real-time frequency spectrum and vocal EQ response curve"
        />
      </div>

      {/* Interactive Waveform Scrubber */}
      <div className="border border-slate-800 rounded-lg bg-[#0D131F] p-4">
        <div className="flex items-center justify-between gap-4 mb-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Waveform Timeline (Click Anywhere to Audition)</span>
          <span className="font-mono tabular-nums text-slate-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <canvas
          ref={waveformCanvasRef}
          onClick={handleWaveformClick}
          className="w-full h-20 rounded block cursor-pointer"
          aria-label="Audio waveform scrubber timeline"
        />
      </div>
    </div>
  );
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00.0';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  const tenths = Math.floor((sec % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}
