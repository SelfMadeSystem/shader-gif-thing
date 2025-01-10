import fs from "fs";
import createGLContext from "gl";
import { Canvas, ImageData, loadImage } from "skia-canvas";
import GIFEncoder from "gif-encoder";
import { Vibrant } from "node-vibrant/node";

const start = process.hrtime();

// Remove all frame PNG files
const frameFiles = fs
  .readdirSync("output")
  .filter((file) => file.startsWith("frame-") && file.endsWith(".png"));
frameFiles.forEach((file) => fs.unlinkSync(`output/${file}`));

process.stdout.write("All frame PNG files have been removed.\n");

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
const avatarPath = "./assets/avatar.png";
const avatar = await loadImage(avatarPath);
const username = "SelfMadeSystem";
const points = 5909;
const pointsToNextLevel = 6515;
const sliderValue = points / pointsToNextLevel;
const level = 18;
const rank = 44;

// Get the avatar palette
const palette = await Vibrant.from(avatarPath).getPalette();
const c = palette.Vibrant!;

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
const vec2 iResolution = vec2(${width}, ${height});
varying vec2 v_uv;
uniform int u_frame;

#define PI 3.14159265359
#define OFFSET ${Math.random()}

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
    return (cos(t) + sin(t * 2.)) / 2.0;   
}

float getPlasmaY(float x, float horizontalFade, float offset)   
{
    float iTime = OFFSET + float(u_frame) / float(maxFrame);
    return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float iTime = OFFSET + float(u_frame) / float(maxFrame);
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
encoder.pipe(fs.createWriteStream(outputFile));
encoder.setRepeat(0);
encoder.setDelay((duration * 1000) / maxFrame);
encoder.setQuality(10);
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
  ctx.font = "14px Arial";
  ctx.textAlign = "right";
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`Level ${level}`, sliderRight - 8, sliderTop - 3);

  // Write the rank
  ctx.font = "13px Arial";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ddd";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`#${rank}`, sliderRight - 8, sliderTop - 20);

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
console.log(
  `Average frame render time: ${averageFrameRender.toFixed(3)}s/frame`
);
console.log(`Encoding time: ${secondsEncoding.toFixed(3)}s`);
console.log(`Average encoding time: ${averageEncoding.toFixed(3)}s/frame`);
console.log(`Output file: ${outputFile}`);
