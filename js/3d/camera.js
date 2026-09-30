/**
 * camera.js - Cinematic Follow & Preview Camera Controller
 * Smooth third-person chase camera with dynamic speed FOV, pitch damping,
 * and elegant idle hero preview orbit.
 */

class DriveCamera {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'PREVIEW'; // 'PREVIEW' or 'DRIVING'

    // Damping state
    this.currentPosition = new THREE.Vector3(6, 3.5, 12);
    this.currentTarget = new THREE.Vector3(0, 1, 0);

    // Dynamic FOV
    this.baseFov = 60;
    this.maxFov = 72;
    this.currentFov = 60;

    // Transition factor
    this.transitionProgress = 1;
  }

  setMode(mode) {
    this.mode = mode;
  }

  update(delta, car, time) {
    if (this.mode === 'DRIVING') {
      this.updateDriving(delta, car);
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

  updateDriving(delta, car) {
    // Offset behind and above car based on car's current heading rotation
    const behindDistance = 7.4;
    const height = 3.2;

    const angle = car.rotation;
    const offsetX = Math.sin(angle) * behindDistance;
    const offsetZ = Math.cos(angle) * behindDistance;

    const targetPos = new THREE.Vector3(
      car.position.x + offsetX,
      car.position.y + height,
      car.position.z + offsetZ
    );

    // Look-ahead target point forward along car trajectory
    const lookAheadDist = 6.5;
    const targetLookAt = new THREE.Vector3(
      car.position.x - Math.sin(angle) * lookAheadDist,
      car.position.y + 1.2,
      car.position.z - Math.cos(angle) * lookAheadDist
    );

    // Smooth lerp (damped follow)
    const posLerp = 0.12;
    const lookLerp = 0.15;
    this.currentPosition.lerp(targetPos, posLerp);
    this.currentTarget.lerp(targetLookAt, lookLerp);

    // Dynamic FOV based on speed
    const speedRatio = Math.min(1, Math.abs(car.speed) / car.maxForwardSpeed);
    const targetFov = this.baseFov + speedRatio * (this.maxFov - this.baseFov);
    this.currentFov += (targetFov - this.currentFov) * 0.08;
  }

  updatePreview(delta, car, time) {
    // Gentle cinematic angle framing the car to the right on desktop
    const radius = 9.5;
    const orbitSpeed = 0.25;
    const angle = Math.sin(time * orbitSpeed) * 0.45 - 0.2;

    const targetPos = new THREE.Vector3(
      car.position.x + Math.sin(angle) * radius + 2.5,
      car.position.y + 2.6 + Math.sin(time * 0.4) * 0.4,
      car.position.z + Math.cos(angle) * radius
    );

    const targetLookAt = new THREE.Vector3(
      car.position.x,
      car.position.y + 1.0,
      car.position.z
    );

    this.currentPosition.lerp(targetPos, 0.06);
    this.currentTarget.lerp(targetLookAt, 0.08);
    this.currentFov = this.baseFov;
  }
}

window.DriveCamera = DriveCamera;
