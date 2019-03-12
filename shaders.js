export const vertex = `
  attribute vec3 position;
  void main() {
    gl_Position = vec4( position, 1.0 );
  }
`;

export const fragment = `
uniform vec2 u_resolution;
uniform vec2 u_tilt;
uniform vec3 u_topColor;
uniform vec3 u_bottomColor;
uniform float u_scale;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_ambience;
uniform float u_contrast;

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float random(vec2 co) {
  float a = 12.9898;
  float b = 78.233;
  float c = 43758.5453;
  float dt= dot(co.xy ,vec2(a,b));
  float sn= mod(dt,3.14);
  return fract(sin(sn) * c);
}

// Permutation polynomial: (34x^2 + x) mod 289
vec4 permute(vec4 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

vec2 cellular2x2(vec2 P) {
  #define K 0.142857142857 // 1/7
  #define K2 0.0714285714285 // K/2
  #define jitter 0.9 // jitter 1.0 makes F1 wrong more often
  vec2 Pi = mod(floor(P), 288.992);
  vec2 Pf = fract(P);
  vec4 Pfx = Pf.x + vec4(-0.5, -1.5, -0.5, -1.5);
  vec4 Pfy = Pf.y + vec4(-0.5, -0.5, -1.5, -1.5);
  vec4 p = permute(Pi.x + vec4(0.0, 1.0, 0.0, 1.0));
  p = permute(p + Pi.y + vec4(0.0, 0.0, 1.0, 1.0));

  vec4 ox = mod(p, 7.0)*K+K2;
  vec4 oy = mod(floor(p*K),7.0)*K+K2;
  vec4 dx = Pfx + jitter*ox;
  vec4 dy = Pfy + jitter*oy;
  vec4 d = dx * dx + dy * dy; // d11, d12, d21 and d22, squared
  // Sort out the two smallest distances

  vec2 smallest = min(d.xy, d.zw);
  smallest.x = min(smallest.x, smallest.y);

  if (smallest.x == d.x) {
    return vec2(dx.x, dy.x);
  } else if (smallest.x == d.y) {
    return vec2(dx.y, dy.y);
  } else if (smallest.x == d.z) {
    return vec2(dx.z, dy.z);
  } else if (smallest.x == d.w) {
    return vec2(dx.w, dy.w);
  }
}


float lit(float cell) {
  float tilt = (u_tilt.x + u_tilt.y + 2.0) / 4.0;
  return 2.0 * pow(1.0 - abs(cell - abs(tilt)), u_contrast);
}

float cell(vec2 p) {
  return random(cellular2x2(p) - p);
}

void main(void) {
  vec2 p = gl_FragCoord.xy / u_scale;
  float cell1 = cell(p);
  float cell2 = cell(p * 1.5 + 5.0);
  float brightness = lit(cell1) + lit(cell2);

  // Add a little randomness so no cell looks "blank"
  brightness = max(brightness, (cell1 - 0.5) * u_ambience);

  vec3 color = mix(u_bottomColor, u_topColor, gl_FragCoord.y / u_resolution.y);

  vec3 hsv = rgb2hsv(color);

  hsv.y = 1.0 - max(brightness - 1.0, 0.0) * u_highlights;
  hsv.z = min(brightness + u_shadows, 1.0);
  
  gl_FragColor = vec4(hsv2rgb(hsv), 1.0);
}
`;
