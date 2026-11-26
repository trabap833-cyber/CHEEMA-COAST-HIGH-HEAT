import { MUSIC_TRACKS, MusicTrackSpec, VehiclePhysics } from './types';

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class RaceAudioEngine {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sfxMasterGain: GainNode | null = null;
  private musicMasterGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicEchoSend: GainNode | null = null;
  private musicDelay: DelayNode | null = null;
  private musicFeedback: GainNode | null = null;

  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  private screechSource: AudioBufferSourceNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechGain: GainNode | null = null;

  private nitroSource: AudioBufferSourceNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private nitroGain: GainNode | null = null;

  private sirenOsc: OscillatorNode | null = null;
  private sirenFilter: BiquadFilterNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenPhase = 0;

  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  private sfxMuted = false;
  private sfxVolume = 0.85;
  private musicMuted = false;
  private musicPlaying = true;
  private musicVolume = 0.72;
  private timbre: VehiclePhysics['engineTimbre'] = 'v12';

  private started = false;
  private unlocking = false;
  private disposed = false;

  // Dynamic Playlist Music Sequencer State
  private currentTrackIndex = 0;
  private nextNoteTime = 0;
  private currentStep = 0; // 0..63 (4 bars x 16 steps)
  private musicIntensity = 0.35;
  private musicDucked = true;
  private jukeboxBoost = false;
  private timeScale = 1.0;

  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.3, Math.min(1.0, Number.isFinite(scale) ? scale : 1.0));
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  public isMusicPlaying(): boolean {
    return this.musicPlaying && !this.musicMuted;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getCurrentTrack(): MusicTrackSpec {
    return MUSIC_TRACKS[this.currentTrackIndex] ?? MUSIC_TRACKS[0];
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public setJukeboxFocus(focused: boolean): void {
    this.jukeboxBoost = focused;
  }

  public selectMusicTrack(trackId: string): MusicTrackSpec {
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === trackId);
    if (idx >= 0) {
      this.currentTrackIndex = idx;
    }
    this.currentStep = 0;
    this.musicPlaying = true;
    if (this.musicMuted) {
      this.setMusicMuted(false);
    }
    this.unlock();
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.03;
    }
    return this.getCurrentTrack();
  }

  public nextMusicTrack(): MusicTrackSpec {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % MUSIC_TRACKS.length;
    this.currentStep = 0;
    this.musicPlaying = true;
    if (this.musicMuted) this.setMusicMuted(false);
    this.unlock();
    if (this.ctx) this.nextNoteTime = this.ctx.currentTime + 0.03;
    return this.getCurrentTrack();
  }

  public prevMusicTrack(): MusicTrackSpec {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    this.currentStep = 0;
    this.musicPlaying = true;
    if (this.musicMuted) this.setMusicMuted(false);
    this.unlock();
    if (this.ctx) this.nextNoteTime = this.ctx.currentTime + 0.03;
    return this.getCurrentTrack();
  }

  public toggleMusicPlaying(): boolean {
    if (this.musicMuted) {
      this.setMusicMuted(false);
      this.musicPlaying = true;
    } else {
      this.musicPlaying = !this.musicPlaying;
    }
    this.unlock();
    if (this.musicPlaying && this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.03;
    }
    if (this.musicMasterGain && this.ctx && this.ctx.state !== 'closed') {
      this.safeSetTarget(
        this.musicMasterGain.gain,
        this.getTargetMusicGain(),
        this.ctx.currentTime,
        0.05,
      );
    }
    return this.isMusicPlaying();
  }

  public setEngineTimbre(timbre: VehiclePhysics['engineTimbre']): void {
    this.timbre = timbre;
    if (!this.engineOsc1 || !this.engineOsc2) return;
    if (timbre === 'cyber') {
      this.engineOsc1.type = 'sine';
      this.engineOsc2.type = 'triangle';
    } else if (timbre === 'bike') {
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'sawtooth';
    } else if (timbre === 'muscle') {
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'square';
    } else {
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';
    }
  }

  private getTargetSfxGain(): number {
    return this.sfxMuted ? 0 : Math.max(0, Math.min(1, this.sfxVolume)) * 0.5;
  }

  private getTargetMusicGain(): number {
    if (this.musicMuted || !this.musicPlaying) return 0;
    const base = Math.max(0, Math.min(1, this.musicVolume)) * 0.38;
    if (this.jukeboxBoost) return base * 0.98;
    return this.musicDucked ? base * 0.65 : base * (0.85 + this.musicIntensity * 0.3);
  }

  private safeSetTarget(
    param: AudioParam | null | undefined,
    value: number,
    now: number,
    timeConstant: number,
  ): void {
    if (!param || !Number.isFinite(value) || !Number.isFinite(now) || timeConstant <= 0) {
      return;
    }
    try {
      param.setTargetAtTime(value, now, timeConstant);
    } catch {
      // Ignore transient scheduling errors
    }
  }

  public setSfxMuted(mute: boolean): void {
    this.sfxMuted = mute;
    if (this.sfxMasterGain && this.ctx && this.ctx.state !== 'closed') {
      this.safeSetTarget(this.sfxMasterGain.gain, this.getTargetSfxGain(), this.ctx.currentTime, 0.04);
    }
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, Number.isFinite(vol) ? vol : 0.85));
    if (this.sfxMasterGain && this.ctx && this.ctx.state !== 'closed') {
      this.safeSetTarget(this.sfxMasterGain.gain, this.getTargetSfxGain(), this.ctx.currentTime, 0.04);
    }
  }

  public toggleSfxMute(): boolean {
    this.setSfxMuted(!this.sfxMuted);
    return this.sfxMuted;
  }

  public setMusicMuted(mute: boolean): void {
    this.musicMuted = mute;
    if (this.musicMasterGain && this.ctx && this.ctx.state !== 'closed') {
      this.safeSetTarget(
        this.musicMasterGain.gain,
        this.getTargetMusicGain(),
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, Number.isFinite(vol) ? vol : 0.72));
    if (this.musicMasterGain && this.ctx && this.ctx.state !== 'closed') {
      this.safeSetTarget(
        this.musicMasterGain.gain,
        this.getTargetMusicGain(),
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  public toggleMusicMute(): boolean {
    this.setMusicMuted(!this.musicMuted);
    return this.musicMuted;
  }

  public unlock(): void {
    if (this.disposed) return;
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        this.ctx = new AudioCtx({ latencyHint: 'interactive' });
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -13;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 6;
        this.compressor.attack.value = 0.004;
        this.compressor.release.value = 0.16;
        this.compressor.connect(this.ctx.destination);

        this.sfxMasterGain = this.ctx.createGain();
        this.sfxMasterGain.gain.value = this.getTargetSfxGain();
        this.sfxMasterGain.connect(this.compressor);

        this.musicFilter = this.ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.value = 2400;
        this.musicFilter.Q.value = 0.7;

        this.musicMasterGain = this.ctx.createGain();
        this.musicMasterGain.gain.value = this.getTargetMusicGain();

        // EDM Stadium Delay/Reverb Bus for Walker vocals & piano leads
        this.musicEchoSend = this.ctx.createGain();
        this.musicEchoSend.gain.value = 0.34;
        this.musicDelay = this.ctx.createDelay(1.0);
        this.musicDelay.delayTime.value = 0.34;
        this.musicFeedback = this.ctx.createGain();
        this.musicFeedback.gain.value = 0.36;
        const echoTone = this.ctx.createBiquadFilter();
        echoTone.type = 'lowpass';
        echoTone.frequency.value = 2600;

        this.musicFilter.connect(this.musicMasterGain);
        this.musicEchoSend.connect(this.musicDelay);
        this.musicDelay.connect(echoTone);
        echoTone.connect(this.musicFeedback);
        this.musicFeedback.connect(this.musicDelay);
        echoTone.connect(this.musicMasterGain);
        this.musicMasterGain.connect(this.compressor);

        this.createNoiseBuffers(this.ctx);
        this.initContinuousLoops();
        this.nextNoteTime = this.ctx.currentTime + 0.06;
      }

      if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') {
        this.unlocking = true;
        this.ctx
          .resume()
          .then(() => {
            if (this.ctx) {
              this.nextNoteTime = Math.max(this.nextNoteTime, this.ctx.currentTime + 0.04);
            }
          })
          .catch(() => {})
          .finally(() => {
            this.unlocking = false;
          });
      }
    } catch {
      this.unlocking = false;
    }
  }

  public resumeIfNeeded(): void {
    if (this.disposed || !this.ctx || this.ctx.state === 'closed') return;
    if (this.ctx.state !== 'running' && !this.unlocking) {
      this.unlock();
    }
  }

  private createNoiseBuffers(ctx: AudioContext): void {
    const sampleRate = ctx.sampleRate || 44100;
    const len = Math.floor(sampleRate * 2);

    const white = ctx.createBuffer(1, len, sampleRate);
    const wData = white.getChannelData(0);
    for (let i = 0; i < len; i++) {
      wData[i] = Math.random() * 2 - 1;
    }
    this.whiteNoiseBuffer = white;

    const pink = ctx.createBuffer(1, len, sampleRate);
    const pData = pink.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      pData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    this.pinkNoiseBuffer = pink;
  }

  private initContinuousLoops(): void {
    if (!this.ctx || !this.sfxMasterGain || !this.pinkNoiseBuffer || this.started) return;
    this.started = true;

    // 1. Engine RPM synthesizer
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 220;
    this.engineFilter.Q.value = 1.8;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.value = 52;

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.value = 104;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxMasterGain);
    this.engineOsc1.start();
    this.engineOsc2.start();
    this.setEngineTimbre(this.timbre);

    // 2. High-speed Wind Rush
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.pinkNoiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 340;
    this.windFilter.Q.value = 0.9;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.sfxMasterGain);
    this.windSource.start();

    // 3. Tire Drift Screech
    this.screechSource = this.ctx.createBufferSource();
    this.screechSource.buffer = this.pinkNoiseBuffer;
    this.screechSource.loop = true;

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.value = 980;
    this.screechFilter.Q.value = 2.8;

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.value = 0;

    this.screechSource.connect(this.screechFilter);
    this.screechFilter.connect(this.screechGain);
    this.screechGain.connect(this.sfxMasterGain);
    this.screechSource.start();

    // 4. Nitro Jet Whoosh
    this.nitroSource = this.ctx.createBufferSource();
    this.nitroSource.buffer = this.pinkNoiseBuffer;
    this.nitroSource.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.value = 480;
    this.nitroFilter.Q.value = 1.1;

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.value = 0;

    this.nitroSource.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxMasterGain);
    this.nitroSource.start();

    // 5. Dual-Tone Police Siren
    this.sirenFilter = this.ctx.createBiquadFilter();
    this.sirenFilter.type = 'lowpass';
    this.sirenFilter.frequency.value = 1450;
    this.sirenFilter.Q.value = 1.0;

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0;

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.value = 660;

    this.sirenOsc.connect(this.sirenFilter);
    this.sirenFilter.connect(this.sirenGain);
    this.sirenGain.connect(this.sfxMasterGain);
    this.sirenOsc.start();
  }

  private scheduleMusicStep(stepIndex: number, time: number): void {
    if (
      !this.ctx ||
      !this.musicFilter ||
      !this.whiteNoiseBuffer ||
      this.musicMuted ||
      !this.musicPlaying
    ) {
      return;
    }

    const track = this.getCurrentTrack();
    const bar = Math.floor(stepIndex / 16) % 4;
    const step = stepIndex % 16;
    const intensity = this.jukeboxBoost ? 0.78 : this.musicIntensity;
    const fullEnergy = !this.musicDucked || this.jukeboxBoost;

    // 1. Melodic Walker Piano / Pluck Arpeggio
    if (fullEnergy || step % 2 === 0) {
      const arpNote = track.arpPattern[bar][step];
      const osc = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = track.arpWave;
      oscSub.type = 'sine';
      const freq = midiToHz(arpNote);
      osc.frequency.setValueAtTime(freq, time);
      oscSub.frequency.setValueAtTime(freq * 2, time);

      const accent = step % 4 === 0 ? 0.115 : 0.072;
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(accent, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      osc.connect(gain);
      oscSub.connect(gain);
      gain.connect(this.musicFilter);
      if (this.musicEchoSend && step % 4 === 0) {
        gain.connect(this.musicEchoSend);
      }
      osc.start(time);
      oscSub.start(time);
      osc.stop(time + 0.29);
      oscSub.stop(time + 0.29);
    }

    // 1b. Lush Atmospheric Pad Chords on beat 1 of each bar
    if (step === 0) {
      const chordNotes = [
        track.arpPattern[bar][0] - 12,
        track.arpPattern[bar][2] - 12,
        track.arpPattern[bar][1] - 12,
      ];
      const barDur = (60 / track.bpm) * 3.8;
      for (const n of chordNotes) {
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        padOsc.type = 'triangle';
        padOsc.frequency.setValueAtTime(midiToHz(n), time);
        padGain.gain.setValueAtTime(0.001, time);
        padGain.gain.linearRampToValueAtTime(fullEnergy ? 0.042 : 0.025, time + 0.18);
        padGain.gain.exponentialRampToValueAtTime(0.001, time + barDur);
        padOsc.connect(padGain);
        padGain.connect(this.musicFilter);
        padOsc.start(time);
        padOsc.stop(time + barDur + 0.05);
      }
    }

    // 2. Formant Vocal Choir & Singing Lead (Alan Walker signature vocal synth)
    const leadNote = track.leadMelody[bar][step];
    if (leadNote > 0) {
      const freq = midiToHz(leadNote);
      const v1 = this.ctx.createOscillator();
      const v2 = this.ctx.createOscillator();
      const vAir = this.ctx.createOscillator();
      const formant1 = this.ctx.createBiquadFilter();
      const formant2 = this.ctx.createBiquadFilter();
      const vocalGain = this.ctx.createGain();

      v1.type = 'sawtooth';
      v2.type = track.leadWave;
      vAir.type = 'sine';
      v1.frequency.setValueAtTime(freq, time);
      v2.frequency.setValueAtTime(freq * 1.0055, time);
      vAir.frequency.setValueAtTime(freq * 2, time);

      // Vowel formant progression across bars: Ah -> Eh -> Oh -> Ah
      const f1Targets = [720, 560, 480, 680];
      const f2Targets = [1240, 1780, 920, 1380];
      const bIdx = (bar + (step >= 8 ? 1 : 0)) % 4;

      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(f1Targets[bIdx], time);
      formant1.Q.value = 3.2;

      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(f2Targets[bIdx], time);
      formant2.Q.value = 4.0;

      const peak = fullEnergy ? 0.145 + intensity * 0.065 : 0.095;
      const sustain = step % 8 === 0 ? 0.62 : 0.44;
      vocalGain.gain.setValueAtTime(0.001, time);
      vocalGain.gain.linearRampToValueAtTime(peak, time + 0.032);
      vocalGain.gain.exponentialRampToValueAtTime(0.001, time + sustain);

      v1.connect(formant1);
      v2.connect(formant1);
      v1.connect(formant2);
      v2.connect(formant2);
      formant1.connect(vocalGain);
      formant2.connect(vocalGain);
      vAir.connect(vocalGain);

      vocalGain.connect(this.musicFilter);
      if (this.musicEchoSend) {
        vocalGain.connect(this.musicEchoSend);
      }

      v1.start(time);
      v2.start(time);
      vAir.start(time);
      v1.stop(time + sustain + 0.02);
      v2.stop(time + sustain + 0.02);
      vAir.stop(time + sustain + 0.02);
    }

    // 3. Warm Sidechained Sub-Bassline
    if (step % 2 === 0) {
      const rootMidi = track.bassRoots[bar];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = step % 4 === 2 ? track.bassWave : 'sine';
      bassOsc.frequency.setValueAtTime(midiToHz(rootMidi), time);

      const bassPeak = step % 4 === 2 ? 0.19 : 0.095;
      bassGain.gain.setValueAtTime(0.001, time);
      bassGain.gain.linearRampToValueAtTime(fullEnergy ? bassPeak : bassPeak * 0.55, time + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.21);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicFilter);
      bassOsc.start(time);
      bassOsc.stop(time + 0.22);
    }

    // 4. Driving Kick / Clap / Hats
    if (fullEnergy || step % 8 === 0) {
      if (step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(132, time);
        kick.frequency.exponentialRampToValueAtTime(42, time + 0.09);

        kGain.gain.setValueAtTime(fullEnergy ? 0.32 + intensity * 0.08 : 0.16, time);
        kGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

        kick.connect(kGain);
        kGain.connect(this.musicMasterGain ?? this.musicFilter);
        kick.start(time);
        kick.stop(time + 0.17);
      }

      if (fullEnergy && (step === 4 || step === 12)) {
        const clap = this.ctx.createBufferSource();
        clap.buffer = this.whiteNoiseBuffer;
        const cFilter = this.ctx.createBiquadFilter();
        cFilter.type = 'bandpass';
        cFilter.frequency.value = 1850;
        cFilter.Q.value = 1.1;

        const cGain = this.ctx.createGain();
        cGain.gain.setValueAtTime(0.16 + intensity * 0.09, time);
        cGain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

        clap.connect(cFilter);
        cFilter.connect(cGain);
        cGain.connect(this.musicFilter);
        clap.start(time);
        clap.stop(time + 0.14);
      }

      if (fullEnergy && (step % 4 === 2 || (intensity > 0.5 && step % 2 === 1))) {
        const hat = this.ctx.createBufferSource();
        hat.buffer = this.whiteNoiseBuffer;
        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.value = 6800;

        const hGain = this.ctx.createGain();
        const hVol = step % 4 === 2 ? 0.085 + intensity * 0.05 : 0.035;
        hGain.gain.setValueAtTime(hVol, time);
        hGain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

        hat.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.musicFilter);
        hat.start(time);
        hat.stop(time + 0.05);
      }
    }
  }

  private stepMusicSequencer(now: number): void {
    if (!this.ctx || this.ctx.state !== 'running' || !this.musicPlaying || this.musicMuted) {
      return;
    }
    try {
      const track = this.getCurrentTrack();
      const stepDuration = 60 / track.bpm / 4;
      if (this.nextNoteTime < now - 0.2) {
        this.nextNoteTime = now + 0.02;
      }
      const lookahead = 0.14;
      let safety = 0;
      while (this.nextNoteTime < now + lookahead && safety < 8) {
        this.scheduleMusicStep(this.currentStep, this.nextNoteTime);
        this.nextNoteTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 64;
        safety++;
      }
    } catch {
      // Ignore mobile Safari audio scheduling hiccups
    }
  }

  public updateContinuous(params: {
    active: boolean;
    menuMode?: boolean;
    dt: number;
    rpmRatio: number;
    speedKmh: number;
    throttle: boolean;
    driftIntensity: number;
    isBoosting: boolean;
    policeProximity: number;
  }): void {
    if (!this.ctx || !this.started || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const speedNorm = Math.max(
      0,
      Math.min(1.25, (Number.isFinite(params.speedKmh) ? params.speedKmh : 0) / 290),
    );
    const prox = Math.max(
      0,
      Math.min(1, Number.isFinite(params.policeProximity) ? params.policeProximity : 0),
    );

    this.musicDucked = !params.active;
    this.musicIntensity = params.active
      ? Math.min(1, 0.25 + speedNorm * 0.45 + (params.isBoosting ? 0.35 : 0) + prox * 0.25)
      : this.jukeboxBoost
        ? 0.78
        : 0.32;

    if (this.musicFilter && this.musicMasterGain) {
      const baseCutoff = this.jukeboxBoost
        ? 6800
        : this.musicDucked
          ? 2800
          : 2800 + this.musicIntensity * 4600;
      const targetCutoff = baseCutoff * (0.45 + this.timeScale * 0.55);
      this.safeSetTarget(this.musicFilter.frequency, targetCutoff, now, 0.14);
      this.safeSetTarget(
        this.musicMasterGain.gain,
        this.getTargetMusicGain(),
        now,
        0.1,
      );
    }

    this.stepMusicSequencer(now);

    if (!params.active) {
      this.safeSetTarget(this.engineGain?.gain, 0, now, 0.08);
      this.safeSetTarget(this.windGain?.gain, 0, now, 0.08);
      this.safeSetTarget(this.screechGain?.gain, 0, now, 0.05);
      this.safeSetTarget(this.nitroGain?.gain, 0, now, 0.06);
      this.safeSetTarget(this.sirenGain?.gain, 0, now, 0.08);
      return;
    }

    const rpm = Math.max(0, Math.min(1.25, Number.isFinite(params.rpmRatio) ? params.rpmRatio : 0));

    let pitchMul = 1.0;
    let harmonicRatio = 1.995;
    if (this.timbre === 'bike') {
      pitchMul = 1.68;
      harmonicRatio = 2.02;
    } else if (this.timbre === 'muscle') {
      pitchMul = 0.78;
      harmonicRatio = 1.5;
    } else if (this.timbre === 'rotary') {
      pitchMul = 1.38;
      harmonicRatio = 2.49;
    } else if (this.timbre === 'cyber') {
      pitchMul = 1.95;
      harmonicRatio = 2.98;
    }

    const slowScale = 0.45 + this.timeScale * 0.55;
    const baseFreq =
      (44 + rpm * 128 + speedNorm * 34 + (params.isBoosting ? 24 : 0)) * pitchMul * slowScale;

    if (this.engineOsc1 && this.engineOsc2 && this.engineFilter && this.engineGain) {
      this.safeSetTarget(this.engineOsc1.frequency, baseFreq, now, 0.045);
      this.safeSetTarget(this.engineOsc2.frequency, baseFreq * harmonicRatio, now, 0.045);
      this.safeSetTarget(
        this.engineFilter.frequency,
        (195 + rpm * 780 + speedNorm * 220 + (params.throttle ? 180 : 0)) *
          (this.timbre === 'cyber' ? 1.4 : 1.0) *
          slowScale,
        now,
        0.05,
      );
      this.safeSetTarget(
        this.engineGain.gain,
        0.095 + (params.throttle ? 0.06 : 0) + rpm * 0.04,
        now,
        0.05,
      );
    }

    if (this.windGain && this.windFilter) {
      const windLevel =
        speedNorm > 0.25 ? Math.min(0.2, Math.pow((speedNorm - 0.25) / 0.85, 1.4) * 0.18) : 0;
      this.safeSetTarget(this.windGain.gain, windLevel, now, 0.07);
      this.safeSetTarget(this.windFilter.frequency, (260 + speedNorm * 680) * slowScale, now, 0.08);
    }

    if (this.screechGain && this.screechFilter) {
      const slip = Number.isFinite(params.driftIntensity) ? params.driftIntensity : 0;
      const targetScreech = slip > 0.08 ? Math.min(0.2, slip * 0.2) : 0;
      this.safeSetTarget(this.screechGain.gain, targetScreech, now, 0.04);
      this.safeSetTarget(this.screechFilter.frequency, (880 + slip * 340) * slowScale, now, 0.05);
    }

    if (this.nitroGain && this.nitroFilter) {
      this.safeSetTarget(this.nitroGain.gain, params.isBoosting ? 0.24 : 0, now, 0.06);
      this.safeSetTarget(
        this.nitroFilter.frequency,
        (params.isBoosting ? 760 : 320) * slowScale,
        now,
        0.08,
      );
    }

    if (this.sirenOsc && this.sirenGain) {
      if (prox > 0.02) {
        this.sirenPhase += Math.min(0.05, Math.max(0, params.dt)) * 2.6 * this.timeScale;
        const hi = Math.sin(this.sirenPhase * Math.PI * 2) >= 0;
        this.safeSetTarget(this.sirenOsc.frequency, (hi ? 840 : 620) * slowScale, now, 0.035);
        this.safeSetTarget(this.sirenGain.gain, prox * 0.11, now, 0.08);
      } else {
        this.safeSetTarget(this.sirenGain.gain, 0, now, 0.1);
      }
    }
  }

  public playCollision(intensity = 0.7, metallic = true): void {
    if (!this.ctx || !this.sfxMasterGain || !this.whiteNoiseBuffer || this.sfxMuted || this.ctx.state !== 'running') {
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const clamped = Math.max(0.2, Math.min(1, Number.isFinite(intensity) ? intensity : 0.7));

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(132, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
      oscGain.gain.setValueAtTime(0.32 * clamped, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(oscGain);
      oscGain.connect(this.sfxMasterGain);
      osc.start(now);
      osc.stop(now + 0.21);

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.whiteNoiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = metallic ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(metallic ? 2100 : 950, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.18);
      filter.Q.value = metallic ? 2.4 : 1.0;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.24 * clamped, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxMasterGain);
      noise.start(now);
      noise.stop(now + 0.18);

      if (metallic && clamped > 0.45) {
        const clang = this.ctx.createOscillator();
        const clangGain = this.ctx.createGain();
        clang.type = 'triangle';
        clang.frequency.setValueAtTime(640 + clamped * 260, now);
        clang.frequency.exponentialRampToValueAtTime(190, now + 0.22);
        clangGain.gain.setValueAtTime(0.14 * clamped, now);
        clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
        clang.connect(clangGain);
        clangGain.connect(this.sfxMasterGain);
        clang.start(now);
        clang.stop(now + 0.24);
      }
    } catch {
      // Ignore
    }
  }

  public playCountdownTone(isGo: boolean): void {
    if (!this.ctx || !this.sfxMasterGain || this.sfxMuted || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isGo ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.42 : 0.22));
      osc.connect(gain);
      gain.connect(this.sfxMasterGain);
      osc.start(now);
      osc.stop(now + (isGo ? 0.44 : 0.24));
    } catch {
      // Ignore
    }
  }

  public playPickup(): void {
    if (!this.ctx || !this.sfxMasterGain || this.sfxMuted || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        if (!this.ctx || !this.sfxMasterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.045);
        gain.gain.setValueAtTime(0.14, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxMasterGain);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  public playBoostPad(): void {
    if (!this.ctx || !this.sfxMasterGain || !this.pinkNoiseBuffer || this.sfxMuted || this.ctx.state !== 'running') {
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.28);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxMasterGain);
      osc.start(now);
      osc.stop(now + 0.34);

      const whoosh = this.ctx.createBufferSource();
      whoosh.buffer = this.pinkNoiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, now);
      filter.frequency.exponentialRampToValueAtTime(1350, now + 0.26);
      const wGain = this.ctx.createGain();
      wGain.gain.setValueAtTime(0.22, now);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      whoosh.connect(filter);
      filter.connect(wGain);
      wGain.connect(this.sfxMasterGain);
      whoosh.start(now);
      whoosh.stop(now + 0.32);
    } catch {
      // Ignore
    }
  }

  public playLapChime(isFinalFinish = false): void {
    if (!this.ctx || !this.sfxMasterGain || this.sfxMuted || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const notes = isFinalFinish ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880];
      notes.forEach((f, idx) => {
        if (!this.ctx || !this.sfxMasterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);
        gain.gain.setValueAtTime(0.16, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxMasterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.38);
      });
    } catch {
      // Ignore
    }
  }

  public dispose(): void {
    this.disposed = true;
    const stopSafe = (node: AudioScheduledSourceNode | null) => {
      if (!node) return;
      try {
        node.stop();
      } catch {
        // Ignore
      }
      try {
        node.disconnect();
      } catch {
        // Ignore
      }
    };

    stopSafe(this.engineOsc1);
    stopSafe(this.engineOsc2);
    stopSafe(this.windSource);
    stopSafe(this.screechSource);
    stopSafe(this.nitroSource);
    stopSafe(this.sirenOsc);

    try {
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close().catch(() => {});
      }
    } catch {
      // Ignore
    }

    this.ctx = null;
    this.compressor = null;
    this.sfxMasterGain = null;
    this.musicMasterGain = null;
    this.musicFilter = null;
    this.musicEchoSend = null;
    this.musicDelay = null;
    this.musicFeedback = null;
    this.started = false;
  }
}
