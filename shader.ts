import { gl, initEGLContext } from "./bungl/index.js";
import { PlacementOptions, UserOptions, GlOptions } from "./options.js";
import { start, stop } from "./bench.js";
import { ptr } from "bun:ffi";

// OpenGL constants
const GL_VERTEX_SHADER = 0x8b31;
const GL_FRAGMENT_SHADER = 0x8b30;
const GL_COMPILE_STATUS = 0x8b81;
const GL_LINK_STATUS = 0x8b82;
const GL_ARRAY_BUFFER = 0x8892;
const GL_STATIC_DRAW = 0x88e4;
const GL_TRIANGLES = 0x0004;
const GL_COLOR_BUFFER_BIT = 0x00004000;
const GL_TEXTURE_2D = 0x0de1;
const GL_TEXTURE0 = 0x84c0;
const GL_RGBA = 0x1908;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_LINEAR = 0x2601;
const GL_CLAMP_TO_EDGE = 0x812f;
const GL_TEXTURE_MIN_FILTER = 0x2801;
const GL_TEXTURE_MAG_FILTER = 0x2800;
const GL_TEXTURE_WRAP_S = 0x2802;
const GL_TEXTURE_WRAP_T = 0x2803;
const GL_BLEND = 0x0be2;
const GL_SRC_ALPHA = 0x0302;
const GL_ONE_MINUS_SRC_ALPHA = 0x0303;
const GL_FLOAT = 0x1406;

function compileShader(source: string, type: number): number {
  const shader = gl.symbols.glCreateShader(type);

  if (shader === 0) {
    throw new Error("Failed to create shader");
  }

  // Create shader source buffer using the same approach as the WebGL wrapper
  const sourceBuffer = Buffer.from(source + "\0", "utf-8");
  const sourcePtr = ptr(sourceBuffer);

  // Create an array containing the pointer to the source string
  const sourcePtrsBuffer = Buffer.alloc(8);
  const sourcePtrsView = new BigUint64Array(sourcePtrsBuffer.buffer);
  sourcePtrsView[0] = BigInt(sourcePtr);

  gl.symbols.glShaderSource(shader, 1, ptr(sourcePtrsBuffer), null);
  gl.symbols.glCompileShader(shader);

  // Check compilation status
  const statusBuffer = Buffer.alloc(4);
  gl.symbols.glGetShaderiv(shader, GL_COMPILE_STATUS, ptr(statusBuffer));
  const status = new Int32Array(statusBuffer.buffer)[0];

  if (!status) {
    const logBuffer = Buffer.alloc(512);
    const lengthBuffer = Buffer.alloc(4);
    gl.symbols.glGetShaderInfoLog(
      shader,
      512,
      ptr(lengthBuffer),
      ptr(logBuffer)
    );
    const logLength = new Int32Array(lengthBuffer.buffer)[0];
    const log = new TextDecoder().decode(logBuffer.slice(0, logLength));
    throw new Error(`Failed to compile shader: ${log}`);
  }

  return shader;
}

function createProgram(vertexShader: number, fragmentShader: number): number {
  const program = gl.symbols.glCreateProgram();

  if (program === 0) {
    throw new Error("Failed to create program");
  }

  gl.symbols.glAttachShader(program, vertexShader);
  gl.symbols.glAttachShader(program, fragmentShader);
  gl.symbols.glLinkProgram(program);

  // Check link status
  const statusBuffer = Buffer.alloc(4);
  gl.symbols.glGetProgramiv(program, GL_LINK_STATUS, ptr(statusBuffer));
  const status = new Int32Array(statusBuffer.buffer)[0];

  if (!status) {
    const logBuffer = Buffer.alloc(512);
    const lengthBuffer = Buffer.alloc(4);
    gl.symbols.glGetProgramInfoLog(
      program,
      512,
      ptr(lengthBuffer),
      ptr(logBuffer)
    );
    const logLength = new Int32Array(lengthBuffer.buffer)[0];
    const log = new TextDecoder().decode(logBuffer.slice(0, logLength));
    throw new Error(`Failed to link program: ${log}`);
  }

  return program;
}

function getAttribLocation(program: number, name: string): number {
  const nameBuffer = Buffer.from(name + "\0", "utf-8");
  return gl.symbols.glGetAttribLocation(program, ptr(nameBuffer));
}

function getUniformLocation(program: number, name: string): number {
  const nameBuffer = Buffer.from(name + "\0", "utf-8");
  return gl.symbols.glGetUniformLocation(program, ptr(nameBuffer));
}

export function setupGl({
  frames,
  width,
  height,
}: PlacementOptions): GlOptions {
  // Create a simple gradient shader
  const vertexShaderSource = /* glsl */ `
#version 120
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

  // Source: https://www.shadertoy.com/view/ltXczj
  const bgShaderSource = /* glsl */ `
#version 120
const int maxFrame = ${frames};
const vec2 iResolution = vec2(${width}, ${height});
varying vec2 v_uv;
uniform int u_frame;

#define PI 3.14159265359

const float overallSpeed = 1.0;
const float gridSmoothWidth = 0.015;
const float axisWidth = 0.05;
const float majorLineWidth = 0.025;
const float minorLineWidth = 0.0125;
const float majorLineFrequency = 1.0;
const float minorLineFrequency = 1.0;
const float scale = 5.0;
uniform vec4 lineColor; // vec4({c.r / 255}, {c.g / 255}, {c.b / 255}, 1.0)
const float minLineWidth = 0.02;
const float maxLineWidth = 0.5;
const float lineSpeed = 2. * PI * overallSpeed;
const float lineAmplitude = 1.0;
const float lineFrequency = 0.2;
const float warpSpeed = 2. * PI * overallSpeed;
const float warpFrequency = 0.5;
const float warpAmplitude = 1.0;
const float offsetFrequency = 0.5;
const float offsetSpeed = 2. * PI * overallSpeed;
const float minOffsetSpread = 0.2;
const float maxOffsetSpread = 1.5;
const int linesPerGroup = 16;

#define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))

#define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))

#define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))

#define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

float drawGridLines(float axis)   
{
    return   drawCrispLine(0.0, axisWidth, axis)
           + drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
           + drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
}

float drawGrid(vec2 space)
{
    return min(1., drawGridLines(space.x)
                  +drawGridLines(space.y));
}

// probably can optimize w/ noise, but currently using fourier transform
float random(float t)
{
    return (
    cos(t + ${Math.random() * Math.PI}) +
    sin(t * 2. + ${Math.random() * Math.PI}) +
    cos(t * 3. + ${Math.random() * Math.PI}) * 0.5) / 2.5;   
}

float getPlasmaY(float x, float horizontalFade, float offset)   
{
    float iTime = float(u_frame) / float(maxFrame);
    return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float iTime = float(u_frame) / float(maxFrame);
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;
    
    float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    // fun with nonlinear transformations! (wind / turbulence)
    space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
    space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;
    
    vec4 lines = vec4(0);
    
    for(int l = 0; l < linesPerGroup; l++)
    {
        float normalizedLineIndex = float(l) / float(linesPerGroup);
        float offsetTime = iTime * offsetSpeed;
        float offsetPosition = float(l) + space.x * offsetFrequency;
        float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
        float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
        float offset = random(offsetPosition * normalizedLineIndex + offsetTime) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
        float linePosition = getPlasmaY(space.x, horizontalFade, offset);
        float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);
        
        float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
        vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
        float circle = drawCircle(circlePosition, 0.01, space) * 4.0;
        
        
        line = line + circle;
        lines += line * lineColor * rand;
    }
    
    fragColor = mix(lineColor * 0.5, lineColor, uv.x);
    fragColor *= verticalFade;
    // debug grid:
    // fragColor = mix(fragColor, vec4(1.,0.,0.,1.), drawGrid(space));
    fragColor += lines;
    fragColor.a = 1.0;
}

void main() {
    mainImage(gl_FragColor, v_uv * vec2(${width}, ${height}));
}
`;

  // Source https://www.shadertoy.com/view/tdG3Rd
  const sliderShaderSource = /* glsl */ `
#version 120
const int maxFrame = ${frames};
varying vec2 v_uv;
uniform int u_frame;
uniform sampler2D u_stencil;
#define PI 3.14159265359

vec4 colormap (float x) {
  const float e0 = 0.0;
  const vec4 v0 = vec4(0.49019607843137253,0,0.7019607843137254,1);
  const float e1 = 0.13;
  const vec4 v1 = vec4(0.4549019607843137,0,0.8549019607843137,1);
  const float e2 = 0.25;
  const vec4 v2 = vec4(0.3843137254901961,0.2901960784313726,0.9294117647058824,1);
  const float e3 = 0.38;
  const vec4 v3 = vec4(0.26666666666666666,0.5725490196078431,0.9058823529411765,1);
  const float e4 = 0.5;
  const vec4 v4 = vec4(0,0.8,0.7725490196078432,1);
  const float e5 = 0.63;
  const vec4 v5 = vec4(0,0.9686274509803922,0.5725490196078431,1);
  const float e6 = 0.75;
  const vec4 v6 = vec4(0,1,0.34509803921568627,1);
  const float e7 = 0.88;
  const vec4 v7 = vec4(0.1568627450980392,1,0.03137254901960784,1);
  const float e8 = 1.0;
  const vec4 v8 = vec4(0.5764705882352941,1,0,1);
  float a0 = smoothstep(e0,e1,x);
  float a1 = smoothstep(e1,e2,x);
  float a2 = smoothstep(e2,e3,x);
  float a3 = smoothstep(e3,e4,x);
  float a4 = smoothstep(e4,e5,x);
  float a5 = smoothstep(e5,e6,x);
  float a6 = smoothstep(e6,e7,x);
  float a7 = smoothstep(e7,e8,x);
  return max(mix(v0,v1,a0)*step(e0,x)*step(x,e1),
    max(mix(v1,v2,a1)*step(e1,x)*step(x,e2),
    max(mix(v2,v3,a2)*step(e2,x)*step(x,e3),
    max(mix(v3,v4,a3)*step(e3,x)*step(x,e4),
    max(mix(v4,v5,a4)*step(e4,x)*step(x,e5),
    max(mix(v5,v6,a5)*step(e5,x)*step(x,e6),
    max(mix(v6,v7,a6)*step(e6,x)*step(x,e7),mix(v7,v8,a7)*step(e7,x)*step(x,e8)
  )))))));
}

// https://iquilezles.org/articles/warp
/*float noise( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float a = textureLod(iChannel0,(p+vec2(0.5,0.5))/256.0,0.0).x;
	float b = textureLod(iChannel0,(p+vec2(1.5,0.5))/256.0,0.0).x;
	float c = textureLod(iChannel0,(p+vec2(0.5,1.5))/256.0,0.0).x;
	float d = textureLod(iChannel0,(p+vec2(1.5,1.5))/256.0,0.0).x;
    return mix(mix( a, b,f.x), mix( c, d,f.x),f.y);
}*/


float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

float thing(vec2 p, float t) {
    p += vec2(t, 0.);
    float g = mod(dot(p, vec2(0.5)), 2.) * PI * 2.;
    return (
      sin(g) +
      sin(g / 2.)
    ) / 4. + .5;
}

const mat2 mtx = mat2( 0.80,  0.60, -0.60,  0.80 );

float fbm( vec2 p )
{
    // float t = mod(iTime, 4.);
    float t = float(u_frame) / float(maxFrame) * 4.;
    float f = 0.0;

    f += 0.500000*thing( p, t ); p = mtx*p*2.02;
    f += 0.031250*noise( p ); p = mtx*p*2.01;
    f += 0.250000*noise( p ); p = mtx*p*2.03;
    f += 0.125000*noise( p ); p = mtx*p*2.01;
    f += 0.062500*noise( p ); p = mtx*p*2.04;
    f += 0.015625*noise( p + sin(t * PI) );

    return f/0.96875;
}

float pattern( in vec2 p )
{
	return fbm(p);
	// return fbm( p + fbm( p + fbm( p ) ) );
}

void main()
{
	float shade = pattern(v_uv);
  vec4 stencilColor = texture2D(u_stencil, v_uv);
  gl_FragColor = colormap(shade) * stencilColor.a;
}
`;

  const simpleFragmentShaderSource = /* glsl */ `
#version 120
varying vec2 v_uv;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_uv);
}
`;

  // Initialize EGL context directly
  const eglContext = initEGLContext(width, height);

  if (!eglContext) {
    throw new Error("Failed to create EGL context");
  }

  // Enable blending
  gl.symbols.glEnable(GL_BLEND);
  gl.symbols.glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

  // Compile the shaders
  const vertexShader = compileShader(vertexShaderSource, GL_VERTEX_SHADER);
  const bgShader = compileShader(bgShaderSource, GL_FRAGMENT_SHADER);
  const sliderShader = compileShader(sliderShaderSource, GL_FRAGMENT_SHADER);
  const simpleFragmentShader = compileShader(
    simpleFragmentShaderSource,
    GL_FRAGMENT_SHADER
  );

  // Create the programs
  const bgProgram = createProgram(vertexShader, bgShader);
  const sliderProgram = createProgram(vertexShader, sliderShader);
  const simpleProgram = createProgram(vertexShader, simpleFragmentShader);

  // Create the position buffer
  const bufferPtr = new Uint32Array(1);
  gl.symbols.glGenBuffers(1, ptr(bufferPtr));
  const positionBuffer = bufferPtr[0];

  gl.symbols.glBindBuffer(GL_ARRAY_BUFFER, positionBuffer);
  const positionData = new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
  ]);
  gl.symbols.glBufferData(
    GL_ARRAY_BUFFER,
    positionData.byteLength,
    ptr(positionData),
    GL_STATIC_DRAW
  );

  // Get the attribute locations
  const bgPositionLocation = getAttribLocation(bgProgram, "a_position");
  const sliderPositionLocation = getAttribLocation(sliderProgram, "a_position");
  const simplePositionLocation = getAttribLocation(simpleProgram, "a_position");

  const sliderStencilLocation = getUniformLocation(sliderProgram, "u_stencil");

  if (sliderStencilLocation === -1) {
    throw new Error("Failed to get slider stencil location");
  }

  const bgFrameLocation = getUniformLocation(bgProgram, "u_frame");
  const sliderFrameLocation = getUniformLocation(sliderProgram, "u_frame");

  if (bgFrameLocation === -1 || sliderFrameLocation === -1) {
    throw new Error("Failed to get frame location");
  }

  const bgColorLocation = getUniformLocation(bgProgram, "lineColor");

  if (bgColorLocation === -1) {
    throw new Error("Failed to get bg color location");
  }

  return new GlOptions(
    gl,
    bgProgram,
    sliderProgram,
    simpleProgram,
    sliderStencilLocation,
    bgFrameLocation,
    sliderFrameLocation,
    bgColorLocation,
    bgPositionLocation,
    sliderPositionLocation,
    simplePositionLocation,
    positionBuffer
  );
}

export function renderGl(
  { frames, width, height }: PlacementOptions,
  { palette }: UserOptions,
  {
    sliderProgram,
    sliderFrameLocation,
    sliderStencilLocation,
    bgProgram,
    bgFrameLocation,
    bgColorLocation,
    simpleProgram,
    bgPositionLocation,
    sliderPositionLocation,
    simplePositionLocation,
    positionBuffer,
    gl,
    ctx: canvas,
    stencilCtx: stencilCanvas,
  }: GlOptions
) {
  if (!canvas || !stencilCanvas) {
    throw new Error("Missing canvas or stencilCanvas");
  }
  start("initGl");
  const c = palette.Vibrant!;

  // Set viewport
  gl.symbols.glViewport(0, 0, width, height);

  gl.symbols.glUseProgram(bgProgram);
  gl.symbols.glUniform4f(bgColorLocation, c.r / 255, c.g / 255, c.b / 255, 1);

  const textureLocation = getUniformLocation(simpleProgram, "u_texture");

  if (textureLocation === -1) {
    throw new Error("Failed to get texture location");
  }

  const texturePtr = new Uint32Array(1);
  gl.symbols.glGenTextures(1, ptr(texturePtr));
  const stencilTexture = texturePtr[0];

  gl.symbols.glBindTexture(GL_TEXTURE_2D, stencilTexture);
  gl.symbols.glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  gl.symbols.glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  gl.symbols.glTexParameteri(
    GL_TEXTURE_2D,
    GL_TEXTURE_WRAP_S,
    GL_CLAMP_TO_EDGE
  );
  gl.symbols.glTexParameteri(
    GL_TEXTURE_2D,
    GL_TEXTURE_WRAP_T,
    GL_CLAMP_TO_EDGE
  );

  // Get the canvas's textures
  start("getTextures");
  start("getImageData");
  const stencilCanvasData = stencilCanvas.getImageData(0, 0, width, height);
  stop("getImageData");
  gl.symbols.glTexImage2D(
    GL_TEXTURE_2D,
    0,
    GL_RGBA,
    width,
    height,
    0,
    GL_RGBA,
    GL_UNSIGNED_BYTE,
    ptr(stencilCanvasData.data)
  );

  const canvasTexturePtr = new Uint32Array(1);
  gl.symbols.glGenTextures(1, ptr(canvasTexturePtr));
  const canvasTexture = canvasTexturePtr[0];

  gl.symbols.glBindTexture(GL_TEXTURE_2D, canvasTexture);
  gl.symbols.glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  gl.symbols.glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  gl.symbols.glTexParameteri(
    GL_TEXTURE_2D,
    GL_TEXTURE_WRAP_S,
    GL_CLAMP_TO_EDGE
  );
  gl.symbols.glTexParameteri(
    GL_TEXTURE_2D,
    GL_TEXTURE_WRAP_T,
    GL_CLAMP_TO_EDGE
  );

  start("getImageData");
  const canvasData = canvas.getImageData(0, 0, width, height);
  stop("getImageData");
  gl.symbols.glTexImage2D(
    GL_TEXTURE_2D,
    0,
    GL_RGBA,
    width,
    height,
    0,
    GL_RGBA,
    GL_UNSIGNED_BYTE,
    ptr(canvasData.data)
  );
  stop("getTextures");

  const drawTexture = (texture: number) => {
    gl.symbols.glUseProgram(simpleProgram);

    // Set up vertex attributes for simple program
    gl.symbols.glEnableVertexAttribArray(simplePositionLocation);
    gl.symbols.glVertexAttribPointer(
      simplePositionLocation,
      2,
      GL_FLOAT,
      false,
      0,
      null
    );

    gl.symbols.glActiveTexture(GL_TEXTURE0);
    gl.symbols.glBindTexture(GL_TEXTURE_2D, texture);
    gl.symbols.glUniform1i(textureLocation, 0);
    gl.symbols.glDrawArrays(GL_TRIANGLES, 0, 6);
  };

  const frameArray: Uint8Array[] = [];

  stop("initGl");

  start("drawFrames");
  for (let frame = 0; frame < frames; frame++) {
    // Clear the canvas
    gl.symbols.glClear(GL_COLOR_BUFFER_BIT);

    // Bind the position buffer (needed for all programs)
    gl.symbols.glBindBuffer(GL_ARRAY_BUFFER, positionBuffer);

    // Draw background
    gl.symbols.glUseProgram(bgProgram);
    gl.symbols.glEnableVertexAttribArray(bgPositionLocation);
    gl.symbols.glVertexAttribPointer(
      bgPositionLocation,
      2,
      GL_FLOAT,
      false,
      0,
      null
    );
    gl.symbols.glUniform1i(bgFrameLocation, frame);
    gl.symbols.glDrawArrays(GL_TRIANGLES, 0, 6);

    // Draw canvas image
    drawTexture(canvasTexture);

    // Draw slider
    gl.symbols.glUseProgram(sliderProgram);
    gl.symbols.glEnableVertexAttribArray(sliderPositionLocation);
    gl.symbols.glVertexAttribPointer(
      sliderPositionLocation,
      2,
      GL_FLOAT,
      false,
      0,
      null
    );
    gl.symbols.glUniform1i(sliderFrameLocation, frame);
    gl.symbols.glUniform1i(sliderStencilLocation, 0);
    gl.symbols.glActiveTexture(GL_TEXTURE0);
    gl.symbols.glBindTexture(GL_TEXTURE_2D, stencilTexture);
    gl.symbols.glDrawArrays(GL_TRIANGLES, 0, 6);

    // Ensure all OpenGL commands are executed
    gl.symbols.glFlush();
    gl.symbols.glFinish();

    // Read the pixels from the framebuffer using raw OpenGL
    start("readPixels");
    const pixels = new Uint8Array(width * height * 4); // RGBA
    const buffer = Buffer.from(pixels.buffer);

    gl.symbols.glReadPixels(
      0,
      0, // x, y
      width,
      height, // width, height
      GL_RGBA, // format
      GL_UNSIGNED_BYTE, // type
      ptr(buffer)
    );

    // Check for OpenGL errors using raw GL calls
    const error = gl.symbols.glGetError();
    if (error !== 0) {
      console.error(
        `OpenGL error during frame ${frame}: 0x${error.toString(16)}`
      );
    }

    frameArray.push(pixels);
    stop("readPixels");
  }
  stop("drawFrames");

  return frameArray;
}
