#!/usr/bin/env bun

import { initHeadlessGL, gl } from "./headless-gl.js";
import sharp from "sharp";

function testDirectGL() {
  console.log("Testing direct OpenGL calls...");

  const width = 375;
  const height = 150;

  const context = initHeadlessGL(width, height);
  if (!context) {
    throw new Error("Failed to create WebGL context");
  }

  console.log("Setting up OpenGL state...");

  // Set viewport
  gl.symbols.glViewport(0, 0, width, height);

  // Clear with red
  gl.symbols.glClearColor(1.0, 0.0, 0.0, 1.0);
  gl.symbols.glClear(0x00004000); // GL_COLOR_BUFFER_BIT

  // Read pixels
  const pixels = new Uint8Array(width * height * 4);
  gl.symbols.glReadPixels(
    0,
    0,
    width,
    height,
    0x1908,
    0x1401,
    Buffer.from(pixels)
  );

  console.log(
    `First pixel RGBA: ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
  );
  console.log(
    `Last pixel RGBA: ${pixels[(width * height - 1) * 4]}, ${
      pixels[(width * height - 1) * 4 + 1]
    }, ${pixels[(width * height - 1) * 4 + 2]}, ${
      pixels[(width * height - 1) * 4 + 3]
    }`
  );

  // Flip vertically
  const flippedPixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcOffset = ((height - 1 - y) * width + x) * 4;
      const dstOffset = (y * width + x) * 4;
      flippedPixels[dstOffset] = pixels[srcOffset];
      flippedPixels[dstOffset + 1] = pixels[srcOffset + 1];
      flippedPixels[dstOffset + 2] = pixels[srcOffset + 2];
      flippedPixels[dstOffset + 3] = pixels[srcOffset + 3];
    }
  }

  // Save as PNG
  const buffer = Buffer.from(flippedPixels);
  sharp(buffer, {
    raw: {
      width: width,
      height: height,
      channels: 4,
    },
  })
    .png()
    .toFile("output/test_direct_gl.png")
    .then(() => {
      console.log("Saved test_direct_gl.png");
    })
    .catch((err) => {
      console.error("Error saving image:", err);
    });

  console.log("Direct OpenGL test completed");
}

testDirectGL();
