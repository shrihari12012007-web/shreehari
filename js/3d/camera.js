/**
 * camera.js - Bruno Simon Elevated Camera with Full 360-Degree Free Orbit Rotation
 * Features:
 * - Full 360-Degree Orbit: Click & drag mouse or touch-swipe to rotate around the car freely
 * - Keyboard Orbit: Q / E keys smoothly spin the camera 360° around the vehicle
 * - Auto-Spin Mode: Cinematic 360-degree rotating showcase view
 * - View Modes: ISOMETRIC (elevated overview), CHASE (close bumper), and 360 FREE ORBIT
 * - Dynamic speed altitude and FOV modulation
 */

class DriveCamera {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'PREVIEW'; // 'PREVIEW', 'DRIVING'
    this.driveViewMode = 'ISOMETRIC'; // 'ISOMETRIC', 'CHASE', 'FREE_360'

    // Damping state
    this.currentPosition = new THREE.Vector3(12, 16, 20);
    this.currentTarget = new THREE.Vector3(0, 1, 0);

    // 360-Degree Orbit Controls
    this.orbitAzimuth = 0; // Horizontal angle around car (0 to 2*PI)
    this.orbitElevation = 0.52; // Vertical pitch angle (~30 to 75 deg)
    this.orbitDistance = 22.0; // Distance from vehicle
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.userControlledOrbit = false;
    this.idleReturnTimer = 0;
    this.autoSpinActive = false;

    // Dynamic FOV
    this.baseFov = 52;
    this.maxFov = 64;
    this.currentFov = 52;

    this.initPointerControls();
  }

  initPointerControls() {
    window.addEventListener('pointerdown', (e) => {
      // Only capture drag if clicking on the 3D canvas (not interactive HUD buttons)
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.userControlledOrbit = true;
      this.idleReturnTimer = 0;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      // Rotate 360 degrees horizontally
      const rotSpeed = 0.0065;
      this.orbitAzimuth -= dx * rotSpeed;

      // Pitch vertically (clamped)
      this.orbitElevation = Math.max(0.12, Math.min(1.28, this.orbitElevation + dy * rotSpeed * 0.7));
      this.idleReturnTimer = 0;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    // Zoom on wheel
    window.addEventListener('wheel', (e) => {
      if (this.mode !== 'DRIVING') return;
      this.orbitDistance = Math.max(10, Math.min(46, this.orbitDistance + e.deltaY * 0.02));
      this.idleReturnTimer = 0;
    }, { passive: true });

    // Keyboard Q / E to rotate 360 degrees
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyQ') {
        this.orbitAzimuth += 0.08;
        this.userControlledOrbit = true;
        this.idleReturnTimer = 0;
      }
      if (e.code === 'KeyE') {
        this.orbitAzimuth -= 0.08;
        this.userControlledOrbit = true;
        this.idleReturnTimer = 0;
      }
    });
  }

  setMode(mode) {
    this.mode = mode;
  }

  toggleViewMode() {
    if (this.driveViewMode === 'ISOMETRIC') {
      this.driveViewMode = 'CHASE';
    } else if (this.driveViewMode === 'CHASE') {
      this.driveViewMode = 'FREE_360';
      this.autoSpinActive = true;
    } else {
      this.driveViewMode = 'ISOMETRIC';
      this.autoSpinActive = false;
      this.userControlledOrbit = false;
    }
    return this.driveViewMode;
  }

  toggleAutoSpin() {
    this.autoSpinActive = !this.autoSpinActive;
    return this.autoSpinActive;
  }

  snapTo(targetPos) {
    this.currentTarget.copy(targetPos);
    this.currentPosition.set(targetPos.x + 12, targetPos.y + 19, targetPos.z + 18);
    this.userControlledOrbit = false;
  }

  update(delta, car, time) {
    if (this.mode === 'DRIVING') {
      this.updateDriving(delta, car, time);
    } else {
      this.updatePreview(delta, car, time);
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);

    if (Math.abs(this.camera.fov - this.currentFov) > 0.1) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }
  }

  updateDriving(delta, car, time) {
    const speedRatio = Math.min(1, Math.abs(car.speed) / car.maxForwardSpeed);

    // Auto-spin mode spins 360 degrees constantly
    if (this.autoSpinActive) {
      this.orbitAzimuth += delta * 0.45;
    }

    // If user rotated via mouse/touch, use full 360-degree spherical orbit
    if (this.userControlledOrbit || this.autoSpinActive) {
      // Calculate 3D sphere coordinate around car
      const dist = this.orbitDistance;
      const height = Math.sin(this.orbitElevation) * dist;
      const horizRadius = Math.cos(this.orbitElevation) * dist;

      // Heading combined with user orbit azimuth
      const totalAngle = car.rotation + this.orbitAzimuth;
      const targetPos = new THREE.Vector3(
        car.position.x + Math.sin(totalAngle) * horizRadius,
        car.position.y + height + 0.6,
        car.position.z + Math.cos(totalAngle) * horizRadius
      );

      const targetLookAt = new THREE.Vector3(
        car.position.x,
        car.position.y + 0.9,
        car.position.z
      );

      this.currentPosition.lerp(targetPos, 0.12);
      this.currentTarget.lerp(targetLookAt, 0.15);

      // Reset to follow after 8s of no user input
      if (!this.autoSpinActive && !this.isDragging) {
        this.idleReturnTimer += delta;
        if (this.idleReturnTimer > 8.0) {
          this.userControlledOrbit = false;
          this.orbitAzimuth *= 0.95;
        }
      }
      return;
    }

    // Default Dynamic Follow (Isometric or Chase)
    if (this.driveViewMode === 'ISOMETRIC') {
      // Elevated angle looking down at ~40 degrees
      const elevationHeight = 17.5 + speedRatio * 4.0;
      const behindDistance = 18.0 + speedRatio * 3.5;
      const sideOffset = 10.5;

      const angle = car.rotation;
      const offsetX = Math.sin(angle) * behindDistance + Math.cos(angle) * sideOffset * 0.35;
      const offsetZ = Math.cos(angle) * behindDistance - Math.sin(angle) * sideOffset * 0.35;

      const targetPos = new THREE.Vector3(
        car.position.x + offsetX,
        car.position.y + elevationHeight,
        car.position.z + offsetZ
      );

      const lookAheadDist = 3.5 + speedRatio * 4.0;
      const targetLookAt = new THREE.Vector3(
        car.position.x - Math.sin(angle) * lookAheadDist,
        car.position.y + 0.8,
        car.position.z - Math.cos(angle) * lookAheadDist
      );

      this.currentPosition.lerp(targetPos, 0.09);
      this.currentTarget.lerp(targetLookAt, 0.12);
      this.currentFov = 50 + speedRatio * 6;
    } else {
      // Close Chase view
      const behindDistance = 7.5;
      const height = 3.2;

      const angle = car.rotation;
      const targetPos = new THREE.Vector3(
        car.position.x + Math.sin(angle) * behindDistance,
        car.position.y + height,
        car.position.z + Math.cos(angle) * behindDistance
      );

      const targetLookAt = new THREE.Vector3(
        car.position.x - Math.sin(angle) * 6.5,
        car.position.y + 1.2,
        car.position.z - Math.cos(angle) * 6.5
      );

      this.currentPosition.lerp(targetPos, 0.12);
      this.currentTarget.lerp(targetLookAt, 0.15);
      this.currentFov = this.baseFov + speedRatio * 8;
    }
  }

  updatePreview(delta, car, time) {
    const radius = 10.5;
    const orbitSpeed = 0.22;
    const angle = Math.sin(time * orbitSpeed) * 0.42 - 0.2;

    const targetPos = new THREE.Vector3(
      car.position.x + Math.sin(angle) * radius + 2.8,
      car.position.y + 3.2 + Math.sin(time * 0.35) * 0.4,
      car.position.z + Math.cos(angle) * radius
    );

    const targetLookAt = new THREE.Vector3(
      car.position.x,
      car.position.y + 0.9,
      car.position.z
    );

    this.currentPosition.lerp(targetPos, 0.05);
    this.currentTarget.lerp(targetLookAt, 0.08);
    this.currentFov = 52;
  }
}

window.DriveCamera = DriveCamera;
