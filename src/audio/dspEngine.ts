export interface VocalDSPSettings {
  bypass: boolean;
  // Stage 1: Noise Reduction & Hum Filter
  noiseGateDb: number;         // 0 - 24 dB ambient noise floor suppression
  gateThresholdDb: number;     // -65 to -28 dBFS threshold for noise gate
  humFilterEnabled: boolean;   // Eliminates 50Hz/60Hz electrical hum + 2nd harmonic
  humFreqHz: 50 | 60;          // 50Hz (South Asia/Europe) or 60Hz (Americas)
  hissReductionDb: number;     // 0 - 12 dB high-frequency hiss reduction above 7.5kHz
  highPassFreq: number;        // 20 - 220 Hz low rumble cut

  // Stage 2: Vocal Warmth, Clarity & Intelligibility EQ
  warmthGainDb: number;        // -12 to +12 dB @ 155 Hz (Natural vocal richness)
  mudCutGainDb: number;        // -12 to +6 dB @ 360 Hz (Room boxiness removal)
  presenceGainDb: number;      // -6 to +12 dB @ 3400 Hz ('S' & 'T' intelligibility & presence)
  airGainDb: number;           // -6 to +12 dB @ 9800 Hz (Natural breath & silkiness)
  deEsserAmountDb: number;     // 0 to 12 dB @ 6800 Hz (Prevents artificial harshness)

  // Stage 3: Dynamics, Harmonic Richness & Output
  compThresholdDb: number;     // -48 to 0 dB
  compRatio: number;           // 1 to 12
  compAttackMs: number;        // 1 to 80 ms
  compReleaseMs: number;       // 40 to 500 ms
  exciterDrive: number;        // 0 to 100 % (Subtle warm harmonic richness)
  studioAmbienceMix: number;   // 0 to 40 %
  outputGainDb: number;        // -12 to +12 dB
}

export interface StudioPreset {
  id: string;
  name: string;
  subtitle: string;
  targetUse: string;
  settings: Omit<VocalDSPSettings, 'bypass'>;
}

export interface AudioDiagnostics {
  durationSec: number;
  sampleRate: number;
  peakDb: number;
  rmsDb: number;
  crestFactorDb: number;
  noiseFloorDb: number;
  rumbleLevel: 'Low' | 'Moderate' | 'High';
  mudLevel: 'Clean' | 'Slightly Boxy' | 'Muddy';
  sibilanceLevel: 'Balanced' | 'Sharp';
  recommendations: string[];
}

export const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: 'documentary-clarity-nr',
    name: 'Documentary Clarity & Noise Reduction',
    subtitle: 'Natural warmth, crisp S/T consonant intelligibility, 50Hz hum & room hiss removal',
    targetUse: 'Voiceover narration, educational storytelling, and documentary tracks',
    settings: {
      noiseGateDb: 14,
      gateThresholdDb: -44,
      humFilterEnabled: true,
      humFreqHz: 50,
      hissReductionDb: 5.5,
      highPassFreq: 88,
      warmthGainDb: 3.2,
      mudCutGainDb: -4.2,
      presenceGainDb: 4.2,
      airGainDb: 2.8,
      deEsserAmountDb: 4.2,
      compThresholdDb: -23,
      compRatio: 3.2,
      compAttackMs: 10,
      compReleaseMs: 150,
      exciterDrive: 18,
      studioAmbienceMix: 0,
      outputGainDb: 3.5,
    },
  },
  {
    id: 'podcast-broadcast',
    name: 'Broadcast Podcast',
    subtitle: 'Warm chest resonance, room mud cut, forward articulation',
    targetUse: 'Podcasts, YouTube commentary, and interviews',
    settings: {
      noiseGateDb: 10,
      gateThresholdDb: -46,
      humFilterEnabled: true,
      humFreqHz: 50,
      hissReductionDb: 4.0,
      highPassFreq: 90,
      warmthGainDb: 4.0,
      mudCutGainDb: -4.5,
      presenceGainDb: 3.8,
      airGainDb: 2.5,
      deEsserAmountDb: 4.5,
      compThresholdDb: -24,
      compRatio: 4.0,
      compAttackMs: 8,
      compReleaseMs: 140,
      exciterDrive: 22,
      studioAmbienceMix: 4,
      outputGainDb: 3.5,
    },
  },
  {
    id: 'warm-condenser',
    name: 'Warm Condenser Studio',
    subtitle: 'Silky top-end air, gentle optical leveling, natural harmonic richness',
    targetUse: 'Audiobooks, intimate narration, and studio vocals',
    settings: {
      noiseGateDb: 8,
      gateThresholdDb: -48,
      humFilterEnabled: true,
      humFreqHz: 50,
      hissReductionDb: 3.0,
      highPassFreq: 75,
      warmthGainDb: 3.5,
      mudCutGainDb: -2.8,
      presenceGainDb: 3.0,
      airGainDb: 4.5,
      deEsserAmountDb: 3.8,
      compThresholdDb: -20,
      compRatio: 2.8,
      compAttackMs: 15,
      compReleaseMs: 180,
      exciterDrive: 24,
      studioAmbienceMix: 10,
      outputGainDb: 2.8,
    },
  },
  {
    id: 'noisy-room-rescue',
    name: 'Max Noise & Hum Elimination',
    subtitle: 'Deep background hiss & hum suppression, hollow-room de-box, crisp speech boost',
    targetUse: 'Untreated rooms, fan/AC background hum, and ambient noise cleanup',
    settings: {
      noiseGateDb: 18,
      gateThresholdDb: -40,
      humFilterEnabled: true,
      humFreqHz: 50,
      hissReductionDb: 8.0,
      highPassFreq: 125,
      warmthGainDb: 2.6,
      mudCutGainDb: -6.5,
      presenceGainDb: 4.6,
      airGainDb: 2.0,
      deEsserAmountDb: 5.5,
      compThresholdDb: -22,
      compRatio: 3.6,
      compAttackMs: 7,
      compReleaseMs: 135,
      exciterDrive: 14,
      studioAmbienceMix: 0,
      outputGainDb: 3.8,
    },
  },
  {
    id: 'crisp-voiceover',
    name: 'Crisp Articulation & Presence',
    subtitle: 'Enhanced S & T consonant definition with controlled dynamics',
    targetUse: 'Presentations, lectures, and high-intelligibility voice tracks',
    settings: {
      noiseGateDb: 12,
      gateThresholdDb: -45,
      humFilterEnabled: true,
      humFreqHz: 50,
      hissReductionDb: 4.5,
      highPassFreq: 105,
      warmthGainDb: 2.2,
      mudCutGainDb: -5.0,
      presenceGainDb: 5.2,
      airGainDb: 3.5,
      deEsserAmountDb: 5.0,
      compThresholdDb: -25,
      compRatio: 4.2,
      compAttackMs: 6,
      compReleaseMs: 125,
      exciterDrive: 16,
      studioAmbienceMix: 0,
      outputGainDb: 4.0,
    },
  },
];

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export function linearToDb(linear: number): number {
  if (linear <= 0.000001) return -100;
  return 20 * Math.log10(linear);
}

/**
 * Generates an asymmetric tube-style harmonic saturation curve for natural vocal richness
 */
export function makeTubeSaturationCurve(drivePercent: number): Float32Array {
  const samples = 8192;
  const curve = new Float32Array(samples);
  const amount = Math.max(0, Math.min(100, drivePercent)) / 100;

  if (amount <= 0.001) {
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = x;
    }
    return curve;
  }

  const k = amount * 2.6;
  const norm = Math.tanh(1 + k);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // Subtle 2nd-order even harmonic warmth without harsh clipping
    const shifted = x + 0.05 * amount * (x * x - 0.25);
    curve[i] = Math.tanh(shifted * (1 + k)) / norm;
  }
  return curve;
}

/**
 * Generates a tight acoustic vocal booth early-reflections impulse response
 */
export function createStudioBoothImpulse(ctx: BaseAudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * 0.28);
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    let seed = ch === 0 ? 194827 : 847261;
    const nextRand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1073741823.5) / 1073741823.5;
    };

    const earlyTapMs = ch === 0 ? [7, 13, 19, 28, 37] : [9, 15, 22, 31, 39];
    earlyTapMs.forEach((ms, idx) => {
      const sampleIdx = Math.floor((ms / 1000) * sampleRate);
      if (sampleIdx < length) {
        data[sampleIdx] = (idx % 2 === 0 ? 0.42 : -0.36) * Math.pow(0.76, idx);
      }
    });

    let lp = 0;
    for (let i = Math.floor(0.006 * sampleRate); i < length; i++) {
      const t = i / length;
      const decay = Math.exp(-t * 10.5);
      const raw = nextRand() * decay * 0.22;
      lp = lp * 0.74 + raw * 0.26;
      data[i] += lp;
    }
  }
  return impulse;
}

export interface DSPGraphNodes {
  inputNode: GainNode;
  outputNode: GainNode;
  analyserInput: AnalyserNode;
  analyserOutput: AnalyserNode;
  compressor: DynamicsCompressorNode;
  applySettings: (settings: VocalDSPSettings) => void;
  getCompositeEqResponse: (freqs: Float32Array) => Float32Array;
}

export function buildVocalDSPGraph(ctx: BaseAudioContext): DSPGraphNodes {
  const inputNode = ctx.createGain();
  const outputNode = ctx.createGain();

  const analyserInput = ctx.createAnalyser();
  analyserInput.fftSize = 2048;
  analyserInput.smoothingTimeConstant = 0.82;

  const analyserOutput = ctx.createAnalyser();
  analyserOutput.fftSize = 2048;
  analyserOutput.smoothingTimeConstant = 0.82;

  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  // Stage 1A: Electrical Hum Notch Filters (Fundamental + 2nd Harmonic)
  const humNotch1 = ctx.createBiquadFilter();
  humNotch1.type = 'notch';
  humNotch1.frequency.value = 50;
  humNotch1.Q.value = 12.0;

  const humNotch2 = ctx.createBiquadFilter();
  humNotch2.type = 'notch';
  humNotch2.frequency.value = 100;
  humNotch2.Q.value = 10.0;

  // Stage 1B: 24dB/oct Cascaded High-Pass Rumble Filter
  const hpf1 = ctx.createBiquadFilter();
  hpf1.type = 'highpass';
  hpf1.Q.value = 0.707;

  const hpf2 = ctx.createBiquadFilter();
  hpf2.type = 'highpass';
  hpf2.Q.value = 0.707;

  // Stage 1C: High-Frequency Hiss Reduction Filter (tames ultrasonic/upper-band mic hiss)
  const hissShelf = ctx.createBiquadFilter();
  hissShelf.type = 'highshelf';
  hissShelf.frequency.value = 7600;

  const ultrasonicLowPass = ctx.createBiquadFilter();
  ultrasonicLowPass.type = 'lowpass';
  ultrasonicLowPass.frequency.value = 15800;
  ultrasonicLowPass.Q.value = 0.707;

  // Stage 2: 4-Band Vocal Warmth, Clarity & Intelligibility EQ
  // Band 1: Natural Warmth & Richness (155 Hz, broad musical Q)
  const warmthEq = ctx.createBiquadFilter();
  warmthEq.type = 'peaking';
  warmthEq.frequency.value = 155;
  warmthEq.Q.value = 0.85;

  // Band 2: Untreated Room Mud & Boxiness Cut (360 Hz)
  const mudCutEq = ctx.createBiquadFilter();
  mudCutEq.type = 'peaking';
  mudCutEq.frequency.value = 360;
  mudCutEq.Q.value = 1.8;

  // Band 3: Vocal Clarity, Presence & Consonant Intelligibility ('s' and 't' articulation @ 3.4 kHz)
  const presenceEq = ctx.createBiquadFilter();
  presenceEq.type = 'peaking';
  presenceEq.frequency.value = 3400;
  presenceEq.Q.value = 1.05;

  // Band 4: Natural Air & Breathiness (9.8 kHz)
  const airEq = ctx.createBiquadFilter();
  airEq.type = 'highshelf';
  airEq.frequency.value = 9800;

  // Stage 3: Precision Sibilance Control (6.8 kHz) so boosted 's'/'t' never sound harsh or artificial
  const deEsserFilter = ctx.createBiquadFilter();
  deEsserFilter.type = 'peaking';
  deEsserFilter.frequency.value = 6800;
  deEsserFilter.Q.value = 3.4;

  // Stage 4: Optical Vocal Compressor
  const compressor = ctx.createDynamicsCompressor();
  compressor.knee.value = 12;

  // Stage 5: Subtle Analog Harmonic Richness
  const exciterShaper = ctx.createWaveShaper();
  exciterShaper.oversample = '2x';

  // Stage 6: Optional Studio Booth Acoustic Space
  const convolver = ctx.createConvolver();
  convolver.buffer = createStudioBoothImpulse(ctx);
  const reverbWetGain = ctx.createGain();
  const reverbDryGain = ctx.createGain();
  const postSpaceSum = ctx.createGain();

  // Stage 7: Makeup Gain + Brickwall Safety Limiter
  const makeupGain = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1.0;
  limiter.knee.value = 0.0;
  limiter.ratio.value = 20.0;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.06;

  // Connect Input -> Input Analyser
  inputNode.connect(analyserInput);

  // Dry Bypass Path
  inputNode.connect(dryGain);
  dryGain.connect(outputNode);

  // Wet DSP Path
  inputNode.connect(humNotch1);
  humNotch1.connect(humNotch2);
  humNotch2.connect(hpf1);
  hpf1.connect(hpf2);
  hpf2.connect(hissShelf);
  hissShelf.connect(ultrasonicLowPass);
  ultrasonicLowPass.connect(warmthEq);
  warmthEq.connect(mudCutEq);
  mudCutEq.connect(presenceEq);
  presenceEq.connect(airEq);
  airEq.connect(deEsserFilter);
  deEsserFilter.connect(compressor);
  compressor.connect(exciterShaper);

  exciterShaper.connect(reverbDryGain);
  exciterShaper.connect(convolver);
  convolver.connect(reverbWetGain);

  reverbDryGain.connect(postSpaceSum);
  reverbWetGain.connect(postSpaceSum);

  postSpaceSum.connect(makeupGain);
  makeupGain.connect(limiter);
  limiter.connect(wetGain);
  wetGain.connect(outputNode);

  outputNode.connect(analyserOutput);

  const applySettings = (s: VocalDSPSettings) => {
    const now = ctx.currentTime;
    const ramp = 0.025;

    if (s.bypass) {
      dryGain.gain.setTargetAtTime(1.0, now, ramp);
      wetGain.gain.setTargetAtTime(0.0, now, ramp);
    } else {
      dryGain.gain.setTargetAtTime(0.0, now, ramp);
      wetGain.gain.setTargetAtTime(1.0, now, ramp);
    }

    // Hum Notch configuration (when disabled, park notch at 10Hz with high Q so it's transparent)
    const baseHum = s.humFilterEnabled ? s.humFreqHz : 12;
    humNotch1.frequency.setTargetAtTime(baseHum, now, ramp);
    humNotch1.Q.setTargetAtTime(s.humFilterEnabled ? 12.0 : 30.0, now, ramp);
    humNotch2.frequency.setTargetAtTime(baseHum * 2, now, ramp);
    humNotch2.Q.setTargetAtTime(s.humFilterEnabled ? 10.0 : 30.0, now, ramp);

    hpf1.frequency.setTargetAtTime(s.highPassFreq, now, ramp);
    hpf2.frequency.setTargetAtTime(s.highPassFreq, now, ramp);

    // High-frequency hiss filter
    hissShelf.gain.setTargetAtTime(-Math.abs(s.hissReductionDb), now, ramp);
    const lpCutoff = Math.max(11000, 16500 - s.hissReductionDb * 380);
    ultrasonicLowPass.frequency.setTargetAtTime(lpCutoff, now, ramp);

    warmthEq.gain.setTargetAtTime(s.warmthGainDb, now, ramp);
    mudCutEq.gain.setTargetAtTime(s.mudCutGainDb, now, ramp);
    presenceEq.gain.setTargetAtTime(s.presenceGainDb, now, ramp);
    airEq.gain.setTargetAtTime(s.airGainDb, now, ramp);
    deEsserFilter.gain.setTargetAtTime(-Math.abs(s.deEsserAmountDb), now, ramp);

    compressor.threshold.setTargetAtTime(s.compThresholdDb, now, ramp);
    compressor.ratio.setTargetAtTime(s.compRatio, now, ramp);
    compressor.attack.setTargetAtTime(s.compAttackMs / 1000, now, ramp);
    compressor.release.setTargetAtTime(s.compReleaseMs / 1000, now, ramp);

    exciterShaper.curve = makeTubeSaturationCurve(s.exciterDrive);

    const mix = Math.max(0, Math.min(0.4, s.studioAmbienceMix / 100));
    reverbWetGain.gain.setTargetAtTime(mix, now, ramp);
    reverbDryGain.gain.setTargetAtTime(1 - mix * 0.35, now, ramp);

    makeupGain.gain.setTargetAtTime(dbToLinear(s.outputGainDb), now, ramp);
  };

  const getCompositeEqResponse = (freqs: Float32Array): Float32Array => {
    const magTotal = new Float32Array(freqs.length);
    const magTmp = new Float32Array(freqs.length);
    const phaseTmp = new Float32Array(freqs.length);

    const filters = [
      humNotch1,
      humNotch2,
      hpf1,
      hpf2,
      hissShelf,
      ultrasonicLowPass,
      warmthEq,
      mudCutEq,
      presenceEq,
      airEq,
      deEsserFilter,
    ];
    for (let i = 0; i < freqs.length; i++) {
      magTotal[i] = 1.0;
    }

    for (const f of filters) {
      f.getFrequencyResponse(freqs, magTmp, phaseTmp);
      for (let i = 0; i < freqs.length; i++) {
        magTotal[i] *= magTmp[i];
      }
    }

    const dbResponse = new Float32Array(freqs.length);
    for (let i = 0; i < freqs.length; i++) {
      dbResponse[i] = 20 * Math.log10(Math.max(0.0001, magTotal[i]));
    }
    return dbResponse;
  };

  return {
    inputNode,
    outputNode,
    analyserInput,
    analyserOutput,
    compressor,
    applySettings,
    getCompositeEqResponse,
  };
}

/**
 * Applies a studio-grade lookahead downward expander / noise reduction filter
 * that suppresses ambient room noise, hum, and hiss between words while preserving
 * soft consonant onsets ('s', 't', breath starts) without choppy gating artifacts.
 */
export function applyStudioNoiseReductionBuffer(
  sourceBuffer: AudioBuffer,
  ctx: BaseAudioContext,
  gateSuppressionDb: number,
  gateThresholdDb: number
): AudioBuffer {
  if (gateSuppressionDb <= 0.5) return sourceBuffer;

  const numChannels = sourceBuffer.numberOfChannels;
  const length = sourceBuffer.length;
  const sampleRate = sourceBuffer.sampleRate;
  const outBuffer = ctx.createBuffer(numChannels, length, sampleRate);

  const ch0 = sourceBuffer.getChannelData(0);

  // Estimate adaptive noise floor from the quietest 18% of 20ms frames
  const frameSize = Math.floor(sampleRate * 0.02);
  const numFrames = Math.floor(length / frameSize);
  const frameRms: number[] = [];

  for (let f = 0; f < numFrames; f++) {
    let sum = 0;
    const offset = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      const v = ch0[offset + i];
      sum += v * v;
    }
    frameRms.push(Math.sqrt(sum / frameSize));
  }

  const sorted = [...frameRms].sort((a, b) => a - b);
  const detectedNoiseRms = sorted[Math.floor(sorted.length * 0.18)] || 0.002;
  const manualThresholdLinear = dbToLinear(gateThresholdDb);

  // Combine adaptive floor with user's threshold control
  const effectiveThreshold = Math.max(detectedNoiseRms * 2.1, manualThresholdLinear);
  const floorGain = dbToLinear(-gateSuppressionDb);

  // 6ms lookahead so 's' and 't' consonant starts are never clipped
  const lookaheadSamples = Math.floor(sampleRate * 0.006);
  const attackCoeff = Math.exp(-1 / (sampleRate * 0.003));   // 3ms fast opening
  const releaseCoeff = Math.exp(-1 / (sampleRate * 0.11));   // 110ms natural vocal decay

  const gainEnvelope = new Float32Array(length);
  let env = 0;
  let smoothedGain = 1.0;

  for (let i = 0; i < length; i++) {
    const lookIdx = Math.min(length - 1, i + lookaheadSamples);
    const absVal = Math.abs(ch0[lookIdx]);
    if (absVal > env) {
      env = attackCoeff * env + (1 - attackCoeff) * absVal;
    } else {
      env = releaseCoeff * env + (1 - releaseCoeff) * absVal;
    }

    // Soft-knee downward expansion ratio (smooth transition instead of hard cutoff)
    let targetGain = 1.0;
    if (env < effectiveThreshold) {
      const ratio = env / Math.max(0.00001, effectiveThreshold);
      const shaped = Math.pow(ratio, 1.85);
      targetGain = floorGain + (1.0 - floorGain) * shaped;
    }

    smoothedGain = smoothedGain * 0.994 + targetGain * 0.006;
    gainEnvelope[i] = smoothedGain;
  }

  for (let ch = 0; ch < numChannels; ch++) {
    const src = sourceBuffer.getChannelData(ch);
    const dst = outBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      dst[i] = src[i] * gainEnvelope[i];
    }
  }

  return outBuffer;
}

/**
 * Analyzes an AudioBuffer to diagnose vocal characteristics and auto-configure DSP settings
 */
export function analyzeAndRecommendSettings(buffer: AudioBuffer): {
  diagnostics: AudioDiagnostics;
  recommendedSettings: VocalDSPSettings;
} {
  const ch0 = buffer.getChannelData(0);
  const length = ch0.length;
  const sr = buffer.sampleRate;

  let peak = 0;
  let sumSq = 0;

  for (let i = 0; i < length; i++) {
    const abs = Math.abs(ch0[i]);
    if (abs > peak) peak = abs;
    sumSq += ch0[i] * ch0[i];
  }

  const rms = Math.sqrt(sumSq / Math.max(1, length));
  const peakDb = linearToDb(peak);
  const rmsDb = linearToDb(rms);
  const crestFactorDb = Math.max(0, peakDb - rmsDb);

  const winSize = Math.floor(sr * 0.025);
  const numWins = Math.max(1, Math.floor(length / winSize));
  const winLevels: number[] = [];
  for (let w = 0; w < numWins; w++) {
    let s = 0;
    const start = w * winSize;
    for (let i = 0; i < winSize; i++) {
      const v = ch0[start + i];
      s += v * v;
    }
    winLevels.push(Math.sqrt(s / winSize));
  }
  winLevels.sort((a, b) => a - b);
  const quietRms = winLevels[Math.floor(winLevels.length * 0.15)] || 0.0005;
  const noiseFloorDb = linearToDb(quietRms);

  let lowLp = 0;
  let midLp = 0;
  let rumbleEnergy = 0;
  let mudEnergy = 0;
  let presenceEnergy = 0;

  const alpha100 = (2 * Math.PI * 105) / (sr + 2 * Math.PI * 105);
  const alpha450 = (2 * Math.PI * 450) / (sr + 2 * Math.PI * 450);

  const step = Math.max(1, Math.floor(length / 60000));
  for (let i = 0; i < length; i += step) {
    const x = ch0[i];
    lowLp = lowLp + alpha100 * (x - lowLp);
    midLp = midLp + alpha450 * (x - midLp);
    const mudBand = midLp - lowLp;
    const highBand = x - midLp;

    rumbleEnergy += lowLp * lowLp;
    mudEnergy += mudBand * mudBand;
    presenceEnergy += highBand * highBand;
  }

  const totalBandEnergy = Math.max(0.000001, rumbleEnergy + mudEnergy + presenceEnergy);
  const rumbleRatio = rumbleEnergy / totalBandEnergy;
  const mudRatio = mudEnergy / totalBandEnergy;
  const highRatio = presenceEnergy / totalBandEnergy;

  const rumbleLevel: 'Low' | 'Moderate' | 'High' =
    rumbleRatio > 0.28 ? 'High' : rumbleRatio > 0.14 ? 'Moderate' : 'Low';
  const mudLevel: 'Clean' | 'Slightly Boxy' | 'Muddy' =
    mudRatio > 0.48 ? 'Muddy' : mudRatio > 0.32 ? 'Slightly Boxy' : 'Clean';
  const sibilanceLevel: 'Balanced' | 'Sharp' = highRatio > 0.42 ? 'Sharp' : 'Balanced';

  const recommendations: string[] = [];

  const highPassFreq = rumbleLevel === 'High' ? 110 : rumbleLevel === 'Moderate' ? 90 : 80;
  recommendations.push(
    `Enabled 50 Hz Hum Notch + ${highPassFreq} Hz High-Pass Filter to eliminate low-end hum and room rumble.`
  );

  const noiseGateDb = noiseFloorDb > -42 ? 16 : noiseFloorDb > -52 ? 13 : 9;
  const gateThresholdDb = Math.max(-52, Math.min(-34, Math.round(noiseFloorDb + 7)));
  const hissReductionDb = noiseFloorDb > -45 ? 6.0 : 4.5;
  recommendations.push(
    `Configured ${noiseGateDb} dB Lookahead Noise Reduction (threshold ${gateThresholdDb} dBFS) and -${hissReductionDb.toFixed(1)} dB Hiss Filter to clean ambient pauses.`
  );

  const mudCutGainDb = mudLevel === 'Muddy' ? -5.5 : mudLevel === 'Slightly Boxy' ? -4.0 : -2.5;
  const warmthGainDb = 3.2;
  const presenceGainDb = highRatio < 0.28 ? 4.4 : 3.6;
  const airGainDb = 2.8;
  const deEsserAmountDb = sibilanceLevel === 'Sharp' ? 5.5 : 4.0;

  recommendations.push(
    `Boosted consonant intelligibility ('s' & 't' band at 3.4 kHz) by +${presenceGainDb.toFixed(1)} dB and added +${warmthGainDb.toFixed(1)} dB natural warmth at 155 Hz.`
  );

  const compThresholdDb = Math.max(-34, Math.min(-18, Math.round(rmsDb - 4)));
  const compRatio = crestFactorDb > 15 ? 3.6 : 3.0;
  const targetMakeup = Math.max(1.5, Math.min(8.5, Math.round((-15 - rmsDb) * 0.65 * 10) / 10));

  recommendations.push(
    `Applied ${compRatio.toFixed(1)}:1 optical leveling with +${targetMakeup.toFixed(1)} dB output gain for balanced narration presence.`
  );

  return {
    diagnostics: {
      durationSec: buffer.duration,
      sampleRate: buffer.sampleRate,
      peakDb,
      rmsDb,
      crestFactorDb,
      noiseFloorDb,
      rumbleLevel,
      mudLevel,
      sibilanceLevel,
      recommendations,
    },
    recommendedSettings: {
      bypass: false,
      noiseGateDb,
      gateThresholdDb,
      humFilterEnabled: true,
      humFreqHz: 50,
      hissReductionDb,
      highPassFreq,
      warmthGainDb,
      mudCutGainDb,
      presenceGainDb,
      airGainDb,
      deEsserAmountDb,
      compThresholdDb,
      compRatio,
      compAttackMs: 10,
      compReleaseMs: 150,
      exciterDrive: 18,
      studioAmbienceMix: 0,
      outputGainDb: targetMakeup,
    },
  };
}

/**
 * Renders an AudioBuffer offline through the full Vocal DSP chain (including lookahead noise reduction)
 * and returns the enhanced AudioBuffer and lossless 16-bit WAV Blob.
 */
export async function renderEnhancedAudio(
  sourceBuffer: AudioBuffer,
  settings: VocalDSPSettings
): Promise<{ enhancedBuffer: AudioBuffer; wavBlob: Blob }> {
  const numChannels = Math.max(1, sourceBuffer.numberOfChannels);
  const sampleRate = sourceBuffer.sampleRate;
  const length = sourceBuffer.length;

  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const gatedBuffer = settings.bypass
    ? sourceBuffer
    : applyStudioNoiseReductionBuffer(
        sourceBuffer,
        offlineCtx,
        settings.noiseGateDb,
        settings.gateThresholdDb
      );

  const source = offlineCtx.createBufferSource();
  source.buffer = gatedBuffer;

  const graph = buildVocalDSPGraph(offlineCtx);
  graph.applySettings(settings);

  source.connect(graph.inputNode);
  graph.outputNode.connect(offlineCtx.destination);

  source.start(0);
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = encodeAudioBufferToWav(renderedBuffer);

  return { enhancedBuffer: renderedBuffer, wavBlob };
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM RIFF WAVE Blob
 */
export function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Generates a realistic synthetic vocal phrase with natural speech cadence,
 * vowel formants, sibilance bursts, room mud, 50Hz mains hum, and ambient hiss
 * so users can audition the Noise Reduction & Clarity DSP immediately.
 */
export function createDemoVoiceBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 6.4;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  const syllables = [
    { start: 0.25, end: 0.62, f0: 132, f1: 720, f2: 1240, sib: false },
    { start: 0.66, end: 0.98, f0: 145, f1: 440, f2: 2050, sib: true },
    { start: 1.05, end: 1.52, f0: 138, f1: 580, f2: 1550, sib: false },
    { start: 1.58, end: 1.95, f0: 124, f1: 360, f2: 980, sib: true },
    { start: 2.35, end: 2.78, f0: 148, f1: 680, f2: 1320, sib: false },
    { start: 2.84, end: 3.28, f0: 154, f1: 490, f2: 1920, sib: true },
    { start: 3.34, end: 3.82, f0: 136, f1: 620, f2: 1420, sib: false },
    { start: 3.88, end: 4.35, f0: 122, f1: 420, f2: 1120, sib: false },
    { start: 4.65, end: 5.15, f0: 140, f1: 540, f2: 1780, sib: true },
    { start: 5.20, end: 5.95, f0: 116, f1: 660, f2: 1260, sib: false },
  ];

  let phase = 0;
  let seed = 48271;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1073741823.5) / 1073741823.5;
  };

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;

    // 1. Simulated ambient room hiss + 50 Hz mains hum + 100 Hz harmonic + low room rumble
    let sample =
      rand() * 0.011 +
      Math.sin(2 * Math.PI * 50 * t) * 0.028 +
      Math.sin(2 * Math.PI * 100 * t) * 0.014 +
      Math.sin(2 * Math.PI * 72 * t) * 0.018;

    // 2. Active vocal syllables
    for (const syl of syllables) {
      if (t >= syl.start && t <= syl.end) {
        const localT = (t - syl.start) / (syl.end - syl.start);
        const env = Math.sin(Math.PI * localT) * Math.min(1, localT * 8) * Math.min(1, (1 - localT) * 6);

        const instF0 = syl.f0 * (1 - 0.06 * localT + 0.012 * Math.sin(2 * Math.PI * 5.4 * t));
        phase += instF0 / sampleRate;
        if (phase >= 1) phase -= 1;

        let voice = 0;
        for (let h = 1; h <= 26; h++) {
          const freq = h * instF0;
          if (freq > sampleRate * 0.45) break;

          const d1 = (freq - syl.f1) / 140;
          const d2 = (freq - syl.f2) / 220;
          const d3 = (freq - 3200) / 380;
          const dMud = (freq - 360) / 85;

          const formantGain =
            Math.exp(-0.5 * d1 * d1) * 1.1 +
            Math.exp(-0.5 * d2 * d2) * 0.75 +
            Math.exp(-0.5 * d3 * d3) * 0.25 +
            Math.exp(-0.5 * dMud * dMud) * 0.92;

          const spectralTilt = 1 / Math.pow(h, 0.88);
          voice += Math.sin(2 * Math.PI * h * phase + h * 0.3) * spectralTilt * (0.25 + formantGain);
        }

        // 'S' & 'T' consonant bursts in the 3.4kHz - 6.8kHz intelligibility zone
        if (syl.sib && localT < 0.22) {
          const sibEnv = Math.sin((localT / 0.22) * Math.PI);
          voice += rand() * (Math.sin(2 * Math.PI * 3600 * t) * 0.4 + Math.sin(2 * Math.PI * 6600 * t) * 0.35) * sibEnv;
        }

        sample += voice * env * 0.24;
      }
    }

    data[i] = Math.max(-0.95, Math.min(0.95, sample));
  }

  return buffer;
}
