import fs from "fs";
import createGLContext from "gl";
import { Canvas, ImageData, loadImage, FontLibrary } from "skia-canvas";
import GIFEncoder from "gif-encoder";
import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";
import { start, report, stop } from "./bench.ts";

start("total");

FontLibrary.use("Noto Custom", [
  "./assets/NotoSans-Custom.ttf"
])

async function bufferFromUrl(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pngBuffer = await sharp(buffer).png().toBuffer();

  return pngBuffer;
}

// Remove all frame PNG files
const frameFiles = fs
  .readdirSync("output")
  .filter((file) => file.startsWith("frame-") && file.endsWith(".png"));
frameFiles.forEach((file) => fs.unlinkSync(`output/${file}`));

console.log("All frame PNG files have been removed.");

// Initialize constants
const outputFile = "./output/gradient.gif";
const fps = 30;
const duration = 4;
const maxFrame = fps * duration;
const width = 375;
const height = 150;
const avatarSize = 100;
const placement = (height - avatarSize) / 2;
const boxMargin = 10;
const boxRadius = 20;
const textMargin = 20;

const sliderLeft = placement + avatarSize;
const sliderRight = width - boxMargin * 2;
const sliderWidth = sliderRight - sliderLeft;
const sliderBottom = height - placement;
const sliderHeight = 20;
const sliderTop = sliderBottom - sliderHeight;

// Load the avatar
console.log("Loading avatar...");
start("load-avatar");
const avatarPath =
  "https://cdn.discordapp.com/avatars/299298175825739776/568dd2233779e3c2a037ac3186116739.webp";
const avatarBuffer = await bufferFromUrl(avatarPath);
const avatar = await loadImage(avatarBuffer);
const username = "SelfMadeSystem";
const points = 153;
const pointsPrevLevel = 120;
const pointsToNextLevel = 175;
const sliderValue =
  (points - pointsPrevLevel) / (pointsToNextLevel - pointsPrevLevel);
const level = 6;
const rank = 4;

// Get the avatar palette
const palette = await Vibrant.from(avatarBuffer).getPalette();
const c = palette.Vibrant!;
stop("load-avatar");

// Create a WebGL context
console.log("Creating WebGL context...");
start("create-gl-total");
start("create-gl-context");
const gl = createGLContext(width, height);
stop("create-gl-context");

if (!gl) {
  throw new Error("Failed to create WebGL context");
}

start("create-gl-shaders");
// Create a simple gradient shader
const vertexShaderSource = /* glsl */ `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Source: https://www.shadertoy.com/view/ltXczj
const bgShaderSource = /* glsl */ `
precision mediump float;
const int maxFrame = ${maxFrame};
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
const vec4 lineColor = vec4(${c.r / 255}, ${c.g / 255}, ${c.b / 255}, 1.0);
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
    fragColor.a = 1.0;
    // debug grid:
    //fragColor = mix(fragColor, gridColor, drawGrid(space));
    fragColor += lines;
}

void main() {
    mainImage(gl_FragColor, v_uv * vec2(${width}, ${height}));
}
`;

// Source https://www.shadertoy.com/view/tdG3Rd
const sliderShaderSource = /* glsl */ `
precision mediump float;
const int maxFrame = ${maxFrame};
varying vec2 v_uv;
uniform int u_frame;
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
  gl_FragColor = vec4(colormap(shade).rgb, 1.);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to create shader");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Failed to compile shader: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const bgShader = compileShader(gl, bgShaderSource, gl.FRAGMENT_SHADER);
const sliderShader = compileShader(gl, sliderShaderSource, gl.FRAGMENT_SHADER);

const bgProgram = gl.createProgram();
gl.attachShader(bgProgram, vertexShader);
gl.attachShader(bgProgram, bgShader);
gl.linkProgram(bgProgram);
if (!gl.getProgramParameter(bgProgram, gl.LINK_STATUS)) {
  throw new Error(
    `Failed to link bg program: ${gl.getProgramInfoLog(bgProgram)}`
  );
}

const sliderProgram = gl.createProgram();
gl.attachShader(sliderProgram, vertexShader);
gl.attachShader(sliderProgram, sliderShader);
gl.linkProgram(sliderProgram);
if (!gl.getProgramParameter(sliderProgram, gl.LINK_STATUS)) {
  throw new Error(
    `Failed to link slider program: ${gl.getProgramInfoLog(sliderProgram)}`
  );
}
stop("create-gl-shaders");

start("create-gl-buffers");
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
  gl.STATIC_DRAW
);
stop("create-gl-buffers");

start("create-gl-locations");
const bgPositionLocation = gl.getAttribLocation(bgProgram, "a_position");
gl.enableVertexAttribArray(bgPositionLocation);
gl.vertexAttribPointer(bgPositionLocation, 2, gl.FLOAT, false, 0, 0);

const sliderPositionLocation = gl.getAttribLocation(
  sliderProgram,
  "a_position"
);
gl.enableVertexAttribArray(sliderPositionLocation);
gl.vertexAttribPointer(sliderPositionLocation, 2, gl.FLOAT, false, 0, 0);

const frameLocationsByProgram = new Map<WebGLProgram, WebGLUniformLocation>();

frameLocationsByProgram.set(
  bgProgram,
  gl.getUniformLocation(bgProgram, "u_frame")!
);
frameLocationsByProgram.set(
  sliderProgram,
  gl.getUniformLocation(sliderProgram, "u_frame")!
);
stop("create-gl-locations");
stop("create-gl-total");

// Create a canvas
start("create-canvas");
const canvas = new Canvas(width, height);
const ctx = canvas.getContext("2d");
stop("create-canvas");

// Create a GIF encoder
start("create-gif-encoder");
const encoder = new GIFEncoder(width, height, {
  highWaterMark: 10 * 1024 * 1024,
});
encoder.pipe(fs.createWriteStream(outputFile));
encoder.setRepeat(0);
encoder.setDelay((duration * 1000) / maxFrame);
encoder.setQuality(10);
encoder.writeHeader();
stop("create-gif-encoder");

// const frames: Uint8ClampedArray[] = [];
const bufferPromises: Promise<void>[] = [];

console.log(`FPS: ${(maxFrame / duration).toFixed(3)}`);
console.log(`ms/F: ${Math.floor((duration / maxFrame) * 1000)}`);

function drawGl(program: WebGLProgram, frame: number) {
  start("draw-gl");
  // Set the frame
  start("draw-gl-use-program");
  gl.useProgram(program);
  stop("draw-gl-use-program");
  start("draw-gl-frame");
  const frameLocation = frameLocationsByProgram.get(program)!;
  gl.uniform1i(frameLocation, frame);
  stop("draw-gl-frame");

  // Draw the program
  start("draw-gl-draw");
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  stop("draw-gl-draw");

  // Get the pixels
  start("draw-gl-read-pixels");
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  stop("draw-gl-read-pixels");

  // Convert the pixels to an ImageData
  start("draw-gl-image-data");
  const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
  stop("draw-gl-image-data");
  stop("draw-gl");

  // Return the ImageData
  return imageData;
}

start("draw-frames");
for (let frame = 0; frame < maxFrame; frame++) {
  start("draw-frame");
  // Print the frame status
  process.stdout.write(`Frame ${frame + 1}/${maxFrame}\r`);

  // Clear the canvas
  start("clear-canvas");
  ctx.clearRect(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  stop("clear-canvas");

  // Draw the background
  start("draw-gl-bg");
  ctx.putImageData(drawGl(bgProgram, frame), 0, 0);
  stop("draw-gl-bg");

  // Draw the box
  start("draw-box");
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.roundRect(
    boxMargin,
    boxMargin,
    width - boxMargin * 2,
    height - boxMargin * 2,
    boxRadius
  );
  ctx.fill();
  stop("draw-box");

  // Clip the avatar
  start("clip-avatar");
  ctx.save();
  ctx.beginPath();
  ctx.arc(
    placement + avatarSize / 2,
    placement + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2
  );
  ctx.clip();
  stop("clip-avatar");

  // Draw a blur effect
  start("draw-blur");
  ctx.filter = "blur(12px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  stop("draw-blur");

  // Draw the avatar background
  start("draw-avatar-bg");
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fill();
  stop("draw-avatar-bg");

  // Draw the avatar
  start("draw-avatar");
  ctx.drawImage(avatar, placement, placement, avatarSize, avatarSize);
  stop("draw-avatar");

  // Restore the clip
  ctx.restore();

  // Draw the slider
  start("draw-slider");
  start("draw-slider-1");
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.beginPath();
  ctx.roundRect(sliderLeft, sliderTop, sliderWidth, sliderHeight, sliderHeight);
  ctx.save();
  ctx.clip();
  ctx.filter = "blur(8px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  ctx.fill();
  stop("draw-slider-1");

  start("draw-slider-2");
  ctx.beginPath();
  ctx.roundRect(
    sliderLeft - sliderHeight / 2,
    sliderTop,
    sliderWidth * sliderValue + sliderHeight / 2,
    sliderHeight,
    sliderHeight
  );
  ctx.clip();
  start("draw-slider-gl");
  ctx.drawImage(drawGl(sliderProgram, frame), 0, 0);
  stop("draw-slider-gl");
  ctx.restore();
  stop("draw-slider-2");
  stop("draw-slider");

  start("draw-text");
  // Write the slider value
  start("draw-text-1");
  ctx.font = "14px Montserrat";
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText(
    `${points} / ${pointsToNextLevel}`,
    sliderLeft + 8,
    sliderTop - 3
  );
  stop("draw-text-1");

  // Write the level
  start("draw-text-2");
  ctx.font = "14px Montserrat";
  ctx.textAlign = "right";
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`Level ${level}`, sliderRight - 8, sliderTop - 3);
  stop("draw-text-2");

  // Write the rank
  start("draw-text-3");
  ctx.font = "13px Montserrat";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ddd";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`#${rank}`, sliderRight - 8, sliderTop - 20);
  stop("draw-text-3");

  // Clip the username
  start("clip-username");
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(
    boxMargin,
    boxMargin,
    width - boxMargin * 2,
    height - boxMargin * 2,
    boxRadius
  );
  ctx.clip();
  stop("clip-username");

  // Write the username
  start("draw-username");
  ctx.font = "24px 'Noto Custom'";
  ctx.fillStyle = "white";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(username, placement + avatarSize, boxMargin + textMargin);
  stop("draw-username");
  stop("draw-text");

  // Restore the clip
  ctx.restore();

  // Collect the frame
  start("collect-frame");
  const imageData = ctx.getImageData(0, 0, width, height);
  encoder.addFrame(imageData.data);
  stop("collect-frame");
  // frames.push(imageData.data);

  // Write the frame to a file
  start("write-frame");
  const frameNumber = String(frame).padStart(3, "0");
  const wait = canvas.toBuffer("png").then((buffer) => {
    console.log(`Writing frame ${frameNumber}`);
    fs.writeFileSync(`output/frame-${frameNumber}.png`, buffer);
  });
  bufferPromises.push(wait);
  stop("write-frame");
  stop("draw-frame");
}
stop("draw-frames");

console.log("");

start("encoder-finish");
encoder.finish();
stop("encoder-finish");

start("buffer-promises");
await Promise.all(bufferPromises);
stop("buffer-promises");

console.log("Done!");

console.log(`Output file: ${outputFile}`);

stop("total");

report();
