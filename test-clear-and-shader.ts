#!/usr/bin/env bun

import {
  initHeadlessGL,
  readPixels,
  cleanupHeadlessGL,
} from "./headless-gl.js";
import { compileShader } from "./utils.js";

function testBothClearAndShader() {
  console.log("Testing both clear and shader in same context...");

  const width = 375;
  const height = 150;

  try {
    const gl = initHeadlessGL(width, height);
    if (!gl) {
      throw new Error("Failed to create WebGL context");
    }

    gl.viewport(0, 0, width, height);

    // Ensure clean OpenGL state
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.flush();
    gl.finish();

    // Test 1: Clear to red (like test-egl.ts)
    console.log("Test 1: Clear operation");
    gl.clearColor(1.0, 0.0, 0.0, 1.0); // Red
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.flush();
    gl.finish();

    const clearPixels = readPixels(width, height);
    console.log(
      `Clear test - First pixel RGBA: ${clearPixels[0]}, ${clearPixels[1]}, ${clearPixels[2]}, ${clearPixels[3]}`
    );

    // Test 2: Now try shader rendering
    console.log("Test 2: Shader rendering");

    // Clear to black first
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
    console.log("Position attribute location:", positionLocation);

    // Make sure we use the program BEFORE setting up attributes
    gl.useProgram(program);

    // Ensure clean state before setting up vertex attributes
    gl.flush();
    gl.finish();

    // Bind buffer and set up attributes after using program
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Flush after attribute setup
    gl.flush();
    gl.finish();

    // Check for errors after attribute setup
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(
        `OpenGL error after attribute setup: 0x${error.toString(16)}`
      );
    }

    // Draw
    console.log("Drawing triangle...");
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Check for errors after drawing
    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`OpenGL error: 0x${error.toString(16)}`);
    }

    gl.flush();
    gl.finish();

    // Read pixels
    const shaderPixels = readPixels(width, height);
    console.log(
      `Shader test - First pixel RGBA: ${shaderPixels[0]}, ${shaderPixels[1]}, ${shaderPixels[2]}, ${shaderPixels[3]}`
    );

    // Cleanup
    cleanupHeadlessGL();
  } catch (error) {
    console.error("Test failed:", error);
    cleanupHeadlessGL();
  }
}

testBothClearAndShader();
