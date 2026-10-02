/**
 * camera.js - Bruno Simon-Inspired Elevated Isometric & Chase Camera Controller
 * Supports:
 * - ISOMETRIC: Iconic elevated bird's-eye perspective (default) for an open-world overview
 * - CHASE: Dynamic close 3rd-person follow camera
 * - PREVIEW: Gentle idle orbit when viewing the hero section
 * - Smooth lerping, speed-responsive altitude/FOV, and teleport swooping.
 */

class DriveCamera {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'PREVIEW'; // 'PREVIEW', 'ISOMETRIC', or 'CHASE'
    this.driveViewMode = 'ISOMETRIC'; // Toggleable via 'C' key

    // Damping state
    this.currentPosition = new THREE.Vector3(12, 14, 18);
    this.currentTarget = new THREE.Vector3(0, 1, 0);

    // Dynamic FOV
    this.baseFov = 52;
    this.maxFov = 64;
    this.currentFov = 52;

    // Teleport swooping
    this.isTeleporting = false;
  }

  setMode(mode) {
    this.mode = mode;
  }

  toggleViewMode() {
    this.driveViewMode = this.driveViewMode === 'ISOMETRIC' ? 'CHASE' : 'ISOMETRIC';
    return this.driveViewMode;
  }

  snapTo(targetPos) {
    this.currentTarget.copy(targetPos);
    if (this.driveViewMode === 'ISOMETRIC') {
      this.currentPosition.set(targetPos.x + 12, targetPos.y + 19, targetPos.z + 18);
    } else {
      this.currentPosition.set(targetPos.x, targetPos.y + 3.5, targetPos.z + 8);
    }
  }

  update(delta, car, time) {
    if (this.mode === 'DRIVING') {
      if (this.driveViewMode === 'ISOMETRIC') {
        this.updateIsometric(delta, car);
      } else {
        this.updateChase(delta, car);
      }
    } else {
      this.updatePreview(delta, car, time);
    }

    // Apply to Three.js camera
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);

    if (Math.abs(this.camera.fov - this.currentFov) > 0.1) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }
  }

  // ── BRUNO SIMON ELEVATED ISOMETRIC VIEW ──
  updateIsometric(delta, car) {
    const speedRatio = Math.min(1, Math.abs(car.speed) / car.maxForwardSpeed);

    // Elevated angle looking down at ~42 degrees
    const elevationHeight = 18.0 + speedRatio * 4.5;
    const behindDistance = 18.5 + speedRatio * 3.5;
    const sideOffset = 11.0;

    // Follow car heading gently with soft damping
    const angle = car.rotation;
    const offsetX = Math.sin(angle) * behindDistance + Math.cos(angle) * sideOffset * 0.4;
    const offsetZ = Math.cos(angle) * behindDistance - Math.sin(angle) * sideOffset * 0.4;

    const targetPos = new THREE.Vector3(
      car.position.x + offsetX,
      car.position.y + elevationHeight,
      car.position.z + offsetZ
    );

    // Look slightly ahead of the car
    const lookAheadDist = 4.0 + speedRatio * 4.0;
    const targetLookAt = new THREE.Vector3(
      car.position.x - Math.sin(angle) * lookAheadDist,
      car.position.y + 0.8,
      car.position.z - Math.cos(angle) * lookAheadDist
    );

    // Soft, smooth follow lerp
    const posLerp = 0.085;
    const lookLerp = 0.12;
    this.currentPosition.lerp(targetPos, posLerp);
    this.currentTarget.lerp(targetLookAt, lookLerp);

    const targetFov = 50 + speedRatio * 6;
    this.currentFov += (targetFov - this.currentFov) * 0.06;
  }

  // ── CLOSE SPORTS CAR CHASE VIEW ──
  updateChase(delta, car) {
    const behindDistance = 7.8;
    const height = 3.2;

    const angle = car.rotation;
    const offsetX = Math.sin(angle) * behindDistance;
    const offsetZ = Math.cos(angle) * behindDistance;

    const targetPos = new THREE.Vector3(
      car.position.x + offsetX,
      car.position.y + height,
      car.position.z + offsetZ
    );

    const lookAheadDist = 6.5;
    const targetLookAt = new THREE.Vector3(
      car.position.x - Math.sin(angle) * lookAheadDist,
      car.position.y + 1.2,
      car.position.z - Math.cos(angle) * lookAheadDist
    );

    const posLerp = 0.12;
    const lookLerp = 0.15;
    this.currentPosition.lerp(targetPos, posLerp);
    this.currentTarget.lerp(targetLookAt, lookLerp);

    const speedRatio = Math.min(1, Math.abs(car.speed) / car.maxForwardSpeed);
    const targetFov = this.baseFov + speedRatio * (this.maxFov - this.baseFov);
    this.currentFov += (targetFov - this.currentFov) * 0.08;
  }

  // ── IDLE HERO PREVIEW MODE ──
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
