import { initEGLContext, gl } from "./bungl/index.js";
import { CString } from "bun:ffi";

let eglContext: any = null;
let currentWidth = 0;
let currentHeight = 0;

/**
 * Initialize headless OpenGL context using EGL
 * This follows the NVIDIA recommended approach for headless OpenGL
 */
export function initHeadlessGL(width: number = 512, height: number = 512) {
  // Always cleanup and recreate context for now to avoid race conditions
  // TODO: Optimize this later by proper context reuse
  if (eglContext) {
    console.log(
      `Cleaning up existing EGL context for new dimensions: ${width}x${height}`
    );
    cleanupHeadlessGL();
  }

  try {
    // Initialize EGL context using the modern EGL approach
    eglContext = initEGLContext(width, height);
    currentWidth = width;
    currentHeight = height;

    // Test that OpenGL is working
    const version = gl.symbols.glGetString(0x1f02); // GL_VERSION
    if (version) {
      const versionStr = new CString(version);
      console.log("OpenGL Version:", versionStr);
    }
  } catch (error) {
    console.error("Failed to initialize headless OpenGL:", error);
    throw error;
  }
}
/**
 * Clean up the EGL context
 */
export function cleanupHeadlessGL() {
  if (eglContext) {
    eglContext.cleanup();
    eglContext = null;
    currentWidth = 0;
    currentHeight = 0;
    console.log("EGL context cleaned up");
  }
}

/**
 * Get the current EGL context
 */
export function getEGLContext() {
  return eglContext;
}

/**
 * Read pixels from the current framebuffer
 */
export function readPixels(width: number, height: number): Uint8Array {
  if (!eglContext) {
    throw new Error(
      "EGL context not initialized. Call initHeadlessGL() first."
    );
  }

  const pixels = new Uint8Array(width * height * 4); // RGBA
  const buffer = Buffer.from(pixels.buffer);

  gl.symbols.glReadPixels(
    0,
    0, // x, y
    width,
    height, // width, height
    0x1908, // GL_RGBA
    0x1401, // GL_UNSIGNED_BYTE
    buffer
  );

  return pixels;
}

// Re-export GL symbols for convenience
export { gl };
