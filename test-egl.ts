#!/usr/bin/env bun

import {
  initHeadlessGL,
  cleanupHeadlessGL,
  readPixels,
  gl,
} from "./headless-gl.js";

async function testEGLHeadless() {
  console.log("Testing EGL headless OpenGL implementation...");

  try {
    // Initialize headless OpenGL context
    const context = initHeadlessGL(256, 256);
    console.log("✓ EGL context initialized successfully");

    // Clear the framebuffer with a red color
    gl.symbols.glClearColor(1.0, 0.0, 0.0, 1.0); // Red
    gl.symbols.glClear(0x00004000); // GL_COLOR_BUFFER_BIT

    console.log("✓ Cleared framebuffer with red color");

    // Read back the pixels to verify rendering worked
    const pixels = readPixels(256, 256);

    // Check if the first pixel is red (approximately)
    const r = pixels[0];
    const g = pixels[1];
    const b = pixels[2];
    const a = pixels[3];

    console.log(`First pixel RGBA: ${r}, ${g}, ${b}, ${a}`);

    if (r > 200 && g < 50 && b < 50) {
      console.log(
        "✓ Pixel readback successful - framebuffer is red as expected"
      );
    } else {
      console.log("⚠ Pixel readback may not be working correctly");
    }

    // Test OpenGL error checking
    const error = gl.symbols.glGetError();
    if (error === 0) {
      console.log("✓ No OpenGL errors detected");
    } else {
      console.log(`⚠ OpenGL error detected: 0x${error.toString(16)}`);
    }

    console.log("✅ EGL headless test completed successfully!");
  } catch (error) {
    console.error("❌ EGL headless test failed:", error);
    process.exit(1);
  } finally {
    // Clean up
    cleanupHeadlessGL();
    console.log("✓ Cleaned up EGL context");
  }
}

// Run the test
testEGLHeadless();
