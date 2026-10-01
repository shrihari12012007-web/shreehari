/**
 * driveMode.js - Main Drive Mode Coordinator, Web Audio Engine & HUD Manager
 * Coordinates WebGL scene, BMW sports car, continuous roadway with middle bridge,
 * Web Audio sports engine ignition roar & running sound, checkpoints, and HUD.
 */

class CarAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;
    this.filterNode = null;
    this.isRunning = false;
    this.ignitionTimeout = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playIgnition() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.stop(); // Clear any previous active sound

    const t = this.ctx.currentTime;

    // 1. Starter motor cranking pulses (BMW high-torque starter)
    for (let i = 0; i < 3; i++) {
      const crankOsc = this.ctx.createOscillator();
      const crankGain = this.ctx.createGain();
      crankOsc.type = 'sawtooth';
      crankOsc.frequency.setValueAtTime(42 + i * 6, t + i * 0.12);
      crankGain.gain.setValueAtTime(0.08, t + i * 0.12);
      crankGain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.08);

      crankOsc.connect(crankGain);
      crankGain.connect(this.ctx.destination);

      crankOsc.start(t + i * 0.12);
      crankOsc.stop(t + i * 0.12 + 0.08);
    }

    // 2. Engine Ignition Roar (Throaty M-Power rev flare)
    const roarOsc = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    const roarFilter = this.ctx.createBiquadFilter();

    roarOsc.type = 'sawtooth';
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(260, t + 0.38);
    roarFilter.frequency.exponentialRampToValueAtTime(700, t + 0.72);
    roarFilter.frequency.exponentialRampToValueAtTime(240, t + 1.25);

    roarOsc.frequency.setValueAtTime(52, t + 0.38);
    roarOsc.frequency.exponentialRampToValueAtTime(185, t + 0.72); // Rev spike
    roarOsc.frequency.exponentialRampToValueAtTime(52, t + 1.3);   // Idle settle

    roarGain.gain.setValueAtTime(0.001, t + 0.38);
    roarGain.gain.linearRampToValueAtTime(0.24, t + 0.60);
    roarGain.gain.exponentialRampToValueAtTime(0.07, t + 1.3);

    roarOsc.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.ctx.destination);

    roarOsc.start(t + 0.38);
    roarOsc.stop(t + 1.32);

    // 3. Smooth transition to continuous running rumble
    if (this.ignitionTimeout) clearTimeout(this.ignitionTimeout);
    this.ignitionTimeout = setTimeout(() => {
      this.startContinuousEngine();
    }, 1300);
  }

  startContinuousEngine() {
    if (!this.ctx || this.isRunning || this.isMuted) return;

    this.isRunning = true;
    const t = this.ctx.currentTime;

    // Dual layered oscillators for rich BMW inline-6 rumble
    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.gainNode = this.ctx.createGain();
    this.filterNode = this.ctx.createBiquadFilter();

    this.osc1.type = 'sawtooth';
    this.osc2.type = 'triangle';

    this.osc1.frequency.setValueAtTime(46, t);
    this.osc2.frequency.setValueAtTime(92, t);

    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(280, t);

    this.gainNode.gain.setValueAtTime(0.01, t);
    this.gainNode.gain.linearRampToValueAtTime(0.065, t + 0.25);

    this.osc1.connect(this.filterNode);
    this.osc2.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.osc1.start(t);
    this.osc2.start(t);
  }

  updateEngine(speedKmh, throttle) {
    if (!this.isRunning || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const speedRatio = Math.min(1.0, speedKmh / 160);

    const targetFreq = 46 + speedRatio * 140 + (throttle > 0 ? 18 : 0);
    const targetGain = 0.055 + speedRatio * 0.11 + (throttle > 0 ? 0.04 : 0);
    const targetFilter = 260 + speedRatio * 620;

    if (this.osc1) this.osc1.frequency.setTargetAtTime(targetFreq, t, 0.08);
    if (this.osc2) this.osc2.frequency.setTargetAtTime(targetFreq * 2, t, 0.08);
    if (this.gainNode) this.gainNode.gain.setTargetAtTime(targetGain, t, 0.08);
    if (this.filterNode) this.filterNode.frequency.setTargetAtTime(targetFilter, t, 0.08);
  }

  stop() {
    if (this.ignitionTimeout) {
      clearTimeout(this.ignitionTimeout);
      this.ignitionTimeout = null;
    }
    if (!this.isRunning || !this.ctx) return;
    this.isRunning = false;
    const t = this.ctx.currentTime;

    if (this.gainNode) {
      this.gainNode.gain.linearRampToValueAtTime(0.001, t + 0.18);
    }
    setTimeout(() => {
      try {
        if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); this.osc1 = null; }
        if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); this.osc2 = null; }
      } catch (e) {}
    }, 200);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    } else {
      this.initContext();
      this.startContinuousEngine();
    }
    return this.isMuted;
  }
}

class DriveModeApp {
  constructor() {
    this.isActive = false;
    this.clock = null;
    this.driveScene = null;
    this.car = null;
    this.environment = null;
    this.checkpoints = null;
    this.cameraController = null;
    this.controls = null;
    this.audio = new CarAudioEngine();
    this.isSupported = true;

    // DOM Elements
    this.canvas = document.getElementById('driveCanvas');
    this.heroSection = document.getElementById('home');
    this.enterBtn = document.getElementById('enterDriveBtn');
    this.exitBtn = document.getElementById('exitDriveBtn');
    this.toggleSoundBtn = document.getElementById('toggleSoundBtn');
    this.soundIcon = document.getElementById('soundIcon');
    this.hud = document.getElementById('driveHud');
    this.speedometer = document.getElementById('hudSpeed');
    this.speedBarFill = document.getElementById('speedBarFill');
    this.checkpointModal = document.getElementById('checkpointModal');
    this.cpNumberEl = document.getElementById('cpModalNumber');
    this.cpTitleEl = document.getElementById('cpModalTitle');
    this.cpDescEl = document.getElementById('cpModalDesc');
    this.cpActionBtn = document.getElementById('cpModalAction');
    this.mobileControls = document.getElementById('mobileDriveControls');
    this.navbar = document.getElementById('navbar');

    this.checkWebGL();
    if (this.isSupported) {
      this.init();
    }
  }

  checkWebGL() {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) this.isSupported = false;
    } catch (e) {
      this.isSupported = false;
    }

    if (!this.isSupported) {
      const fallbackMsg = document.getElementById('driveFallbackMsg');
      if (fallbackMsg) fallbackMsg.style.display = 'block';
      if (this.enterBtn) {
        this.enterBtn.innerHTML = '<span>3D Unavailable</span>';
        this.enterBtn.style.opacity = '0.5';
        this.enterBtn.style.cursor = 'not-allowed';
      }
    }
  }

  init() {
    if (!this.canvas) return;

    this.clock = new THREE.Clock();

    // 1. Initialize Subsystems
    this.driveScene = new DriveScene(this.canvas);
    this.car = new SportsCar(this.driveScene.scene);
    this.environment = new BridgeEnvironment(this.driveScene.scene);
    this.checkpoints = new CheckpointManager(this.driveScene.scene);
    this.cameraController = new DriveCamera(this.driveScene.camera);
    this.controls = new DriveControls();

    // Pass the winding road curve to the car for curved-road boundary physics
    if (this.environment.roadCurve) {
      this.car.roadCurve = this.environment.roadCurve;
    }

    // 2. Setup Checkpoint callbacks
    this.checkpoints.onEnterCallback = (cp) => {
      this.showCheckpointHUD(cp);
    };

    this.checkpoints.onLeaveCallback = () => {
      this.hideCheckpointHUD();
    };

    // 3. Setup Controls callbacks
    this.controls.onExitCallback = () => {
      if (this.isActive) this.exitDriveMode();
    };

    this.controls.onResetCallback = () => {
      if (this.isActive && this.car) {
        this.car.resetPosition();
      }
    };

    this.controls.onInteractCallback = () => {
      if (this.isActive && this.checkpoints.activeCheckpoint) {
        const targetId = this.checkpoints.activeCheckpoint.targetId;
        this.exitDriveMode(targetId);
      }
    };

    this.controls.onToggleSoundCallback = () => {
      this.handleSoundToggle();
    };

    // 4. Bind UI Buttons
    if (this.enterBtn) {
      this.enterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.enterDriveMode();
      });
    }

    if (this.exitBtn) {
      this.exitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.exitDriveMode();
      });
    }

    if (this.toggleSoundBtn) {
      this.toggleSoundBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSoundToggle();
      });
    }

    if (this.cpActionBtn) {
      this.cpActionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.checkpoints.activeCheckpoint) {
          const targetId = this.checkpoints.activeCheckpoint.targetId;
          this.exitDriveMode(targetId);
        }
      });
    }

    // 5. Detect Touch Support for Mobile Controls
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch && this.mobileControls) {
      this.mobileControls.classList.add('touch-device');
    }

    // 6. Pause render loop & audio if tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clock.stop();
        this.audio.stop();
      } else {
        this.clock.start();
        if (this.isActive) {
          this.audio.startContinuousEngine();
        }
      }
    });

    // 7. Start render loop
    this.animate();
  }

  handleSoundToggle() {
    const isMuted = this.audio.toggleMute();
    if (this.soundIcon) {
      this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    }
  }

  enterDriveMode() {
    this.isActive = true;
    document.body.classList.add('drive-mode-active');

    // Smoothly scroll to top so canvas fills viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Switch Camera to follow chase mode
    this.cameraController.setMode('DRIVING');

    // Show HUD & Focus
    if (this.hud) this.hud.classList.add('visible');
    if (this.navbar) this.navbar.classList.add('hidden-in-drive');

    // Synthesize BMW sports engine ignition roar!
    this.audio.playIgnition();

    // Focus controls
    this.controls.reset();
  }

  exitDriveMode(targetSectionId = null) {
    this.isActive = false;
    document.body.classList.remove('drive-mode-active');

    // Stop engine sound
    this.audio.stop();

    // Switch camera to idle beauty preview
    this.cameraController.setMode('PREVIEW');

    // Hide HUD
    if (this.hud) this.hud.classList.remove('visible');
    if (this.navbar) this.navbar.classList.remove('hidden-in-drive');
    this.hideCheckpointHUD();

    this.controls.reset();

    // Smooth scroll to portfolio checkpoint section if requested
    if (targetSectionId) {
      setTimeout(() => {
        const el = document.getElementById(targetSectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 250);
    }
  }

  showCheckpointHUD(cp) {
    if (!this.checkpointModal) return;
    if (this.cpNumberEl) this.cpNumberEl.textContent = `CHECKPOINT ${cp.number}`;
    if (this.cpTitleEl) this.cpTitleEl.textContent = cp.title;
    if (this.cpDescEl) this.cpDescEl.textContent = cp.desc;
    if (this.cpActionBtn) this.cpActionBtn.textContent = `OPEN ${cp.title} ↗`;
    this.checkpointModal.classList.add('active');
  }

  hideCheckpointHUD() {
    if (this.checkpointModal) {
      this.checkpointModal.classList.remove('active');
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (document.hidden) return;

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // In Drive Mode: update user controls, car physics & dynamic audio
    if (this.isActive) {
      this.controls.update();
      this.car.update(delta, this.controls);
      this.checkpoints.update(this.car.position);

      // Dynamic engine audio modulation
      this.audio.updateEngine(this.car.speedKmh, this.controls.throttle);

      // Update speedometer HUD
      if (this.speedometer) {
        const formattedSpeed = String(this.car.speedKmh).padStart(3, '0');
        this.speedometer.textContent = formattedSpeed;
      }
      if (this.speedBarFill) {
        const pct = Math.min(100, (this.car.speedKmh / 160) * 100);
        this.speedBarFill.style.width = pct + '%';
      }
    } else {
      // In Hero Preview Mode: gentle idle drift so car is displayed nicely
      if (this.car.speed !== 0) {
        this.car.speed *= 0.95;
        this.car.update(delta, { throttle: 0, reverse: 0, steer: 0, handbrake: false });
      }
    }

    // Update Environment & Camera
    this.environment.update(elapsedTime, delta);
    this.cameraController.update(delta, this.car, elapsedTime);

    // Render Scene
    this.driveScene.render();
  }
}

// Instantiate once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.driveApp = new DriveModeApp();
});
