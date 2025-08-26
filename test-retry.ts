#!/usr/bin/env bun

import {
  initHeadlessGL,
  readPixels,
  cleanupHeadlessGL,
} from "./headless-gl.js";
import { compileShader } from "./utils.js";

function testWithRetry() {
  console.log("Testing shader rendering with retry logic...");

  const width = 375;
  const height = 150;
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Attempt ${attempt}/${MAX_RETRIES}`);

    try {
      const gl = initHeadlessGL(width, height);
      if (!gl) {
        throw new Error("Failed to create WebGL context");
      }

      gl.viewport(0, 0, width, height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Simple shaders
      const vertexShaderSource = /* glsl */ `
#version 120
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

      const fragmentShaderSource = /* glsl */ `
#version 120
void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // Green
}
`;

      // Compile and link shaders
      const vertexShader = compileShader(
        gl,
        vertexShaderSource,
        gl.VERTEX_SHADER
      );
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
        throw new Error(
          `Failed to link program: ${gl.getProgramInfoLog(program)}`
        );
      }

      // Create vertex buffer
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -3,
          -1, // Large triangle
          1,
          -1,
          1,
          3,
        ]),
        gl.STATIC_DRAW
      );

      // Set up vertex attributes
      const positionLocation = gl.getAttribLocation(program, "a_position");
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.flush();
      gl.finish();

      // Read pixels and check result
      const pixels = readPixels(width, height);
      const isGreen =
        pixels[0] === 0 &&
        pixels[1] === 255 &&
        pixels[2] === 0 &&
        pixels[3] === 255;

      console.log(
        `Attempt ${attempt} result - First pixel RGBA: ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
      );

      cleanupHeadlessGL();

      if (isGreen) {
        console.log(`✅ Success on attempt ${attempt}!`);
        return true;
      } else {
        console.log(`❌ Attempt ${attempt} failed, will retry...`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt} error:`, error);
      cleanupHeadlessGL();
    }
  }

  console.log(`❌ All ${MAX_RETRIES} attempts failed`);
  return false;
}

testWithRetry();
