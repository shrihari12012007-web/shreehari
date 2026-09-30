/**
 * car.js - BMW-Inspired Premium Sports Car Model & Physics Engine
 * High-detail procedural sports coupe with dynamic lighting, steering, wheel rotation,
 * realistic suspension tilt, and road boundary physics.
 */

class SportsCar {
  constructor(scene) {
    this.scene = scene;

    // Physical state
    this.position = new THREE.Vector3(0, 0.45, 0);
    this.rotation = 0; // heading angle around Y
    this.speed = 0;    // current speed in units/sec
    this.steeringAngle = 0;
    this.maxForwardSpeed = 46.0; // ~165 km/h
    this.maxReverseSpeed = -10.0;
    this.acceleration = 18.0;
    this.brakeDecel = 32.0;
    this.handbrakeDecel = 50.0;
    this.friction = 7.0;
    this.speedKmh = 0;

    // Road limits (bridge width)
    this.roadHalfWidth = 9.2;
    this.roadMinZ = -1400;
    this.roadMaxZ = 80;

    // Visual nodes
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

    // Build the car
    this.initModel();
    this.scene.add(this.meshGroup);
  }

  initModel() {
    // Premium materials
    const carPaintMat = new THREE.MeshStandardMaterial({
      color: 0x0c101c, // deep metallic midnight navy
      metalness: 0.9,
      roughness: 0.22,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x08080a,
      metalness: 0.8,
      roughness: 0.6,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x050912,
      metalness: 0.95,
      roughness: 0.08,
      transparent: true,
      opacity: 0.88,
    });

    const cyanGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd0d8e2,
      metalness: 0.98,
      roughness: 0.1,
    });

    this.taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xaa0015,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });

    // ── 1. MAIN CHASSIS & LOWER BODY ──
    const chassisGroup = new THREE.Group();

    // Lower base
    const baseGeo = new THREE.BoxGeometry(1.9, 0.45, 4.4);
    const baseMesh = new THREE.Mesh(baseGeo, carPaintMat);
    baseMesh.position.y = 0.26;
    chassisGroup.add(baseMesh);

    // Aerodynamic front splitter
    const splitterGeo = new THREE.BoxGeometry(1.94, 0.08, 0.6);
    const splitter = new THREE.Mesh(splitterGeo, carbonMat);
    splitter.position.set(0, 0.07, -2.18);
    chassisGroup.add(splitter);

    // Rear diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.92, 0.14, 0.5);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
    diffuser.position.set(0, 0.16, 2.15);
    chassisGroup.add(diffuser);

    // Hood & Front Nose
    const hoodGeo = new THREE.BoxGeometry(1.82, 0.3, 1.6);
    const hood = new THREE.Mesh(hoodGeo, carPaintMat);
    hood.position.set(0, 0.44, -1.25);
    hood.rotation.x = -0.06;
    chassisGroup.add(hood);

    // Front Fender Flares
    const fenderGeo = new THREE.BoxGeometry(2.0, 0.32, 0.9);
    const frontFenders = new THREE.Mesh(fenderGeo, carPaintMat);
    frontFenders.position.set(0, 0.38, -1.35);
    chassisGroup.add(frontFenders);

    const rearFenders = new THREE.Mesh(fenderGeo, carPaintMat);
    rearFenders.position.set(0, 0.40, 1.25);
    chassisGroup.add(rearFenders);

    // Cabin / Cockpit Roof
    const cabinGeo = new THREE.BoxGeometry(1.52, 0.58, 2.1);
    const cabin = new THREE.Mesh(cabinGeo, carPaintMat);
    cabin.position.set(0, 0.82, 0.08);
    chassisGroup.add(cabin);

    // Glass Canopy (Windshield, Rear Window, Side Windows)
    const windshieldGeo = new THREE.BoxGeometry(1.48, 0.52, 0.7);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 0.78, -0.72);
    windshield.rotation.x = -0.48;
    chassisGroup.add(windshield);

    const rearWindowGeo = new THREE.BoxGeometry(1.48, 0.48, 0.75);
    const rearWindow = new THREE.Mesh(rearWindowGeo, glassMat);
    rearWindow.position.set(0, 0.81, 0.82);
    rearWindow.rotation.x = 0.42;
    chassisGroup.add(rearWindow);

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.16);
    const mirrorL = new THREE.Mesh(mirrorGeo, carbonMat);
    mirrorL.position.set(-1.02, 0.76, -0.45);
    mirrorL.rotation.y = 0.15;
    chassisGroup.add(mirrorL);

    const mirrorR = mirrorL.clone();
    mirrorR.position.x = 1.02;
    mirrorR.rotation.y = -0.15;
    chassisGroup.add(mirrorR);

    // ── 2. BMW-INSPIRED ICONIC FRONT GRILLE ──
    const grilleGroup = new THREE.Group();
    const kidneyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.28, 16);
    kidneyGeo.rotateZ(Math.PI / 2);

    const kidneyL = new THREE.Mesh(kidneyGeo, carbonMat);
    kidneyL.position.set(-0.25, 0.36, -2.2);
    kidneyL.scale.set(0.65, 1.2, 0.4);
    grilleGroup.add(kidneyL);

    const kidneyR = kidneyL.clone();
    kidneyR.position.x = 0.25;
    grilleGroup.add(kidneyR);

    // Subtle cyan backlight for kidney grilles
    const kidneyGlowGeo = new THREE.RingGeometry(0.12, 0.16, 16);
    const glowRingL = new THREE.Mesh(kidneyGlowGeo, cyanGlowMat);
    glowRingL.position.set(-0.25, 0.36, -2.22);
    grilleGroup.add(glowRingL);

    const glowRingR = glowRingL.clone();
    glowRingR.position.x = 0.25;
    grilleGroup.add(glowRingR);

    chassisGroup.add(grilleGroup);

    // ── 3. SHARP LED HEADLIGHTS ──
    const headlightGeo = new THREE.BoxGeometry(0.38, 0.1, 0.12);
    const headlightL = new THREE.Mesh(headlightGeo, cyanGlowMat);
    headlightL.position.set(-0.72, 0.4, -2.18);
    headlightL.rotation.y = 0.18;
    chassisGroup.add(headlightL);

    const headlightR = headlightL.clone();
    headlightR.position.x = 0.72;
    headlightR.rotation.y = -0.18;
    chassisGroup.add(headlightR);

    // Spotlight beams casting forward on the asphalt
    const spotL = new THREE.SpotLight(0x00e1ff, 2.5, 55, Math.PI / 5, 0.4, 1.2);
    spotL.position.set(-0.72, 0.45, -2.15);
    spotL.target.position.set(-0.72, 0, -28);
    chassisGroup.add(spotL);
    chassisGroup.add(spotL.target);
    this.headlights.push(spotL);

    const spotR = new THREE.SpotLight(0x00e1ff, 2.5, 55, Math.PI / 5, 0.4, 1.2);
    spotR.position.set(0.72, 0.45, -2.15);
    spotR.target.position.set(0.72, 0, -28);
    chassisGroup.add(spotR);
    chassisGroup.add(spotR.target);
    this.headlights.push(spotR);

    // ── 4. REAR TAILLIGHTS & QUAD EXHAUST ──
    const taillightGeo = new THREE.BoxGeometry(0.55, 0.08, 0.08);
    const taillightL = new THREE.Mesh(taillightGeo, this.taillightMaterial);
    taillightL.position.set(-0.66, 0.52, 2.2);
    chassisGroup.add(taillightL);

    const taillightR = taillightL.clone();
    taillightR.position.x = 0.66;
    chassisGroup.add(taillightR);

    // Quad chrome exhaust tips
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12);
    exhaustGeo.rotateX(Math.PI / 2);
    const exPos = [-0.62, -0.48, 0.48, 0.62];
    exPos.forEach(x => {
      const ex = new THREE.Mesh(exhaustGeo, chromeMat);
      ex.position.set(x, 0.18, 2.25);
      chassisGroup.add(ex);
    });

    this.chassisMesh = chassisGroup;
    this.meshGroup.add(this.chassisMesh);

    // ── 5. WHEEL ASSEMBLIES ──
    const createWheel = () => {
      const wheelGroup = new THREE.Group();

      // Tire
      const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x161616,
        roughness: 0.85,
        metalness: 0.1,
      });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      wheelGroup.add(tire);

      // Alloy Rim
      const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, chromeMat);
      wheelGroup.add(rim);

      // Neon Cyan Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.12, 0.14, 0.08);
      const caliper = new THREE.Mesh(caliperGeo, cyanGlowMat);
      caliper.position.set(0, 0.14, 0.05);
      wheelGroup.add(caliper);

      return wheelGroup;
    };

    // Front Left (with steering pivot)
    this.frontLeftPivot = new THREE.Group();
    this.frontLeftPivot.position.set(-0.95, 0.35, -1.35);
    this.frontLeftWheel = createWheel();
    this.frontLeftPivot.add(this.frontLeftWheel);
    this.meshGroup.add(this.frontLeftPivot);

    // Front Right (with steering pivot)
    this.frontRightPivot = new THREE.Group();
    this.frontRightPivot.position.set(0.95, 0.35, -1.35);
    this.frontRightWheel = createWheel();
    this.frontRightPivot.add(this.frontRightWheel);
    this.meshGroup.add(this.frontRightPivot);

    // Rear Left
    this.rearLeftWheel = createWheel();
    this.rearLeftWheel.position.set(-0.95, 0.35, 1.25);
    this.meshGroup.add(this.rearLeftWheel);

    // Rear Right
    this.rearRightWheel = createWheel();
    this.rearRightWheel.position.set(0.95, 0.35, 1.25);
    this.meshGroup.add(this.rearRightWheel);
  }

  update(delta, controls) {
    if (delta > 0.1) delta = 0.1; // clamp lag spike

    // ── ACCELERATION & BRAKING ──
    const isAccelerating = controls.throttle > 0;
    const isReversing = controls.reverse > 0;
    const isHandbrake = controls.handbrake;

    if (isAccelerating) {
      if (this.speed < 0) {
        // Active braking from reverse
        this.speed += this.brakeDecel * delta;
      } else {
        this.speed += this.acceleration * delta;
        if (this.speed > this.maxForwardSpeed) this.speed = this.maxForwardSpeed;
      }
    } else if (isReversing) {
      if (this.speed > 0) {
        // Active braking from forward
        this.speed -= this.brakeDecel * delta;
      } else {
        this.speed -= this.acceleration * 0.7 * delta;
        if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
      }
    } else {
      // Natural rolling friction
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

    // ── STEERING ──
    const maxSteerAngle = 0.58; // radians (~33 deg)
    this.steeringAngle = controls.steer * maxSteerAngle;

    // Apply steering to front wheel pivots
    if (this.frontLeftPivot && this.frontRightPivot) {
      this.frontLeftPivot.rotation.y = -this.steeringAngle;
      this.frontRightPivot.rotation.y = -this.steeringAngle;
    }

    // Car yaw turning rate scales with speed & steering
    const turnFactor = 0.052;
    if (Math.abs(this.speed) > 0.1) {
      const dir = this.speed >= 0 ? 1 : -1;
      this.rotation -= controls.steer * turnFactor * (Math.abs(this.speed) / this.maxForwardSpeed + 0.3) * dir;
    }

    // ── VELOCITY & POSITION ──
    const vx = -Math.sin(this.rotation) * this.speed;
    const vz = -Math.cos(this.rotation) * this.speed;

    this.position.x += vx * delta;
    this.position.z += vz * delta;

    // ── ROAD BOUNDARIES (STAY ON THE BRIDGE) ──
    if (this.position.x > this.roadHalfWidth) {
      this.position.x = this.roadHalfWidth;
      this.speed *= 0.88; // gentle guardrail friction
    } else if (this.position.x < -this.roadHalfWidth) {
      this.position.x = -this.roadHalfWidth;
      this.speed *= 0.88;
    }

    // Loop or cap bridge length
    if (this.position.z < this.roadMinZ) {
      this.position.z = this.roadMinZ;
      this.speed = 0;
    }
    if (this.position.z > this.roadMaxZ) {
      this.position.z = this.roadMaxZ;
      this.speed = 0;
    }

    // Update 3D transforms
    this.meshGroup.position.copy(this.position);
    this.meshGroup.rotation.y = this.rotation;

    // ── WHEEL SPIN ──
    const wheelRotSpeed = (this.speed * delta) / 0.35;
    if (this.frontLeftWheel)  this.frontLeftWheel.rotation.x -= wheelRotSpeed;
    if (this.frontRightWheel) this.frontRightWheel.rotation.x -= wheelRotSpeed;
    if (this.rearLeftWheel)   this.rearLeftWheel.rotation.x -= wheelRotSpeed;
    if (this.rearRightWheel)  this.rearRightWheel.rotation.x -= wheelRotSpeed;

    // ── SUSPENSION DYNAMICS (PITCH & ROLL) ──
    if (this.chassisMesh) {
      // Pitch: dip nose on brake, squat on acceleration
      let targetPitch = 0;
      if (isAccelerating && this.speed >= 0) targetPitch = -0.025;
      if (isReversing || isHandbrake || (controls.reverse > 0 && this.speed > 0)) targetPitch = 0.04;
      this.chassisMesh.rotation.x += (targetPitch - this.chassisMesh.rotation.x) * 0.15;

      // Roll: lean into/against hard turns
      const targetRoll = controls.steer * (this.speed / this.maxForwardSpeed) * 0.045;
      this.chassisMesh.rotation.z += (targetRoll - this.chassisMesh.rotation.z) * 0.15;
    }

    // ── BRAKE LIGHTS INTENSITY ──
    const isBraking = (controls.reverse > 0 && this.speed > 0.5) || isHandbrake;
    if (this.taillightMaterial) {
      if (isBraking !== this.brakeLightActive) {
        this.brakeLightActive = isBraking;
        this.taillightMaterial.emissiveIntensity = isBraking ? 3.5 : 1.2;
      }
    }

    // KM/H calculation for HUD
    this.speedKmh = Math.round(Math.abs(this.speed) * 3.6);
  }

  resetPosition() {
    this.position.set(0, 0.45, 0);
    this.rotation = 0;
    this.speed = 0;
    this.meshGroup.position.copy(this.position);
    this.meshGroup.rotation.y = 0;
    if (this.chassisMesh) {
      this.chassisMesh.rotation.x = 0;
      this.chassisMesh.rotation.z = 0;
    }
  }
}

window.SportsCar = SportsCar;
