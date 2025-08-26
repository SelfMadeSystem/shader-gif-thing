#!/usr/bin/env bun

import { initHeadlessGL, readPixels, gl } from "./headless-gl.js";
import { CString } from "bun:ffi";

function testRawGLShader() {
  console.log("Testing shader with raw GL symbols (like test-egl.ts)...");

  const width = 375;
  const height = 150;

  const context = initHeadlessGL(width, height);
  if (!context) {
    throw new Error("Failed to create context");
  }

  // Set viewport using raw GL
  gl.symbols.glViewport(0, 0, width, height);

  // Clear using raw GL
  gl.symbols.glClearColor(0.0, 0.0, 0.0, 1.0);
  gl.symbols.glClear(0x00004000); // GL_COLOR_BUFFER_BIT

  // Create shaders using raw GL
  const vertexShader = gl.symbols.glCreateShader(0x8b31); // GL_VERTEX_SHADER
  const fragmentShader = gl.symbols.glCreateShader(0x8b30); // GL_FRAGMENT_SHADER

  // Shader sources
  const vertexSource = `
#version 120
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

  const fragmentSource = `
#version 120
void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`;

  // Compile vertex shader
  const vertexSourceBuffer = Buffer.from(vertexSource + "\0", "utf-8");
  const vertexSourcePtr = Buffer.alloc(8);
  const vertexSourceView = new BigUint64Array(vertexSourcePtr.buffer);
  vertexSourceView[0] = BigInt(vertexSourceBuffer as any);

  gl.symbols.glShaderSource(vertexShader, 1, vertexSourcePtr, null);
  gl.symbols.glCompileShader(vertexShader);

  // Check compile status
  const statusBuffer = Buffer.alloc(4);
  gl.symbols.glGetShaderiv(vertexShader, 0x8b81, statusBuffer); // GL_COMPILE_STATUS
  const vertexStatus = new Int32Array(statusBuffer.buffer)[0];
  console.log("Vertex shader compile status:", vertexStatus);

  // Compile fragment shader
  const fragmentSourceBuffer = Buffer.from(fragmentSource + "\0", "utf-8");
  const fragmentSourcePtr = Buffer.alloc(8);
  const fragmentSourceView = new BigUint64Array(fragmentSourcePtr.buffer);
  fragmentSourceView[0] = BigInt(fragmentSourceBuffer as any);

  gl.symbols.glShaderSource(fragmentShader, 1, fragmentSourcePtr, null);
  gl.symbols.glCompileShader(fragmentShader);

  gl.symbols.glGetShaderiv(fragmentShader, 0x8b81, statusBuffer);
  const fragmentStatus = new Int32Array(statusBuffer.buffer)[0];
  console.log("Fragment shader compile status:", fragmentStatus);

  if (vertexStatus !== 1 || fragmentStatus !== 1) {
    throw new Error("Shader compilation failed");
  }

  // Create and link program
  const program = gl.symbols.glCreateProgram();
  gl.symbols.glAttachShader(program, vertexShader);
  gl.symbols.glAttachShader(program, fragmentShader);
  gl.symbols.glLinkProgram(program);

  // Check link status
  gl.symbols.glGetProgramiv(program, 0x8b82, statusBuffer); // GL_LINK_STATUS
  const linkStatus = new Int32Array(statusBuffer.buffer)[0];
  console.log("Program link status:", linkStatus);

  if (linkStatus !== 1) {
    throw new Error("Program linking failed");
  }

  // Create vertex buffer
  const bufferHandle = Buffer.alloc(4);
  gl.symbols.glGenBuffers(1, bufferHandle);
  const buffer = new Uint32Array(bufferHandle.buffer)[0];

  gl.symbols.glBindBuffer(0x8892, buffer); // GL_ARRAY_BUFFER

  const vertices = new Float32Array([
    -3,
    -1, // Large triangle
    1,
    -1,
    1,
    3,
  ]);
  const verticesBuffer = Buffer.from(vertices.buffer);
  gl.symbols.glBufferData(
    0x8892,
    BigInt(verticesBuffer.length),
    verticesBuffer,
    0x88e4
  ); // GL_STATIC_DRAW

  // Get attribute location
  const attrNameBuffer = Buffer.from("a_position\0", "utf-8");
  const positionLocation = gl.symbols.glGetAttribLocation(
    program,
    attrNameBuffer
  );
  console.log("Position attribute location:", positionLocation);

  // Use program and set up attributes
  gl.symbols.glUseProgram(program);
  gl.symbols.glBindBuffer(0x8892, buffer);
  gl.symbols.glEnableVertexAttribArray(positionLocation);
  gl.symbols.glVertexAttribPointer(positionLocation, 2, 0x1406, false, 0, null); // GL_FLOAT

  // Draw
  console.log("Drawing triangle...");
  gl.symbols.glDrawArrays(0x0004, 0, 3); // GL_TRIANGLES

  // Check for errors
  const error = gl.symbols.glGetError();
  if (error !== 0) {
    console.error(`OpenGL error: 0x${error.toString(16)}`);
  }

  // Read pixels
  const pixels = readPixels(width, height);
  console.log(
    `First pixel RGBA: ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
  );

  const isGreen =
    pixels[0] === 0 &&
    pixels[1] === 255 &&
    pixels[2] === 0 &&
    pixels[3] === 255;
  console.log(isGreen ? "✅ Success with raw GL!" : "❌ Failed with raw GL");

  console.log("Raw GL shader test completed");
}

testRawGLShader();
