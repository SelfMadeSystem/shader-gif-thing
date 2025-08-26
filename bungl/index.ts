/// <reference types="bun-types" />
import { dlopen, FFIType, ptr, CString } from "bun:ffi";

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

    const major = new Int32Array(majorPtr.buffer)[0];
    const minor = new Int32Array(minorPtr.buffer)[0];
    console.log(`EGL version: ${major}.${minor}`);

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
    console.log(`Found ${numConfigs} matching EGL configs`);

    if (numConfigs === 0) {
      throw new Error("No suitable EGL configs found");
    }

    // Read the EGLConfig handle from the buffer
    // EGLConfig is stored as a pointer value in the buffer
    const configValue = new BigUint64Array(configBuffer.buffer)[0];
    console.log(`Config handle: 0x${configValue.toString(16)}`);

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
    console.log("PBuffer surface created successfully");

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

    console.log(`EGL context initialized successfully (${width}x${height})`);

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

// WebGL-compatible wrapper for native OpenGL
export class NativeWebGLContext {
  private width: number;
  private height: number;
  private shaderInfoLogBuffer = Buffer.alloc(512);
  private programInfoLogBuffer = Buffer.alloc(512);

  // WebGL constants
  readonly VERTEX_SHADER = GL_CONSTANTS.VERTEX_SHADER;
  readonly FRAGMENT_SHADER = GL_CONSTANTS.FRAGMENT_SHADER;
  readonly COMPILE_STATUS = GL_CONSTANTS.COMPILE_STATUS;
  readonly LINK_STATUS = GL_CONSTANTS.LINK_STATUS;
  readonly ARRAY_BUFFER = GL_CONSTANTS.ARRAY_BUFFER;
  readonly STATIC_DRAW = GL_CONSTANTS.STATIC_DRAW;
  readonly TRIANGLES = GL_CONSTANTS.TRIANGLES;
  readonly COLOR_BUFFER_BIT = GL_CONSTANTS.COLOR_BUFFER_BIT;
  readonly DEPTH_BUFFER_BIT = GL_CONSTANTS.DEPTH_BUFFER_BIT;
  readonly BLEND = GL_CONSTANTS.BLEND;
  readonly SRC_ALPHA = GL_CONSTANTS.SRC_ALPHA;
  readonly ONE_MINUS_SRC_ALPHA = GL_CONSTANTS.ONE_MINUS_SRC_ALPHA;
  readonly FLOAT = GL_CONSTANTS.FLOAT;
  readonly UNSIGNED_BYTE = GL_CONSTANTS.UNSIGNED_BYTE;
  readonly TEXTURE_2D = GL_CONSTANTS.TEXTURE_2D;
  readonly TEXTURE_MIN_FILTER = GL_CONSTANTS.TEXTURE_MIN_FILTER;
  readonly TEXTURE_MAG_FILTER = GL_CONSTANTS.TEXTURE_MAG_FILTER;
  readonly TEXTURE_WRAP_S = GL_CONSTANTS.TEXTURE_WRAP_S;
  readonly TEXTURE_WRAP_T = GL_CONSTANTS.TEXTURE_WRAP_T;
  readonly LINEAR = GL_CONSTANTS.LINEAR;
  readonly CLAMP_TO_EDGE = GL_CONSTANTS.CLAMP_TO_EDGE;
  readonly TEXTURE0 = GL_CONSTANTS.TEXTURE0;
  readonly RGBA = GL_CONSTANTS.RGBA;
  readonly NO_ERROR = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  createShader(type: number): number {
    return gl.symbols.glCreateShader(type);
  }

  shaderSource(shader: number, source: string): void {
    const sourceBuffer = Buffer.from(source, "utf-8");
    // Add null terminator
    const nullTerminatedSource = Buffer.concat([
      sourceBuffer,
      Buffer.from([0]),
    ]);
    const sourcePtr = ptr(nullTerminatedSource);

    // Create an array containing the pointer to the source string
    const sourcePtrsBuffer = Buffer.alloc(8);
    const sourcePtrsView = new BigUint64Array(sourcePtrsBuffer.buffer);
    sourcePtrsView[0] = BigInt(sourcePtr as any);

    // Create length array (pass null to let OpenGL calculate length)
    gl.symbols.glShaderSource(shader, 1, ptr(sourcePtrsBuffer), null);
  }

  compileShader(shader: number): void {
    gl.symbols.glCompileShader(shader);
  }

  getShaderParameter(shader: number, pname: number): number {
    const result = Buffer.alloc(4);
    gl.symbols.glGetShaderiv(shader, pname, ptr(result));
    return new Int32Array(result.buffer)[0];
  }

  getShaderInfoLog(shader: number): string {
    const lengthPtr = ptr(Buffer.alloc(4));
    gl.symbols.glGetShaderInfoLog(
      shader,
      512,
      lengthPtr,
      ptr(this.shaderInfoLogBuffer)
    );
    return this.shaderInfoLogBuffer.toString("utf-8").split("\0")[0];
  }

  createProgram(): number {
    return gl.symbols.glCreateProgram();
  }

  attachShader(program: number, shader: number): void {
    gl.symbols.glAttachShader(program, shader);
  }

  linkProgram(program: number): void {
    gl.symbols.glLinkProgram(program);
  }

  getProgramParameter(program: number, pname: number): number {
    const result = Buffer.alloc(4);
    gl.symbols.glGetProgramiv(program, pname, ptr(result));
    return new Int32Array(result.buffer)[0];
  }

  getProgramInfoLog(program: number): string {
    const lengthPtr = ptr(Buffer.alloc(4));
    gl.symbols.glGetProgramInfoLog(
      program,
      512,
      lengthPtr,
      ptr(this.programInfoLogBuffer)
    );
    return this.programInfoLogBuffer.toString("utf-8").split("\0")[0];
  }

  useProgram(program: number): void {
    gl.symbols.glUseProgram(program);
  }

  deleteShader(shader: number): void {
    gl.symbols.glDeleteShader(shader);
  }

  createBuffer(): number {
    const buffer = Buffer.alloc(4);
    gl.symbols.glGenBuffers(1, ptr(buffer));
    return new Uint32Array(buffer.buffer)[0];
  }

  bindBuffer(target: number, buffer: number | null): void {
    gl.symbols.glBindBuffer(target, buffer || 0);
  }

  bufferData(
    target: number,
    data: ArrayBuffer | Float32Array,
    usage: number
  ): void {
    let buffer: Buffer;
    if (data instanceof Float32Array) {
      buffer = Buffer.from(data.buffer);
    } else {
      buffer = Buffer.from(data);
    }
    gl.symbols.glBufferData(target, BigInt(buffer.length), ptr(buffer), usage);
  }

  getAttribLocation(program: number, name: string): number {
    return gl.symbols.glGetAttribLocation(
      program,
      ptr(Buffer.from(name + "\0", "utf-8"))
    );
  }

  enableVertexAttribArray(index: number): void {
    gl.symbols.glEnableVertexAttribArray(index);
  }

  vertexAttribPointer(
    index: number,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number
  ): void {
    gl.symbols.glVertexAttribPointer(
      index,
      size,
      type,
      normalized,
      stride,
      ptr(Buffer.alloc(8, offset))
    );
  }

  getUniformLocation(program: number, name: string): number {
    return gl.symbols.glGetUniformLocation(
      program,
      ptr(Buffer.from(name + "\0", "utf-8"))
    );
  }

  uniform1i(location: number, value: number): void {
    gl.symbols.glUniform1i(location, value);
  }

  uniform4f(
    location: number,
    x: number,
    y: number,
    z: number,
    w: number
  ): void {
    gl.symbols.glUniform4f(location, x, y, z, w);
  }

  enable(cap: number): void {
    gl.symbols.glEnable(cap);
  }

  blendFunc(sfactor: number, dfactor: number): void {
    gl.symbols.glBlendFunc(sfactor, dfactor);
  }

  createTexture(): number {
    const texture = Buffer.alloc(4);
    gl.symbols.glGenTextures(1, ptr(texture));
    return new Uint32Array(texture.buffer)[0];
  }

  bindTexture(target: number, texture: number | null): void {
    gl.symbols.glBindTexture(target, texture || 0);
  }

  texParameteri(target: number, pname: number, param: number): void {
    gl.symbols.glTexParameteri(target, pname, param);
  }

  texImage2D(
    target: number,
    level: number,
    internalFormat: number,
    format: number,
    type: number,
    source: ImageData
  ): void {
    const buffer = Buffer.from(source.data.buffer);
    gl.symbols.glTexImage2D(
      target,
      level,
      internalFormat,
      source.width,
      source.height,
      0,
      format,
      type,
      ptr(buffer)
    );
  }

  activeTexture(texture: number): void {
    gl.symbols.glActiveTexture(texture);
  }

  drawArrays(mode: number, first: number, count: number): void {
    gl.symbols.glDrawArrays(mode, first, count);
  }

  clear(mask: number): void {
    gl.symbols.glClear(mask);
  }

  readPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    format: number,
    type: number,
    pixels: Uint8Array
  ): void {
    const buffer = Buffer.from(pixels.buffer);
    gl.symbols.glReadPixels(x, y, width, height, format, type, ptr(buffer));
  }

  viewport(x: number, y: number, width: number, height: number): void {
    gl.symbols.glViewport(x, y, width, height);
  }

  flush(): void {
    gl.symbols.glFlush();
  }

  finish(): void {
    gl.symbols.glFinish();
  }

  clearColor(red: number, green: number, blue: number, alpha: number): void {
    gl.symbols.glClearColor(red, green, blue, alpha);
  }

  getError(): number {
    return gl.symbols.glGetError();
  }
}

// Export OpenGL symbols for use
export { gl, egl };
