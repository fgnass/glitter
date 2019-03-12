export default function webgl(canvas, shaders, render) {
  const gl = canvas.getContext("experimental-webgl");
  const buffer = gl.createBuffer();
  const uniforms = {};

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // Vertex buffer (2 triangles)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
    gl.STATIC_DRAW
  );

  // Create Program
  const currentProgram = createProgram(shaders);

  function createProgram({ vertex, fragment }) {
    const p = gl.createProgram();
    const vs = createShader(vertex, gl.VERTEX_SHADER);
    const fs = createShader(
      `
        #ifdef GL_ES
          precision highp float;
        #endif
        ${fragment}
        `,
      gl.FRAGMENT_SHADER
    );

    if (vs == null || fs == null) return null;

    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.linkProgram(p);

    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramParameter(p, gl.VALIDATE_STATUS));
    }
    return p;
  }

  function createShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function uniform(name, value) {
    const values = [].concat(value);
    let u = uniforms[name];
    if (!u) {
      const type = values.length + "f";
      u = uniforms[name] = {
        name,
        method: "uniform" + type,
        location: gl.getUniformLocation(currentProgram, name)
      };
    }
    const key = values.join();
    if (key != u.key) {
      u.key = key;
      gl[u.method].apply(gl, [u.location].concat(values));
    }
  }

  function renderFrame() {
    if (!currentProgram) return;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Load program into GPU
    gl.useProgram(currentProgram);

    const u = render();
    if (u) {
      Object.keys(u).forEach(name => {
        uniform(name, u[name]);
      });
    }

    // Render geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    let vertex_position;
    gl.vertexAttribPointer(vertex_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertex_position);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(vertex_position);
  }

  function resizeCanvas(event) {
    if (
      canvas.width != canvas.clientWidth ||
      canvas.height != canvas.clientHeight
    ) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  function animate() {
    resizeCanvas();
    renderFrame();
    requestAnimationFrame(animate);
  }

  animate();
}
