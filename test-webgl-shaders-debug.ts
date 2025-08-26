#!/usr/bin/env bun

import { initHeadlessGL, readPixels } from "./headless-gl.js";
import sharp from "sharp";

function testWebGLShadersDebug() {
  console.log("Testing WebGL shader compilation step by step...");

  const width = 375;
  const height = 150;

  const gl = initHeadlessGL(width, height);
  if (!gl) {
    throw new Error("Failed to create WebGL context");
  }

  gl.viewport(0, 0, width, height);

  // Simple shaders that should produce green output
  const vertexShaderSource = `#version 120
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const fragmentShaderSource = `#version 120
void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);  // Solid green
}`;

  try {
    // Step 1: Test shader creation
    console.log("Creating shaders...");
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    console.log("✓ Shaders created successfully");

    // Step 2: Test shader source setting
    console.log("Setting shader sources...");
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    console.log("✓ Shader sources set");

    // Step 3: Test shader compilation
    console.log("Compiling vertex shader...");
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(vertexShader);
      throw new Error(`Vertex shader compilation failed: ${info}`);
    }
    console.log("✓ Vertex shader compiled");

    console.log("Compiling fragment shader...");
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(fragmentShader);
      throw new Error(`Fragment shader compilation failed: ${info}`);
    }
    console.log("✓ Fragment shader compiled");

    // Step 4: Test program creation and linking
    console.log("Creating and linking program...");
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error(`Program linking failed: ${info}`);
    }
    console.log("✓ Program linked successfully");

    // Step 5: Test attribute location
    const positionLocation = gl.getAttribLocation(program, "a_position");
    console.log(`Position attribute location: ${positionLocation}`);
    if (positionLocation === -1) {
      console.error("❌ Failed to get attribute location");
      return;
    }

    // Step 6: Test buffer operations
    console.log("Creating vertex buffer...");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const vertices = new Float32Array([
      -3,
      -1, // Large triangle
      1,
      -1,
      1,
      3,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    console.log("✓ Vertex buffer created and filled");

    // Step 7: Test rendering setup
    console.log("Setting up rendering...");
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Check for OpenGL errors before drawing
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`OpenGL error before drawing: 0x${error.toString(16)}`);
      return;
    }

    // Step 8: Draw
    console.log("Drawing triangle...");
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`OpenGL error after drawing: 0x${error.toString(16)}`);
      return;
    }

    gl.flush();
    gl.finish();

    // Step 9: Read and verify pixels
    console.log("Reading pixels...");
    const pixels = readPixels(width, height);

    console.log(
      `First pixel RGBA: ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
    );
    console.log(
      `Center pixel RGBA: ${
        pixels[4 * (((height / 2) | 0) * width + ((width / 2) | 0))]
      }, ${pixels[4 * (((height / 2) | 0) * width + ((width / 2) | 0)) + 1]}, ${
        pixels[4 * (((height / 2) | 0) * width + ((width / 2) | 0)) + 2]
      }, ${pixels[4 * (((height / 2) | 0) * width + ((width / 2) | 0)) + 3]}`
    );

    if (pixels[1] === 255) {
      // Check for green channel
      console.log("✅ WebGL shader rendering succeeded!");
    } else {
      console.log("❌ WebGL shader rendering failed - no green pixels found");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testWebGLShadersDebug();
