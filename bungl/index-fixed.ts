/// <reference types="bun-types" />
import { dlopen, FFIType, ptr, CString } from "bun:ffi";

const gl = dlopen("libGL.so", {
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

  // GLX functions - using legacy approach
  glXChooseVisual: {
    args: [FFIType.ptr, FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  glXCreateContext: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.bool],
    returns: FFIType.ptr,
  },
  glXCreateGLXPixmap: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.u64,
  },
  glXMakeCurrent: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
    returns: FFIType.bool,
  },
  glXDestroyGLXPixmap: {
    args: [FFIType.ptr, FFIType.u64],
    returns: FFIType.void,
  },
  glXDestroyContext: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
});

const x11 = dlopen("libX11.so", {
  XOpenDisplay: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  XCloseDisplay: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  XDefaultScreen: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  XCreatePixmap: {
    args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32],
    returns: FFIType.u64,
  },
  XFreePixmap: {
    args: [FFIType.ptr, FFIType.u64],
    returns: FFIType.i32,
  },
  XRootWindow: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.u64,
  },
  XDefaultDepth: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
});

// OpenGL constants
const GL_VERSION = 0x1f02;
const GL_NO_ERROR = 0;
const GL_COLOR_BUFFER_BIT = 0x00004000;
const GL_RGB = 0x1907;
const GL_UNSIGNED_BYTE = 0x1401;

// GLX constants - legacy approach
const GLX_RGBA = 4;
const GLX_DEPTH_SIZE = 12;
const GLX_DOUBLEBUFFER = 5;

console.log("Creating off-screen OpenGL context...");

try {
  // Open display
  const display = x11.symbols.XOpenDisplay(null);
  if (!display) {
    throw new Error("Failed to open X11 display");
  }
  console.log("X11 display opened");

  const screen = x11.symbols.XDefaultScreen(display);
  const depth = x11.symbols.XDefaultDepth(display, screen);
  const rootWindow = x11.symbols.XRootWindow(display, screen);

  // Visual attributes for OpenGL
  const visualAttribs = new Int32Array([
    GLX_RGBA,
    GLX_DEPTH_SIZE,
    24,
    0, // null terminator
  ]);

  // Choose visual
  const visual = gl.symbols.glXChooseVisual(
    display,
    screen,
    ptr(visualAttribs)
  );
  if (!visual) {
    throw new Error("Failed to choose GLX visual");
  }
  console.log("GLX visual chosen");

  // Create X11 pixmap (off-screen drawable)
  const width = 800;
  const height = 600;
  const pixmap = x11.symbols.XCreatePixmap(
    display,
    rootWindow,
    width,
    height,
    depth
  );
  if (!pixmap) {
    throw new Error("Failed to create X11 pixmap");
  }
  console.log("X11 pixmap created:", pixmap);

  // Create GLX pixmap from X11 pixmap
  const glxPixmap = gl.symbols.glXCreateGLXPixmap(display, visual, pixmap);
  if (!glxPixmap) {
    throw new Error("Failed to create GLX pixmap");
  }
  console.log("GLX pixmap created:", glxPixmap);

  // Create OpenGL context
  const context = gl.symbols.glXCreateContext(display, visual, null, true);
  if (!context) {
    throw new Error("Failed to create GLX context");
  }
  console.log("GLX context created");

  // Make context current with GLX pixmap
  const success = gl.symbols.glXMakeCurrent(display, glxPixmap, context);
  if (!success) {
    throw new Error("Failed to make GLX context current");
  }
  console.log("GLX context made current with pixmap");

  // Test basic OpenGL functionality
  const version = gl.symbols.glGetString(GL_VERSION);
  if (version) {
    const versionStr = new CString(version);
    console.log("OpenGL Version:", versionStr);
  }

  // Now you can render off-screen!
  gl.symbols.glViewport(0, 0, width, height);
  gl.symbols.glClearColor(1.0, 0.0, 0.0, 1.0); // Red background
  gl.symbols.glClear(GL_COLOR_BUFFER_BIT);

  // Read pixels back
  const pixelData = new Uint8Array(width * height * 3); // RGB
  gl.symbols.glReadPixels(
    0,
    0,
    width,
    height,
    GL_RGB,
    GL_UNSIGNED_BYTE,
    ptr(pixelData)
  );

  const error = gl.symbols.glGetError();
  console.log(
    "GL Error after rendering:",
    error === GL_NO_ERROR ? "OK" : `Error: ${error}`
  );

  // Check some pixel values (should be red)
  console.log("First pixel RGB:", pixelData[0], pixelData[1], pixelData[2]);
  console.log(
    "Last pixel RGB:",
    pixelData[pixelData.length - 3],
    pixelData[pixelData.length - 2],
    pixelData[pixelData.length - 1]
  );
  console.log("Pixel data length:", pixelData.length);

  // Create a program to test more functionality
  const program = gl.symbols.glCreateProgram();
  console.log("Created OpenGL program:", program);

  // Cleanup
  gl.symbols.glXDestroyGLXPixmap(display, glxPixmap);
  x11.symbols.XFreePixmap(display, pixmap);
  gl.symbols.glXDestroyContext(display, context);
  x11.symbols.XCloseDisplay(display);
  console.log("Off-screen context cleaned up");
} catch (e) {
  console.error("Off-screen OpenGL failed:", e);
}
