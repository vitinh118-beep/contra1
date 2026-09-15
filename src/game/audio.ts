/**
 * Authentic 8-bit NES Audio Synthesizer for Contra Arcade
 * Emulates Pulse waves, Triangle waves, and White Noise generators using Web Audio API
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMuted: boolean = false;
  private bgmTimer: number | null = null;
  private bgmPlaying: boolean = false;
  private bgmStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // Pre-generate 1-second white noise buffer for NES noise channel
      const bufferSize = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch {
      // Audio not supported or blocked
    }
  }

  public enableAudio() {
    this.initContext();
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 0.35, this.ctx.currentTime);
    }
    if (mute) {
      this.stopBGM();
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects ---

  // Normal Rifle shot
  public playRifle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Machine Gun shot
  public playMachineGun() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Spread Gun iconic shot (punchy multi-tone burst)
  public playSpreadGun() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(900, t);
    osc1.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(450, t);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.12);
    osc2.stop(t + 0.12);
  }

  // Laser Gun (piercing high tech zap)
  public playLaser() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.15);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Flame Gun (swirling whoosh)
  public playFlame() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.2);
  }

  // Player Jump (rising pitch sweep)
  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.14);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Hit sound effect (bullet impact on shield or armor)
  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Explosions (White noise filtered)
  public playExplosion(boss: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    const t = this.ctx.currentTime;
    const duration = boss ? 0.65 : 0.25;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(boss ? 500 : 750, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(boss ? 0.6 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  // Power-up badge pickup chime
  public playPowerup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [330, 440, 554, 659, 880];
    const t = this.ctx.currentTime;
    
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.linearRampToValueAtTime(0, noteTime + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.08);
    });
  }

  // Konami Code 30 Lives Jingle! (Iconic fanfare)
  public playKonamiFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.50, d: 0.2 }, // C6
      { f: 880.00, d: 0.1 },  // A5
      { f: 1046.50, d: 0.35 } // C6 (long)
    ];

    let t = this.ctx.currentTime;
    notes.forEach(note => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d * 0.95;
    });
  }

  // Player death
  public playDeath() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);

    this.playExplosion();
  }

  // Stage Clear Fanfare
  public playStageClear() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const melody = [
      { f: 440, d: 0.12 },
      { f: 554, d: 0.12 },
      { f: 659, d: 0.12 },
      { f: 880, d: 0.25 },
      { f: 784, d: 0.12 },
      { f: 880, d: 0.4 }
    ];

    let t = this.ctx.currentTime;
    melody.forEach(note => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0, t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.05;
    });
  }

  // --- Dynamic 8-bit Background Music (Contra Jungle Theme) ---

  public startBGM() {
    if (this.bgmPlaying || this.isMuted) return;
    this.initContext();
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Tempo: ~140 BPM, 16th note = 107ms
    const stepDuration = 110;

    // Classic Contra Jungle riff notes (Bassline + Melody in steps)
    const bassline = [
      110, 110, 110, 110, 130.8, 130.8, 146.8, 164.8,
      110, 110, 110, 110, 98.0, 98.0, 110.0, 123.5,
      110, 110, 110, 110, 130.8, 130.8, 146.8, 164.8,
      174.6, 174.6, 164.8, 164.8, 146.8, 130.8, 123.5, 98.0
    ];

    const leadMelody = [
      440, 0, 440, 523.25, 587.33, 0, 523.25, 0,
      440, 0, 392, 0, 440, 0, 0, 0,
      440, 0, 440, 523.25, 587.33, 0, 659.25, 0,
      698.46, 0, 659.25, 0, 587.33, 523.25, 493.88, 392.0
    ];

    const playNextStep = () => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx || !this.bgmGain) return;

      const t = this.ctx.currentTime;
      const bassFreq = bassline[this.bgmStep % bassline.length];
      const leadFreq = leadMelody[this.bgmStep % leadMelody.length];

      // Bass note (Triangle wave for NES triangle bass)
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);

        bassGain.gain.setValueAtTime(0.3, t);
        bassGain.gain.linearRampToValueAtTime(0.01, t + 0.09);

        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.09);
      }

      // Lead note (Square wave with pulse width feeling)
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadGain.gain.setValueAtTime(0.22, t);
        leadGain.gain.linearRampToValueAtTime(0.01, t + 0.1);

        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);

        leadOsc.start(t);
        leadOsc.stop(t + 0.1);
      }

      // Percussion hit on beat (every 4 steps)
      if (this.bgmStep % 4 === 0 && this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, t);

        const drumGain = this.ctx.createGain();
        drumGain.gain.setValueAtTime(0.15, t);
        drumGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        noise.connect(filter);
        filter.connect(drumGain);
        drumGain.connect(this.bgmGain);

        noise.start(t);
        noise.stop(t + 0.05);
      }

      this.bgmStep = (this.bgmStep + 1) % bassline.length;
      this.bgmTimer = window.setTimeout(playNextStep, stepDuration);
    };

    playNextStep();
  }

  public stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audio = new SoundEngine();
