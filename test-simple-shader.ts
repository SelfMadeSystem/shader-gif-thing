#!/usr/bin/env bun

import { initHeadlessGL } from "./headless-gl.js";

async function testSimpleShader() {
  console.log("Testing simple shader compilation...");

  try {
    const gl = initHeadlessGL(256, 256);

    if (!gl) {
      throw new Error("Failed to initialize OpenGL context");
    }

    const vertexSource = `#version 120
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

    const fragmentSource = `#version 120
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

    console.log("Creating vertex shader...");
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    console.log("Vertex shader ID:", vertexShader);

    console.log("Setting vertex shader source...");
    gl.shaderSource(vertexShader, vertexSource);

    console.log("Compiling vertex shader...");
    gl.compileShader(vertexShader);

    console.log("Checking vertex shader compile status...");
    const vertexStatus = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    console.log("Vertex compile status:", vertexStatus);

    if (vertexStatus === 0) {
      const log = gl.getShaderInfoLog(vertexShader);
      console.error("Vertex shader compile error:", log);
      throw new Error(`Vertex shader failed to compile: ${log}`);
    }

    console.log("✅ Vertex shader compiled successfully!");

    console.log("Creating fragment shader...");
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    console.log(
      "Fragment source to be compiled:",
      JSON.stringify(fragmentSource)
    );
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    const fragmentStatus = gl.getShaderParameter(
      fragmentShader,
      gl.COMPILE_STATUS
    );
    if (fragmentStatus === 0) {
      const log = gl.getShaderInfoLog(fragmentShader);
      console.error("Fragment shader compile error:", log);
      throw new Error(`Fragment shader failed to compile: ${log}`);
    }

    console.log("✅ Fragment shader compiled successfully!");
    console.log("✅ Simple shader test completed successfully!");
  } catch (error) {
    console.error("❌ Simple shader test failed:", error);
    process.exit(1);
  }
}

testSimpleShader();
