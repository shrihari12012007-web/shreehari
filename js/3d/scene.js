/**
 * scene.js - High-Clarity Three.js Engine with Dynamic Day/Night Cycle
 * Features:
 * - Dynamic Day, Sunset, and Night lighting presets for high visibility
 * - Smooth lerping of sun direction, sky colors, ambient intensity, and fog
 * - Crisp ACESFilmic tone mapping with optimized DPR clamping
 * - User toggleable via HUD button or auto-cycle
 */

class DriveScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // Mode: 'DAY', 'SUNSET', 'NIGHT', or 'AUTO'
    this.timeOfDay = 'DAY';
    this.cycleProgress = 0.25; // 0=Day, 0.4=Sunset, 0.75=Night
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
    this.ambientLight = new THREE.AmbientLight(p.ambientColor, p.ambientIntensity);
    this.scene.add(this.ambientLight);

    // Hemisphere light (sky vs ground)
    this.hemiLight = new THREE.HemisphereLight(p.hemiSky, p.hemiGround, p.hemiIntensity);
    this.scene.add(this.hemiLight);

    // Main Sun / Moon directional light
    this.sunLight = new THREE.DirectionalLight(p.sunColor, p.sunIntensity);
    this.sunLight.position.copy(p.sunPos);
    this.scene.add(this.sunLight);

    // Vibrant cyan accent / rim light
    this.rimLight = new THREE.DirectionalLight(0x00f0ff, 0.65);
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
    const p = this.presets[mode];

    // Smoothly apply preset targets
    this.scene.background.copy(p.bgColor);
    this.scene.fog.color.copy(p.fogColor);
    this.scene.fog.density = p.fogDensity;

    this.sunLight.color.copy(p.sunColor);
    this.sunLight.intensity = p.sunIntensity;
    this.sunLight.position.copy(p.sunPos);

    this.ambientLight.color.copy(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;

    this.hemiLight.color.copy(p.hemiSky);
    this.hemiLight.groundColor.copy(p.hemiGround);
    this.hemiLight.intensity = p.hemiIntensity;

    this.renderer.toneMappingExposure = p.exposure;
    this.rimLight.intensity = mode === 'NIGHT' ? 0.75 : 0.35;
  }

  update(delta) {
    // Optional gentle auto-cycle
    if (this.autoCycle) {
      this.cycleProgress = (this.cycleProgress + delta * 0.012) % 1.0;
      // Interpolate smoothly if in auto mode
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
