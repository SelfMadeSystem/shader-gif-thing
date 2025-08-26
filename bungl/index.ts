/// <reference types="bun-types" />
import { dlopen, FFIType, ptr } from "bun:ffi";

// Load OpenGL and EGL libraries
const gl = dlopen("libOpenGL.so", {
  // Basic OpenGL functions
  glGetString: {
    args: [FFIType.u32],
    returns: FFIType.ptr,
  },
  glGetError: {
    args: [],
    returns: FFIType.u32,
  },
  glCreateProgram: {
    args: [],
    returns: FFIType.u32,
  },
  glReadPixels: {
    args: [
      FFIType.i32,
      FFIType.i32,
      FFIType.i32,
      FFIType.i32,
      FFIType.u32,
      FFIType.u32,
      FFIType.ptr,
    ],
    returns: FFIType.void,
  },
  glClear: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glClearColor: {
    args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32],
    returns: FFIType.void,
  },
  glViewport: {
    args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32],
    returns: FFIType.void,
  },

  // OpenGL command execution
  glFlush: {
    args: [],
    returns: FFIType.void,
  },
  glFinish: {
    args: [],
    returns: FFIType.void,
  },

  // Shader functions
  glCreateShader: {
    args: [FFIType.u32],
    returns: FFIType.u32,
  },
  glShaderSource: {
    args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  glCompileShader: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glGetShaderiv: {
    args: [FFIType.u32, FFIType.u32, FFIType.ptr],
    returns: FFIType.void,
  },
  glGetShaderInfoLog: {
    args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  glAttachShader: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glLinkProgram: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glGetProgramiv: {
    args: [FFIType.u32, FFIType.u32, FFIType.ptr],
    returns: FFIType.void,
  },
  glGetProgramInfoLog: {
    args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  glUseProgram: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glDeleteShader: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },

  // Buffer functions
  glGenBuffers: {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.void,
  },
  glBindBuffer: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glBufferData: {
    args: [FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.u32],
    returns: FFIType.void,
  },

  // Vertex attribute functions
  glGetAttribLocation: {
    args: [FFIType.u32, FFIType.ptr],
    returns: FFIType.i32,
  },
  glEnableVertexAttribArray: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glVertexAttribPointer: {
    args: [
      FFIType.u32,
      FFIType.i32,
      FFIType.u32,
      FFIType.bool,
      FFIType.i32,
      FFIType.ptr,
    ],
    returns: FFIType.void,
  },

  // Uniform functions
  glGetUniformLocation: {
    args: [FFIType.u32, FFIType.ptr],
    returns: FFIType.i32,
  },
  glUniform1i: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.void,
  },
  glUniform4f: {
    args: [FFIType.i32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32],
    returns: FFIType.void,
  },

  // Blending functions
  glEnable: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glBlendFunc: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },

  // Texture functions
  glGenTextures: {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.void,
  },
  glBindTexture: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glTexParameteri: {
    args: [FFIType.u32, FFIType.u32, FFIType.i32],
    returns: FFIType.void,
  },
  glTexImage2D: {
    args: [
      FFIType.u32,
      FFIType.i32,
      FFIType.i32,
      FFIType.i32,
      FFIType.i32,
      FFIType.i32,
      FFIType.u32,
      FFIType.u32,
      FFIType.ptr,
    ],
    returns: FFIType.void,
  },
  glActiveTexture: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },

  // Drawing functions
  glDrawArrays: {
    args: [FFIType.u32, FFIType.i32, FFIType.i32],
    returns: FFIType.void,
  },
});

// Load EGL library
const egl = dlopen("libEGL.so", {
  // EGL functions for headless rendering
  eglGetDisplay: {
    args: [FFIType.u64], // EGL_DEFAULT_DISPLAY is a NativeDisplayType (usually 0)
    returns: FFIType.ptr,
  },
  eglInitialize: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  eglChooseConfig: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr],
    returns: FFIType.bool,
  },
  eglCreatePbufferSurface: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr], // display, config (as handle/u64), attrib_list
    returns: FFIType.ptr,
  },
  eglBindAPI: {
    args: [FFIType.u32],
    returns: FFIType.bool,
  },
  eglCreateContext: {
    args: [FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr], // display, config, share_context (both as handles), attrib_list
    returns: FFIType.ptr,
  },
  eglMakeCurrent: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  eglTerminate: {
    args: [FFIType.ptr],
    returns: FFIType.bool,
  },
  eglDestroySurface: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  eglDestroyContext: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  eglGetError: {
    args: [],
    returns: FFIType.u32,
  },
});

// EGL constants
const EGL_DEFAULT_DISPLAY = 0; // EGL_DEFAULT_DISPLAY is defined as 0, not a null pointer
const EGL_NO_CONTEXT = 0n; // EGL_NO_CONTEXT is also 0
const EGL_PBUFFER_BIT = 0x0001;
const EGL_OPENGL_API = 0x30a2;
const EGL_OPENGL_BIT = 0x0008;
const EGL_SURFACE_TYPE = 0x3033;
const EGL_BLUE_SIZE = 0x3022;
const EGL_GREEN_SIZE = 0x3023;
const EGL_RED_SIZE = 0x3024;
const EGL_DEPTH_SIZE = 0x3025;
const EGL_RENDERABLE_TYPE = 0x3040;
const EGL_NONE = 0x3038;
const EGL_WIDTH = 0x3057;
const EGL_HEIGHT = 0x3056;

// OpenGL constants
export const GL_CONSTANTS = {
  // Buffer types
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4,

  // Shader types
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,

  // Shader/Program parameters
  COMPILE_STATUS: 0x8b81,
  LINK_STATUS: 0x8b82,
  INFO_LOG_LENGTH: 0x8b84,

  // Drawing modes
  TRIANGLES: 0x0004,

  // Buffer bits
  COLOR_BUFFER_BIT: 0x00004000,
  DEPTH_BUFFER_BIT: 0x00000100,

  // Blending
  BLEND: 0x0be2,
  SRC_ALPHA: 0x0302,
  ONE_MINUS_SRC_ALPHA: 0x0303,

  // Data types
  FLOAT: 0x1406,
  UNSIGNED_BYTE: 0x1401,

  // Texture parameters
  TEXTURE_2D: 0x0de1,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
  LINEAR: 0x2601,
  CLAMP_TO_EDGE: 0x812f,

  // Texture units
  TEXTURE0: 0x84c0,

  // Pixel formats
  RGBA: 0x1908,

  // Version constant
  VERSION: 0x1f02,
} as const;

// Configuration attributes for EGL
function createConfigAttribs(): Buffer {
  const attribs = new Int32Array([
    EGL_SURFACE_TYPE,
    EGL_PBUFFER_BIT,
    EGL_RED_SIZE,
    8,
    EGL_GREEN_SIZE,
    8,
    EGL_BLUE_SIZE,
    8,
    EGL_RENDERABLE_TYPE,
    EGL_OPENGL_BIT,
    EGL_NONE,
  ]);
  return Buffer.from(attribs.buffer);
}

// PBuffer attributes
function createPbufferAttribs(width: number, height: number): Buffer {
  const attribs = new Int32Array([
    EGL_WIDTH,
    width,
    EGL_HEIGHT,
    height,
    EGL_NONE,
  ]);
  return Buffer.from(attribs.buffer);
}

// Initialize EGL headless context
export function initEGLContext(width: number = 512, height: number = 512) {
  try {
    // 1. Initialize EGL
    const eglDisplay = egl.symbols.eglGetDisplay(BigInt(EGL_DEFAULT_DISPLAY));

    const majorPtr = Buffer.alloc(4);
    const minorPtr = Buffer.alloc(4);

    const initResult = egl.symbols.eglInitialize(
      eglDisplay,
      ptr(majorPtr),
      ptr(minorPtr)
    );
    if (!initResult) {
      const error = egl.symbols.eglGetError();
      throw new Error(
        `Failed to initialize EGL. Error: 0x${error.toString(16)}`
      );
    }

    // 2. Use a simpler approach - just get one config
    const configAttribs = createConfigAttribs();

    // Allocate space for a single EGLConfig handle (pointer-sized)
    const configBuffer = Buffer.alloc(8); // 8 bytes for pointer on 64-bit
    const numConfigsPtr = Buffer.alloc(4);

    const chooseResult = egl.symbols.eglChooseConfig(
      eglDisplay,
      ptr(configAttribs),
      ptr(configBuffer),
      1,
      ptr(numConfigsPtr)
    );

    if (!chooseResult) {
      const error = egl.symbols.eglGetError();
      throw new Error(
        `Failed to choose EGL config. Error: 0x${error.toString(16)}`
      );
    }

    const numConfigs = new Int32Array(numConfigsPtr.buffer)[0];

    if (numConfigs === 0) {
      throw new Error("No suitable EGL configs found");
    }

    // Read the EGLConfig handle from the buffer
    // EGLConfig is stored as a pointer value in the buffer
    const configValue = new BigUint64Array(configBuffer.buffer)[0];

    // 3. Create a PBuffer surface - pass config as BigInt handle
    const pbufferAttribs = createPbufferAttribs(width, height);
    const eglSurface = egl.symbols.eglCreatePbufferSurface(
      eglDisplay,
      configValue, // Pass as BigInt handle directly
      ptr(pbufferAttribs)
    );

    if (!eglSurface) {
      const error = egl.symbols.eglGetError();
      throw new Error(
        `Failed to create PBuffer surface. Error: 0x${error.toString(16)}`
      );
    }

    // 4. Bind the OpenGL API
    const bindResult = egl.symbols.eglBindAPI(EGL_OPENGL_API);
    if (!bindResult) {
      throw new Error("Failed to bind OpenGL API");
    }

    // 5. Create a context and make it current
    const eglContext = egl.symbols.eglCreateContext(
      eglDisplay,
      configValue, // Pass config as BigInt handle
      EGL_NO_CONTEXT, // Pass as BigInt (0n)
      null // NULL for default attributes
    );

    if (!eglContext) {
      const error = egl.symbols.eglGetError();
      throw new Error(
        `Failed to create EGL context. Error: 0x${error.toString(16)}`
      );
    }

    const makeCurrentResult = egl.symbols.eglMakeCurrent(
      eglDisplay,
      eglSurface,
      eglSurface,
      eglContext
    );

    if (!makeCurrentResult) {
      throw new Error("Failed to make EGL context current");
    }

    return {
      display: eglDisplay,
      surface: eglSurface,
      context: eglContext,
      width,
      height,
      cleanup: () => {
        egl.symbols.eglDestroySurface(eglDisplay, eglSurface);
        egl.symbols.eglDestroyContext(eglDisplay, eglContext);
        egl.symbols.eglTerminate(eglDisplay);
      },
    };
  } catch (error) {
    console.error("Failed to initialize EGL context:", error);
    throw error;
  }
}

// Export OpenGL symbols for use
export { gl, egl };
