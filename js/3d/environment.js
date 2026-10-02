/**
 * environment.js - Virtual World with Winding Road, Rivers & Pond
 * Matches the hand-drawn sketch:
 * - BMW symbol at top launches this world
 * - Winding/snake road connects all 5 sections
 * - Large pond on the right (near "Things I've Built")
 * - Rivers flowing alongside the road
 * - Suspension bridge crossing the water
 * - Trees, rocks, natural scenery
 * - Futuristic city skyline in the distance
 */

class BridgeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.waterMeshes = [];
    this.particles = null;
    this.roadCurve = null;
    this.ramps = []; // Exposed for car physics
    this.interactiveObstacles = []; // Physics tumbling cones and crates
    this.boostPads = []; // Nitro speed boost pads

    this.buildRoadSpline();
    this.initGroundTerrain();
    this.initCurvedRoad();
    this.initGroundTextAndDecals();
    this.initPondAndRivers();
    this.initBridge();
    this.initRamps();
    this.initTrafficConesAndCrates();
    this.initBoostPads();
    this.initSkillsPlaza();
    this.initNaturalScenery();
    this.initGantries();
    this.initCitySkyline();
    this.initAtmosphericParticles();
  }

  // ── 1. DEFINE THE WINDING ROAD SPLINE ──
  buildRoadSpline() {
    // Control points matching the sketch's snake-like winding road
    // The road curves left-right as the car drives forward (negative Z)
    const pts = [
      new THREE.Vector3(0,   0,  80),    // P0:  Home / BMW symbol start
      new THREE.Vector3(-4,  0, -60),    // P1
      new THREE.Vector3(-8,  0, -200),   // P2:  First curve LEFT
      new THREE.Vector3(-2,  0, -360),   // P3
      new THREE.Vector3(8,   0, -500),   // P4:  Curve RIGHT → About Me zone
      new THREE.Vector3(10,  0, -640),   // P5
      new THREE.Vector3(5,   0, -780),   // P6:  Skills zone
      new THREE.Vector3(-3,  0, -920),   // P7
      new THREE.Vector3(-8,  0, -1060),  // P8:  Curve LEFT → Bridge approach
      new THREE.Vector3(-4,  0, -1200),  // P9:  On the BRIDGE (over pond)
      new THREE.Vector3(2,   0, -1330),  // P10
      new THREE.Vector3(6,   0, -1470),  // P11: Right side, past pond
      new THREE.Vector3(1,   0, -1620),  // P12
      new THREE.Vector3(-6,  0, -1760),  // P13: Curve LEFT → Education
      new THREE.Vector3(-7,  0, -1900),  // P14
      new THREE.Vector3(-1,  0, -2040),  // P15
      new THREE.Vector3(3,   0, -2170),  // P16: Contact zone
      new THREE.Vector3(0,   0, -2290),  // P17: Finish line
    ];

    this.roadCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);

    // Pre-cache sampled points for fast nearest-point lookup
    this.roadCurveSamples = 240;
    this.cachedRoadPoints = [];
    for (let i = 0; i <= this.roadCurveSamples; i++) {
      const t = i / this.roadCurveSamples;
      this.cachedRoadPoints.push({ t, pt: this.roadCurve.getPoint(t) });
    }
  }

  // ── 2. WIDE GROUND TERRAIN PLANE ──
  initGroundTerrain() {
    // Dark grassy earth around the road
    const terrainGeo = new THREE.PlaneGeometry(800, 2700, 1, 1);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0a100a,
      roughness: 0.95,
      metalness: 0.02,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.set(0, -0.12, -1100);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  // ── 3. WINDING CURVED ROAD SURFACE ──
  initCurvedRoad() {
    const group = new THREE.Group();
    const roadWidth = 20;
    const numSeg = 400;

    // --- Road Surface ---
    const roadPositions = [];
    const roadUVs = [];
    const roadIndices = [];

    for (let i = 0; i <= numSeg; i++) {
      const t = i / numSeg;
      const point = this.roadCurve.getPoint(t);
      const tangent = this.roadCurve.getTangent(t).normalize();
      // Right vector perpendicular to tangent in XZ plane
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x);

      const L = point.clone().addScaledVector(right, -roadWidth / 2);
      const R = point.clone().addScaledVector(right, roadWidth / 2);

      roadPositions.push(L.x, 0.01, L.z, R.x, 0.01, R.z);
      roadUVs.push(0, t * 80, 1, t * 80);

      if (i < numSeg) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        roadIndices.push(a, c, b, b, c, d);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f1218,
      roughness: 0.65,
      metalness: 0.18,
    });
    group.add(new THREE.Mesh(roadGeo, roadMat));

    // --- Center Dashed Line ---
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xd0dce8 });
    const arcLen = this.roadCurve.getLength();
    const dashLen = 5.5, dashGap = 7;
    const totalDashes = Math.floor(arcLen / (dashLen + dashGap));

    for (let d = 0; d < totalDashes; d += 1) {
      const t0 = (d * (dashLen + dashGap)) / arcLen;
      const t1 = (d * (dashLen + dashGap) + dashLen) / arcLen;
      if (t1 > 1) break;

      const p0 = this.roadCurve.getPoint(t0);
      const p1 = this.roadCurve.getPoint(t1);
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const len = p0.distanceTo(p1);
      const tang = p1.clone().sub(p0).normalize();

      const dGeo = new THREE.PlaneGeometry(0.3, len);
      dGeo.rotateX(-Math.PI / 2);
      const dMesh = new THREE.Mesh(dGeo, dashMat);
      dMesh.position.set(mid.x, 0.025, mid.z);
      dMesh.rotation.y = Math.atan2(tang.x, tang.z);
      group.add(dMesh);
    }

    // --- Cyan neon edge strips ---
    const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    [-1, 1].forEach(side => {
      const ePos = [], eIdx = [];
      for (let i = 0; i <= numSeg; i++) {
        const t = i / numSeg;
        const pt = this.roadCurve.getPoint(t);
        const tang = this.roadCurve.getTangent(t).normalize();
        const right = new THREE.Vector3(tang.z, 0, -tang.x);
        const edgePt = pt.clone().addScaledVector(right, side * (roadWidth / 2 - 0.2));
        const outerPt = edgePt.clone().addScaledVector(right, side * 0.24);
        ePos.push(edgePt.x, 0.04, edgePt.z, outerPt.x, 0.04, outerPt.z);
        if (i < numSeg) {
          const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
          eIdx.push(a, c, b, b, c, d);
        }
      }
      const eGeo = new THREE.BufferGeometry();
      eGeo.setAttribute('position', new THREE.Float32BufferAttribute(ePos, 3));
      eGeo.setIndex(eIdx);
      eGeo.computeVertexNormals();
      group.add(new THREE.Mesh(eGeo, cyanMat));
    });

    // --- Guardrails along road edges ---
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1a2030, metalness: 0.8, roughness: 0.3 });
    const stepSize = 6;
    const totalSteps = Math.floor(arcLen / stepSize);
    for (let i = 0; i < totalSteps; i++) {
      const t = (i * stepSize) / arcLen;
      const t2 = Math.min(1, ((i + 1) * stepSize) / arcLen);
      const pt = this.roadCurve.getPoint(t);
      const pt2 = this.roadCurve.getPoint(t2);
      const tang = this.roadCurve.getTangent(t).normalize();
      const right = new THREE.Vector3(tang.z, 0, -tang.x);
      const mid = pt.clone().add(pt2).multiplyScalar(0.5);
      const segLen = pt.distanceTo(pt2);
      const angle = Math.atan2(tang.x, tang.z);

      [-1, 1].forEach(side => {
        const rp = mid.clone().addScaledVector(right, side * (roadWidth / 2 + 0.6));
        const rGeo = new THREE.BoxGeometry(0.22, 0.55, segLen + 0.05);
        const rMesh = new THREE.Mesh(rGeo, railMat);
        rMesh.position.set(rp.x, 0.45, rp.z);
        rMesh.rotation.y = angle;
        group.add(rMesh);
      });
    }

    // --- Street Lamps along the road ---
    const lampSpacing = 55;
    const numLamps = Math.floor(arcLen / lampSpacing);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1d222e, metalness: 0.8 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    for (let i = 0; i < numLamps; i++) {
      const t = (i * lampSpacing) / arcLen;
      const pt = this.roadCurve.getPoint(t);
      const tang = this.roadCurve.getTangent(t).normalize();
      const right = new THREE.Vector3(tang.z, 0, -tang.x);
      const angle = Math.atan2(tang.x, tang.z);

      [-1, 1].forEach(side => {
        const lp = pt.clone().addScaledVector(right, side * (roadWidth / 2 + 1.6));
        const lampGrp = new THREE.Group();

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 7), poleMat);
        pole.position.set(lp.x, 3.75, lp.z);
        lampGrp.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.1), poleMat);
        arm.position.set(lp.x - right.x * side * 1.0, 7.4, lp.z - right.z * side * 1.0);
        arm.rotation.y = angle;
        lampGrp.add(arm);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.34), lampMat);
        head.position.set(lp.x - right.x * side * 1.85, 7.28, lp.z - right.z * side * 1.85);
        lampGrp.add(head);

        group.add(lampGrp);
      });
    }

    this.scene.add(group);
  }

  // ── 4. START & FINISH GANTRIES ──
  initGantries() {
    const group = new THREE.Group();

    const startPt = this.roadCurve.getPoint(0);
    const startTang = this.roadCurve.getTangent(0).normalize();
    group.add(this.createGantry(startPt, startTang, 'HOME // PORTFOLIO', 0x00f0ff));

    const endPt = this.roadCurve.getPoint(1);
    const endTang = this.roadCurve.getTangent(1).normalize();
    group.add(this.createGantry(endPt, endTang, "LET'S CONNECT", 0xf43f5e));

    this.scene.add(group);
  }

  createGantry(position, tangent, labelText, color) {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x181c26, metalness: 0.85, roughness: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color });
    const right = new THREE.Vector3(tangent.z, 0, -tangent.x);
    const angle = Math.atan2(tangent.x, tangent.z);

    [-11.5, 11.5].forEach(offset => {
      const colPt = position.clone().addScaledVector(right, offset);
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.2), frameMat);
      col.position.set(colPt.x, 5.5, colPt.z);
      group.add(col);
    });

    const truss = new THREE.Mesh(new THREE.BoxGeometry(24, 1.6, 1.2), frameMat);
    truss.position.set(position.x, 10.6, position.z);
    truss.rotation.y = angle;
    group.add(truss);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(23.5, 0.14, 0.14), glowMat);
    stripe.position.set(position.x, 9.7, position.z);
    stripe.rotation.y = angle;
    group.add(stripe);

    return group;
  }

  // ── BRUNO SIMON PAINTED GROUND TYPOGRAPHY & ROAD MARKINGS ──
  initGroundTextAndDecals() {
    const group = new THREE.Group();

    // 1. Welcome Plaza Painted Text (Z = 15 to -70)
    group.add(this.createGroundText(
      0, 25, 26, 12,
      'SHREE HARI S B',
      'AI & SOFTWARE ENGINEER',
      'DRIVE WITH W A S D / ARROWS · H FOR HORN'
    ));

    group.add(this.createGroundText(
      -6, -180, 22, 10,
      'WELCOME TO MY 3D WORLD',
      'EXPLORE PROJECTS & SKILLS',
      'HIT RAMPS TO JUMP!'
    ));

    // 2. About Approach Text
    group.add(this.createGroundText(
      8, -500, 22, 9,
      'ZONE 01 // ABOUT ME',
      'JIT DAVANGERE · CSE STUDENT',
      'DRIVE AHEAD'
    ));

    // 3. Skills Plaza Approach Text
    group.add(this.createGroundText(
      5, -780, 22, 9,
      'ZONE 02 // TECHNICAL SKILLS',
      'PYTHON · AI/ML · COMPUTER VISION · REACT',
      'VISIT THE SKILLS PLAZA ON RIGHT →'
    ));

    // 4. Bridge & Projects Showcase Text
    group.add(this.createGroundText(
      -7, -1000, 24, 10,
      'ZONE 03 // PROJECTS SHOWCASE',
      'CROSSING SUSPENSION BRIDGE OVER POND',
      'EXPLORE 4 FEATURED PROJECTS'
    ));

    // 5. Education & Journey Text
    group.add(this.createGroundText(
      -5, -1720, 22, 9,
      'ZONE 04 // MY JOURNEY',
      'EDUCATION & CERTIFICATIONS',
      '2025 – PRESENT'
    ));

    // 6. Finish Line Text
    group.add(this.createGroundText(
      0, -2220, 24, 10,
      'ZONE 05 // LET\'S CONNECT',
      'OPEN FOR INTERNSHIPS & COLLABORATION',
      'PRESS ENTER TO CONTACT'
    ));

    // Directional Ground Arrows on the Road
    const arrowTex = this.createArrowTexture();
    const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, opacity: 0.85 });
    [-80, -280, -600, -900, -1120, -1350, -1600, -1850, -2100].forEach(z => {
      const arrowGeo = new THREE.PlaneGeometry(3.5, 5.0);
      arrowGeo.rotateX(-Math.PI / 2);
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      // Sample nearest road X
      const pt = this.roadCurve.getPointAt(Math.max(0, Math.min(1, Math.abs(z - 80) / 2370)));
      arrow.position.set(pt ? pt.x : 0, 0.032, z);
      group.add(arrow);
    });

    this.scene.add(group);
  }

  createGroundText(x, z, width, length, line1, line2, line3, angle = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle dark underlay plate for contrast
    ctx.fillStyle = 'rgba(6, 10, 18, 0.72)';
    ctx.roundRect ? ctx.roundRect(16, 16, canvas.width - 32, canvas.height - 32, 28) : ctx.fillRect(16, 16, canvas.width - 32, canvas.height - 32);
    ctx.fill();

    // Border line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Main Title (bold white)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 76px "Space Grotesk", sans-serif';
    ctx.fillText(line1, canvas.width / 2, 140);

    // Accent line
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(140, 175, canvas.width - 280, 6);

    // Subtitle (bright cyan)
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 42px "Space Grotesk", sans-serif';
    ctx.fillText(line2, canvas.width / 2, 245);

    // Third line (hint / tags)
    if (line3) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 32px "JetBrains Mono", monospace';
      ctx.fillText(line3, canvas.width / 2, 340);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;

    const geo = new THREE.PlaneGeometry(width, length);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.95 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.035, z);
    mesh.rotation.y = angle;
    return mesh;
  }

  createArrowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(128, 20);
    ctx.lineTo(230, 150);
    ctx.lineTo(165, 150);
    ctx.lineTo(165, 235);
    ctx.lineTo(91, 235);
    ctx.lineTo(91, 150);
    ctx.lineTo(26, 150);
    ctx.closePath();
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  // ── DRIVABLE JUMP RAMPS ──
  initRamps() {
    // Ramp 1: Intro jump ramp right down the first straight
    this.createRamp(0, -135, 8.5, 12, 3.2, 0);

    // Ramp 2: Skills park ramp for high jump
    this.createRamp(14, -760, 7.5, 11, 2.9, 0.18);

    // Ramp 3: Lakeside launch ramp
    this.createRamp(-16, -1490, 7.5, 11, 3.0, -0.15);
  }

  createRamp(x, z, width, length, height, angle) {
    const group = new THREE.Group();

    // Wedge prism geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(length, height);
    shape.lineTo(length, 0);
    shape.closePath();

    const extrudeSettings = { depth: width, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x1b2333,
      metalness: 0.82,
      roughness: 0.32,
    });
    const rampMesh = new THREE.Mesh(geo, mat);
    rampMesh.position.set(x, height / 2 + 0.05, z);
    rampMesh.rotation.y = angle + Math.PI / 2;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // Glowing edge strips on ramp top
    const edgeGeo = new THREE.BoxGeometry(width * 0.95, 0.12, 0.4);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(x, height + 0.1, z - (length / 2) * Math.cos(angle));
    edge.rotation.y = angle;
    group.add(edge);

    // Chevrons on ramp slope
    const chevMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let c = -3; c <= 3; c += 2.8) {
      const chevGeo = new THREE.PlaneGeometry(width * 0.8, 0.4);
      chevGeo.rotateX(-Math.PI / 2 - Math.atan2(height, length));
      const chev = new THREE.Mesh(chevGeo, chevMat);
      chev.position.set(x, height * 0.5 + 0.1, z + c);
      group.add(chev);
    }

    this.scene.add(group);

    // Register ramp with car physics
    this.ramps.push({ x, z, width, length, height, angle });
  }

  // ── TRAFFIC CONES & PLAYFUL CRATES (Bruno Simon Signature Interactive Obstacles) ──
  initTrafficConesAndCrates() {
    const group = new THREE.Group();

    // Traffic cone slalom near start & curves
    const conePositions = [
      { x: -3.5, z: -35 },
      { x: 3.5,  z: -65 },
      { x: -4.0, z: -95 },
      { x: 4.0,  z: -125 },
      { x: -2.5, z: -155 },
      { x: 2.5,  z: -185 },
      { x: -9.5, z: -1010 },
      { x: -4.5, z: -1015 },
      { x: 1.5,  z: -1015 },
      { x: -5.0, z: -2270 },
      { x: 5.0,  z: -2270 },
    ];

    conePositions.forEach(p => {
      const coneMesh = this.createTrafficConeMesh(0, 0);
      coneMesh.position.set(p.x, 0, p.z);
      group.add(coneMesh);

      this.interactiveObstacles.push({
        mesh: coneMesh,
        x: p.x,
        y: 0,
        z: p.z,
        origX: p.x,
        origZ: p.z,
        vx: 0,
        vy: 0,
        vz: 0,
        vrx: 0,
        vry: 0,
        vrz: 0,
        radius: 1.2,
        groundY: 0,
        type: 'cone',
        isHit: false,
      });
    });

    // Wooden & cyber crates near ramps and plazas
    const cratePositions = [
      { x: 9.0,  z: -140, s: 2.2 },
      { x: -9.0, z: -142, s: 2.0 },
      { x: 18.0, z: -740, s: 2.4 },
      { x: -18.0,z: -780, s: 2.2 },
      { x: -22.0,z: -1460,s: 2.5 },
      { x: 24.0, z: -1480,s: 2.0 },
    ];

    cratePositions.forEach(c => {
      const crateMesh = this.createCrateMesh(0, c.s / 2, 0, c.s);
      crateMesh.position.set(c.x, 0, c.z);
      group.add(crateMesh);

      this.interactiveObstacles.push({
        mesh: crateMesh,
        x: c.x,
        y: 0,
        z: c.z,
        origX: c.x,
        origZ: c.z,
        vx: 0,
        vy: 0,
        vz: 0,
        vrx: 0,
        vry: 0,
        vrz: 0,
        radius: c.s * 0.85,
        groundY: 0,
        type: 'crate',
        isHit: false,
      });
    });

    this.scene.add(group);
  }

  // ── TURBO SPEED BOOST NITRO PADS ──
  initBoostPads() {
    const group = new THREE.Group();
    const padLocations = [
      { z: -260 },
      { z: -720 },
      { z: -1100 },
      { z: -1680 },
    ];

    const chevronTex = this.createBoostChevronTexture();
    const padMat = new THREE.MeshBasicMaterial({ map: chevronTex, transparent: true, opacity: 0.95 });

    padLocations.forEach((loc) => {
      const t = Math.max(0, Math.min(1, Math.abs(loc.z - 80) / 2370));
      const pt = this.roadCurve.getPointAt(t);
      const px = pt ? pt.x : 0;

      const padGeo = new THREE.PlaneGeometry(8.5, 9.5);
      padGeo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(padGeo, padMat);
      mesh.position.set(px, 0.038, loc.z);
      group.add(mesh);

      // Glowing outer ring
      const ringGeo = new THREE.RingGeometry(5.2, 5.6, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.45 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(px, 0.04, loc.z);
      group.add(ring);

      this.boostPads.push({
        x: px,
        z: loc.z,
        mesh,
        ring,
        cooldown: 0,
      });
    });

    this.scene.add(group);
  }

  createBoostChevronTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.fillStyle = '#00f0ff';
    [100, 240, 380].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(256, y - 70);
      ctx.lineTo(440, y + 40);
      ctx.lineTo(390, y + 40);
      ctx.lineTo(256, y - 30);
      ctx.lineTo(122, y + 40);
      ctx.lineTo(72, y + 40);
      ctx.closePath();
      ctx.fill();
    });

    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ NITRO BOOST ⚡', 256, 480);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  createTrafficConeMesh(x, z) {
    const grp = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.4 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), baseMat);
    base.position.set(x, 0.06, z);
    grp.add(base);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.8, 12), coneMat);
    cone.position.set(x, 0.96, z);
    grp.add(cone);

    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.42, 12), whiteMat);
    stripe.position.set(x, 0.92, z);
    grp.add(stripe);

    return grp;
  }

  createCrateMesh(x, y, z, size) {
    const grp = new THREE.Group();
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x82542a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x3d2713,
      roughness: 0.6,
    });

    const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat);
    box.position.set(x, y, z);
    grp.add(box);

    // Metal band around crate
    const band = new THREE.Mesh(new THREE.BoxGeometry(size * 1.02, size * 0.15, size * 1.02), edgeMat);
    band.position.set(x, y, z);
    grp.add(band);

    return grp;
  }

  // ── TECHNICAL SKILLS PLAZA ──
  initSkillsPlaza() {
    const plazaGroup = new THREE.Group();
    const skills = [
      { name: 'PYTHON', desc: 'Core Backend & AI', color: 0x3b82f6 },
      { name: 'C / C++', desc: 'Systems & DSA', color: 0x6366f1 },
      { name: 'JAVA', desc: 'OOP & Software', color: 0xf97316 },
      { name: 'JAVASCRIPT', desc: 'Modern Web & UI', color: 0xfacc15 },
      { name: 'AI / ML', desc: 'Gemini, ML Models', color: 0xa855f7 },
      { name: 'OPENCV', desc: 'Computer Vision', color: 0x06b6d4 },
      { name: 'REACT & VITE', desc: 'Responsive Frontends', color: 0x38bdf8 },
      { name: 'GIT & GITHUB', desc: 'Version Control', color: 0xef4444 },
    ];

    const center = { x: 32, z: -840 };

    // Circular plaza platform on the grass
    const platGeo = new THREE.CylinderGeometry(38, 40, 0.4, 32);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.82, roughness: 0.28 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(center.x, 0.18, center.z);
    plazaGroup.add(platform);

    // Glowing outer ring
    const ringGeo = new THREE.RingGeometry(37.5, 38.5, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(center.x, 0.39, center.z);
    plazaGroup.add(ring);

    // Center Monument with Title
    const monuGeo = new THREE.CylinderGeometry(4.5, 5.0, 3.5, 16);
    const monuMat = new THREE.MeshStandardMaterial({ color: 0x1e2638, metalness: 0.9, roughness: 0.2 });
    const monument = new THREE.Mesh(monuGeo, monuMat);
    monument.position.set(center.x, 1.75, center.z);
    plazaGroup.add(monument);

    // 8 Skill monoliths with neon crowns arranged in a circle
    skills.forEach((skill, i) => {
      const angle = (i / skills.length) * Math.PI * 2;
      const radius = 25;
      const sx = center.x + Math.cos(angle) * radius;
      const sz = center.z + Math.sin(angle) * radius;

      const blockMat = new THREE.MeshStandardMaterial({
        color: skill.color,
        metalness: 0.75,
        roughness: 0.25,
      });
      const block = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.4, 3.6), blockMat);
      block.position.set(sx, 2.4, sz);
      block.rotation.y = angle;
      plazaGroup.add(block);

      // Light beacon
      const beamMat = new THREE.MeshBasicMaterial({ color: skill.color, transparent: true, opacity: 0.5 });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 14, 8), beamMat);
      beam.position.set(sx, 9.4, sz);
      plazaGroup.add(beam);
    });

    this.scene.add(plazaGroup);
  }

  // ── 5. LARGE POND + WINDING RIVERS ──
  initPondAndRivers() {
    const group = new THREE.Group();

    const deepWaterMat = new THREE.MeshStandardMaterial({
      color: 0x010b12,
      roughness: 0.04,
      metalness: 0.97,
      envMapIntensity: 2.0,
    });

    // ── MAIN POND (right side, near "Things I've Built") ──
    // Large irregular blob shape built from overlapping ellipses
    const pondCenter = { x: 95, z: -1220 };
    const pondGeo = new THREE.PlaneGeometry(340, 260, 48, 48);
    pondGeo.rotateX(-Math.PI / 2);
    const pond = new THREE.Mesh(pondGeo, deepWaterMat);
    pond.position.set(pondCenter.x, -0.55, pondCenter.z);
    group.add(pond);
    this.waterMeshes.push(pond);

    // Secondary pond lobe (gives irregular shape illusion)
    const lobe2Geo = new THREE.PlaneGeometry(160, 200, 32, 32);
    lobe2Geo.rotateX(-Math.PI / 2);
    const lobe2 = new THREE.Mesh(lobe2Geo, deepWaterMat);
    lobe2.position.set(pondCenter.x + 90, -0.55, pondCenter.z + 80);
    group.add(lobe2);
    this.waterMeshes.push(lobe2);

    // Glowing pond edge / shore ring (subtle cyan shimmer)
    const shoreGeo = new THREE.RingGeometry(168, 186, 52);
    shoreGeo.rotateX(-Math.PI / 2);
    const shoreMat = new THREE.MeshBasicMaterial({ color: 0x004466, transparent: true, opacity: 0.22 });
    const shore = new THREE.Mesh(shoreGeo, shoreMat);
    shore.position.set(pondCenter.x, 0.02, pondCenter.z);
    group.add(shore);

    // ── LEFT RIVER (snakes on the left side of the road) ──
    const riverLPts = [
      new THREE.Vector3(-30, -0.28, -80),
      new THREE.Vector3(-32, -0.28, -280),
      new THREE.Vector3(-28, -0.28, -480),
      new THREE.Vector3(-36, -0.28, -680),
      new THREE.Vector3(-30, -0.28, -880),
      new THREE.Vector3(-24, -0.28, -1080),
      new THREE.Vector3(-28, -0.28, -1280),
      new THREE.Vector3(-36, -0.28, -1480),
      new THREE.Vector3(-32, -0.28, -1680),
      new THREE.Vector3(-26, -0.28, -1880),
      new THREE.Vector3(-30, -0.28, -2100),
    ];
    this.buildRiverMesh(riverLPts, 16, deepWaterMat, group, 'L');

    // ── RIGHT RIVER (flows toward the pond) ──
    const riverRPts = [
      new THREE.Vector3(28,  -0.28, -600),
      new THREE.Vector3(38,  -0.28, -800),
      new THREE.Vector3(55,  -0.28, -950),
      new THREE.Vector3(72,  -0.28, -1060),  // feeds into pond
      new THREE.Vector3(pondCenter.x - 80, -0.28, -1120),
    ];
    this.buildRiverMesh(riverRPts, 12, deepWaterMat, group, 'R');

    // ── POND OUTLET STREAM (leaves bottom of pond, winds away) ──
    const outletPts = [
      new THREE.Vector3(pondCenter.x + 50, -0.28, -1450),
      new THREE.Vector3(pondCenter.x + 80, -0.28, -1620),
      new THREE.Vector3(pondCenter.x + 60, -0.28, -1800),
      new THREE.Vector3(pondCenter.x + 40, -0.28, -1980),
    ];
    this.buildRiverMesh(outletPts, 10, deepWaterMat, group, 'O');

    this.scene.add(group);
  }

  buildRiverMesh(points, width, mat, group, tag) {
    const curve = new THREE.CatmullRomCurve3(points);
    const numSeg = 80;
    const rPos = [], rIdx = [];

    for (let i = 0; i <= numSeg; i++) {
      const t = i / numSeg;
      const pt = curve.getPoint(t);
      const tang = curve.getTangent(t).normalize();
      const right = new THREE.Vector3(tang.z, 0, -tang.x);

      const widthVar = width * (0.8 + Math.sin(t * Math.PI * 3) * 0.25); // varies width naturally
      const L = pt.clone().addScaledVector(right, -widthVar / 2);
      const R = pt.clone().addScaledVector(right, widthVar / 2);

      rPos.push(L.x, -0.28, L.z, R.x, -0.28, R.z);
      if (i < numSeg) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        rIdx.push(a, c, b, b, c, d);
      }
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
    rGeo.setIndex(rIdx);
    rGeo.computeVertexNormals();
    const rMesh = new THREE.Mesh(rGeo, mat);
    group.add(rMesh);
    this.waterMeshes.push(rMesh);
  }

  // ── 6. SUSPENSION BRIDGE OVER THE POND ──
  initBridge() {
    const group = new THREE.Group();

    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x131722, metalness: 0.9, roughness: 0.25 });
    const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Bridge pylons placed at road curve t≈0.43 and t≈0.52 (over pond area)
    const pylonTs = [0.42, 0.52];

    pylonTs.forEach(t => {
      const pPos = this.roadCurve.getPoint(t);
      const tang = this.roadCurve.getTangent(t).normalize();
      const right = new THREE.Vector3(tang.z, 0, -tang.x);
      const angle = Math.atan2(tang.x, tang.z);

      const arch = new THREE.Group();

      // Left and right pylon towers
      [-15, 15].forEach(side => {
        const colPt = pPos.clone().addScaledVector(right, side);

        const colGeo = new THREE.BoxGeometry(2.4, 62, 3.4);
        const col = new THREE.Mesh(colGeo, pylonMat);
        col.position.set(colPt.x, 31, colPt.z);
        arch.add(col);

        // Neon glow strips on pylon faces
        const stripGeo = new THREE.BoxGeometry(0.18, 56, 0.18);
        const strip = new THREE.Mesh(stripGeo, cyanMat);
        strip.position.set(colPt.x + right.x * -side * 0.14, 29, colPt.z + right.z * -side * 0.14);
        arch.add(strip);
      });

      // Top crossbeam
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(34, 3.0, 3.5), pylonMat);
      topBeam.position.set(pPos.x, 56, pPos.z);
      topBeam.rotation.y = angle;
      arch.add(topBeam);

      // Mid crossbeam
      const midBeam = new THREE.Mesh(new THREE.BoxGeometry(34, 2.5, 3.5), pylonMat);
      midBeam.position.set(pPos.x, 36, pPos.z);
      midBeam.rotation.y = angle;
      arch.add(midBeam);

      // Suspension cables radiating from pylon top to road deck
      for (let c = -90; c <= 90; c += 16) {
        if (Math.abs(c) < 5) continue;
        [-15, 15].forEach(side => {
          const topPt = pPos.clone().addScaledVector(right, side);
          const anchorPt = pPos.clone().add(tang.clone().multiplyScalar(c)).addScaledVector(right, side * 0.82);
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(topPt.x, 56, topPt.z),
            new THREE.Vector3(anchorPt.x, 0.8, anchorPt.z),
          ]);
          arch.add(new THREE.Line(lineGeo, cyanMat));
        });
      }

      group.add(arch);
    });

    // Bridge deck slight elevation over water
    const deckLen = 280;
    const bridgeMidPt = this.roadCurve.getPoint(0.47);
    const bridgeTang = this.roadCurve.getTangent(0.47).normalize();
    const angle = Math.atan2(bridgeTang.x, bridgeTang.z);
    const deckGeo = new THREE.BoxGeometry(22, 0.4, deckLen);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x141824, metalness: 0.7, roughness: 0.4 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(bridgeMidPt.x, 0.3, bridgeMidPt.z);
    deck.rotation.y = angle;
    group.add(deck);

    this.scene.add(group);
  }

  // ── 7. NATURAL SCENERY (Trees, Rocks) ──
  initNaturalScenery() {
    const group = new THREE.Group();

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1e0e05, roughness: 0.95 });
    const leafMats = [
      new THREE.MeshStandardMaterial({ color: 0x061408, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x0a1f0c, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ color: 0x0d2812, roughness: 0.85 }),
    ];

    const arcLen = this.roadCurve.getLength();

    for (let i = 0; i < 110; i++) {
      const t = Math.random();
      const pt = this.roadCurve.getPoint(t);
      const tang = this.roadCurve.getTangent(t).normalize();
      const right = new THREE.Vector3(tang.z, 0, -tang.x);
      const side = Math.random() > 0.5 ? 1 : -1;
      const dist = 14 + Math.random() * 50;
      const treePos = pt.clone().addScaledVector(right, side * dist);

      // Avoid placing trees inside the pond
      const dx = treePos.x - 95, dz = treePos.z + 1220;
      if (dx * dx / (170 * 170) + dz * dz / (130 * 130) < 1.3) continue;

      const h = 5 + Math.random() * 9;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, h * 0.38, 6), trunkMat);
      trunk.position.set(treePos.x, h * 0.19, treePos.z);
      group.add(trunk);

      const leafMat = leafMats[Math.floor(Math.random() * leafMats.length)];
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.8 + Math.random() * 2, h * 0.75, 7), leafMat);
      leaf.position.set(treePos.x, h * 0.55, treePos.z);
      group.add(leaf);
    }

    // Rocks around the pond shore
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.88, metalness: 0.08 });
    for (let i = 0; i < 40; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 155 + Math.random() * 35;
      const rx = 95 + Math.cos(ang) * r * 2.0;
      const rz = -1220 + Math.sin(ang) * r * 1.3;
      const s = 0.8 + Math.random() * 2.5;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
      rock.position.set(rx, s * 0.38, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
    }

    // River bank rocks
    for (let i = 0; i < 25; i++) {
      const rz = -100 - Math.random() * 2000;
      const rx = -28 + (Math.random() - 0.5) * 20;
      const s = 0.5 + Math.random() * 1.5;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
      rock.position.set(rx, s * 0.3, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
    }

    this.scene.add(group);
  }

  // ── 8. DISTANT CITY SKYLINE ──
  initCitySkyline() {
    const group = new THREE.Group();
    const buildMat = new THREE.MeshStandardMaterial({ color: 0x05070e, roughness: 0.9, metalness: 0.08 });
    const winCyan = new THREE.MeshBasicMaterial({ color: 0x00c8ff });
    const winWarm = new THREE.MeshBasicMaterial({ color: 0xffc860 });

    [-195, 195].forEach(xOff => {
      for (let z = 80; z > -2400; z -= 44) {
        const h = 50 + Math.random() * 120;
        const w = 18 + Math.random() * 30;
        const d = 18 + Math.random() * 30;
        const xN = (Math.random() - 0.5) * 60;
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildMat);
        b.position.set(xOff + xN, h / 2 - 18, z);
        group.add(b);
        if (Math.random() > 0.32) {
          const bGeo = new THREE.BoxGeometry(w * 0.7, 0.55, d * 0.7);
          const bMesh = new THREE.Mesh(bGeo, Math.random() > 0.5 ? winCyan : winWarm);
          bMesh.position.set(xOff + xN, h - 18, z);
          group.add(bMesh);
        }
      }
    });

    this.scene.add(group);
  }

  // ── 9. ATMOSPHERIC PARTICLES ──
  initAtmosphericParticles() {
    const count = 550;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = 80 - Math.random() * 2400;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.52,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  // ── ANIMATION LOOP ──
  update(time, delta, car) {
    // Animate water surfaces with gentle wave motion
    this.waterMeshes.forEach((mesh, i) => {
      mesh.position.y = (i === 0 ? -0.55 : -0.28) + Math.sin(time * 0.65 + i * 1.3) * 0.1;
    });

    // Drift atmospheric particles
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += Math.sin(time + pos[i]) * 0.012;
        pos[i]     += Math.cos(time * 0.5 + pos[i + 2]) * 0.016;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // ── INTERACTIVE OBSTACLES PHYSICS (Cones & Crates) ──
    if (car && car.position) {
      const carVx = -Math.sin(car.rotation) * car.speed;
      const carVz = -Math.cos(car.rotation) * car.speed;

      this.interactiveObstacles.forEach(obs => {
        const dx = car.position.x - obs.x;
        const dz = car.position.z - obs.z;
        const dist = Math.hypot(dx, dz);

        // Check collision with car
        if (dist < obs.radius + 1.4 && !obs.isHit) {
          obs.isHit = true;
          obs.vx = carVx * 1.35 + (Math.random() - 0.5) * 8;
          obs.vz = carVz * 1.35 + (Math.random() - 0.5) * 8;
          obs.vy = 6.5 + Math.random() * 5.0; // flies upward
          obs.vrx = (Math.random() - 0.5) * 16;
          obs.vrz = (Math.random() - 0.5) * 16;
          if (car.onObstacleHit) car.onObstacleHit(obs.type);
        }

        // Apply obstacle physics if hit
        if (obs.isHit) {
          obs.vy += -32 * delta; // gravity
          obs.x += obs.vx * delta;
          obs.y += obs.vy * delta;
          obs.z += obs.vz * delta;

          obs.mesh.rotation.x += obs.vrx * delta;
          obs.mesh.rotation.z += obs.vrz * delta;

          // Ground bounce
          if (obs.y <= obs.groundY) {
            obs.y = obs.groundY;
            obs.vy = -obs.vy * 0.42; // bounce dampening
            obs.vx *= 0.84;
            obs.vz *= 0.84;
            obs.vrx *= 0.75;
            obs.vrz *= 0.75;
          }

          obs.mesh.position.set(obs.x, obs.y, obs.z);
        }
      });

      // ── BOOST PADS COLLISION ──
      this.boostPads.forEach(pad => {
        if (pad.cooldown > 0) {
          pad.cooldown -= delta;
        } else {
          const d = Math.hypot(car.position.x - pad.x, car.position.z - pad.z);
          if (d < 5.2) {
            pad.cooldown = 3.5;
            if (car.applyBoost) car.applyBoost(2.4);
            if (car.onBoostHit) car.onBoostHit();
          }
        }
      });
    }
  }
}

window.BridgeEnvironment = BridgeEnvironment;
