/**
 * Haptic Vibration Engine for Contra NES
 * Supports mobile haptic feedback:
 * - Shot/Hit/Death: Strong tactile impact vibration
 * - Stage Boss Defeated: Continuous intense rumble sequence
 * - Toggleable ON/OFF with persistence
 */

class VibrationEngine {
  private enabled: boolean = true;
  private continuousTimer: number | null = null;
  private readonly storageKey = 'contra_vibration_enabled';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      // Default to enabled if supported, or respect saved user preference
      if (saved !== null) {
        this.enabled = saved === 'true';
      } else {
        this.enabled = true;
      }
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  public isVibrationEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, val ? 'true' : 'false');
    }
    if (!val) {
      this.stop();
    } else if (this.isSupported()) {
      // Gentle confirmation buzz when enabled
      try {
        navigator.vibrate(60);
      } catch {
        // Ignore if blocked
      }
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Stop any active or continuous vibrations immediately
   */
  public stop() {
    if (this.continuousTimer !== null) {
      clearInterval(this.continuousTimer);
      this.continuousTimer = null;
    }
    if (this.isSupported()) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Vibrate when player is hit, shot, or killed
   * Heavy double-pulse thud
   */
  public vibratePlayerHit() {
    if (!this.enabled || !this.isSupported()) return;
    try {
      // 140ms rumble, 40ms pause, 180ms heavy impact
      navigator.vibrate([140, 40, 180]);
    } catch {
      // Ignore
    }
  }

  /**
   * Vibrate when shield absorbs a hit or minor damage
   */
  public vibrateLight() {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(50);
    } catch {
      // Ignore
    }
  }

  /**
   * Continuous vibration when stage boss is defeated
   * Rumbles continuously during the boss explosion sequence (~3.2 seconds)
   */
  public vibrateBossDefeated(durationMs: number = 3200) {
    if (!this.enabled || !this.isSupported()) return;

    this.stop();

    const startTime = Date.now();

    // Pulse vibration repeatedly every 280ms to bypass browser single-vibration caps
    const pulse = () => {
      if (!this.enabled || !this.isSupported()) {
        this.stop();
        return;
      }

      if (Date.now() - startTime >= durationMs) {
        this.stop();
        return;
      }

      try {
        // 240ms continuous rumble followed by quick 30ms gap
        navigator.vibrate([240, 30]);
      } catch {
        this.stop();
      }
    };

    pulse();
    this.continuousTimer = window.setInterval(pulse, 270);

    // Hard safety timeout
    window.setTimeout(() => {
      this.stop();
    }, durationMs + 200);
  }
}

export const vibration = new VibrationEngine();
