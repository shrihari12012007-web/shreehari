/**
 * environment.js - Continuous Portfolio Roadway with Middle Suspension Bridge
 * Continuous multi-zone driving track connecting all portfolio sections one by one:
 * - Zone 1: City Start Grid & About Boulevard
 * - Zone 2: Technical Skills Neon Corridor
 * - Zone 3: THE MIDDLE BRIDGE over reflective water (Projects showcase)
 * - Zone 4: Education & Certifications Avenue
 * - Zone 5: Contact & Grand Finish Line
 */

class BridgeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.waterMesh = null;

    this.initRoadTrack();
    this.initMiddleBridge();
    this.initCitySkyline();
    this.initWater();
    this.initAtmosphericParticles();
  }

  initRoadTrack() {
    const trackGroup = new THREE.Group();

    const roadWidth = 22;
    const roadLength = 2450;
    const roadZCenter = -1150; // spans from +75 to -2375

    // ── 1. CONTINUOUS ASPHALT HIGHWAY ──
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 96);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x10131a,
      roughness: 0.62,
      metalness: 0.22,
    });

    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, 0, roadZCenter);
    road.receiveShadow = true;
    trackGroup.add(road);

    // ── 2. ROAD MARKINGS ──
    // Center Dashed White Line
    const dashLength = 6;
    const dashGap = 6;
    const numDashes = Math.floor(roadLength / (dashLength + dashGap));
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });

    for (let i = 0; i < numDashes; i++) {
      const dashGeo = new THREE.PlaneGeometry(0.32, dashLength);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(0, 0.02, roadZCenter - roadLength / 2 + i * (dashLength + dashGap) + dashLength / 2);
      trackGroup.add(dash);
    }

    // Lane division lines (Left & Right)
    [-3.8, 3.8].forEach(x => {
      for (let i = 0; i < numDashes; i += 2) {
        const laneDashGeo = new THREE.PlaneGeometry(0.2, dashLength);
        laneDashGeo.rotateX(-Math.PI / 2);
        const laneDash = new THREE.Mesh(laneDashGeo, dashMat);
        laneDash.position.set(x, 0.02, roadZCenter - roadLength / 2 + i * (dashLength + dashGap) + dashLength / 2);
        trackGroup.add(laneDash);
      }
    });

    // Glowing Cyan Road Edge Strips
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    [-10.4, 10.4].forEach(x => {
      const edgeGeo = new THREE.BoxGeometry(0.26, 0.06, roadLength);
      const edge = new THREE.Mesh(edgeGeo, cyanGlowMat);
      edge.position.set(x, 0.04, roadZCenter);
      trackGroup.add(edge);
    });

    // Concrete Curbs & Steel Guardrails
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x1f2430,
      metalness: 0.82,
      roughness: 0.35,
    });

    [-10.9, 10.9].forEach(x => {
      const curbGeo = new THREE.BoxGeometry(0.8, 0.5, roadLength);
      const curb = new THREE.Mesh(curbGeo, barrierMat);
      curb.position.set(x, 0.25, roadZCenter);
      trackGroup.add(curb);

      const railGeo = new THREE.BoxGeometry(0.2, 0.15, roadLength);
      const rail = new THREE.Mesh(railGeo, barrierMat);
      rail.position.set(x, 0.75, roadZCenter);
      trackGroup.add(rail);
    });

    // ── 3. STARTING LINE & FINISH LINE GANTRIES ──
    // Starting Gantry at Z = 20
    const startGantry = this.createGantry(20, 'START // HOME', 0x00f0ff);
    trackGroup.add(startGantry);

    // Finish Line Gantry at Z = -2300
    const finishGantry = this.createGantry(-2300, 'FINISH // LET\'S CONNECT', 0xf43f5e);
    trackGroup.add(finishGantry);

    // Checkered line at Start
    const checkerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let c = -10; c < 10; c += 1.2) {
      const cGeo = new THREE.PlaneGeometry(1.2, 0.8);
      cGeo.rotateX(-Math.PI / 2);
      const checker = new THREE.Mesh(cGeo, checkerMat);
      checker.position.set(c + 0.6, 0.03, 10);
      trackGroup.add(checker);
    }

    // Street Lamps along the entire road
    const lampSpacing = 65;
    const totalLamps = Math.floor(roadLength / lampSpacing);

    for (let i = 0; i < totalLamps; i++) {
      const lz = roadZCenter - roadLength / 2 + i * lampSpacing + 25;

      [-11.6, 11.6].forEach(lx => {
        const lamp = new THREE.Group();
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x1d222e, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(lx, 3.75, lz);
        lamp.add(pole);

        const armGeo = new THREE.BoxGeometry(2.2, 0.12, 0.12);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(lx > 0 ? lx - 0.9 : lx + 0.9, 7.4, lz);
        lamp.add(arm);

        const headGeo = new THREE.BoxGeometry(0.8, 0.15, 0.35);
        const head = new THREE.Mesh(headGeo, cyanGlowMat);
        head.position.set(lx > 0 ? lx - 1.8 : lx + 1.8, 7.3, lz);
        lamp.add(head);

        trackGroup.add(lamp);
      });
    }

    this.scene.add(trackGroup);
  }

  createGantry(z, text, color) {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x181c26, metalness: 0.85, roughness: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: color });

    // Left and right support columns
    [-11.2, 11.2].forEach(x => {
      const colGeo = new THREE.BoxGeometry(1.2, 11, 1.2);
      const col = new THREE.Mesh(colGeo, frameMat);
      col.position.set(x, 5.5, z);
      group.add(col);
    });

    // Overhead truss beam
    const trussGeo = new THREE.BoxGeometry(23.6, 1.6, 1.2);
    const truss = new THREE.Mesh(trussGeo, frameMat);
    truss.position.set(0, 10.6, z);
    group.add(truss);

    // Glowing neon stripe
    const stripeGeo = new THREE.BoxGeometry(23.2, 0.15, 0.15);
    const stripe = new THREE.Mesh(stripeGeo, glowMat);
    stripe.position.set(0, 9.7, z);
    group.add(stripe);

    return group;
  }

  initMiddleBridge() {
    // ── THE MIDDLE BRIDGE (Z = -950 to -1450) ──
    // The road specifically passes over a grand suspension bridge in the middle!
    const bridgeGroup = new THREE.Group();

    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x131722,
      metalness: 0.88,
      roughness: 0.28,
    });
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // 2 Massive Suspension Pylons at the bridge mid-section
    const bridgePylons = [-1000, -1350];

    bridgePylons.forEach(pz => {
      const arch = new THREE.Group();

      // Left column
      const colGeo = new THREE.BoxGeometry(2.4, 58, 3.4);
      const leftCol = new THREE.Mesh(colGeo, pylonMat);
      leftCol.position.set(-14, 29, pz);
      arch.add(leftCol);

      // Right column
      const rightCol = new THREE.Mesh(colGeo, pylonMat);
      rightCol.position.set(14, 29, pz);
      arch.add(rightCol);

      // Upper Crossbeam
      const beamGeo = new THREE.BoxGeometry(32, 2.8, 3.2);
      const beam = new THREE.Mesh(beamGeo, pylonMat);
      beam.position.set(0, 52, pz);
      arch.add(beam);

      // Middle Crossbeam
      const midBeam = new THREE.Mesh(beamGeo, pylonMat);
      midBeam.position.set(0, 34, pz);
      arch.add(midBeam);

      // Vertical neon glow strips
      const lightStripGeo = new THREE.BoxGeometry(0.18, 52, 0.18);
      const stripL = new THREE.Mesh(lightStripGeo, cyanGlowMat);
      stripL.position.set(-12.7, 27, pz + 1.7);
      arch.add(stripL);

      const stripR = new THREE.Mesh(lightStripGeo, cyanGlowMat);
      stripR.position.set(12.7, 27, pz + 1.7);
      arch.add(stripR);

      // Suspension cables radiating across the bridge deck
      for (let c = -75; c <= 75; c += 15) {
        if (c === 0) continue;
        const lineGeoL = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-14, 52, pz),
          new THREE.Vector3(-11, 1, pz + c)
        ]);
        const cableL = new THREE.Line(lineGeoL, cableMat);
        arch.add(cableL);

        const lineGeoR = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(14, 52, pz),
          new THREE.Vector3(11, 1, pz + c)
        ]);
        const cableR = new THREE.Line(lineGeoR, cableMat);
        arch.add(cableR);
      }

      bridgeGroup.add(arch);
    });

    this.scene.add(bridgeGroup);
  }

  initCitySkyline() {
    const skylineGroup = new THREE.Group();

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x05070e,
      roughness: 0.9,
      metalness: 0.1,
    });

    const windowMatWarm = new THREE.MeshBasicMaterial({ color: 0xffd580 });
    const windowMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Distant futuristic city along both sides of the roadway
    const sides = [-145, 145];

    sides.forEach(xOffset => {
      for (let z = 60; z > -2400; z -= 38) {
        const height = 45 + Math.random() * 115;
        const width = 18 + Math.random() * 28;
        const depth = 18 + Math.random() * 28;
        const xNoise = (Math.random() - 0.5) * 55;

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(bGeo, buildingMat);
        building.position.set(xOffset + xNoise, height / 2 - 16, z);
        skylineGroup.add(building);

        // Illuminated window / roof matrix
        if (Math.random() > 0.3) {
          const beaconGeo = new THREE.BoxGeometry(width * 0.72, 0.6, depth * 0.72);
          const beaconMat = Math.random() > 0.5 ? windowMatCyan : windowMatWarm;
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(xOffset + xNoise, height - 16, z);
          skylineGroup.add(beacon);
        }
      }
    });

    this.scene.add(skylineGroup);
  }

  initWater() {
    // Water below the bridge in the middle section
    const waterGeo = new THREE.PlaneGeometry(1400, 2600, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x02040b,
      roughness: 0.14,
      metalness: 0.94,
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, -18, -1150);
    this.scene.add(this.waterMesh);
  }

  initAtmosphericParticles() {
    // Atmospheric drifting cyber particles
    const count = 450;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 24;
      positions[i * 3 + 2] = 60 - Math.random() * 2400;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.58,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update(time, delta) {
    if (this.waterMesh) {
      this.waterMesh.position.y = -18 + Math.sin(time * 0.8) * 0.2;
    }

    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += Math.sin(time + pos[i]) * 0.015;
        pos[i + 0] += Math.cos(time * 0.5 + pos[i + 2]) * 0.02;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

window.BridgeEnvironment = BridgeEnvironment;
