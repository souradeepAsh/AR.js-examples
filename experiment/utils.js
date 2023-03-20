import { gsap } from "gsap";

export const animate = (mesh, type, duration = 1, to) => {
  switch (type) {
    case "position":
      return gsap.to(mesh.position, {
        duration: duration,
        x: to[0],
        y: to[1],
        z: to[2],
      });
      break;
    case "rotation":
      //   let { axis, speed, delay, isRotation } = to;
      let { isSpinning, axis, speed, delay = 0, isClockwise } = to;
      if (!isSpinning)
        return gsap.to(mesh.rotation, {
          duration: speed,
          x: axis[0],
          y: axis[1],
          z: axis[2],
        });
      let rotation = axis.map((a) => {
        return isClockwise ? a * Math.PI * 2 : a * Math.PI * -2;
      });

      return gsap.fromTo(
        mesh.rotation,
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          duration: speed,
          x: rotation[0],
          y: rotation[1],
          z: rotation[2],
          repeat: -1,
          repeatDelay: delay,
          ease: "none",
        }
      );
      break;
    case "scale":
      return gsap.to(mesh.scale, {
        duration: duration,
        x: to[0],
        y: to[1],
        z: to[2],
      });
      break;

    default:
      break;
  }
};
