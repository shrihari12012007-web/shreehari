/**
 * checkpoints.js - Interactive 3D Portfolio Checkpoints
 * Places glowing holographic gates along the bridge and triggers portfolio section overlays.
 */

class CheckpointManager {
  constructor(scene) {
    this.scene = scene;
    this.activeCheckpoint = null;
    this.onEnterCallback = null;
    this.onLeaveCallback = null;

    this.checkpoints = [
      {
        id: 'about',
        z: -280,
        number: '01',
        title: 'ABOUT ME',
        subtitle: 'Background & Engineering Journey',
        desc: 'B.E. Computer Science student at Jain Institute of Technology.',
        targetId: 'about',
        color: 0x00f0ff, // cyan
      },
      {
        id: 'skills',
        z: -650,
        number: '02',
        title: 'TECHNICAL SKILLS',
        subtitle: 'Languages & Core Technologies',
        desc: 'Python, C, Java, JavaScript, AI/ML, Computer Vision, React.',
        targetId: 'skills',
        color: 0x38bdf8, // sky blue
      },
      {
        id: 'projects',
        z: -1150,
        number: '03',
        title: 'PROJECTS SHOWCASE',
        subtitle: 'The Middle Bridge',
        desc: 'Nova Cuts, Panda AI Voice Assistant, Eye Care, Gesture Camera.',
        targetId: 'projects',
        color: 0xa855f7, // purple
      },
      {
        id: 'education',
        z: -1680,
        number: '04',
        title: 'EDUCATION & CERTS',
        subtitle: 'Academic Milestones & Certifications',
        desc: 'Bachelor of Engineering in CSE (2025–Present) & Key Certs.',
        targetId: 'education',
        color: 0x4ade80, // emerald green
      },
      {
        id: 'contact',
        z: -2150,
        number: '05',
        title: 'LET\'S CONNECT',
        subtitle: 'Finish Line & Direct Reachout',
        desc: 'Get in touch for internships, projects, and collaboration.',
        targetId: 'contact',
        color: 0xf43f5e, // warm red/pink
      },
    ];

    this.projectBillboards = [
      {
        title: 'NOVA CUTS',
        category: 'WEB APP · LIVE',
        desc: 'Smart Salon & Grooming Booking Platform with Render Hosting',
        x: -14.2,
        z: -1080,
        color: '#00f0ff',
      },
      {
        title: 'PANDA AI',
        category: 'AI / PYTHON',
        desc: 'Smart Desktop Voice Assistant with Speech Recognition & Automation',
        x: 14.2,
        z: -1080,
        color: '#a855f7',
      },
      {
        title: 'EYE CARE MONITOR',
        category: 'COMPUTER VISION',
        desc: 'AI Distance & Blink Rate Health Guard with Real-time Camera Tracking',
        x: -14.2,
        z: -1220,
        color: '#4ade80',
      },
      {
        title: 'GESTURE CAMERA',
        category: 'OPENCV / MEDIAPIPE',
        desc: 'Touchless Hand Gesture System Control & Real-time Vision Interface',
        x: 14.2,
        z: -1220,
        color: '#f59e0b',
      },
    ];

    this.initCheckpointMeshes();
  }

  createHologramTexture(textNumber, textTitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, 'rgba(6, 12, 28, 0.0)');
    grad.addColorStop(0.2, 'rgba(6, 16, 36, 0.85)');
    grad.addColorStop(0.8, 'rgba(6, 16, 36, 0.85)');
    grad.addColorStop(1, 'rgba(6, 12, 28, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 20, canvas.width - 160, canvas.height - 40);

    // Text: Checkpoint Number
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CHECKPOINT ${textNumber}`, canvas.width / 2, 90);

    // Text: Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 74px "Space Grotesk", sans-serif';
    ctx.fillText(textTitle, canvas.width / 2, 190);

    // Prompt hint
    ctx.fillStyle = '#888888';
    ctx.font = '28px "JetBrains Mono", monospace';
    ctx.fillText('PRESS [ENTER] TO OPEN SECTION', canvas.width / 2, 255);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  initCheckpointMeshes() {
    this.checkpoints.forEach(cp => {
      const group = new THREE.Group();

      // Gate Arch frame
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x181e2b,
        metalness: 0.9,
        roughness: 0.2,
      });

      const neonMat = new THREE.MeshBasicMaterial({
        color: cp.color,
      });

      // Left Pillar
      const pillarGeo = new THREE.BoxGeometry(0.8, 14, 0.8);
      const leftPillar = new THREE.Mesh(pillarGeo, archMat);
      leftPillar.position.set(-11, 7, cp.z);
      group.add(leftPillar);

      // Right Pillar
      const rightPillar = new THREE.Mesh(pillarGeo, archMat);
      rightPillar.position.set(11, 7, cp.z);
      group.add(rightPillar);

      // Glowing vertical laser strips
      const laserGeo = new THREE.BoxGeometry(0.12, 13.8, 0.12);
      const laserL = new THREE.Mesh(laserGeo, neonMat);
      laserL.position.set(-10.6, 7, cp.z);
      group.add(laserL);

      const laserR = new THREE.Mesh(laserGeo, neonMat);
      laserR.position.set(10.6, 7, cp.z);
      group.add(laserR);

      // Top Crossbar
      const barGeo = new THREE.BoxGeometry(23.2, 0.9, 0.9);
      const crossbar = new THREE.Mesh(barGeo, archMat);
      crossbar.position.set(0, 13.8, cp.z);
      group.add(crossbar);

      // Glowing Top neon line
      const topNeonGeo = new THREE.BoxGeometry(22.8, 0.12, 0.12);
      const topNeon = new THREE.Mesh(topNeonGeo, neonMat);
      topNeon.position.set(0, 13.3, cp.z);
      group.add(topNeon);

      // Floating Holographic Signboard
      const signGeo = new THREE.PlaneGeometry(16, 5);
      const signTex = this.createHologramTexture(cp.number, cp.title);
      const signMat = new THREE.MeshBasicMaterial({
        map: signTex,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      });
      const signMesh = new THREE.Mesh(signGeo, signMat);
      signMesh.position.set(0, 10.2, cp.z);
      group.add(signMesh);

      // Subtle ground ring on road
      const ringGeo = new THREE.PlaneGeometry(18, 2.5);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cp.color,
        transparent: true,
        opacity: 0.25,
      });
      const groundGlow = new THREE.Mesh(ringGeo, ringMat);
      groundGlow.position.set(0, 0.03, cp.z);
      group.add(groundGlow);

      this.scene.add(group);
    });

    // ── 3D PROJECT BILLBOARDS ON THE MIDDLE BRIDGE ──
    this.projectBillboards.forEach(item => {
      const bGroup = new THREE.Group();

      const supportMat = new THREE.MeshStandardMaterial({
        color: 0x141824,
        metalness: 0.85,
        roughness: 0.3,
      });

      // Dual support posts anchored to bridge deck
      [-3.8, 3.8].forEach(dx => {
        const postGeo = new THREE.BoxGeometry(0.35, 11, 0.35);
        const post = new THREE.Mesh(postGeo, supportMat);
        post.position.set(item.x, 5.5, item.z + dx);
        bGroup.add(post);
      });

      // Billboard Frame
      const frameGeo = new THREE.BoxGeometry(0.4, 6.2, 11.2);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x090c14,
        metalness: 0.9,
        roughness: 0.2,
      });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(item.x, 9.2, item.z);
      bGroup.add(frame);

      // Glowing display panel facing the oncoming car
      const screenGeo = new THREE.PlaneGeometry(10.8, 5.8);
      const tex = this.createBillboardTexture(item);
      const screenMat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      // Face towards oncoming car (facing +Z) and angled inward
      const angle = item.x < 0 ? 0.38 : -0.38;
      screen.position.set(item.x > 0 ? item.x - 0.25 : item.x + 0.25, 9.2, item.z);
      screen.rotation.y = angle;
      bGroup.add(screen);

      this.scene.add(bGroup);
    });
  }

  createBillboardTexture(item) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep dark background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gradient container
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(12, 22, 44, 0.95)');
    grad.addColorStop(1, 'rgba(4, 8, 16, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Top Accent Neon Bar
    ctx.fillStyle = item.color;
    ctx.fillRect(10, 10, canvas.width - 20, 12);

    // Outer border
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Category / Tag
    ctx.fillStyle = item.color;
    ctx.font = 'bold 30px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(item.category, 60, 85);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Space Grotesk", sans-serif';
    ctx.fillText(item.title, 60, 175);

    // Divider line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(60, 215, canvas.width - 120, 3);

    // Description with text wrapping
    ctx.fillStyle = '#94a3b8';
    ctx.font = '34px "Inter", sans-serif';
    const words = item.desc.split(' ');
    let line = '';
    let y = 285;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 140 && n > 0) {
        ctx.fillText(line, 60, y);
        line = words[n] + ' ';
        y += 48;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 60, y);

    // Bottom prompt
    ctx.fillStyle = item.color;
    ctx.font = 'bold 26px "Space Grotesk", sans-serif';
    ctx.fillText('PRESS [ENTER] TO OPEN FULL DETAILS ↗', 60, 450);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  update(carPosition) {
    const triggerRadius = 26; // units around checkpoint center
    let found = null;

    for (let cp of this.checkpoints) {
      const dist = Math.abs(carPosition.z - cp.z);
      if (dist < triggerRadius && Math.abs(carPosition.x) < 11) {
        found = cp;
        break;
      }
    }

    if (found && (!this.activeCheckpoint || this.activeCheckpoint.id !== found.id)) {
      this.activeCheckpoint = found;
      if (this.onEnterCallback) this.onEnterCallback(found);
    } else if (!found && this.activeCheckpoint) {
      if (this.onLeaveCallback) this.onLeaveCallback(this.activeCheckpoint);
      this.activeCheckpoint = null;
    }
  }
}

window.CheckpointManager = CheckpointManager;
