/**
 * environment.js - Futuristic Bridge & Cyberpunk City Skyline
 * Multi-lane suspension bridge over water, glowing road lines, overhead pylons,
 * street lamp fixtures, distant skyscraper skyline, and atmospheric digital embers.
 */

class BridgeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.waterMesh = null;
    this.streetLights = [];

    this.initBridge();
    this.initCitySkyline();
    this.initWater();
    this.initAtmosphericParticles();
  }

  initBridge() {
    const bridgeGroup = new THREE.Group();

    // ── 1. ASPHALT ROADWAY ──
    const roadWidth = 22;
    const roadLength = 1600;
    const roadZCenter = -700;

    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 64);
    roadGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.65,
      metalness: 0.2,
    });

    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, 0, roadZCenter);
    road.receiveShadow = true;
    bridgeGroup.add(road);

    // ── 2. ROAD MARKINGS ──
    // Center dashed line
    const dashLength = 6;
    const dashGap = 6;
    const numDashes = Math.floor(roadLength / (dashLength + dashGap));
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xe0e6ed });

    for (let i = 0; i < numDashes; i++) {
      const dashGeo = new THREE.PlaneGeometry(0.3, dashLength);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(0, 0.02, roadZCenter - roadLength / 2 + i * (dashLength + dashGap) + dashLength / 2);
      bridgeGroup.add(dash);
    }

    // Lane division lines (left and right)
    [-3.8, 3.8].forEach(x => {
      for (let i = 0; i < numDashes; i += 2) {
        const laneDashGeo = new THREE.PlaneGeometry(0.2, dashLength);
        laneDashGeo.rotateX(-Math.PI / 2);
        const laneDash = new THREE.Mesh(laneDashGeo, dashMat);
        laneDash.position.set(x, 0.02, roadZCenter - roadLength / 2 + i * (dashLength + dashGap) + dashLength / 2);
        bridgeGroup.add(laneDash);
      }
    });

    // Glowing Cyan Road Edge Strips
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    [-10.4, 10.4].forEach(x => {
      const edgeGeo = new THREE.BoxGeometry(0.25, 0.06, roadLength);
      const edge = new THREE.Mesh(edgeGeo, cyanGlowMat);
      edge.position.set(x, 0.04, roadZCenter);
      bridgeGroup.add(edge);
    });

    // ── 3. GUARD RAILS & CONCRETE CURBS ──
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      metalness: 0.8,
      roughness: 0.35,
    });

    [-10.9, 10.9].forEach(x => {
      // Concrete base curb
      const curbGeo = new THREE.BoxGeometry(0.8, 0.5, roadLength);
      const curb = new THREE.Mesh(curbGeo, barrierMat);
      curb.position.set(x, 0.25, roadZCenter);
      bridgeGroup.add(curb);

      // Metallic top rail
      const railGeo = new THREE.BoxGeometry(0.2, 0.15, roadLength);
      const rail = new THREE.Mesh(railGeo, barrierMat);
      rail.position.set(x, 0.75, roadZCenter);
      bridgeGroup.add(rail);
    });

    // ── 4. SUSPENSION TOWERS & CABLES ──
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x141822,
      metalness: 0.85,
      roughness: 0.3,
    });
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x00d2b9 });

    // Place 3 grand suspension pylon arches along the bridge
    const pylonZPositions = [-250, -750, -1250];

    pylonZPositions.forEach(pz => {
      const arch = new THREE.Group();

      // Left column
      const colGeo = new THREE.BoxGeometry(2.2, 54, 3.2);
      const leftCol = new THREE.Mesh(colGeo, pylonMat);
      leftCol.position.set(-14, 27, pz);
      arch.add(leftCol);

      // Right column
      const rightCol = new THREE.Mesh(colGeo, pylonMat);
      rightCol.position.set(14, 27, pz);
      arch.add(rightCol);

      // Upper crossbeam
      const beamGeo = new THREE.BoxGeometry(32, 2.5, 3.0);
      const beam = new THREE.Mesh(beamGeo, pylonMat);
      beam.position.set(0, 48, pz);
      arch.add(beam);

      // Lower crossbeam
      const lowerBeam = new THREE.Mesh(beamGeo, pylonMat);
      lowerBeam.position.set(0, 32, pz);
      arch.add(lowerBeam);

      // Cyan accent vertical lights on columns
      const lightStripGeo = new THREE.BoxGeometry(0.15, 48, 0.15);
      const stripL = new THREE.Mesh(lightStripGeo, cyanGlowMat);
      stripL.position.set(-12.8, 25, pz + 1.6);
      arch.add(stripL);

      const stripR = new THREE.Mesh(lightStripGeo, cyanGlowMat);
      stripR.position.set(12.8, 25, pz + 1.6);
      arch.add(stripR);

      // Suspension cables fanning out
      for (let c = -60; c <= 60; c += 15) {
        if (c === 0) continue;
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-14, 48, pz),
          new THREE.Vector3(-11, 1, pz + c)
        ]);
        const cable = new THREE.Line(lineGeo, cableMat);
        arch.add(cable);

        const lineGeoR = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(14, 48, pz),
          new THREE.Vector3(11, 1, pz + c)
        ]);
        const cableR = new THREE.Line(lineGeoR, cableMat);
        arch.add(cableR);
      }

      bridgeGroup.add(arch);
    });

    // ── 5. STREET LIGHTS ALONG ROAD ──
    const lampSpacing = 65;
    const numLamps = Math.floor(roadLength / lampSpacing);

    for (let i = 0; i < numLamps; i++) {
      const lz = roadZCenter - roadLength / 2 + i * lampSpacing + 20;

      [-11.6, 11.6].forEach(lx => {
        const lamp = new THREE.Group();
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x1d222e, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(lx, 3.75, lz);
        lamp.add(pole);

        // Curved arm reaching over road
        const armGeo = new THREE.BoxGeometry(2.2, 0.12, 0.12);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(lx > 0 ? lx - 0.9 : lx + 0.9, 7.4, lz);
        lamp.add(arm);

        // Glow head fixture
        const headGeo = new THREE.BoxGeometry(0.8, 0.15, 0.35);
        const head = new THREE.Mesh(headGeo, cyanGlowMat);
        head.position.set(lx > 0 ? lx - 1.8 : lx + 1.8, 7.3, lz);
        lamp.add(head);

        bridgeGroup.add(lamp);
      });
    }

    this.scene.add(bridgeGroup);
  }

  initCitySkyline() {
    const skylineGroup = new THREE.Group();

    // Procedural building generator
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x05070e,
      roughness: 0.9,
      metalness: 0.1,
    });

    const windowMatWarm = new THREE.MeshBasicMaterial({ color: 0xffd580 });
    const windowMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Place clusters of skyscrapers along both sides of the water
    const sides = [-140, 140];

    sides.forEach(xOffset => {
      for (let z = 50; z > -1500; z -= 35) {
        const height = 40 + Math.random() * 110;
        const width = 16 + Math.random() * 26;
        const depth = 16 + Math.random() * 26;
        const xNoise = (Math.random() - 0.5) * 50;

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(bGeo, buildingMat);
        building.position.set(xOffset + xNoise, height / 2 - 16, z);
        skylineGroup.add(building);

        // Illuminated rooftop beacon or window strip
        if (Math.random() > 0.3) {
          const beaconGeo = new THREE.BoxGeometry(width * 0.7, 0.6, depth * 0.7);
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
    // Water surface plane below the bridge
    const waterGeo = new THREE.PlaneGeometry(1200, 1800, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x02040a,
      roughness: 0.15,
      metalness: 0.92,
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, -18, -700);
    this.scene.add(this.waterMesh);
  }

  initAtmosphericParticles() {
    // Subtle digital motes / cyan cyber embers drifting across the scene
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = Math.random() * 22;
      positions[i * 3 + 2] = 50 - Math.random() * 1500;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.55,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update(time, delta) {
    // Subtle water specular ripple animation
    if (this.waterMesh) {
      this.waterMesh.position.y = -18 + Math.sin(time * 0.8) * 0.2;
    }

    // Drift particles gently
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] += Math.sin(time + pos[i]) * 0.015; // gentle vertical bob
        pos[i + 0] += Math.cos(time * 0.5 + pos[i + 2]) * 0.02; // lateral drift
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

window.BridgeEnvironment = BridgeEnvironment;
