#!/usr/bin/env bun

import { initHeadlessGL, readPixels } from "./headless-gl.js";
import { compileShader } from "./utils.js";
import sharp from "sharp";

function testMinimalShader() {
  console.log("Testing minimal shader without any uniforms...");

  const width = 375;
  const height = 150;

  const gl = initHeadlessGL(width, height);
  if (!gl) {
    throw new Error("Failed to create WebGL context");
  }

  gl.viewport(0, 0, width, height);

  // Super simple vertex shader with attributes
  const vertexShaderSource = /* glsl */ `
#version 120
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

  // Simple fragment shader
  const fragmentShaderSource = /* glsl */ `
#version 120
void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // Green
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

    console.log("Shaders compiled and linked successfully");

    // Create a simple vertex buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -3,
        -1, // Bottom left (large triangle)
        1,
        -1, // Bottom right
        1,
        3, // Top right
      ]),
      gl.STATIC_DRAW
    );

    // Get and set up the position attribute
    const positionLocation = gl.getAttribLocation(program, "a_position");
    console.log("Position attribute location:", positionLocation);

    // Clear and render
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Set up vertex attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw 3 vertices to make a triangle
    console.log("About to draw triangle...");
    let error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`OpenGL error before drawing: 0x${error.toString(16)}`);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`OpenGL error after drawing: 0x${error.toString(16)}`);
    }

    console.log("Triangle drawn, flushing...");
    gl.flush();
    gl.finish();

    error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`OpenGL error after flush/finish: 0x${error.toString(16)}`);
    }

    console.log("Reading pixels...");
    // Read pixels using the raw readPixels function like test-egl.ts does
    const pixels = readPixels(width, height);

    console.log(
      `First pixel RGBA: ${pixels[0]}, ${pixels[1]}, ${pixels[2]}, ${pixels[3]}`
    );
    console.log(
      `Middle pixel RGBA: ${
        pixels[(width * Math.floor(height / 2) + Math.floor(width / 2)) * 4]
      }, ${
        pixels[(width * Math.floor(height / 2) + Math.floor(width / 2)) * 4 + 1]
      }, ${
        pixels[(width * Math.floor(height / 2) + Math.floor(width / 2)) * 4 + 2]
      }, ${
        pixels[(width * Math.floor(height / 2) + Math.floor(width / 2)) * 4 + 3]
      }`
    );

    // Save image
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

    const buffer = Buffer.from(flippedPixels);
    sharp(buffer, {
      raw: {
        width: width,
        height: height,
        channels: 4,
      },
    })
      .png()
      .toFile("output/test_minimal_shader.png")
      .then(() => {
        console.log("Saved test_minimal_shader.png");
      })
      .catch((err) => {
        console.error("Error saving image:", err);
      });
  } catch (error) {
    console.error("Shader compilation failed:", error);
  }

  console.log("Minimal shader test completed");
}

testMinimalShader();
