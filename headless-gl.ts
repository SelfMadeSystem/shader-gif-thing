import { initEGLContext, gl, NativeWebGLContext } from "./bungl/index.js";
import { CString } from "bun:ffi";

let eglContext: any = null;
let webglContext: NativeWebGLContext | null = null;

/**
 * Initialize headless OpenGL context using EGL
 * This follows the NVIDIA recommended approach for headless OpenGL
 */
export function initHeadlessGL(width: number = 512, height: number = 512) {
  if (eglContext) {
    console.log("EGL context already initialized");
    return webglContext;
  }

  try {
    // Initialize EGL context using the modern EGL approach
    eglContext = initEGLContext(width, height);

    // Create WebGL-compatible wrapper
    webglContext = new NativeWebGLContext(width, height);

    // Test that OpenGL is working
    const version = gl.symbols.glGetString(0x1f02); // GL_VERSION
    if (version) {
      const versionStr = new CString(version);
      console.log("OpenGL Version:", versionStr);
    }

    // Set up viewport
    gl.symbols.glViewport(0, 0, width, height);

    return webglContext;
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
    webglContext = null;
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
