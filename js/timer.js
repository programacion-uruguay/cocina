/**
 * Temporizador de cocina integrado con alerta sonora (Web Audio API).
 */

class CookingTimer {
  constructor() {
    this.widget = document.getElementById("floating-timer");
    this.labelEl = document.getElementById("timer-label");
    this.displayEl = document.getElementById("timer-display");
    this.playPauseBtn = document.getElementById("timer-play-pause");
    this.resetBtn = document.getElementById("timer-reset");
    this.closeBtn = document.getElementById("timer-close");

    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.intervalId = null;
    this.isRunning = false;

    this.bindEvents();
  }

  bindEvents() {
    this.playPauseBtn.addEventListener("click", () => {
      if (this.isRunning) {
        this.pause();
      } else {
        this.resume();
      }
    });

    this.resetBtn.addEventListener("click", () => {
      this.remainingSeconds = this.totalSeconds;
      this.widget.classList.remove("is-finished");
      this.updateDisplay();
    });

    this.closeBtn.addEventListener("click", () => {
      this.stop();
      this.widget.hidden = true;
    });
  }

  start(minutes, label = "Cocción") {
    this.stop();
    this.totalSeconds = Math.max(1, Math.round(minutes * 60));
    this.remainingSeconds = this.totalSeconds;
    this.labelEl.textContent = label;
    this.widget.classList.remove("is-finished");
    this.widget.hidden = false;
    this.resume();
  }

  resume() {
    if (this.isRunning || this.remainingSeconds <= 0) return;
    this.isRunning = true;
    this.playPauseBtn.textContent = "⏸";
    this.updateDisplay();

    this.intervalId = setInterval(() => {
      this.remainingSeconds -= 1;
      this.updateDisplay();

      if (this.remainingSeconds <= 0) {
        this.finish();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    this.playPauseBtn.textContent = "▶";
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  stop() {
    this.pause();
    this.widget.classList.remove("is-finished");
  }

  finish() {
    this.pause();
    this.remainingSeconds = 0;
    this.updateDisplay();
    this.widget.classList.add("is-finished");
    this.playChime();
  }

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    this.displayEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [587.33, 783.99, 1046.5]; // D5, G5, C6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + i * 0.18 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.46);
      });
    } catch {
      // Ignorar si el navegador bloquea audio sin interacción
    }
  }
}
