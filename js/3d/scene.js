/**
 * scene.js - High-Clarity Three.js Engine with Smooth Dynamic Day/Night Atmosphere Transitions
 * Features:
 * - Seamless continuous real-time interpolation of sky color, sunlight, ambient intensity, fog, and exposure
 * - Smooth Day, Sunset, and Night lighting presets for optimal visual clarity
 * - Crisp ACESFilmic tone mapping with optimized DPR clamping
 * - User toggleable via HUD button or auto-cycle
 */

class DriveScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // Mode: 'DAY', 'SUNSET', 'NIGHT', or 'AUTO'
    this.timeOfDay = 'DAY';
    this.cycleProgress = 0.25;
    this.autoCycle = false;

    // Presets for lighting & atmosphere
    this.presets = {
      DAY: {
        bgColor: new THREE.Color(0x7ebbff),
        fogColor: new THREE.Color(0x8bc4ff),
        fogDensity: 0.0005, // Crystal clear visibility
        sunColor: new THREE.Color(0xfff6e8),
        sunIntensity: 1.85,
        sunPos: new THREE.Vector3(70, 110, -30),
        ambientColor: new THREE.Color(0xd6eaff),
        ambientIntensity: 1.15,
        hemiSky: new THREE.Color(0x99ccff),
        hemiGround: new THREE.Color(0x385538),
        hemiIntensity: 0.75,
        exposure: 1.18,
      },
      SUNSET: {
        bgColor: new THREE.Color(0xf97316),
        fogColor: new THREE.Color(0xfb923c),
        fogDensity: 0.0008,
        sunColor: new THREE.Color(0xffaa44),
        sunIntensity: 1.6,
        sunPos: new THREE.Vector3(120, 35, -40),
        ambientColor: new THREE.Color(0x7c2d12),
        ambientIntensity: 0.9,
        hemiSky: new THREE.Color(0xf97316),
        hemiGround: new THREE.Color(0x1e1b4b),
        hemiIntensity: 0.65,
        exposure: 1.1,
      },
      NIGHT: {
        bgColor: new THREE.Color(0x060914),
        fogColor: new THREE.Color(0x080c1a),
        fogDensity: 0.0013,
        sunColor: new THREE.Color(0x7090c8),
        sunIntensity: 1.25,
        sunPos: new THREE.Vector3(45, 80, -40),
        ambientColor: new THREE.Color(0x18243c),
        ambientIntensity: 0.85,
        hemiSky: new THREE.Color(0x1e293b),
        hemiGround: new THREE.Color(0x020617),
        hemiIntensity: 0.6,
        exposure: 1.12,
      },
    };

    // Camera
    this.camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1600);

    // Renderer with ACESFilmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.initAtmosphere();
    this.initLights();
    this.initResize();
  }

  initAtmosphere() {
    const p = this.presets[this.timeOfDay];
    this.scene.background = p.bgColor.clone();
    this.scene.fog = new THREE.FogExp2(p.fogColor.getHex(), p.fogDensity);
  }

  initLights() {
    const p = this.presets[this.timeOfDay];

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(p.ambientColor.clone(), p.ambientIntensity);
    this.scene.add(this.ambientLight);

    // Hemisphere light (sky vs ground)
    this.hemiLight = new THREE.HemisphereLight(p.hemiSky.clone(), p.hemiGround.clone(), p.hemiIntensity);
    this.scene.add(this.hemiLight);

    // Main Sun / Moon directional light
    this.sunLight = new THREE.DirectionalLight(p.sunColor.clone(), p.sunIntensity);
    this.sunLight.position.copy(p.sunPos);
    this.scene.add(this.sunLight);

    // Vibrant cyan accent / rim light
    this.rimLight = new THREE.DirectionalLight(0x00f0ff, 0.45);
    this.rimLight.position.set(-60, 45, 60);
    this.scene.add(this.rimLight);
  }

  toggleTimeOfDay() {
    // Cycle between DAY -> SUNSET -> NIGHT -> DAY
    if (this.timeOfDay === 'DAY') {
      this.setTimeOfDay('SUNSET');
    } else if (this.timeOfDay === 'SUNSET') {
      this.setTimeOfDay('NIGHT');
    } else {
      this.setTimeOfDay('DAY');
    }
    return this.timeOfDay;
  }

  setTimeOfDay(mode) {
    if (!this.presets[mode]) return;
    this.timeOfDay = mode;
  }

  // Smooth continuous atmosphere and lighting interpolation
  update(delta) {
    if (!delta) delta = 0.016;
    const p = this.presets[this.timeOfDay];
    if (!p) return;

    // Smooth exponential blend factor (~1.2s gradual time-lapse transition)
    const t = 1 - Math.exp(-2.8 * delta);

    if (this.scene.background) {
      this.scene.background.lerp(p.bgColor, t);
    }
    if (this.scene.fog) {
      this.scene.fog.color.lerp(p.fogColor, t);
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, p.fogDensity, t);
    }

    if (this.sunLight) {
      this.sunLight.color.lerp(p.sunColor, t);
      this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, p.sunIntensity, t);
      this.sunLight.position.lerp(p.sunPos, t);
    }

    if (this.ambientLight) {
      this.ambientLight.color.lerp(p.ambientColor, t);
      this.ambientLight.intensity = THREE.MathUtils.lerp(this.ambientLight.intensity, p.ambientIntensity, t);
    }

    if (this.hemiLight) {
      this.hemiLight.color.lerp(p.hemiSky, t);
      this.hemiLight.groundColor.lerp(p.hemiGround, t);
      this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, p.hemiIntensity, t);
    }

    if (this.renderer) {
      this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, p.exposure, t);
    }

    if (this.rimLight) {
      const targetRim = (this.timeOfDay === 'NIGHT') ? 0.75 : 0.35;
      this.rimLight.intensity = THREE.MathUtils.lerp(this.rimLight.intensity, targetRim, t);
    }

    // Optional gentle auto-cycle
    if (this.autoCycle) {
      this.cycleProgress = (this.cycleProgress + delta * 0.012) % 1.0;
    }
  }

  initResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.DriveScene = DriveScene;
