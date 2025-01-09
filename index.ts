import fs from "fs";
import createGLContext from "gl";
import { Canvas, ImageData, loadImage } from "skia-canvas";
import GIFEncoder from "gif-encoder";

const start = process.hrtime();

// Remove all frame PNG files
const frameFiles = fs
  .readdirSync("output")
  .filter((file) => file.startsWith("frame-") && file.endsWith(".png"));
frameFiles.forEach((file) => fs.unlinkSync(`output/${file}`));

process.stdout.write("All frame PNG files have been removed.\n");

// Initialize constants
const duration = 3;
const maxFrame = 90;
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
const avatar = await loadImage("./assets/avatar.png");
const username = "SelfMadeSystem";
const points = 18;
const pointsToNextLevel = 64;
const sliderValue = points / pointsToNextLevel;
const level = 6;

// Create a WebGL context
const gl = createGLContext(width, height);

// Create a simple gradient shader
const vertexShaderSource = /* glsl */ `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = /* glsl */ `
precision mediump float;
const int maxFrame = ${maxFrame};
varying vec2 v_uv;
uniform int u_frame;

#define PI 3.14159
#define TWO_PI 6.283185

float polygonDistanceField(in vec2 pixelPos, in int N) {
    float a = atan(pixelPos.y, pixelPos.x) + PI/2.;
    float r = TWO_PI/float(N);
    float distanceField = cos(floor(0.5 + a/r) * r - a) * length(pixelPos);
    return distanceField;
}

float minAngularDifference(in float angleA, in float angleB) {
    angleA = mod(angleA, TWO_PI);
    if (angleA > PI) angleA -= TWO_PI;
    if (angleA < PI) angleA += TWO_PI;
    angleB = mod(angleB, TWO_PI);
    if (angleB > PI) angleB -= TWO_PI;
    if (angleB < PI) angleB += TWO_PI;

    float angularDiff = abs(angleA - angleB);
    angularDiff = min(angularDiff, TWO_PI - angularDiff);
    return angularDiff;
}

float map(in float value, in float istart, in float istop, in float ostart, in float ostop) {
    return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

float mapAndCap(in float value, in float istart, in float istop, in float ostart, in float ostop) {
    float v = map(value, istart, istop, ostart, ostop);
    v = max(min(ostart, ostop), v);
    v = min(max(ostart, ostop), v);
    return v;
}

mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

mat2 scale(vec2 scale) {
    return mat2(scale.x, 0, 0, scale.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 u_resolution = vec2(${width}, ${height});
    
    vec3 color = vec3(0.2);
    float t = float(u_frame) / float(maxFrame) * PI;
    vec2 st = fragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    float divisions = 4.;
    vec2 mst = st;
    mst *= divisions;

    float cellx = floor(mst.x);
    float celly = floor(mst.y);

    mst = mod(mst, 1.);
    float tt = t - (sin(cellx * .3) + cos(celly * .3)) * .5;
    float squareProgress = mod(tt * .3, 1.);
    float squareEntryProgress = mapAndCap(squareProgress, 0., 0.6, 0., 1.);
    float squareExitProgress = mapAndCap(squareProgress, 0.9, .999, 0., 1.);
    squareExitProgress = pow(squareExitProgress, 3.);

    float borderProgress = mapAndCap(squareEntryProgress, 0., 0.55, 0., 1.);
    borderProgress = pow(borderProgress, 1.5);
    float fillProgress = mapAndCap(squareEntryProgress, 0.4, 0.9, 0., 1.);
    fillProgress = pow(fillProgress, 4.);

    mst = mst * 2. - 1.;
    mst = rotate2d(cellx * PI * .5 + celly * PI * .5 + PI * .25) * mst;

    float d = polygonDistanceField(mst, 4);
    float r = map(squareExitProgress, 0., 1., 0.7, 0.);
    float innerCut = map(fillProgress, 0., 1., 0.9, 0.0001);
    float buf = 1.01;
    float shape = smoothstep(r * buf, r, d) - smoothstep(r * innerCut, r * innerCut / buf, d);

    buf = 1.5;
    float shape2 = smoothstep(r * buf, r, d) - smoothstep(r * innerCut, r * innerCut / buf, d);

    float sta = atan(mst.y, mst.x);
    float targetAngle = map(borderProgress, 0., 1., 0., PI) + PI * .251;
    float adiff = minAngularDifference(sta, targetAngle);
    float arange = map(borderProgress, 0., 1., 0., PI);
    float amask = 1. - smoothstep(arange, arange, adiff);
    shape *= amask;

    color = vec3(shape) * (vec3(1. - st.x, st.y, st.y) + vec3(.2));
    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, v_uv * vec2(${width}, ${height}));
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
const fragmentShader = compileShader(
  gl,
  fragmentShaderSource,
  gl.FRAGMENT_SHADER
);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(`Failed to link program: ${gl.getProgramInfoLog(program)}`);
}

gl.useProgram(program);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
  gl.STATIC_DRAW
);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const frameLocation = gl.getUniformLocation(program, "u_frame");

// Create a canvas
const canvas = new Canvas(width, height);
const ctx = canvas.getContext("2d");

// Create a GIF encoder
const encoder = new GIFEncoder(width, height, {
  highWaterMark: 10 * 1024 * 1024,
});
encoder.pipe(fs.createWriteStream("output/gradient.gif"));
encoder.setRepeat(0);
encoder.setDelay((duration * 1000) / maxFrame);
encoder.setQuality(1);
encoder.writeHeader();

const frames: Uint8ClampedArray[] = [];
const bufferPromises: Promise<void>[] = [];

console.log(`FPS: ${(maxFrame / duration).toFixed(3)}`);
console.log(`ms/F: ${Math.floor((duration / maxFrame) * 1000)}`);

for (let frame = 0; frame < maxFrame; frame++) {
  // Print the frame status
  process.stdout.write(`Frame ${frame + 1}/${maxFrame}\r`);

  gl.uniform1i(frameLocation, frame);

  // Draw the gradient
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Read the pixels
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Clear the canvas and put the pixels on it
  ctx.clearRect(0, 0, width, height);
  const glImageData = new ImageData(
    new Uint8ClampedArray(pixels),
    width,
    height
  );
  ctx.putImageData(glImageData, 0, 0);

  // Draw the box
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

  // Clip the avatar
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

  // Draw a blur effect
  ctx.filter = "blur(12px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";

  // Draw the avatar background
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fill();

  // Draw the avatar
  ctx.drawImage(avatar, placement, placement, avatarSize, avatarSize);

  // Restore the clip
  ctx.restore();

  // Draw the slider
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.beginPath();
  ctx.roundRect(sliderLeft, sliderTop, sliderWidth, sliderHeight, sliderHeight);
  ctx.save();
  ctx.clip();
  ctx.filter = "blur(8px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.roundRect(
    sliderLeft - sliderHeight / 2,
    sliderTop,
    sliderWidth * sliderValue + sliderHeight / 2,
    sliderHeight,
    sliderHeight
  );
  ctx.fill();
  ctx.restore();

  // Write the slider value
  ctx.font = "14px Arial";
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText(
    `${points} / ${pointsToNextLevel}`,
    sliderLeft + 8,
    sliderTop - 3
  );

  // Write the level
  ctx.textAlign = "right";
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`Level ${level}`, sliderRight - 8, sliderTop - 3);

  // Write the username
  ctx.font = "24px Arial";
  ctx.fillStyle = "white";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(username, placement + avatarSize, boxMargin + textMargin);

  // Collect the frame
  const imageData = ctx.getImageData(0, 0, width, height);
  frames.push(imageData.data);

  // Write the frame to a file
  const frameNumber = String(frame).padStart(3, "0");
  const promise = canvas.toBuffer("png").then((buffer) => {
    fs.writeFileSync(`output/frame-${frameNumber}.png`, buffer);
  });
  bufferPromises.push(promise);
}

const endFrameRender = process.hrtime(start);

process.stdout.write("\n");

for (let i = 0; i < maxFrame; i++) {
  encoder.addFrame(frames[i]);
  process.stdout.write(`Encoding frame ${i + 1}/${maxFrame}\r`);
}

process.stdout.write("\nWaiting for file writes...\n");

encoder.finish();

const endEncoding = process.hrtime(start);

await Promise.all(bufferPromises);

process.stdout.write("Done!\n");

const end = process.hrtime(start);
const secondsEnd = end[0] + end[1] / 1e9;
const secondsFrameRender = endFrameRender[0] + endFrameRender[1] / 1e9;
const secondsEncoding =
  endEncoding[0] + endEncoding[1] / 1e9 - secondsFrameRender;

const averageEnd = secondsEnd / maxFrame;
const averageFrameRender = secondsFrameRender / maxFrame;
const averageEncoding = secondsEncoding / maxFrame;

console.log(`Total time: ${secondsEnd.toFixed(3)}s`);
console.log(`Average time: ${averageEnd.toFixed(3)}s/frame`);
console.log(`Frame render time: ${secondsFrameRender.toFixed(3)}s`);
console.log(`Average frame render time: ${averageFrameRender.toFixed(3)}s/frame`);
console.log(`Encoding time: ${secondsEncoding.toFixed(3)}s`);
console.log(`Average encoding time: ${averageEncoding.toFixed(3)}s/frame`);
