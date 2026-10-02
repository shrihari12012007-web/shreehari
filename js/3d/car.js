/**
 * car.js - Exact BMW M-Series Sports Coupe Model & Physics Engine
 * High-detail procedural BMW M4/M8 Competition coupe featuring:
 * - Iconic BMW twin vertical kidney grilles with M badge
 * - Genuine miniature BMW roundel emblems on hood & trunk
 * - Laserlight dual hexagonal DRL angel-eyes in vibrant cyan
 * - M power-dome sculpted hood and carbon-fiber roof with shark-fin
 * - Signature Hofmeister kink in the rear glasshouse
 * - M twin-stalk aero side mirrors
 * - Quad chrome exhaust tips and aggressive rear aerodynamic diffuser
 * - 5-double-spoke M-Sport bi-color alloy wheels with M-Blue brake calipers
 * - Realistic steering physics, suspension pitch/roll, and dynamic lighting
 */

class SportsCar {
  constructor(scene) {
    this.scene = scene;

    // Physical State
    this.position = new THREE.Vector3(0, 0.45, 0);
    this.rotation = 0; // heading angle around Y
    this.speed = 0;    // units/sec
    this.steeringAngle = 0;
    this.maxForwardSpeed = 48.0; // ~172 km/h
    this.maxReverseSpeed = -11.0;
    this.acceleration = 19.5;
    this.brakeDecel = 34.0;
    this.handbrakeDecel = 52.0;
    this.friction = 7.5;
    this.speedKmh = 0;

    // Bruno Simon Open World Island Bounds (Free-Roaming across all zones)
    this.worldMinX = -260;
    this.worldMaxX = 260;
    this.worldMinZ = -2380;
    this.worldMaxZ = 110;

    // Jump & Ramp Physics
    this.vy = 0;
    this.groundY = 0.45;
    this.isAirborne = false;
    this.gravity = -38;
    this.ramps = []; // Array of ramp collision objects

    // Drifting & Skid State
    this.isDrifting = false;
    this.skidContainer = null;
    this.lastSkidTime = 0;

    // Curved road support (used for navigation and surface friction)
    this.roadCurve = null;
    this.lastCurveT = 0;

    // 6-Speed M-Transmission & Engine RPM
    this.currentGear = 1;
    this.gearMaxSpeeds = [9.0, 17.5, 26.5, 35.5, 43.0, 52.0];
    this.rpm = 1000;
    this.idleRpm = 1000;
    this.isShifting = false;
    this.shiftCooldown = 0;
    this.onGearShiftCallback = null;

    // Turbo Nitro Boost
    this.boostTimer = 0;

    // Exhaust VFX
    this.exhaustFlames = [];
    this.flameTimer = 0;

    // Visual Nodes
    this.meshGroup = new THREE.Group();
    this.chassisMesh = null;
    this.frontLeftWheel = null;
    this.frontRightWheel = null;
    this.rearLeftWheel = null;
    this.rearRightWheel = null;
    this.frontLeftPivot = null;
    this.frontRightPivot = null;

    // Lights
    this.headlights = [];
    this.taillightMaterial = null;
    this.brakeLightActive = false;

    this.initModel();
    this.scene.add(this.meshGroup);
  }

  createRoundelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Outer Chrome
    ctx.beginPath();
    ctx.arc(64, 64, 62, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1e24';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Black ring
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = '#08090d';
    ctx.fill();

    // Inner chrome border
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Blue & White Quadrants
    // Top-Left Blue
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, 37, -Math.PI, -Math.PI / 2);
    ctx.fillStyle = '#0066b1';
    ctx.fill();

    // Top-Right White
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, 37, -Math.PI / 2, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Bottom-Right Blue
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, 37, 0, Math.PI / 2);
    ctx.fillStyle = '#0066b1';
    ctx.fill();

    // Bottom-Left White
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, 37, Math.PI / 2, Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  initModel() {
    // ── PREMIUM MATERIALS ──
    const bmwPaintMat = new THREE.MeshStandardMaterial({
      color: 0x090d18, // BMW Tanzanite Blue / Frozen Black metallic
      metalness: 0.92,
      roughness: 0.18,
    });

    const carbonRoofMat = new THREE.MeshStandardMaterial({
      color: 0x08090d,
      metalness: 0.85,
      roughness: 0.45,
    });

    const glossBlackMat = new THREE.MeshStandardMaterial({
      color: 0x040406,
      metalness: 0.95,
      roughness: 0.08,
    });

    const darkGlassMat = new THREE.MeshStandardMaterial({
      color: 0x04070e,
      metalness: 0.96,
      roughness: 0.05,
      transparent: true,
      opacity: 0.90,
    });

    const laserCyanMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8e0ea,
      metalness: 0.98,
      roughness: 0.12,
    });

    const mBlueCalipersMat = new THREE.MeshBasicMaterial({
      color: 0x0066b1, // Iconic BMW M caliper blue
    });

    this.taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xcc001b,
      emissiveIntensity: 1.4,
      roughness: 0.25,
    });

    const roundelTex = this.createRoundelTexture();
    const roundelMat = new THREE.MeshBasicMaterial({
      map: roundelTex,
      transparent: true,
    });

    const chassisGroup = new THREE.Group();

    // ── 1. LOWER BODY & AERODYNAMIC CHASSIS ──
    const lowerBodyGeo = new THREE.BoxGeometry(1.92, 0.42, 4.45);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, bmwPaintMat);
    lowerBody.position.y = 0.25;
    chassisGroup.add(lowerBody);

    // Front M-Carbon Aero Splitter
    const splitterGeo = new THREE.BoxGeometry(1.96, 0.07, 0.65);
    const splitter = new THREE.Mesh(splitterGeo, glossBlackMat);
    splitter.position.set(0, 0.06, -2.22);
    chassisGroup.add(splitter);

    // Aerodynamic Side Skirts
    [-0.98, 0.98].forEach(x => {
      const skirtGeo = new THREE.BoxGeometry(0.08, 0.12, 2.6);
      const skirt = new THREE.Mesh(skirtGeo, glossBlackMat);
      skirt.position.set(x, 0.12, 0);
      chassisGroup.add(skirt);
    });

    // Rear M Diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.94, 0.16, 0.55);
    const diffuser = new THREE.Mesh(diffuserGeo, glossBlackMat);
    diffuser.position.set(0, 0.15, 2.2);
    chassisGroup.add(diffuser);

    // ── 2. HOOD WITH M POWER-DOME & FENDERS ──
    const hoodGeo = new THREE.BoxGeometry(1.84, 0.28, 1.65);
    const hood = new THREE.Mesh(hoodGeo, bmwPaintMat);
    hood.position.set(0, 0.43, -1.28);
    hood.rotation.x = -0.065;
    chassisGroup.add(hood);

    // M Power-Dome (center raised contour on hood)
    const domeGeo = new THREE.BoxGeometry(0.72, 0.05, 1.25);
    const powerDome = new THREE.Mesh(domeGeo, bmwPaintMat);
    powerDome.position.set(0, 0.58, -1.22);
    powerDome.rotation.x = -0.065;
    chassisGroup.add(powerDome);

    // Flared M Front & Rear Fenders
    const fenderGeo = new THREE.BoxGeometry(2.04, 0.32, 0.92);
    const frontFenders = new THREE.Mesh(fenderGeo, bmwPaintMat);
    frontFenders.position.set(0, 0.37, -1.35);
    chassisGroup.add(frontFenders);

    const rearFenders = new THREE.Mesh(fenderGeo, bmwPaintMat);
    rearFenders.position.set(0, 0.39, 1.25);
    chassisGroup.add(rearFenders);

    // ── 3. BMW ROUNDEL ON HOOD ──
    const roundelGeo = new THREE.CircleGeometry(0.09, 24);
    roundelGeo.rotateX(-Math.PI / 2);
    const hoodRoundel = new THREE.Mesh(roundelGeo, roundelMat);
    hoodRoundel.position.set(0, 0.56, -2.12);
    hoodRoundel.rotation.x = -0.15;
    chassisGroup.add(hoodRoundel);

    // ── 4. ICONIC BMW VERTICAL TWIN KIDNEY GRILLES ──
    const kidneyGroup = new THREE.Group();
    const kidneyWidth = 0.26;
    const kidneyHeight = 0.36;

    [-0.18, 0.18].forEach(kx => {
      // Gloss-black kidney frame
      const frameGeo = new THREE.BoxGeometry(kidneyWidth, kidneyHeight, 0.12);
      const frame = new THREE.Mesh(frameGeo, glossBlackMat);
      frame.position.set(kx, 0.32, -2.25);
      kidneyGroup.add(frame);

      // Horizontal double-slats inside grille
      for (let s = -0.12; s <= 0.12; s += 0.06) {
        const slatGeo = new THREE.BoxGeometry(kidneyWidth * 0.88, 0.015, 0.13);
        const slat = new THREE.Mesh(slatGeo, chromeMat);
        slat.position.set(kx, 0.32 + s, -2.25);
        kidneyGroup.add(slat);
      }

      // Subtle cyan neon backlight contour
      const glowBorderGeo = new THREE.RingGeometry(0.12, 0.15, 16);
      const glowBorder = new THREE.Mesh(glowBorderGeo, laserCyanMat);
      glowBorder.position.set(kx, 0.32, -2.27);
      glowBorder.scale.set(0.8, 1.2, 1);
      kidneyGroup.add(glowBorder);
    });

    // M Badge on right kidney
    const mBadgeGeo = new THREE.BoxGeometry(0.06, 0.025, 0.02);
    const mBadge = new THREE.Mesh(mBadgeGeo, laserCyanMat);
    mBadge.position.set(0.24, 0.44, -2.26);
    kidneyGroup.add(mBadge);

    chassisGroup.add(kidneyGroup);

    // ── 5. BMW LASERLIGHT HEADLIGHTS (HEXAGONAL DRLS) ──
    [-0.74, 0.74].forEach((hx, idx) => {
      const rotY = idx === 0 ? 0.2 : -0.2;

      // Dark headlight housing
      const housingGeo = new THREE.BoxGeometry(0.42, 0.12, 0.14);
      const housing = new THREE.Mesh(housingGeo, glossBlackMat);
      housing.position.set(hx, 0.42, -2.20);
      housing.rotation.y = rotY;
      chassisGroup.add(housing);

      // Dual L-shaped / Hexagonal laser DRL strips
      [-0.1, 0.1].forEach(dx => {
        const drlGeo = new THREE.RingGeometry(0.04, 0.06, 6);
        const drl = new THREE.Mesh(drlGeo, laserCyanMat);
        drl.position.set(hx + dx, 0.42, -2.28);
        drl.rotation.y = rotY;
        chassisGroup.add(drl);
      });

      // Forward projector beam
      const spot = new THREE.SpotLight(0x00f0ff, 3.2, 60, Math.PI / 4.8, 0.35, 1.1);
      spot.position.set(hx, 0.46, -2.18);
      spot.target.position.set(hx, 0, -32);
      chassisGroup.add(spot);
      chassisGroup.add(spot.target);
      this.headlights.push(spot);
    });

    // ── 6. CABIN, CARBON ROOF & HOFMEISTER KINK ──
    const cabinGeo = new THREE.BoxGeometry(1.54, 0.58, 2.15);
    const cabin = new THREE.Mesh(cabinGeo, bmwPaintMat);
    cabin.position.set(0, 0.81, 0.1);
    chassisGroup.add(cabin);

    // Carbon fiber roof with aerodynamic central groove
    const roofGeo = new THREE.BoxGeometry(1.48, 0.06, 1.7);
    const carbonRoof = new THREE.Mesh(roofGeo, carbonRoofMat);
    carbonRoof.position.set(0, 1.11, 0.12);
    chassisGroup.add(carbonRoof);

    // Iconic BMW Shark-Fin Roof Antenna
    const sharkGeo = new THREE.ConeGeometry(0.05, 0.14, 4);
    sharkGeo.rotateZ(Math.PI / 2);
    sharkGeo.rotateY(Math.PI / 4);
    const sharkFin = new THREE.Mesh(sharkGeo, glossBlackMat);
    sharkFin.position.set(0, 1.18, 0.78);
    chassisGroup.add(sharkFin);

    // Sloped Windshield
    const windshieldGeo = new THREE.BoxGeometry(1.48, 0.54, 0.75);
    const windshield = new THREE.Mesh(windshieldGeo, darkGlassMat);
    windshield.position.set(0, 0.78, -0.72);
    windshield.rotation.x = -0.50;
    chassisGroup.add(windshield);

    // Fastback Rear Window & Hofmeister Kink
    const rearGlassGeo = new THREE.BoxGeometry(1.48, 0.50, 0.8);
    const rearGlass = new THREE.Mesh(rearGlassGeo, darkGlassMat);
    rearGlass.position.set(0, 0.80, 0.88);
    rearGlass.rotation.x = 0.44;
    chassisGroup.add(rearGlass);

    // M Twin-Stalk Aerodynamic Wing Mirrors
    [-1.02, 1.02].forEach((mx, idx) => {
      const mirrorRot = idx === 0 ? 0.15 : -0.15;
      const mirrorGeo = new THREE.BoxGeometry(0.24, 0.11, 0.15);
      const mirror = new THREE.Mesh(mirrorGeo, glossBlackMat);
      mirror.position.set(mx, 0.75, -0.46);
      mirror.rotation.y = mirrorRot;
      chassisGroup.add(mirror);
    });

    // ── 7. REAR 3D OLED TAILLIGHTS, ROUNDEL & QUAD EXHAUST ──
    [-0.68, 0.68].forEach(tx => {
      // Signature BMW L-shaped LED Lightbar
      const tailGeo = new THREE.BoxGeometry(0.56, 0.08, 0.08);
      const taillight = new THREE.Mesh(tailGeo, this.taillightMaterial);
      taillight.position.set(tx, 0.52, 2.22);
      chassisGroup.add(taillight);
    });

    // Trunk BMW Roundel
    const trunkRoundel = new THREE.Mesh(roundelGeo, roundelMat);
    trunkRoundel.position.set(0, 0.56, 2.22);
    trunkRoundel.rotation.x = Math.PI / 2;
    chassisGroup.add(trunkRoundel);

    // Quad Chrome M Exhaust Tips & Flame VFX
    const exGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 16);
    exGeo.rotateX(Math.PI / 2);
    const exhaustX = [-0.64, -0.48, 0.48, 0.64];
    exhaustX.forEach(x => {
      const ex = new THREE.Mesh(exGeo, chromeMat);
      ex.position.set(x, 0.17, 2.26);
      chassisGroup.add(ex);

      // Dynamic Flame Burst mesh
      const flameGeo = new THREE.ConeGeometry(0.08, 0.42, 8);
      flameGeo.rotateX(-Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0,
      });
      const fl = new THREE.Mesh(flameGeo, flameMat);
      fl.position.set(x, 0.17, 2.52);
      chassisGroup.add(fl);
      this.exhaustFlames.push(fl);
    });

    this.chassisMesh = chassisGroup;
    this.meshGroup.add(this.chassisMesh);

    // ── 8. M-SPORT BI-COLOR ALLOY WHEELS WITH M-BLUE CALIPERS ──
    const createBmwWheel = () => {
      const wheelGroup = new THREE.Group();

      // Performance Tire
      const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 28);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x141416,
        roughness: 0.9,
        metalness: 0.1,
      });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      wheelGroup.add(tire);

      // Bi-Color M Rim Base
      const rimBaseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.29, 16);
      rimBaseGeo.rotateZ(Math.PI / 2);
      const rimBase = new THREE.Mesh(rimBaseGeo, glossBlackMat);
      wheelGroup.add(rimBase);

      // 5-Double Spokes in Burnished Chrome
      for (let s = 0; s < 5; s++) {
        const spokeAngle = (s * (Math.PI * 2)) / 5;
        const spokeGeo = new THREE.BoxGeometry(0.025, 0.23, 0.05);
        const spoke1 = new THREE.Mesh(spokeGeo, chromeMat);
        spoke1.position.set(0.145, Math.cos(spokeAngle) * 0.12, Math.sin(spokeAngle) * 0.12);
        spoke1.rotation.x = spokeAngle;
        wheelGroup.add(spoke1);
      }

      // Drilled Brake Rotor Disc
      const rotorGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 18);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotor = new THREE.Mesh(rotorGeo, chromeMat);
      rotor.position.set(0.06, 0, 0);
      wheelGroup.add(rotor);

      // M-Sport Blue Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.12, 0.14, 0.07);
      const caliper = new THREE.Mesh(caliperGeo, mBlueCalipersMat);
      caliper.position.set(0.08, 0.14, 0.04);
      wheelGroup.add(caliper);

      // Center BMW Hubcap Roundel
      const capGeo = new THREE.CircleGeometry(0.045, 16);
      capGeo.rotateY(Math.PI / 2);
      const hubcap = new THREE.Mesh(capGeo, roundelMat);
      hubcap.position.set(0.15, 0, 0);
      wheelGroup.add(hubcap);

      return wheelGroup;
    };

    // Front Left (Steering Pivot)
    this.frontLeftPivot = new THREE.Group();
    this.frontLeftPivot.position.set(-0.96, 0.36, -1.35);
    this.frontLeftWheel = createBmwWheel();
    this.frontLeftPivot.add(this.frontLeftWheel);
    this.meshGroup.add(this.frontLeftPivot);

    // Front Right (Steering Pivot)
    this.frontRightPivot = new THREE.Group();
    this.frontRightPivot.position.set(0.96, 0.36, -1.35);
    this.frontRightWheel = createBmwWheel();
    this.frontRightWheel.rotation.y = Math.PI; // face outward
    this.frontRightPivot.add(this.frontRightWheel);
    this.meshGroup.add(this.frontRightPivot);

    // Rear Left
    this.rearLeftWheel = createBmwWheel();
    this.rearLeftWheel.position.set(-0.96, 0.36, 1.25);
    this.meshGroup.add(this.rearLeftWheel);

    // Rear Right
    this.rearRightWheel = createBmwWheel();
    this.rearRightWheel.position.set(0.96, 0.36, 1.25);
    this.rearRightWheel.rotation.y = Math.PI;
    this.meshGroup.add(this.rearRightWheel);
  }

  update(delta, controls) {
    if (delta > 0.1) delta = 0.1; // clamp lag spike

    // ── ACCELERATION, BRAKING & REVERSE ──
    const isAccelerating = controls.throttle > 0;
    const isReversing = controls.reverse > 0;
    const isHandbrake = controls.handbrake;

    if (isAccelerating) {
      if (this.speed < 0) {
        this.speed += this.brakeDecel * delta;
      } else {
        this.speed += this.acceleration * delta;
        if (this.speed > this.maxForwardSpeed) this.speed = this.maxForwardSpeed;
      }
    } else if (isReversing) {
      if (this.speed > 0) {
        this.speed -= this.brakeDecel * delta;
      } else {
        this.speed -= this.acceleration * 0.75 * delta;
        if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
      }
    } else {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.friction * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.friction * delta);
      }
    }

    if (isHandbrake) {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.handbrakeDecel * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.handbrakeDecel * delta);
      }
    }

    // ── STEERING DYNAMICS ──
    const maxSteerAngle = 0.55;
    this.steeringAngle = controls.steer * maxSteerAngle;

    if (this.frontLeftPivot && this.frontRightPivot) {
      this.frontLeftPivot.rotation.y = -this.steeringAngle;
      this.frontRightPivot.rotation.y = -this.steeringAngle + Math.PI;
    }

    // Yaw rotation rate
    const turnFactor = 0.054;
    if (Math.abs(this.speed) > 0.1) {
      const dir = this.speed >= 0 ? 1 : -1;
      this.rotation -= controls.steer * turnFactor * (Math.abs(this.speed) / this.maxForwardSpeed + 0.3) * dir;
    }

    // Velocity update
    const vx = -Math.sin(this.rotation) * this.speed;
    const vz = -Math.cos(this.rotation) * this.speed;

    this.position.x += vx * delta;
    this.position.z += vz * delta;

    // ── RAMP & JUMP COLLISION DETECTION ──
    let onRamp = false;
    for (let r of this.ramps) {
      const rx = this.position.x - r.x;
      const rz = this.position.z - r.z;
      const cosA = Math.cos(-r.angle);
      const sinA = Math.sin(-r.angle);
      const localX = rx * cosA - rz * sinA;
      const localZ = rx * sinA + rz * cosA;

      if (Math.abs(localX) <= r.width / 2 && localZ >= -r.length / 2 && localZ <= r.length / 2) {
        onRamp = true;
        const progress = (localZ + r.length / 2) / r.length;
        const rampHeight = progress * r.height;
        const targetGround = this.groundY + rampHeight;

        if (this.position.y <= targetGround + 0.3) {
          this.position.y = targetGround;
          this.vy = 0;
          this.isAirborne = false;
          if (progress > 0.88 && this.speed > 10) {
            this.vy = Math.max(14, Math.abs(this.speed) * 0.45);
            this.isAirborne = true;
          }
        }
        break;
      }
    }

    // ── AIRBORNE & GRAVITY PHYSICS ──
    if (this.isAirborne || this.position.y > this.groundY + 0.05) {
      this.vy += this.gravity * delta;
      this.position.y += this.vy * delta;
      if (this.position.y <= this.groundY) {
        this.position.y = this.groundY;
        this.vy = 0;
        this.isAirborne = false;
      }
    }

    // ── BRUNO SIMON FREE-ROAMING ISLAND BOUNDARIES ──
    if (this.position.x > this.worldMaxX) {
      this.position.x = this.worldMaxX;
      this.speed *= -0.3;
    } else if (this.position.x < this.worldMinX) {
      this.position.x = this.worldMinX;
      this.speed *= -0.3;
    }

    if (this.position.z < this.worldMinZ) {
      this.position.z = this.worldMinZ;
      this.speed = 0;
    } else if (this.position.z > this.worldMaxZ) {
      this.position.z = this.worldMaxZ;
      this.speed = 0;
    }

    // Deep water safety: if fallen into deep pond away from bridge, respawn on road
    const pondDist = Math.hypot(this.position.x - 95, this.position.z - (-1220));
    if (pondDist < 75 && Math.abs(this.position.x) > 22 && !this.isAirborne) {
      this.teleportTo(-6, 0.45, -1140, 0);
    }

    // Drifting state check
    this.isDrifting = (Math.abs(this.speed) > 16.0 && Math.abs(controls.steer) > 0.45) || (isHandbrake && Math.abs(this.speed) > 8);

    this.meshGroup.position.copy(this.position);
    this.meshGroup.rotation.y = this.rotation;

    // Wheel spin
    const wheelRotSpeed = (this.speed * delta) / 0.36;
    if (this.frontLeftWheel)  this.frontLeftWheel.rotation.x -= wheelRotSpeed;
    if (this.frontRightWheel) this.frontRightWheel.rotation.x += wheelRotSpeed;
    if (this.rearLeftWheel)   this.rearLeftWheel.rotation.x -= wheelRotSpeed;
    if (this.rearRightWheel)  this.rearRightWheel.rotation.x += wheelRotSpeed;

    // Suspension dynamics (M-tuned pitch & roll + jump pitch)
    if (this.chassisMesh) {
      let targetPitch = 0;
      if (this.isAirborne) {
        targetPitch = -0.06; // tilt up when jumping
      } else {
        if (isAccelerating && this.speed >= 0) targetPitch = -0.028;
        if (isReversing || isHandbrake || (controls.reverse > 0 && this.speed > 0)) targetPitch = 0.045;
      }
      this.chassisMesh.rotation.x += (targetPitch - this.chassisMesh.rotation.x) * 0.16;

      const targetRoll = controls.steer * (this.speed / this.maxForwardSpeed) * 0.048;
      this.chassisMesh.rotation.z += (targetRoll - this.chassisMesh.rotation.z) * 0.16;
    }

    // Taillights brake flare
    const isBraking = (controls.reverse > 0 && this.speed > 0.5) || isHandbrake;
    if (this.taillightMaterial) {
      if (isBraking !== this.brakeLightActive) {
        this.brakeLightActive = isBraking;
        this.taillightMaterial.emissiveIntensity = isBraking ? 3.8 : 1.4;
      }
    }

    this.speedKmh = Math.round(Math.abs(this.speed) * 3.6);

    // ── 6-SPEED TRANSMISSION & RPM CALCULATION ──
    if (this.shiftCooldown > 0) {
      this.shiftCooldown -= delta;
      if (this.shiftCooldown <= 0.12) {
        this.isShifting = false;
      }
    }

    const absSpeed = Math.abs(this.speed);
    if (absSpeed < 0.8) {
      this.currentGear = 1;
      this.rpm = 1000 + controls.throttle * 4400;
    } else {
      const maxGearSpeed = this.gearMaxSpeeds[this.currentGear - 1];
      const prevGearSpeed = this.currentGear > 1 ? this.gearMaxSpeeds[this.currentGear - 2] : 0;
      const progressInGear = Math.max(0, Math.min(1.08, (absSpeed - prevGearSpeed * 0.45) / (maxGearSpeed - prevGearSpeed * 0.45)));

      this.rpm = 2000 + progressInGear * 5400;

      // Upshift
      if (this.rpm > 6900 && this.currentGear < 6 && this.shiftCooldown <= 0 && controls.throttle > 0) {
        this.currentGear++;
        this.isShifting = true;
        this.shiftCooldown = 0.32;
        this.flameTimer = 0.22;
        if (this.onGearShiftCallback) this.onGearShiftCallback('up', this.currentGear);
      }
      // Downshift
      else if (this.rpm < 2400 && this.currentGear > 1 && this.shiftCooldown <= 0) {
        this.currentGear--;
        this.isShifting = true;
        this.shiftCooldown = 0.28;
        this.flameTimer = 0.16;
        if (this.onGearShiftCallback) this.onGearShiftCallback('down', this.currentGear);
      }
    }

    // ── NITRO BOOST TIMER ──
    if (this.boostTimer > 0) {
      this.boostTimer -= delta;
      this.speed = Math.min(56.0, this.speed + 26.0 * delta);
      this.flameTimer = 0.22;
    }

    // ── EXHAUST FLAME VFX ──
    if (this.flameTimer > 0) {
      this.flameTimer -= delta;
      const opacity = Math.min(1.0, this.flameTimer * 5.0);
      const scale = 0.8 + Math.random() * 0.55;
      this.exhaustFlames.forEach((fl, idx) => {
        fl.material.opacity = opacity;
        fl.material.color.setHex((idx === 0 || idx === 3) ? 0x00f0ff : 0xff6600);
        fl.scale.set(scale, scale, scale * 1.4);
      });
    } else {
      this.exhaustFlames.forEach(fl => { fl.material.opacity = 0; });
    }
  }

  applyBoost(duration = 2.0) {
    this.boostTimer = duration;
    this.speed = Math.max(this.speed, 48.0);
    this.flameTimer = duration * 0.8;
  }

  resetPosition() {
    this.teleportTo(0, 0.45, 0, 0);
  }

  teleportTo(x, y, z, rotation = 0) {
    this.position.set(x, y !== undefined ? y : 0.45, z);
    this.rotation = rotation;
    this.speed = 0;
    this.vy = 0;
    this.isAirborne = false;
    this.meshGroup.position.copy(this.position);
    this.meshGroup.rotation.y = this.rotation;
    if (this.chassisMesh) {
      this.chassisMesh.rotation.x = 0;
      this.chassisMesh.rotation.z = 0;
    }
  }

  honk() {
    // Flash headlights
    if (this.headlights && this.headlights.length > 0) {
      this.headlights.forEach(hl => {
        const orig = hl.intensity;
        hl.intensity = 5.5;
        setTimeout(() => { hl.intensity = orig; }, 180);
      });
    }
  }

  // ── NEAREST POINT ON ROAD CURVE (cached for performance) ──
  findNearestTOnCurve(pos) {
    if (!this.roadCurve) return { t: 0, point: pos.clone(), dist: 0 };

    // Search in a window around last cached t (efficient for smooth movement)
    const windowHalf = 0.12;
    const lo = Math.max(0, this.lastCurveT - windowHalf);
    const hi = Math.min(1, this.lastCurveT + windowHalf);
    const steps = 36;

    let minDist = Infinity;
    let minT = this.lastCurveT;
    let minPt = null;

    for (let i = 0; i <= steps; i++) {
      const t = lo + (hi - lo) * (i / steps);
      const pt = this.roadCurve.getPoint(t);
      const d = (pos.x - pt.x) ** 2 + (pos.z - pt.z) ** 2;
      if (d < minDist) {
        minDist = d;
        minT = t;
        minPt = pt;
      }
    }

    // If the car has drifted far from cached window, do a full coarse search
    if (Math.sqrt(minDist) > 60) {
      const coarseSteps = 80;
      for (let i = 0; i <= coarseSteps; i++) {
        const t = i / coarseSteps;
        const pt = this.roadCurve.getPoint(t);
        const d = (pos.x - pt.x) ** 2 + (pos.z - pt.z) ** 2;
        if (d < minDist) {
          minDist = d;
          minT = t;
          minPt = pt;
        }
      }
    }

    this.lastCurveT = minT;
    return { t: minT, point: minPt || this.roadCurve.getPoint(minT), dist: Math.sqrt(minDist) };
  }
}

window.SportsCar = SportsCar;
