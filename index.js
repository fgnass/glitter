import webgl from "./webgl.js";
import * as shaders from "./shaders.js";

const opts = {
  top: [105, 0, 234],
  bottom: [218, 15, 216],
  scale: 6,
  screenWidth: 0,
  screenHeight: 0,
  contrast: 48,
  highlights: 1.0,
  shadows: 0.45,
  ambience: 0.4,
  fullscreen() {
    document.body.requestFullscreen();
  }
};

const gui = new dat.GUI({});
gui.add(opts, "contrast", 0, 100);
gui.add(opts, "scale", 1, 10);
gui.addColor(opts, "top");
gui.addColor(opts, "bottom");
gui.add(opts, "highlights", 0.01, 2);
gui.add(opts, "shadows", 0.01, 1);
gui.add(opts, "ambience", 0.01, 1);
gui.add(opts, "fullscreen");

window.addEventListener("deviceorientation", e => {
  if (!opts.initial) opts.initial = e;
  opts.beta = e.beta - opts.initial.beta;
  opts.gamma = e.gamma - opts.initial.gamma;
});

const canvas = document.getElementById("canvas");
const startTime = Date.now();

webgl(canvas, shaders, () => {
  let xTilt;
  let yTilt;

  if (opts.initial) {
    xTilt = Math.sin((0.5 * opts.gamma * Math.PI) / 180);
    yTilt = Math.sin((0.5 * opts.beta * Math.PI) / 180);
  } else {
    const time = Date.now() - startTime;
    xTilt = Math.cos(time / 3600);
    yTilt = Math.sin(time / 3600);
  }

  return {
    u_tilt: [xTilt, yTilt],
    u_resolution: [canvas.width, canvas.height],
    u_topColor: opts.top.map(c => c / 255),
    u_bottomColor: opts.bottom.map(c => c / 255),
    u_scale: opts.scale,
    u_contrast: opts.contrast,
    u_highlights: opts.highlights,
    u_shadows: opts.shadows,
    u_ambience: opts.ambience
  };
});
