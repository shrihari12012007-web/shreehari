/**
 * driveMode.js - Main Drive Mode Coordinator, Web Audio Engine, Transmission & Race Manager
 * Full Features:
 * - Dynamic Day / Sunset / Night cycle lighting toggle
 * - Full 360-Degree Camera Rotation via mouse/touch drag and 360° spin button
 * - Realistic 6-Speed M-Transmission with crisp gear shift sounds & exhaust crackle pops
 * - Quad exhaust flame burst VFX and RPM tachometer
 * - Interactive physics obstacles (tumbling traffic cones & crates with crash sounds)
 * - Turbo Nitro speed boost pads on the track
 * - AI Rival BMW sports car & Race Competition with 3-2-1 countdown, live lap timer, position tracker
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
    this.lastShiftTime = 0;
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

    // 1. Starter motor pulses
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

    // 2. Throaty Ignition Roar
    const roarOsc = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    const roarFilter = this.ctx.createBiquadFilter();

    roarOsc.type = 'sawtooth';
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(260, t + 0.38);
    roarFilter.frequency.exponentialRampToValueAtTime(740, t + 0.72);
    roarFilter.frequency.exponentialRampToValueAtTime(240, t + 1.25);

    roarOsc.frequency.setValueAtTime(52, t + 0.38);
    roarOsc.frequency.exponentialRampToValueAtTime(190, t + 0.72);
    roarOsc.frequency.exponentialRampToValueAtTime(52, t + 1.3);

    roarGain.gain.setValueAtTime(0.001, t + 0.38);
    roarGain.gain.linearRampToValueAtTime(0.26, t + 0.60);
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

  // Engine Pitch Driven by Engine RPM and Gear Shifts
  updateEngine(speedKmh, throttle, rpm = 1000, currentGear = 1, isShifting = false) {
    if (!this.isRunning || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // RPM fundamental frequency (1000 RPM ≈ 35Hz, 7000 RPM ≈ 220Hz)
    const rpmRatio = Math.max(0, Math.min(1.0, (rpm - 1000) / 6500));
    const targetFreq = 40 + rpmRatio * 185;

    // Throttle cut during gear shifting
    let targetGain = 0.055 + (throttle > 0 ? 0.055 : 0) + rpmRatio * 0.06;
    if (isShifting) {
      targetGain = 0.012; // momentary drop during DCT shift
    }

    const targetFilter = 240 + rpmRatio * 760;

    if (this.osc1) this.osc1.frequency.setTargetAtTime(targetFreq, t, 0.06);
    if (this.osc2) this.osc2.frequency.setTargetAtTime(targetFreq * 2, t, 0.06);
    if (this.gainNode) this.gainNode.gain.setTargetAtTime(targetGain, t, 0.04);
    if (this.filterNode) this.filterNode.frequency.setTargetAtTime(targetFilter, t, 0.06);
  }

  // Crisp DCT Gear Shift Click + Exhaust Crackle Pop
  playGearShift(type = 'up', gear = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = Date.now();
    if (now - this.lastShiftTime < 240) return;
    this.lastShiftTime = now;

    const t = this.ctx.currentTime;

    // 1. Mechanical shifter click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(type === 'up' ? 820 : 640, t);
    clickOsc.frequency.exponentialRampToValueAtTime(240, t + 0.04);

    clickGain.gain.setValueAtTime(0.12, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.06);

    // 2. Exhaust Backfire Pop
    this.playExhaustPop(t + 0.02);
  }

  // Exhaust Backfire Pop / Crackle (Sports Exhaust Burble)
  playExhaustPop(startTime = null) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = startTime || this.ctx.currentTime;

    // Dual noise burst for throaty backfire
    for (let p = 0; p < 2; p++) {
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      const popFilter = this.ctx.createBiquadFilter();

      popOsc.type = 'square';
      popOsc.frequency.setValueAtTime(140 + p * 60, t + p * 0.04);
      popOsc.frequency.exponentialRampToValueAtTime(45, t + p * 0.04 + 0.08);

      popFilter.type = 'lowpass';
      popFilter.frequency.setValueAtTime(550, t + p * 0.04);

      popGain.gain.setValueAtTime(0.18, t + p * 0.04);
      popGain.gain.exponentialRampToValueAtTime(0.001, t + p * 0.04 + 0.09);

      popOsc.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.ctx.destination);

      popOsc.start(t + p * 0.04);
      popOsc.stop(t + p * 0.04 + 0.1);
    }
  }

  // Turbo Nitro Boost Rush
  playBoost() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Rising turbo whistle
    const whistle = this.ctx.createOscillator();
    const wGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(450, t);
    whistle.frequency.exponentialRampToValueAtTime(1450, t + 0.35);

    wGain.gain.setValueAtTime(0.001, t);
    wGain.gain.linearRampToValueAtTime(0.15, t + 0.12);
    wGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    whistle.connect(wGain);
    wGain.connect(this.ctx.destination);
    whistle.start(t);
    whistle.stop(t + 0.56);
  }

  // Interactive Obstacle Crash Sound
  playObstacleCrash(type = 'cone') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type === 'cone' ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(type === 'cone' ? 320 : 160, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.14);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  // Race Countdown Beeps (3, 2, 1, GO!)
  playCountdownBeep(isGo = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'square' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.45 : 0.2));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + (isGo ? 0.46 : 0.22));
  }

  // Victory Fanfare
  playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.42);
    });
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
    osc2.frequency.setValueAtTime(554, t);

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
    if (now - this.lastSkidTime < 320) return;
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

// ── AI RIVAL CAR (Red Sports Coupe Competitor) ──
class RivalCar {
  constructor(scene, roadCurve) {
    this.scene = scene;
    this.roadCurve = roadCurve;
    this.splineT = 0;
    this.speed = 0;
    this.targetSpeed = 40.5; // units/sec (~145 km/h)
    this.isRacing = false;
    this.position = new THREE.Vector3(4.5, 0.45, 20);
    this.rotation = 0;

    this.meshGroup = new THREE.Group();
    this.initMesh();
    this.scene.add(this.meshGroup);
  }

  initMesh() {
    // Red Sports Coupe Body (Rosso Corsa Metallic)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xb5121b,
      metalness: 0.88,
      roughness: 0.22,
    });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.15, metalness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdde4ec, metalness: 0.98, roughness: 0.10 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x05080e, metalness: 0.95, roughness: 0.05, transparent: true, opacity: 0.86 });

    // 0. Soft Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.7, 5.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    this.meshGroup.add(shadow);

    // Lower Sculpted Chassis
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.32, 4.38), bodyMat);
    lowerBody.position.y = 0.24;
    this.meshGroup.add(lowerBody);

    // Front Bumper Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.05, 0.60), blackMat);
    splitter.position.set(0, 0.06, -2.20);
    this.meshGroup.add(splitter);

    // Sloping Aerodynamic Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.24, 1.60), bodyMat);
    hood.position.set(0, 0.44, -1.26);
    hood.rotation.x = -0.075;
    this.meshGroup.add(hood);

    // Sleek Aerodynamic Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.52, 2.05), blackMat);
    cabin.position.set(0, 0.78, 0.10);
    this.meshGroup.add(cabin);

    // Sloped Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.50, 0.70), glassMat);
    windshield.position.set(0, 0.76, -0.68);
    windshield.rotation.x = -0.52;
    this.meshGroup.add(windshield);

    // Fastback Rear Glass
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.46, 0.76), glassMat);
    rearGlass.position.set(0, 0.78, 0.84);
    rearGlass.rotation.x = 0.45;
    this.meshGroup.add(rearGlass);

    // Rear Carbon Lip Spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.04, 0.16), blackMat);
    spoiler.position.set(0, 0.62, 2.18);
    spoiler.rotation.x = 0.12;
    this.meshGroup.add(spoiler);

    // Dual Twin Chrome Exhaust Tips
    const exGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16);
    exGeo.rotateX(Math.PI / 2);
    [-0.55, 0.55].forEach(x => {
      const ex = new THREE.Mesh(exGeo, chromeMat);
      ex.position.set(x, 0.16, 2.24);
      this.meshGroup.add(ex);
    });

    // Aggressive Headlights
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
    [-0.72, 0.72].forEach((x, idx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.10, 0.14), hlMat);
      hl.position.set(x, 0.42, -2.20);
      hl.rotation.y = idx === 0 ? 0.22 : -0.22;
      this.meshGroup.add(hl);
    });

    // 3D LED Taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff002e });
    [-0.66, 0.66].forEach(x => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.08), tlMat);
      tl.position.set(x, 0.51, 2.22);
      this.meshGroup.add(tl);
    });

    // Realistic Alloy Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.92 });
    const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.27, 16);
    rimGeo.rotateZ(Math.PI / 2);

    [
      { x: -0.96, z: -1.35 },
      { x: 0.96,  z: -1.35 },
      { x: -0.96, z: 1.25 },
      { x: 0.96,  z: 1.25 },
    ].forEach(pos => {
      const wGroup = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, tireMat);
      const rim = new THREE.Mesh(rimGeo, chromeMat);
      wGroup.add(tire);
      wGroup.add(rim);
      wGroup.position.set(pos.x, 0.36, pos.z);
      this.meshGroup.add(wGroup);
    });

    this.meshGroup.position.copy(this.position);
  }

  reset() {
    this.splineT = 0;
    this.speed = 0;
    this.isRacing = false;
    this.position.set(4.5, 0.45, 20);
    this.rotation = 0;
    this.meshGroup.position.copy(this.position);
    this.meshGroup.rotation.y = 0;
  }

  update(delta) {
    if (!this.isRacing || !this.roadCurve) return;

    // Smooth acceleration
    if (this.speed < this.targetSpeed) {
      this.speed += 17.0 * delta;
    }

    // Advance along spline
    const totalCurveLength = 2370;
    const dt = (this.speed * delta) / totalCurveLength;
    this.splineT = Math.min(1.0, this.splineT + dt);

    const pt = this.roadCurve.getPointAt(this.splineT);
    const tangent = this.roadCurve.getTangentAt(this.splineT).normalize();
    const right = new THREE.Vector3(tangent.z, 0, -tangent.x);

    // Ride on right lane (offset = +4.2 units)
    this.position.copy(pt).addScaledVector(right, 4.2);
    this.position.y = 0.45;
    this.rotation = Math.atan2(tangent.x, tangent.z) + Math.PI;

    this.meshGroup.position.copy(this.position);
    this.meshGroup.rotation.y = this.rotation;

    if (this.splineT >= 0.998) {
      this.isRacing = false;
    }
  }
}

// ── MAIN DRIVE MODE APPLICATION ──
class DriveModeApp {
  constructor() {
    this.isActive = false;
    this.clock = null;
    this.driveScene = null;
    this.car = null;
    this.rival = null;
    this.environment = null;
    this.checkpoints = null;
    this.cameraController = null;
    this.controls = null;
    this.audio = new CarAudioEngine();
    this.isSupported = true;

    // Race State
    this.raceState = 'IDLE'; // 'IDLE', 'COUNTDOWN', 'RACING', 'FINISHED'
    this.raceTimer = 0;
    this.raceCountdown = 3;
    this.raceCountdownTimer = 0;

    // DOM Elements
    this.canvas = document.getElementById('driveCanvas');
    this.enterBtn = document.getElementById('enterDriveBtn');
    this.exitBtn = document.getElementById('exitDriveBtn');
    this.toggleSoundBtn = document.getElementById('toggleSoundBtn');
    this.soundIcon = document.getElementById('soundIcon');
    this.toggleDayNightBtn = document.getElementById('toggleDayNightBtn');
    this.dayNightIcon = document.getElementById('dayNightIcon');
    this.raceModeBtn = document.getElementById('raceModeBtn');
    this.spinCamBtn = document.getElementById('spinCamBtn');
    this.hornBtn = document.getElementById('hornBtn');
    this.toggleCamBtn = document.getElementById('toggleCamBtn');
    this.camIcon = document.getElementById('camIcon');
    this.hud = document.getElementById('driveHud');
    this.speedometer = document.getElementById('hudSpeed');
    this.speedBarFill = document.getElementById('speedBarFill');
    this.rpmBarFill = document.getElementById('rpmBarFill');
    this.hudGear = document.getElementById('hudGear');
    this.raceBanner = document.getElementById('raceBanner');
    this.raceCountdownText = document.getElementById('raceCountdownText');
    this.raceStatusText = document.getElementById('raceStatusText');
    this.raceStatsPanel = document.getElementById('raceStatsPanel');
    this.raceTimerDisplay = document.getElementById('raceTimerDisplay');
    this.racePosDisplay = document.getElementById('racePosDisplay');
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
    this.rival = new RivalCar(this.driveScene.scene, this.environment.roadCurve);
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

    // 2. Setup Car Audio Callbacks (Gear Shifts, Exhaust Pops, Boost, Obstacles)
    this.car.onGearShiftCallback = (type, gear) => {
      this.audio.playGearShift(type, gear);
    };
    this.car.onBoostHit = () => {
      this.audio.playBoost();
    };
    this.car.onObstacleHit = (type) => {
      this.audio.playObstacleCrash(type);
    };

    // 3. Setup Checkpoint callbacks
    this.checkpoints.onEnterCallback = (item) => {
      if (this.raceState !== 'RACING') {
        this.showCheckpointHUD(item);
      }
    };
    this.checkpoints.onLeaveCallback = () => {
      this.hideCheckpointHUD();
    };

    // 4. Setup Controls callbacks
    this.controls.onExitCallback = () => {
      if (this.isActive) this.exitDriveMode();
    };
    this.controls.onResetCallback = () => {
      if (this.isActive && this.car) {
        this.car.resetPosition();
        if (this.raceState === 'RACING') {
          this.startRace();
        }
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

    // 5. Bind UI Buttons
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

    if (this.toggleDayNightBtn) {
      this.toggleDayNightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDayNightToggle();
      });
    }

    if (this.raceModeBtn) {
      this.raceModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startRace();
      });
    }

    if (this.spinCamBtn) {
      this.spinCamBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isSpin = this.cameraController.toggleAutoSpin();
        this.spinCamBtn.style.color = isSpin ? '#00f0ff' : '#ddd';
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

    // 6. Quick Teleport Navigation
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

    // 7. Touch Support
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch && this.mobileControls) {
      this.mobileControls.classList.add('touch-device');
    }

    // 8. Visibility change handling
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

    // 9. Start loop
    this.animate();
  }

  handleSoundToggle() {
    const isMuted = this.audio.toggleMute();
    if (this.soundIcon) {
      this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    }
  }

  handleDayNightToggle() {
    if (!this.driveScene) return;
    const mode = this.driveScene.toggleTimeOfDay();
    if (this.dayNightIcon) {
      if (mode === 'DAY') this.dayNightIcon.textContent = '☀️ DAY';
      else if (mode === 'SUNSET') this.dayNightIcon.textContent = '🌅 DUSK';
      else this.dayNightIcon.textContent = '🌙 NIGHT';
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
      if (newMode === 'ISOMETRIC') this.camIcon.textContent = '📷 ISO';
      else if (newMode === 'CHASE') this.camIcon.textContent = '📷 CHASE';
      else this.camIcon.textContent = '🔄 360°';
    }
  }

  // ── RACE COMPETITION ENGINE ──
  startRace() {
    if (!this.isActive) {
      this.enterDriveMode();
    }
    this.hideCheckpointHUD();

    // 1. Grid line up: Player on Left, Rival on Right
    this.car.teleportTo(-4.0, 0.45, 20, 0);
    this.rival.reset();
    this.cameraController.snapTo(this.car.position);

    // 2. Start Countdown
    this.raceState = 'COUNTDOWN';
    this.raceCountdown = 3;
    this.raceCountdownTimer = 0;
    this.raceTimer = 0;

    if (this.raceBanner) this.raceBanner.style.display = 'block';
    if (this.raceCountdownText) this.raceCountdownText.textContent = '3';
    if (this.raceStatusText) this.raceStatusText.textContent = 'GET READY';
    if (this.raceStatsPanel) this.raceStatsPanel.style.display = 'flex';

    this.audio.playCountdownBeep(false);
  }

  updateRace(delta) {
    if (this.raceState === 'COUNTDOWN') {
      this.raceCountdownTimer += delta;
      if (this.raceCountdownTimer >= 1.0) {
        this.raceCountdownTimer = 0;
        this.raceCountdown--;

        if (this.raceCountdown === 2) {
          if (this.raceCountdownText) this.raceCountdownText.textContent = '2';
          this.audio.playCountdownBeep(false);
        } else if (this.raceCountdown === 1) {
          if (this.raceCountdownText) this.raceCountdownText.textContent = '1';
          this.audio.playCountdownBeep(false);
        } else if (this.raceCountdown === 0) {
          if (this.raceCountdownText) {
            this.raceCountdownText.textContent = 'GO!';
            this.raceCountdownText.style.color = '#4ade80';
          }
          if (this.raceStatusText) this.raceStatusText.textContent = 'RACE IN PROGRESS';
          this.audio.playCountdownBeep(true);
          this.raceState = 'RACING';
          this.rival.isRacing = true;

          setTimeout(() => {
            if (this.raceBanner && this.raceState === 'RACING') {
              this.raceBanner.style.display = 'none';
            }
          }, 1200);
        }
      }
    } else if (this.raceState === 'RACING') {
      this.raceTimer += delta;

      // Format Timer mm:ss.d
      const mins = Math.floor(this.raceTimer / 60);
      const secs = (this.raceTimer % 60).toFixed(1);
      const formattedTime = `${String(mins).padStart(2, '0')}:${secs.padStart(4, '0')}`;
      if (this.raceTimerDisplay) this.raceTimerDisplay.textContent = formattedTime;

      // Position check (Player vs Rival along Z distance)
      const isPlayerAhead = this.car.position.z < this.rival.position.z;
      if (this.racePosDisplay) {
        this.racePosDisplay.textContent = isPlayerAhead ? '1st' : '2nd';
        this.racePosDisplay.className = isPlayerAhead ? 'race-stat-val gold' : 'race-stat-val';
      }

      // Finish Line at Z = -2250
      if (this.car.position.z <= -2240 || this.rival.position.z <= -2240) {
        this.raceState = 'FINISHED';
        this.rival.isRacing = false;
        const playerWon = this.car.position.z <= this.rival.position.z;

        if (this.raceBanner) this.raceBanner.style.display = 'block';
        if (this.raceCountdownText) {
          this.raceCountdownText.textContent = playerWon ? '🏆 YOU WON!' : '🥈 RIVAL WON';
          this.raceCountdownText.style.color = playerWon ? '#facc15' : '#f43f5e';
        }
        if (this.raceStatusText) {
          this.raceStatusText.textContent = `FINAL TIME: ${formattedTime}`;
        }

        if (playerWon) {
          this.audio.playVictory();
        }
      }
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

    this.cameraController.setMode('DRIVING');

    if (this.hud) this.hud.classList.add('visible');
    if (this.navbar) this.navbar.classList.add('hidden-in-drive');

    this.audio.playIgnition();
    this.controls.reset();
  }

  exitDriveMode(targetSectionId = null) {
    this.isActive = false;
    this.raceState = 'IDLE';
    document.body.classList.remove('drive-mode-active');

    this.audio.stop();
    this.cameraController.setMode('PREVIEW');

    if (this.hud) this.hud.classList.remove('visible');
    if (this.navbar) this.navbar.classList.remove('hidden-in-drive');
    if (this.raceBanner) this.raceBanner.style.display = 'none';
    if (this.raceStatsPanel) this.raceStatsPanel.style.display = 'none';
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

      if (this.cpModalTags) {
        this.cpModalTags.innerHTML = (item.tags || []).map(t => `<span class="cp-tag-badge">${t}</span>`).join('');
        this.cpModalTags.style.display = 'flex';
      }

      if (this.cpModalLiveBtn) {
        if (item.liveUrl) {
          this.cpModalLiveBtn.href = item.liveUrl;
          this.cpModalLiveBtn.style.display = 'inline-flex';
        } else {
          this.cpModalLiveBtn.style.display = 'none';
        }
      }

      if (this.cpModalGithubBtn) {
        this.cpModalGithubBtn.href = item.githubUrl || 'https://github.com/shrihari12012007-web';
        this.cpModalGithubBtn.style.display = 'inline-flex';
      }

      if (this.cpActionBtn) {
        this.cpActionBtn.style.display = 'none';
      }
    } else {
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

      // Audio engine pitch dynamically driven by RPM and gear
      this.audio.updateEngine(
        this.car.speedKmh,
        this.controls.throttle,
        this.car.rpm,
        this.car.currentGear,
        this.car.isShifting
      );

      if (this.car.isDrifting) {
        this.audio.playSkid();
      }

      // Update AI Rival & Race Competition
      if (this.rival) {
        this.rival.update(delta);
      }
      this.updateRace(delta);

      // Telemetry (Speed, Gear & Tachometer)
      if (this.speedometer) {
        const formattedSpeed = String(this.car.speedKmh).padStart(3, '0');
        this.speedometer.textContent = formattedSpeed;
      }
      if (this.speedBarFill) {
        const pct = Math.min(100, (this.car.speedKmh / 160) * 100);
        this.speedBarFill.style.width = pct + '%';
      }
      if (this.hudGear) {
        this.hudGear.textContent = this.car.currentGear || 1;
      }
      if (this.rpmBarFill) {
        const rpmPct = Math.min(100, Math.max(10, ((this.car.rpm - 1000) / 6500) * 100));
        this.rpmBarFill.style.width = rpmPct + '%';
      }
    } else {
      if (this.car && this.car.speed !== 0) {
        this.car.speed *= 0.95;
        this.car.update(delta, { throttle: 0, reverse: 0, steer: 0, handbrake: false });
      }
    }

    this.environment.update(elapsedTime, delta, this.car);
    this.cameraController.update(delta, this.car, elapsedTime);
    this.driveScene.render();
  }
}

// Instantiate once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.driveApp = new DriveModeApp();
});
