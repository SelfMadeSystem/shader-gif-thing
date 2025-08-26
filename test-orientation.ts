#!/usr/bin/env bun

import { initHeadlessGL, readPixels } from "./headless-gl.js";
import { compileShader } from "./utils.js";
import sharp from "sharp";

function testOrientation() {
  console.log("Testing image orientation with gradient...");

  const width = 375;
  const height = 150;

  const gl = initHeadlessGL(width, height);
  if (!gl) {
    throw new Error("Failed to create WebGL context");
  }

  gl.viewport(0, 0, width, height);

  // Vertex shader
  const vertexShaderSource = /* glsl */ `
#version 120
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5; // Convert from [-1,1] to [0,1]
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

  // Fragment shader that creates a clear gradient from top-left (red) to bottom-right (blue)
  const fragmentShaderSource = /* glsl */ `
#version 120
varying vec2 v_uv;
void main() {
  // v_uv.x goes from 0 (left) to 1 (right)  
  // v_uv.y goes from 0 (bottom) to 1 (top) in OpenGL coordinates
  // We want: top-left = red, top-right = yellow, bottom-left = black, bottom-right = blue
  float red = v_uv.y; // More red at top
  float green = v_uv.x * v_uv.y; // Yellow in top-right corner
  float blue = v_uv.x * (1.0 - v_uv.y); // Blue in bottom-right corner
  gl_FragColor = vec4(red, green, blue, 1.0);
}
`;

  try {
    const vertexShader = compileShader(
      gl,
      vertexShaderSource,
      gl.VERTEX_SHADER
    );
    const fragmentShader = compileShader(
      gl,
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `Failed to link program: ${gl.getProgramInfoLog(program)}`
      );
    }

    // Create fullscreen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");

    // Clear and render
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.flush();
    gl.finish();

    // Read pixels
    const pixels = readPixels(width, height);

    console.log(
      `Top-left pixel (should be red): ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
    );
    console.log(
      `Top-right pixel (should be yellow): ${pixels[(width - 1) * 4]}, ${
        pixels[(width - 1) * 4 + 1]
      }, ${pixels[(width - 1) * 4 + 2]}, ${pixels[(width - 1) * 4 + 3]}`
    );
    console.log(
      `Bottom-left pixel (should be black): ${
        pixels[(height - 1) * width * 4]
      }, ${pixels[(height - 1) * width * 4 + 1]}, ${
        pixels[(height - 1) * width * 4 + 2]
      }, ${pixels[(height - 1) * width * 4 + 3]}`
    );
    console.log(
      `Bottom-right pixel (should be blue): ${
        pixels[((height - 1) * width + (width - 1)) * 4]
      }, ${pixels[((height - 1) * width + (width - 1)) * 4 + 1]}, ${
        pixels[((height - 1) * width + (width - 1)) * 4 + 2]
      }, ${pixels[((height - 1) * width + (width - 1)) * 4 + 3]}`
    );

    // Test both with and without flipping
    console.log("\\nSaving with NO flipping (direct OpenGL coordinates):");
    const buffer1 = Buffer.from(pixels);
    sharp(buffer1, {
      raw: { width: width, height: height, channels: 4 },
    })
      .png()
      .toFile("output/test_orientation_no_flip.png")
      .then(() => console.log("Saved test_orientation_no_flip.png"))
      .catch((err) => console.error("Error:", err));

    console.log("Saving WITH vertical flipping (image coordinates):");
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

    const buffer2 = Buffer.from(flippedPixels);
    sharp(buffer2, {
      raw: { width: width, height: height, channels: 4 },
    })
      .png()
      .toFile("output/test_orientation_flipped.png")
      .then(() => console.log("Saved test_orientation_flipped.png"))
      .catch((err) => console.error("Error:", err));
  } catch (error) {
    console.error("Test failed:", error);
  }

  console.log(
    "Orientation test completed - compare the two output files to see which is correct"
  );
}

testOrientation();
