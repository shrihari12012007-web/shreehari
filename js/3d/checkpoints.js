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
        z: -180,
        number: '01',
        title: 'ABOUT ME',
        subtitle: 'Background & Engineering Journey',
        desc: 'B.E. Computer Science student at Jain Institute of Technology.',
        targetId: 'about',
        color: 0x00f0ff, // cyan
      },
      {
        id: 'skills',
        z: -420,
        number: '02',
        title: 'TECHNICAL SKILLS',
        subtitle: 'Languages & Core Technologies',
        desc: 'Python, C, Java, JavaScript, AI/ML, Computer Vision, React.',
        targetId: 'skills',
        color: 0x38bdf8, // sky blue
      },
      {
        id: 'projects',
        z: -680,
        number: '03',
        title: 'PROJECTS',
        subtitle: 'Featured Work & Codebases',
        desc: 'Panda AI Voice Assistant, Gesture Camera, Nova Cuts, Eye Care.',
        targetId: 'projects',
        color: 0xa855f7, // purple
      },
      {
        id: 'education',
        z: -960,
        number: '04',
        title: 'EDUCATION & CERTS',
        subtitle: 'Academic Milestones & Certifications',
        desc: 'Bachelor of Engineering in CSE (2025–Present) & Key Certs.',
        targetId: 'education',
        color: 0x4ade80, // emerald green
      },
      {
        id: 'contact',
        z: -1240,
        number: '05',
        title: 'LET\'S CONNECT',
        subtitle: 'Direct Reachout & Opportunities',
        desc: 'Get in touch for internships, projects, and collaboration.',
        targetId: 'contact',
        color: 0xf43f5e, // warm red/pink
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
