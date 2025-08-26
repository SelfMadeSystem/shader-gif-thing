#!/usr/bin/env bun

import {
  initHeadlessGL,
  readPixels,
  cleanupHeadlessGL,
  gl,
} from "./headless-gl.js";
import { ptr } from "bun:ffi";

function testRawGLShaders() {
  console.log("Testing shader rendering with raw GL symbols...");

  const width = 375;
  const height = 150;

  try {
    const glContext = initHeadlessGL(width, height);
    if (!glContext) {
      throw new Error("Failed to create WebGL context");
    }

    // Use raw GL symbols like test-egl.ts does
    gl.symbols.glViewport(0, 0, width, height);
    gl.symbols.glClearColor(0.0, 0.0, 0.0, 1.0);
    gl.symbols.glClear(0x00004000); // GL_COLOR_BUFFER_BIT

    // Create shaders using raw GL symbols
    const vertexShader = gl.symbols.glCreateShader(0x8b31); // GL_VERTEX_SHADER
    const fragmentShader = gl.symbols.glCreateShader(0x8b30); // GL_FRAGMENT_SHADER

    // Vertex shader source
    const vertexSource = `
#version 120
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

    // Fragment shader source
    const fragmentSource = `
#version 120
void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
}
`;

    // Compile vertex shader
    const vertexSourceBuffer = Buffer.from(vertexSource + "\0", "utf-8");
    const vertexSourcePtr = Buffer.alloc(8);
    new BigUint64Array(vertexSourcePtr.buffer)[0] = BigInt(
      ptr(vertexSourceBuffer)
    );

    gl.symbols.glShaderSource(vertexShader, 1, ptr(vertexSourcePtr), null);
    gl.symbols.glCompileShader(vertexShader);

    // Check vertex shader compilation
    const vertexStatus = Buffer.alloc(4);
    gl.symbols.glGetShaderiv(vertexShader, 0x8b81, ptr(vertexStatus)); // GL_COMPILE_STATUS
    if (new Int32Array(vertexStatus.buffer)[0] === 0) {
      const logBuffer = Buffer.alloc(512);
      gl.symbols.glGetShaderInfoLog(vertexShader, 512, null, ptr(logBuffer));
      throw new Error(
        `Vertex shader compilation failed: ${logBuffer.toString()}`
      );
    }

    // Compile fragment shader
    const fragmentSourceBuffer = Buffer.from(fragmentSource + "\0", "utf-8");
    const fragmentSourcePtr = Buffer.alloc(8);
    new BigUint64Array(fragmentSourcePtr.buffer)[0] = BigInt(
      ptr(fragmentSourceBuffer)
    );

    gl.symbols.glShaderSource(fragmentShader, 1, ptr(fragmentSourcePtr), null);
    gl.symbols.glCompileShader(fragmentShader);

    // Check fragment shader compilation
    const fragmentStatus = Buffer.alloc(4);
    gl.symbols.glGetShaderiv(fragmentShader, 0x8b81, ptr(fragmentStatus)); // GL_COMPILE_STATUS
    if (new Int32Array(fragmentStatus.buffer)[0] === 0) {
      const logBuffer = Buffer.alloc(512);
      gl.symbols.glGetShaderInfoLog(fragmentShader, 512, null, ptr(logBuffer));
      throw new Error(
        `Fragment shader compilation failed: ${logBuffer.toString()}`
      );
    }

    console.log("✓ Shaders compiled successfully");

    // Create and link program
    const program = gl.symbols.glCreateProgram();
    gl.symbols.glAttachShader(program, vertexShader);
    gl.symbols.glAttachShader(program, fragmentShader);
    gl.symbols.glLinkProgram(program);

    // Check program linking
    const linkStatus = Buffer.alloc(4);
    gl.symbols.glGetProgramiv(program, 0x8b82, ptr(linkStatus)); // GL_LINK_STATUS
    if (new Int32Array(linkStatus.buffer)[0] === 0) {
      const logBuffer = Buffer.alloc(512);
      gl.symbols.glGetProgramInfoLog(program, 512, null, ptr(logBuffer));
      throw new Error(`Program linking failed: ${logBuffer.toString()}`);
    }

    console.log("✓ Program linked successfully");

    // Create vertex buffer
    const vboBuffer = Buffer.alloc(4);
    gl.symbols.glGenBuffers(1, ptr(vboBuffer));
    const vbo = new Uint32Array(vboBuffer.buffer)[0];

    const vertices = new Float32Array([
      -3,
      -1, // Large triangle
      1,
      -1,
      1,
      3,
    ]);
    const vertexBuffer = Buffer.from(vertices.buffer);

    gl.symbols.glBindBuffer(0x8892, vbo); // GL_ARRAY_BUFFER
    gl.symbols.glBufferData(
      0x8892,
      BigInt(vertexBuffer.length),
      ptr(vertexBuffer),
      0x88e4
    ); // GL_STATIC_DRAW

    // Get attribute location and set up vertex attributes
    const positionLocationBuffer = Buffer.from("a_position\0", "utf-8");
    const positionLocation = gl.symbols.glGetAttribLocation(
      program,
      ptr(positionLocationBuffer)
    );
    console.log("Position attribute location:", positionLocation);

    gl.symbols.glUseProgram(program);
    gl.symbols.glBindBuffer(0x8892, vbo); // GL_ARRAY_BUFFER
    gl.symbols.glEnableVertexAttribArray(positionLocation);
    gl.symbols.glVertexAttribPointer(
      positionLocation,
      2,
      0x1406,
      false,
      0,
      null
    ); // GL_FLOAT

    // Draw
    console.log("Drawing triangle with raw GL...");
    gl.symbols.glDrawArrays(0x0004, 0, 3); // GL_TRIANGLES

    // Check for errors
    const error = gl.symbols.glGetError();
    if (error !== 0) {
      console.error(`OpenGL error: 0x${error.toString(16)}`);
    }

    // Read pixels
    const pixels = readPixels(width, height);
    console.log(
      `Raw GL result - First pixel RGBA: ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
    );

    const isGreen =
      pixels[0] === 0 &&
      pixels[1] === 255 &&
      pixels[2] === 0 &&
      pixels[3] === 255;
    console.log(
      isGreen
        ? "✅ Raw GL shader rendering succeeded!"
        : "❌ Raw GL shader rendering failed"
    );

    cleanupHeadlessGL();
    return isGreen;
  } catch (error) {
    console.error("Raw GL test failed:", error);
    cleanupHeadlessGL();
    return false;
  }
}

testRawGLShaders();
