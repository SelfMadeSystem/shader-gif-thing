#!/usr/bin/env bun

import { setupGl } from "./shader.js";
import { PlacementOptions } from "./options.js";

async function testNativeShader() {
  console.log("Testing native OpenGL shader implementation...");

  try {
    const options = new PlacementOptions();
    options.width = 256;
    options.height = 256;

    console.log("Setting up OpenGL context and shaders...");
    const glOptions = setupGl(options);

    console.log("✅ Native OpenGL shader setup completed successfully!");
    console.log("GL options:", {
      bgProgram: glOptions.bgProgram,
      sliderProgram: glOptions.sliderProgram,
      simpleProgram: glOptions.simpleProgram,
      bgFrameLocation: glOptions.bgFrameLocation,
      sliderFrameLocation: glOptions.sliderFrameLocation,
      bgColorLocation: glOptions.bgColorLocation,
    });
  } catch (error) {
    console.error("❌ Native OpenGL shader test failed:", error);
    process.exit(1);
  }
}

// Run the test
testNativeShader();
