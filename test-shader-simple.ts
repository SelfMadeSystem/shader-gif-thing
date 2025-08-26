#!/usr/bin/env bun

import { initHeadlessGL } from "./headless-gl.js";
import { compileShader } from "./utils.js";
import sharp from "sharp";

function testSimpleShader() {
  console.log("Testing simple shader rendering...");

  const width = 375;
  const height = 150;

  const gl = initHeadlessGL(width, height);
  if (!gl) {
    throw new Error("Failed to create WebGL context");
  }

  // Set viewport
  gl.viewport(0, 0, width, height);

  // Disable depth testing and other states that might interfere
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Simple vertex shader
  const vertexShaderSource = /* glsl */ `
#version 120
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

  // Simple fragment shader - just output red
  const fragmentShaderSource = /* glsl */ `
#version 120
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red
}
`;

  // Compile shaders
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(
    gl,
    fragmentShaderSource,
    gl.FRAGMENT_SHADER
  );

  // Create program
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Failed to link program: ${gl.getProgramInfoLog(program)}`);
  }

  // Check for errors after program creation
  let error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.error(`OpenGL error after program setup: 0x${error.toString(16)}`);
  }

  // Create vertex buffer with one large triangle covering the entire screen
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -3,
      -1, // Bottom left (way off screen to the left)
      1,
      -1, // Bottom right
      1,
      3, // Top right (way off screen to the top)
    ]),
    gl.STATIC_DRAW
  );

  // Get attribute location
  const positionLocation = gl.getAttribLocation(program, "a_position");
  console.log("Position attribute location:", positionLocation);

  if (positionLocation === -1) {
    console.error("Failed to get position attribute location");
    return;
  }

  // Clear and render
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Set up vertex attributes AFTER binding buffer and using program
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Check for errors after drawing
  error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.error(`OpenGL error after drawing: 0x${error.toString(16)}`);
  }

  // Ensure all OpenGL commands are executed
  gl.flush();
  gl.finish();

  // Read pixels
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Check first few pixels
  console.log(
    `First pixel RGBA: ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
  );
  console.log(
    `Middle pixel RGBA: ${pixels[width * (height / 2) * 4]}, ${
      pixels[width * (height / 2) * 4 + 1]
    }, ${pixels[width * (height / 2) * 4 + 2]}, ${
      pixels[width * (height / 2) * 4 + 3]
    }`
  );

  // Flip vertically (OpenGL to image coordinates)
  const flippedPixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcOffset = ((height - 1 - y) * width + x) * 4;
      const dstOffset = (y * width + x) * 4;
      flippedPixels[dstOffset] = pixels[srcOffset];
      flippedPixels[dstOffset + 1] = pixels[srcOffset + 1];
      flippedPixels[dstOffset + 2] = pixels[srcOffset + 2];
      flippedPixels[dstOffset + 3] = pixels[srcOffset + 3];
    }
  }

  // Save as PNG
  const buffer = Buffer.from(flippedPixels);
  sharp(buffer, {
    raw: {
      width: width,
      height: height,
      channels: 4,
    },
  })
    .png()
    .toFile("output/test_simple_shader.png")
    .then(() => {
      console.log("Saved test_simple_shader.png");
    })
    .catch((err) => {
      console.error("Error saving image:", err);
    });

  console.log("Simple shader test completed");
}

testSimpleShader();
