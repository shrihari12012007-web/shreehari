/**
 * driveMode.js - Main Drive Mode Coordinator & HUD Manager
 * Coordinates WebGL scene, sports car, bridge environment, checkpoints, camera,
 * cinematic mode transitions, HUD display, and checkpoint section navigation.
 */

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
    this.isSupported = true;

    // DOM Elements
    this.canvas = document.getElementById('driveCanvas');
    this.heroSection = document.getElementById('home');
    this.enterBtn = document.getElementById('enterDriveBtn');
    this.exitBtn = document.getElementById('exitDriveBtn');
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

    // 6. Pause render loop if tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clock.stop();
      } else {
        this.clock.start();
      }
    });

    // 7. Start render loop
    this.animate();
  }

  enterDriveMode() {
    this.isActive = true;
    document.body.classList.add('drive-mode-active');

    // Smoothly scroll to top so canvas is full viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Switch Camera to follow chase mode
    this.cameraController.setMode('DRIVING');

    // Show HUD & Focus
    if (this.hud) this.hud.classList.add('visible');
    if (this.navbar) this.navbar.classList.add('hidden-in-drive');

    // Focus controls
    this.controls.reset();
  }

  exitDriveMode(targetSectionId = null) {
    this.isActive = false;
    document.body.classList.remove('drive-mode-active');

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

    // In Drive Mode: update user controls & car physics
    if (this.isActive) {
      this.controls.update();
      this.car.update(delta, this.controls);
      this.checkpoints.update(this.car.position);

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
