#!/usr/bin/env bun

// Test setupGl function specifically
import { setupGl } from "./shader.js";
import { PlacementOptions } from "./options.js";

console.log("Testing setupGl function...");

try {
  const placementOptions = new PlacementOptions();
  placementOptions.width = 256;
  placementOptions.height = 256;

  const glOptions = setupGl(placementOptions);
  console.log("✅ setupGl completed successfully!");
  console.log("- bgProgram:", glOptions.bgProgram);
  console.log("- sliderProgram:", glOptions.sliderProgram);
  console.log("- simpleProgram:", glOptions.simpleProgram);
  console.log("- positionBuffer:", glOptions.positionBuffer);
} catch (error) {
  console.error("❌ setupGl failed:", error);
  process.exit(1);
}
