import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileAudio,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Square,
  Upload,
  Volume2,
  Wand2,
} from 'lucide-react';
import {
  AudioDiagnostics,
  DSPGraphNodes,
  STUDIO_PRESETS,
  VocalDSPSettings,
  analyzeAndRecommendSettings,
  applyStudioNoiseReductionBuffer,
  buildVocalDSPGraph,
  createDemoVoiceBuffer,
  encodeAudioBufferToWav,
  renderEnhancedAudio,
} from './audio/dspEngine';
import { StudioVisualizer } from './components/StudioVisualizer';

interface NarrationCue {
  timeSec: number;
  timecode: string;
  excerpt: string;
  acousticFocus: string;
}

const BENGALI_NARRATION_CUES: NarrationCue[] = [
  {
    timeSec: 0,
    timecode: '00:00',
    excerpt: 'একটা ছোট্ট চুম্বক যদি বিদ্যুৎ উৎপাদন করতে পারে, তাহলে একটা বিশাল যন্ত্র ঠিক কতটা বিদ্যুৎ উৎপাদন করতে পারবে?',
    acousticFocus: 'Opening warmth (155 Hz) & room rumble cleanup (88 Hz HPF)',
  },
  {
    timeSec: 14,
    timecode: '00:14',
    excerpt: 'ফ্যারাডের আবিষ্কারের রহস্য ছিল বিদ্যুৎ ঘূর্ণন। কিন্তু বড় আকারের বিদ্যুৎ তৈরি করতে হলে এই ঘূর্ণন তো ক্ষণস্থায়ী নয়...',
    acousticFocus: ' Ambient room pause noise reduction (-14 dB lookahead gate)',
  },
  {
    timeSec: 26,
    timecode: '00:26',
    excerpt: 'একে ঘুরতে হবে বারবার, একটানা। এই ধারণা থেকেই চুম্বকটাকে যুক্ত করা হলো একটা শক্ত দণ্ডের সাথে।',
    acousticFocus: 'Optical dynamic leveling (3.2:1) on emphatic transient peak',
  },
  {
    timeSec: 56,
    timecode: '00:56',
    excerpt: 'তাহলে কোথায় পাওয়া যাবে সেই শক্তি? উত্তরটা ছিল প্রকৃতির মধ্যেই। মানুষকে নতুন করে শক্তি তৈরি করতে হয়নি।',
    acousticFocus: 'Consonant clarity boost (+4.2 dB @ 3.4 kHz for S/T articulation)',
  },
  {
    timeSec: 95,
    timecode: '01:35',
    excerpt: 'আর এই সম্পূর্ণ যন্ত্রটিকে নাম দেওয়া হলো টারবাইন। কিন্তু বাতাস তো সব সময় প্রবহমান থাকে না।',
    acousticFocus: 'De-Mud filter (-4.2 dB @ 360 Hz) removing boxy room reflection',
  },
  {
    timeSec: 146,
    timecode: '02:26',
    excerpt: 'পানিকে উত্তপ্ত করে তৈরি করা হলো প্রচণ্ড চাপের বাষ্প। সেই বাষ্পের শক্তিতে ঘুরতে শুরু করল টারবাইন।',
    acousticFocus: 'Sibilance control (-4.2 dB @ 6.8 kHz) keeping boosted clarity natural',
  },
];

export default function App() {
  const [activePresetId, setActivePresetId] = useState<string>('documentary-clarity-nr');
  const [settings, setSettings] = useState<VocalDSPSettings>({
    bypass: false,
    ...STUDIO_PRESETS[0].settings,
  });

  const [sourceName, setSourceName] = useState<string>('Built-in Vocal Calibration Signal (Drop Your Audio File Below)');
  const [rawBuffer, setRawBuffer] = useState<AudioBuffer | null>(null);
  const [diagnostics, setDiagnostics] = useState<AudioDiagnostics | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [gainReductionDb, setGainReductionDb] = useState<number>(0);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSec, setRecordingSec] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Documentary Clarity & Noise Reduction chain active: +4.2 dB @ 3.4 kHz (S/T intelligibility), +3.2 dB @ 155 Hz (natural warmth), 50 Hz hum notch & 14 dB lookahead noise reduction.'
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const graphNodesRef = useRef<DSPGraphNodes | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startOffsetRef = useRef<number>(0);
  const startContextTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ensureAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const graph = buildVocalDSPGraph(ctx);
      graph.outputNode.connect(ctx.destination);
      graph.applySettings(settings);
      audioCtxRef.current = ctx;
      graphNodesRef.current = graph;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Initialize built-in calibration buffer on first mount
  useEffect(() => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const tempCtx = new AudioCtx();
    const demoBuf = createDemoVoiceBuffer(tempCtx);
    setRawBuffer(demoBuf);
    setDuration(demoBuf.duration);
    const { diagnostics: diag } = analyzeAndRecommendSettings(demoBuf);
    setDiagnostics(diag);
    tempCtx.close();
  }, []);

  // Sync DSP parameters in real time whenever settings change
  useEffect(() => {
    if (graphNodesRef.current) {
      graphNodesRef.current.applySettings(settings);
    }
  }, [settings]);

  // Playback progress & compressor gain reduction meter loop
  useEffect(() => {
    if (!isPlaying) {
      setGainReductionDb(0);
      return;
    }
    let rafId = 0;
    const tick = () => {
      const ctx = audioCtxRef.current;
      const graph = graphNodesRef.current;
      if (ctx && graph) {
        const elapsed = startOffsetRef.current + (ctx.currentTime - startContextTimeRef.current);
        if (elapsed >= duration) {
          stopPlayback(0);
          return;
        }
        setCurrentTime(elapsed);
        setGainReductionDb(settings.bypass ? 0 : graph.compressor.reduction);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, duration, settings.bypass]);

  const stopPlayback = (resetTime?: number) => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore already stopped source
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    if (typeof resetTime === 'number') {
      startOffsetRef.current = resetTime;
      setCurrentTime(resetTime);
    } else if (audioCtxRef.current) {
      const elapsed = Math.min(
        duration,
        startOffsetRef.current + (audioCtxRef.current.currentTime - startContextTimeRef.current)
      );
      startOffsetRef.current = elapsed;
      setCurrentTime(elapsed);
    }
  };

  const startPlayback = (offsetSec?: number) => {
    if (!rawBuffer) return;
    const ctx = ensureAudioContext();
    const graph = graphNodesRef.current;
    if (!graph) return;

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore
      }
    }

    const playFrom = typeof offsetSec === 'number' ? offsetSec : currentTime >= duration - 0.05 ? 0 : currentTime;

    // Apply time-domain lookahead noise gate when not bypassed
    const playbackBuffer = settings.bypass
      ? rawBuffer
      : applyStudioNoiseReductionBuffer(rawBuffer, ctx, settings.noiseGateDb, settings.gateThresholdDb);

    const src = ctx.createBufferSource();
    src.buffer = playbackBuffer;
    src.connect(graph.inputNode);
    graph.applySettings(settings);

    startOffsetRef.current = playFrom;
    startContextTimeRef.current = ctx.currentTime;
    src.start(0, playFrom);

    sourceNodeRef.current = src;
    setCurrentTime(playFrom);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const handleSeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(duration, targetSec));
    if (isPlaying) {
      startPlayback(clamped);
    } else {
      startOffsetRef.current = clamped;
      setCurrentTime(clamped);
    }
  };

  const loadAudioFile = async (file: File) => {
    stopPlayback(0);
    setStatusMessage(`Decoding "${file.name}" and running spectral noise & clarity diagnostics...`);
    try {
      const ctx = ensureAudioContext();
      const arrayBuf = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      setRawBuffer(decoded);
      setDuration(decoded.duration);
      setSourceName(file.name);

      const { diagnostics: diag } = analyzeAndRecommendSettings(decoded);
      setDiagnostics(diag);
      setStatusMessage(
        `Loaded "${file.name}" (${decoded.duration.toFixed(1)}s, ${decoded.sampleRate} Hz). Press Play to audition Enhanced vs Raw Original.`
      );
    } catch {
      setStatusMessage('Could not decode that audio file. Please upload a valid WAV, MP3, M4A, OGG, or WebM recording.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };

  const handleStartRecording = async () => {
    stopPlayback(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const ctx = ensureAudioContext();
        const arrayBuf = await blob.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuf);
        setRawBuffer(decoded);
        setDuration(decoded.duration);
        setSourceName(`Microphone Take (${decoded.duration.toFixed(1)}s)`);
        const { diagnostics: diag } = analyzeAndRecommendSettings(decoded);
        setDiagnostics(diag);
        setStatusMessage('Microphone recording captured. Press Play to hear your enhanced voice.');
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSec(0);
      setStatusMessage('Recording live from microphone... Speak naturally.');
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSec((prev) => prev + 1);
      }, 1000);
    } catch {
      setStatusMessage('Microphone access was blocked or unavailable. Please check browser permissions or upload your audio file.');
    }
  };

  const handleStopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSelectPreset = (presetId: string) => {
    const found = STUDIO_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setSettings((prev) => ({
      ...found.settings,
      bypass: prev.bypass,
    }));
    setStatusMessage(`Applied "${found.name}" profile: ${found.subtitle}.`);
  };

  const handleAutoCalibrate = () => {
    if (!rawBuffer) return;
    const { diagnostics: diag, recommendedSettings } = analyzeAndRecommendSettings(rawBuffer);
    setDiagnostics(diag);
    setActivePresetId('custom');
    setSettings(recommendedSettings);
    setStatusMessage(
      'Auto-Calibrated DSP to your voice: optimized noise gate threshold, 50Hz hum removal, +155Hz warmth, and +3.4kHz S/T consonant clarity.'
    );
  };

  const handleExportWav = async () => {
    if (!rawBuffer || isExporting) return;
    setIsExporting(true);
    setStatusMessage('Rendering enhanced 16-bit lossless WAV master through offline DSP chain...');
    try {
      const { wavBlob } = await renderEnhancedAudio(rawBuffer, { ...settings, bypass: false });
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      const cleanName = sourceName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'voice_recording';
      a.href = url;
      a.download = `${cleanName}_enhanced_master.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage(`Exported "${cleanName}_enhanced_master.wav" with full noise reduction and vocal clarity enhancement.`);
    } catch {
      setStatusMessage('Error exporting enhanced WAV file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRawWav = () => {
    if (!rawBuffer) return;
    const wavBlob = encodeAudioBufferToWav(rawBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'original_unprocessed_voice.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateSetting = <K extends keyof VocalDSPSettings>(key: K, value: VocalDSPSettings[K]) => {
    setActivePresetId('custom');
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // If noise gate settings change while playing, re-trigger buffer seamlessly
    if ((key === 'noiseGateDb' || key === 'gateThresholdDb') && isPlaying) {
      // Applied on next play/seek or offline export
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#0B0F17]/95 sticky top-0 z-30">
        <a href="#top" className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
          VoxCraft Studio
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#source-deck" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Audio Source
          </a>
          <a href="#noise-reduction" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Noise Reduction
          </a>
          <a href="#clarity-eq" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Clarity & Warmth EQ
          </a>
          <a href="#narration-cues" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
            Diagnostics & Cues
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportWav}
            disabled={!rawBuffer || isExporting}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Rendering Master...' : 'Export Enhanced WAV'}</span>
          </button>
        </div>
      </header>

      {/* Main 1440px Studio Workspace */}
      <main id="top" className="max-w-[1380px] w-full mx-auto px-6 py-8 space-y-8 flex-1">
        {/* Top Hero & Source Transport Bar */}
        <section id="source-deck" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Cols: Title, Upload Dropzone & Transport */}
          <div className="lg:col-span-7 border border-slate-800 rounded-xl bg-[#111827] p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                <span>Broadcast Vocal DSP Engine</span>
                <span aria-hidden="true">·</span>
                <span>32-Bit Floating Point Web Audio</span>
                <span aria-hidden="true">·</span>
                <span>Lossless WAV Mastering</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100" style={{ textWrap: 'balance' }}>
                Enhance Vocal Clarity, Natural Warmth & Eliminate Background Noise
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                Drop your voiceover recording below or record live from your microphone. The DSP chain removes 50/60 Hz hum,
                ambient room hiss, and hollow boxiness while boosting <span className="text-slate-200 font-medium">3.4 kHz S/T consonant intelligibility</span> and <span className="text-slate-200 font-medium">155 Hz chest warmth</span> without sounding artificial.
              </p>
            </div>

            {/* File Upload Dropzone + Live Microphone Recording */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border border-dashed border-slate-700 hover:border-amber-500/70 rounded-lg bg-[#0B0F17] p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileAudio className="w-8 h-8 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate" title={sourceName}>
                    {sourceName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                    <span>{duration.toFixed(1)}s duration</span>
                    <span aria-hidden="true">·</span>
                    <span>{rawBuffer ? `${rawBuffer.sampleRate} Hz` : '48000 Hz'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Drop WAV / MP3 / M4A / OGG here</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm,.aac"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load Your Voice File</span>
                </button>

                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-rose-400" />
                    <span>Record Mic</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span className="font-mono tabular-nums">Stop ({recordingSec}s)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Primary Playback & A/B Bypass Compare Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'Pause Playback' : 'Play & Audition'}</span>
                </button>

                <button
                  onClick={() => handleSeek(0)}
                  className="px-3 py-2.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  title="Restart from 00:00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>

                <button
                  onClick={handleAutoCalibrate}
                  className="px-3.5 py-2.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Auto-Calibrate to Voice</span>
                </button>
              </div>

              {/* Segmented A/B Compare Control */}
              <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <button
                  onClick={() => setSettings((s) => ({ ...s, bypass: false }))}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    !settings.bypass
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Enhanced Voice (ON)
                </button>
                <button
                  onClick={() => setSettings((s) => ({ ...s, bypass: true }))}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    settings.bypass
                      ? 'bg-slate-700 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Original (Bypass)
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Studio Presets & Quick Summary */}
          <div className="lg:col-span-5 border border-slate-800 rounded-xl bg-[#111827] p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-base font-semibold text-slate-100">Studio Enhancement Profiles</h2>
                <span className="text-xs text-slate-400">1-Click Vocal Chain</span>
              </div>

              <div className="space-y-2">
                {STUDIO_PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-500/50 text-slate-100'
                          : 'bg-[#0B0F17]/70 border-slate-800/90 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100">{preset.name}</span>
                        <span className="text-[11px] font-mono tabular-nums text-amber-400">
                          {isActive ? 'Active' : 'Select'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{preset.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Status:</strong> {statusMessage}
            </div>
          </div>
        </section>

        {/* Real-Time Spectrum Analyzer & Waveform Scrubber */}
        <section aria-label="Real-Time Audio Visualizer">
          <StudioVisualizer
            graphNodes={graphNodesRef.current}
            audioBuffer={rawBuffer}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            settings={settings}
            onSeek={handleSeek}
            gainReductionDb={gainReductionDb}
          />
        </section>

        {/* Three-Stage Hardware Rack: 1. Noise Reduction, 2. Clarity & Warmth EQ, 3. Dynamics & Output */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Rack Module 1: Multi-Stage Noise & Hum Reduction Filter */}
          <div id="noise-reduction" className="border border-slate-800 rounded-xl bg-[#111827] p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-xs text-amber-400 font-medium">01. Spectral Cleanup Stage</div>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">Noise, Hum & Rumble Reduction</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Eliminates background hiss, ambient room noise between phrases, and 50/60 Hz electrical hum without degrading speech.
                </p>
              </div>

              {/* Lookahead Noise Gate / Downward Expander Suppression */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="noiseGateDb" className="font-medium text-slate-200">
                    Ambient Noise Floor Reduction
                  </label>
                  <span className="font-mono tabular-nums text-amber-400">-{settings.noiseGateDb.toFixed(1)} dB</span>
                </div>
                <input
                  id="noiseGateDb"
                  type="range"
                  min={0}
                  max={24}
                  step={0.5}
                  value={settings.noiseGateDb}
                  onChange={(e) => updateSetting('noiseGateDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
                <p className="text-[11px] text-slate-400">
                  6ms lookahead downward expander suppresses room noise during pauses while protecting soft word starts.
                </p>
              </div>

              {/* Noise Gate Detection Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="gateThresholdDb" className="font-medium text-slate-200">
                    Noise Floor Sensitivity Threshold
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">{settings.gateThresholdDb} dBFS</span>
                </div>
                <input
                  id="gateThresholdDb"
                  type="range"
                  min={-62}
                  max={-28}
                  step={1}
                  value={settings.gateThresholdDb}
                  onChange={(e) => updateSetting('gateThresholdDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* High-Frequency Hiss Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="hissReductionDb" className="font-medium text-slate-200">
                    High-Frequency Hiss Suppression (&gt;7.6 kHz)
                  </label>
                  <span className="font-mono tabular-nums text-amber-400">-{settings.hissReductionDb.toFixed(1)} dB</span>
                </div>
                <input
                  id="hissReductionDb"
                  type="range"
                  min={0}
                  max={12}
                  step={0.5}
                  value={settings.hissReductionDb}
                  onChange={(e) => updateSetting('hissReductionDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* Sub-Vocal High-Pass Rumble Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="highPassFreq" className="font-medium text-slate-200">
                    24 dB/Oct Low-Rumble High-Pass Cut
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">{settings.highPassFreq} Hz</span>
                </div>
                <input
                  id="highPassFreq"
                  type="range"
                  min={20}
                  max={180}
                  step={1}
                  value={settings.highPassFreq}
                  onChange={(e) => updateSetting('highPassFreq', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>
            </div>

            {/* 50Hz / 60Hz Electrical Hum Notch Filter Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-200">Mains Power Hum Notch Filter</div>
                <div className="text-[11px] text-slate-400">Cuts fundamental + 2nd harmonic hum</div>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-lg">
                <button
                  onClick={() => {
                    updateSetting('humFilterEnabled', true);
                    updateSetting('humFreqHz', 50);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    settings.humFilterEnabled && settings.humFreqHz === 50
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  50 Hz
                </button>
                <button
                  onClick={() => {
                    updateSetting('humFilterEnabled', true);
                    updateSetting('humFreqHz', 60);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    settings.humFilterEnabled && settings.humFreqHz === 60
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  60 Hz
                </button>
                <button
                  onClick={() => updateSetting('humFilterEnabled', false)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    !settings.humFilterEnabled
                      ? 'bg-slate-700 text-slate-100 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Off
                </button>
              </div>
            </div>
          </div>

          {/* Rack Module 2: Vocal Clarity, Presence ('S' & 'T') & Natural Warmth EQ */}
          <div id="clarity-eq" className="border border-slate-800 rounded-xl bg-[#111827] p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-xs text-amber-400 font-medium">02. Tonal Sculpting Stage</div>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">Clarity, S/T Presence & Warmth EQ</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Subtly boosts consonant intelligibility (3.4 kHz) and chest richness (155 Hz) while controlling sibilance so the voice stays natural.
                </p>
              </div>

              {/* S & T Consonant Intelligibility & Presence (3.4 kHz) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="presenceGainDb" className="font-medium text-slate-200">
                    Vocal Clarity &apos;S&apos; / &apos;T&apos; Intelligibility (3.4 kHz)
                  </label>
                  <span className="font-mono tabular-nums text-amber-400">
                    {settings.presenceGainDb >= 0 ? `+${settings.presenceGainDb.toFixed(1)}` : settings.presenceGainDb.toFixed(1)} dB
                  </span>
                </div>
                <input
                  id="presenceGainDb"
                  type="range"
                  min={-6}
                  max={10}
                  step={0.2}
                  value={settings.presenceGainDb}
                  onChange={(e) => updateSetting('presenceGainDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
                <p className="text-[11px] text-slate-400">
                  Brings dental and fricative consonants (&apos;s&apos;, &apos;t&apos;, articulation) forward in the mix.
                </p>
              </div>

              {/* Natural Chest Warmth & Richness (155 Hz) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="warmthGainDb" className="font-medium text-slate-200">
                    Natural Vocal Warmth & Richness (155 Hz)
                  </label>
                  <span className="font-mono tabular-nums text-amber-400">
                    {settings.warmthGainDb >= 0 ? `+${settings.warmthGainDb.toFixed(1)}` : settings.warmthGainDb.toFixed(1)} dB
                  </span>
                </div>
                <input
                  id="warmthGainDb"
                  type="range"
                  min={-8}
                  max={10}
                  step={0.2}
                  value={settings.warmthGainDb}
                  onChange={(e) => updateSetting('warmthGainDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* Room Mud / Boxiness Cut (360 Hz) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="mudCutGainDb" className="font-medium text-slate-200">
                    Hollow Room Mud & Boxiness Cut (360 Hz)
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">
                    {settings.mudCutGainDb >= 0 ? `+${settings.mudCutGainDb.toFixed(1)}` : settings.mudCutGainDb.toFixed(1)} dB
                  </span>
                </div>
                <input
                  id="mudCutGainDb"
                  type="range"
                  min={-12}
                  max={4}
                  step={0.2}
                  value={settings.mudCutGainDb}
                  onChange={(e) => updateSetting('mudCutGainDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* Precision De-Esser (6.8 kHz) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="deEsserAmountDb" className="font-medium text-slate-200">
                    Sibilance Smoothing De-Esser (6.8 kHz)
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">-{settings.deEsserAmountDb.toFixed(1)} dB</span>
                </div>
                <input
                  id="deEsserAmountDb"
                  type="range"
                  min={0}
                  max={10}
                  step={0.2}
                  value={settings.deEsserAmountDb}
                  onChange={(e) => updateSetting('deEsserAmountDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* Studio Air & Shimmer (9.8 kHz) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="airGainDb" className="font-medium text-slate-200">
                    Condenser Air & Breath (9.8 kHz Shelf)
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">
                    {settings.airGainDb >= 0 ? `+${settings.airGainDb.toFixed(1)}` : settings.airGainDb.toFixed(1)} dB
                  </span>
                </div>
                <input
                  id="airGainDb"
                  type="range"
                  min={-6}
                  max={10}
                  step={0.2}
                  value={settings.airGainDb}
                  onChange={(e) => updateSetting('airGainDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Q-Factor Calibration: Musical Proportional Q</span>
              <button
                onClick={() => {
                  updateSetting('warmthGainDb', 3.2);
                  updateSetting('mudCutGainDb', -4.2);
                  updateSetting('presenceGainDb', 4.2);
                  updateSetting('deEsserAmountDb', 4.2);
                  updateSetting('airGainDb', 2.8);
                }}
                className="text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset EQ to Ideal Vocal
              </button>
            </div>
          </div>

          {/* Rack Module 3: Optical Compressor, Harmonic Warmth & Master Output */}
          <div className="border border-slate-800 rounded-xl bg-[#111827] p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-xs text-amber-400 font-medium">03. Dynamics & Mastering Stage</div>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">Optical Leveler & Harmonic Richness</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Evens out volume differences between soft and loud phrases and adds subtle tube harmonic richness.
                </p>
              </div>

              {/* Compressor Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="compThresholdDb" className="font-medium text-slate-200">
                    Optical Compressor Threshold
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">{settings.compThresholdDb} dB</span>
                </div>
                <input
                  id="compThresholdDb"
                  type="range"
                  min={-44}
                  max={-6}
                  step={1}
                  value={settings.compThresholdDb}
                  onChange={(e) => updateSetting('compThresholdDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* Compressor Ratio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="compRatio" className="font-medium text-slate-200">
                    Compression Ratio (Soft-Knee)
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">{settings.compRatio.toFixed(1)} : 1</span>
                </div>
                <input
                  id="compRatio"
                  type="range"
                  min={1.2}
                  max={8.0}
                  step={0.2}
                  value={settings.compRatio}
                  onChange={(e) => updateSetting('compRatio', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* Analog Harmonic Warmth Exciter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="exciterDrive" className="font-medium text-slate-200">
                    Even-Order Harmonic Richness
                  </label>
                  <span className="font-mono tabular-nums text-amber-400">{settings.exciterDrive}%</span>
                </div>
                <input
                  id="exciterDrive"
                  type="range"
                  min={0}
                  max={65}
                  step={1}
                  value={settings.exciterDrive}
                  onChange={(e) => updateSetting('exciterDrive', parseFloat(e.target.value))}
                  className="studio-slider"
                />
                <p className="text-[11px] text-slate-400">
                  Subtle 2nd-harmonic tube saturation adds vocal density without distortion.
                </p>
              </div>

              {/* Studio Acoustic Booth Space */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="studioAmbienceMix" className="font-medium text-slate-200">
                    Acoustic Booth Early Reflections
                  </label>
                  <span className="font-mono tabular-nums text-slate-300">{settings.studioAmbienceMix}%</span>
                </div>
                <input
                  id="studioAmbienceMix"
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={settings.studioAmbienceMix}
                  onChange={(e) => updateSetting('studioAmbienceMix', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {/* Master Makeup Gain */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="outputGainDb" className="font-medium text-slate-200">
                    Master Output Gain (into -1.0 dB Limiter)
                  </label>
                  <span className="font-mono tabular-nums text-amber-400">
                    {settings.outputGainDb >= 0 ? `+${settings.outputGainDb.toFixed(1)}` : settings.outputGainDb.toFixed(1)} dB
                  </span>
                </div>
                <input
                  id="outputGainDb"
                  type="range"
                  min={-6}
                  max={10}
                  step={0.5}
                  value={settings.outputGainDb}
                  onChange={(e) => updateSetting('outputGainDb', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={handleExportRawWav}
                className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Download Raw WAV
              </button>
              <button
                onClick={handleExportWav}
                disabled={!rawBuffer || isExporting}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Rendering...' : 'Download Enhanced WAV'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Section: Acoustic Signal Diagnostics + Documentary Voiceover Cue Sheet */}
        <section id="narration-cues" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 5 Cols: Real Signal Diagnostics */}
          <div className="lg:col-span-5 border border-slate-800 rounded-xl bg-[#111827] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100">Acoustic Signal Diagnostics</h2>
                <p className="text-xs text-slate-400">Measured directly from active input audio buffer</p>
              </div>
              <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            {diagnostics && (
              <>
                <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs text-slate-400">Input Peak Level</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-100 mt-0.5">
                      {diagnostics.peakDb.toFixed(1)} dBFS
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Average RMS Loudness</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-100 mt-0.5">
                      {diagnostics.rmsDb.toFixed(1)} dBFS
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Ambient Noise Floor</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                      {diagnostics.noiseFloorDb.toFixed(1)} dBFS
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Dynamic Crest Factor</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-100 mt-0.5">
                      {diagnostics.crestFactorDb.toFixed(1)} dB
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-200">Active DSP Calibration Actions</div>
                  <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    {diagnostics.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono text-amber-400 shrink-0">0{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Right 7 Cols: Uploaded Documentary Narration Timestamp Cues */}
          <div className="lg:col-span-7 border border-slate-800 rounded-xl bg-[#111827] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Documentary Voiceover Inspection Cues (00:00 – 02:51)
                </h2>
                <p className="text-xs text-slate-400">
                  Load your Bengali narration file above and click any row below to jump the playhead and compare Raw vs Enhanced
                </p>
              </div>
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-2 pr-3 font-medium">Time</th>
                    <th className="py-2 px-3 font-medium">Narration Phrase</th>
                    <th className="py-2 pl-3 font-medium text-right">DSP Focus Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {BENGALI_NARRATION_CUES.map((cue) => (
                    <tr
                      key={cue.timecode}
                      onClick={() => handleSeek(cue.timeSec)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 pr-3 font-mono tabular-nums text-amber-400 whitespace-nowrap group-hover:underline">
                        {cue.timecode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 leading-relaxed">{cue.excerpt}</td>
                      <td className="py-2.5 pl-3 text-slate-400 text-right whitespace-nowrap">{cue.acousticFocus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
