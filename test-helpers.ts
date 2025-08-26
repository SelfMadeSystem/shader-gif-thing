#!/usr/bin/env bun

// Test OpenGL helper functions individually
import { gl, initEGLContext } from "./bungl/index.js";
import { ptr, CString } from "bun:ffi";

// OpenGL constants
const GL_VERTEX_SHADER = 0x8b31;
const GL_FRAGMENT_SHADER = 0x8b30;
const GL_COMPILE_STATUS = 0x8b81;

function compileShader(source: string, type: number): number {
  console.log(
    `Creating shader of type ${
      type === GL_VERTEX_SHADER ? "VERTEX" : "FRAGMENT"
    }...`
  );
  const shader = gl.symbols.glCreateShader(type);
  console.log(`Shader ID: ${shader}`);

  if (shader === 0) {
    throw new Error("Failed to create shader");
  }

  console.log("Setting shader source...");
  const sourceStr = new CString(source);
  const sourcePtr = ptr([sourceStr.ptr]);
  gl.symbols.glShaderSource(shader, 1, sourcePtr, null);

  console.log("Compiling shader...");
  gl.symbols.glCompileShader(shader);

  console.log("Checking compile status...");
  const status = new Int32Array(1);
  gl.symbols.glGetShaderiv(shader, GL_COMPILE_STATUS, ptr(status));

  console.log(`Compile status: ${status[0]}`);
  if (status[0] === 0) {
    const infoLog = new Uint8Array(512);
    const length = new Int32Array(1);
    gl.symbols.glGetShaderInfoLog(shader, 512, ptr(length), ptr(infoLog));
    const message = new TextDecoder().decode(infoLog.slice(0, length[0]));
    throw new Error(`Failed to compile shader: ${message}`);
  }

  return shader;
}

console.log("Testing OpenGL helper functions...");

try {
  // Initialize EGL context
  const eglContext = initEGLContext(256, 256);
  if (!eglContext) {
    throw new Error("Failed to create EGL context");
  }

  const vertexSource = `
#version 120
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const fragmentSource = `
#version 120
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

  // Test compiling shaders
  console.log("Testing vertex shader compilation...");
  const vertexShader = compileShader(vertexSource, GL_VERTEX_SHADER);
  console.log("✅ Vertex shader compiled successfully!");

  console.log("Testing fragment shader compilation...");
  const fragmentShader = compileShader(fragmentSource, GL_FRAGMENT_SHADER);
  console.log("✅ Fragment shader compiled successfully!");

  console.log("✅ All helper function tests passed!");
} catch (error) {
  console.error("❌ Helper function test failed:", error);
  process.exit(1);
}
