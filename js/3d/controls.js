/**
 * controls.js - User Input Handler for 3D Drive Mode
 * Handles keyboard (WASD / Arrows / Space / R / ESC) and mobile touch controls.
 */

class DriveControls {
  constructor() {
    this.throttle = 0;      // 0 to 1
    this.reverse = 0;       // 0 to 1
    this.steer = 0;         // -1 (left) to 1 (right)
    this.handbrake = false;
    this.resetCar = false;
    this.exitRequested = false;
    this.interactCheckpoint = false;

    this.keys = {};
    this.touchActive = false;

    this.onExitCallback = null;
    this.onResetCallback = null;
    this.onInteractCallback = null;
    this.onToggleSoundCallback = null;
    this.onHornCallback = null;
    this.onCameraToggleCallback = null;

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'Escape') {
        if (this.onExitCallback) this.onExitCallback();
      }
      if (e.code === 'KeyR') {
        if (this.onResetCallback) this.onResetCallback();
      }
      if (e.code === 'Enter') {
        if (this.onInteractCallback) this.onInteractCallback();
      }
      if (e.code === 'KeyM') {
        if (this.onToggleSoundCallback) this.onToggleSoundCallback();
      }
      if (e.code === 'KeyH') {
        if (this.onHornCallback) this.onHornCallback();
      }
      if (e.code === 'KeyC') {
        if (this.onCameraToggleCallback) this.onCameraToggleCallback();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  initTouch() {
    // Touch event listeners for mobile UI buttons
    const bindTouchBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      const down = (e) => { e.preventDefault(); onDown(); };
      const up = (e) => { e.preventDefault(); onUp(); };
      el.addEventListener('touchstart', down, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('mousedown', down);
      el.addEventListener('mouseup', up);
      el.addEventListener('mouseleave', up);
    };

    bindTouchBtn('touchGas',   () => { this.touchGas = true; },   () => { this.touchGas = false; });
    bindTouchBtn('touchBrake', () => { this.touchBrake = true; }, () => { this.touchBrake = false; });
    bindTouchBtn('touchLeft',  () => { this.touchLeft = true; },  () => { this.touchLeft = false; });
    bindTouchBtn('touchRight', () => { this.touchRight = true; }, () => { this.touchRight = false; });
  }

  update() {
    const k = this.keys;

    // Throttle / Accelerate
    const forward = k['KeyW'] || k['ArrowUp'] || this.touchGas;
    const backward = k['KeyS'] || k['ArrowDown'] || this.touchBrake;

    this.throttle = forward ? 1.0 : 0.0;
    this.reverse = backward ? 1.0 : 0.0;

    // Steering with smooth interpolation
    let targetSteer = 0;
    if (k['KeyA'] || k['ArrowLeft'] || this.touchLeft)  targetSteer -= 1;
    if (k['KeyD'] || k['ArrowRight'] || this.touchRight) targetSteer += 1;

    // Smooth return to center
    const steerSpeed = 0.15;
    this.steer += (targetSteer - this.steer) * steerSpeed;

    // Handbrake
    this.handbrake = !!k['Space'];
  }

  reset() {
    this.throttle = 0;
    this.reverse = 0;
    this.steer = 0;
    this.handbrake = false;
    this.keys = {};
  }
}

window.DriveControls = DriveControls;
