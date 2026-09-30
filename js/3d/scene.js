/**
 * scene.js - Three.js Engine Setup & Lighting
 * Renderer, ambient lighting, directional moonlight, exponential fog,
 * DPR clamping, and responsive resize handling.
 */

class DriveScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // Night atmosphere fog matching portfolio dark aesthetic
    this.scene.background = new THREE.Color(0x060812);
    this.scene.fog = new THREE.FogExp2(0x060812, 0.0022);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1400);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });

    // Performance: Clamp DPR to prevent 4K GPU choke
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.initLights();
    this.initResize();
  }

  initLights() {
    // Ambient night sky fill
    const ambient = new THREE.AmbientLight(0x18243c, 0.85);
    this.scene.add(ambient);

    // Hemisphere light (sky vs ground tint)
    const hemiLight = new THREE.HemisphereLight(0x223555, 0x05070c, 0.6);
    this.scene.add(hemiLight);

    // Moonlight / distant city glow key light
    const moonDir = new THREE.DirectionalLight(0x6088b0, 1.4);
    moonDir.position.set(40, 75, -50);
    this.scene.add(moonDir);

    // Subtle cyan backlight accentuating edges
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.55);
    rimLight.position.set(-60, 45, 60);
    this.scene.add(rimLight);
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
