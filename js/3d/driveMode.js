/**
 * driveMode.js - Main Drive Mode Coordinator, Web Audio Engine & HUD Manager
 * Bruno Simon-Inspired 3D Interactive World with:
 * - Web Audio Engine: Ignition roar, continuous BMW inline-6 rumble, dual-tone horn, skid sound, checkpoint ding
 * - Teleport Navigation: Jump directly to Start, About, Skills, Projects, Education, Contact
 * - Camera toggle: Elevated Isometric view (default) vs. Close Chase camera
 * - Interactive Project cards with live demo & GitHub direct links
 * - Full responsive touch controls for mobile
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
    this.lastSkidTime = 0;
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

    this.stop();

    const t = this.ctx.currentTime;

    // 1. Starter motor cranking pulses
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

    // 2. Engine Ignition Roar
    const roarOsc = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    const roarFilter = this.ctx.createBiquadFilter();

    roarOsc.type = 'sawtooth';
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(260, t + 0.38);
    roarFilter.frequency.exponentialRampToValueAtTime(700, t + 0.72);
    roarFilter.frequency.exponentialRampToValueAtTime(240, t + 1.25);

    roarOsc.frequency.setValueAtTime(52, t + 0.38);
    roarOsc.frequency.exponentialRampToValueAtTime(185, t + 0.72);
    roarOsc.frequency.exponentialRampToValueAtTime(52, t + 1.3);

    roarGain.gain.setValueAtTime(0.001, t + 0.38);
    roarGain.gain.linearRampToValueAtTime(0.24, t + 0.60);
    roarGain.gain.exponentialRampToValueAtTime(0.07, t + 1.3);

    roarOsc.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.ctx.destination);

    roarOsc.start(t + 0.38);
    roarOsc.stop(t + 1.32);

    if (this.ignitionTimeout) clearTimeout(this.ignitionTimeout);
    this.ignitionTimeout = setTimeout(() => {
      this.startContinuousEngine();
    }, 1300);
  }

  startContinuousEngine() {
    if (!this.ctx || this.isRunning || this.isMuted) return;

    this.isRunning = true;
    const t = this.ctx.currentTime;

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

  playHorn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, t);
    osc2.frequency.setValueAtTime(554, t); // Major third automotive horn interval

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gain.gain.setValueAtTime(0.18, t + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.23);
    osc2.stop(t + 0.23);
  }

  playDing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.14);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.43);
  }

  playSkid() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = Date.now();
    if (now - this.lastSkidTime < 350) return;
    this.lastSkidTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(680, t);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(820, t);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
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
    this.hornBtn = document.getElementById('hornBtn');
    this.toggleCamBtn = document.getElementById('toggleCamBtn');
    this.camIcon = document.getElementById('camIcon');
    this.hud = document.getElementById('driveHud');
    this.speedometer = document.getElementById('hudSpeed');
    this.speedBarFill = document.getElementById('speedBarFill');
    this.checkpointModal = document.getElementById('checkpointModal');
    this.cpModalCloseBtn = document.getElementById('cpModalCloseBtn');
    this.cpNumberEl = document.getElementById('cpModalNumber');
    this.cpTitleEl = document.getElementById('cpModalTitle');
    this.cpDescEl = document.getElementById('cpModalDesc');
    this.cpModalTags = document.getElementById('cpModalTags');
    this.cpModalLiveBtn = document.getElementById('cpModalLiveBtn');
    this.cpModalGithubBtn = document.getElementById('cpModalGithubBtn');
    this.cpActionBtn = document.getElementById('cpModalAction');
    this.mobileControls = document.getElementById('mobileDriveControls');
    this.navbar = document.getElementById('navbar');
    this.teleportBtns = document.querySelectorAll('.hud-teleport-btn');

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

    // Hook up road curve & jump ramps
    if (this.environment.roadCurve) {
      this.car.roadCurve = this.environment.roadCurve;
    }
    if (this.environment.ramps) {
      this.car.ramps = this.environment.ramps;
    }

    // 2. Setup Checkpoint callbacks
    this.checkpoints.onEnterCallback = (item) => {
      this.showCheckpointHUD(item);
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
        const item = this.checkpoints.activeCheckpoint;
        if (item.isProject && item.liveUrl) {
          window.open(item.liveUrl, '_blank');
        } else if (item.targetId) {
          this.exitDriveMode(item.targetId);
        }
      }
    };

    this.controls.onToggleSoundCallback = () => {
      this.handleSoundToggle();
    };

    this.controls.onHornCallback = () => {
      this.handleHorn();
    };

    this.controls.onCameraToggleCallback = () => {
      this.handleCameraToggle();
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

    if (this.hornBtn) {
      this.hornBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleHorn();
      });
    }

    if (this.toggleCamBtn) {
      this.toggleCamBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleCameraToggle();
      });
    }

    if (this.cpModalCloseBtn) {
      this.cpModalCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideCheckpointHUD();
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

    // 5. Bruno Simon Quick Teleport Buttons
    if (this.teleportBtns && this.teleportBtns.length > 0) {
      this.teleportBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const zoneId = btn.getAttribute('data-zone');
          this.teleportToZone(zoneId);
          this.teleportBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }

    // 6. Detect Touch Support for Mobile Controls
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch && this.mobileControls) {
      this.mobileControls.classList.add('touch-device');
    }

    // 7. Pause render loop & audio if tab is hidden
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

    // 8. Start render loop
    this.animate();
  }

  handleSoundToggle() {
    const isMuted = this.audio.toggleMute();
    if (this.soundIcon) {
      this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    }
  }

  handleHorn() {
    this.audio.playHorn();
    if (this.car) this.car.honk();
  }

  handleCameraToggle() {
    if (!this.cameraController) return;
    const newMode = this.cameraController.toggleViewMode();
    if (this.camIcon) {
      this.camIcon.textContent = newMode === 'ISOMETRIC' ? '📷 ISO' : '📷 CHASE';
    }
  }

  teleportToZone(zoneId) {
    if (!this.isActive) {
      this.enterDriveMode();
    }
    const coords = {
      'home':      { x: 0,   z: 20,    rot: 0 },
      'about':     { x: 9,   z: -560,  rot: 0 },
      'skills':    { x: 28,  z: -840,  rot: -Math.PI / 4 },
      'projects':  { x: -6,  z: -1140, rot: 0 },
      'education': { x: -6,  z: -1820, rot: 0 },
      'contact':   { x: 2,   z: -2190, rot: 0 },
    };
    const target = coords[zoneId] || coords['home'];
    if (this.car) {
      this.car.teleportTo(target.x, 0.45, target.z, target.rot);
    }
    if (this.cameraController && this.car) {
      this.cameraController.snapTo(this.car.position);
    }
    this.audio.playDing();
  }

  enterDriveMode() {
    this.isActive = true;
    document.body.classList.add('drive-mode-active');

    setTimeout(() => {
      if (this.driveScene) {
        this.driveScene.camera.aspect = window.innerWidth / window.innerHeight;
        this.driveScene.camera.updateProjectionMatrix();
        this.driveScene.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    }, 60);

    // Default to Bruno Simon elevated isometric view
    this.cameraController.setMode('DRIVING');

    // Show HUD & Focus
    if (this.hud) this.hud.classList.add('visible');
    if (this.navbar) this.navbar.classList.add('hidden-in-drive');

    // Synthesize BMW sports engine ignition roar!
    this.audio.playIgnition();

    this.controls.reset();
  }

  exitDriveMode(targetSectionId = null) {
    this.isActive = false;
    document.body.classList.remove('drive-mode-active');

    this.audio.stop();
    this.cameraController.setMode('PREVIEW');

    if (this.hud) this.hud.classList.remove('visible');
    if (this.navbar) this.navbar.classList.remove('hidden-in-drive');
    this.hideCheckpointHUD();

    this.controls.reset();

    if (targetSectionId) {
      setTimeout(() => {
        const el = document.getElementById(targetSectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 250);
    }
  }

  showCheckpointHUD(item) {
    if (!this.checkpointModal) return;
    this.audio.playDing();

    if (item.isProject) {
      if (this.cpNumberEl) this.cpNumberEl.textContent = item.category || 'PROJECT SHOWCASE';
      if (this.cpTitleEl) this.cpTitleEl.textContent = item.title;
      if (this.cpDescEl) this.cpDescEl.textContent = item.desc;

      // Render technology tags
      if (this.cpModalTags) {
        this.cpModalTags.innerHTML = (item.tags || []).map(t => `<span class="cp-tag-badge">${t}</span>`).join('');
        this.cpModalTags.style.display = 'flex';
      }

      // Live Demo Link
      if (this.cpModalLiveBtn) {
        if (item.liveUrl) {
          this.cpModalLiveBtn.href = item.liveUrl;
          this.cpModalLiveBtn.style.display = 'inline-flex';
        } else {
          this.cpModalLiveBtn.style.display = 'none';
        }
      }

      // GitHub Link
      if (this.cpModalGithubBtn) {
        this.cpModalGithubBtn.href = item.githubUrl || 'https://github.com/shrihari12012007-web';
        this.cpModalGithubBtn.style.display = 'inline-flex';
      }

      // Hide generic section button
      if (this.cpActionBtn) {
        this.cpActionBtn.style.display = 'none';
      }
    } else {
      // Standard Section Gate
      if (this.cpNumberEl) this.cpNumberEl.textContent = `CHECKPOINT ${item.number}`;
      if (this.cpTitleEl) this.cpTitleEl.textContent = item.title;
      if (this.cpDescEl) this.cpDescEl.textContent = item.desc;
      if (this.cpModalTags) this.cpModalTags.style.display = 'none';
      if (this.cpModalLiveBtn) this.cpModalLiveBtn.style.display = 'none';
      if (this.cpModalGithubBtn) this.cpModalGithubBtn.style.display = 'none';
      if (this.cpActionBtn) {
        this.cpActionBtn.style.display = 'inline-flex';
        this.cpActionBtn.textContent = `OPEN ${item.title} ↗`;
      }
    }

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

    if (this.isActive) {
      this.controls.update();
      this.car.update(delta, this.controls);
      this.checkpoints.update(this.car.position);

      this.audio.updateEngine(this.car.speedKmh, this.controls.throttle);

      if (this.car.isDrifting) {
        this.audio.playSkid();
      }

      if (this.speedometer) {
        const formattedSpeed = String(this.car.speedKmh).padStart(3, '0');
        this.speedometer.textContent = formattedSpeed;
      }
      if (this.speedBarFill) {
        const pct = Math.min(100, (this.car.speedKmh / 160) * 100);
        this.speedBarFill.style.width = pct + '%';
      }
    } else {
      if (this.car && this.car.speed !== 0) {
        this.car.speed *= 0.95;
        this.car.update(delta, { throttle: 0, reverse: 0, steer: 0, handbrake: false });
      }
    }

    this.environment.update(elapsedTime, delta);
    this.cameraController.update(delta, this.car, elapsedTime);
    this.driveScene.render();
  }
}

// Instantiate once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.driveApp = new DriveModeApp();
});
