#!/usr/bin/env bun

import { renderStatic } from "./static.ts";
import { renderGl, setupGl } from "./shader.ts";
import { PlacementOptions, UserOptions } from "./options.ts";
import { bufferFromUrl } from "./utils.ts";
import { loadImage } from "@napi-rs/canvas";
import { Vibrant } from "node-vibrant/node";

async function testMainShader() {
  console.log("Testing main shader pipeline...");

  const placementOptions = new PlacementOptions();

  // Use a small number of frames for testing
  placementOptions.duration = 1; // 1 second
  placementOptions.fps = 2; // 2 fps = 2 frames total

  console.log("Setting up GL...");
  const glOptions = setupGl(placementOptions);

  console.log("Loading test avatar...");
  // Use a simple default avatar URL or create a test image
  const avatarBuffer = await bufferFromUrl(
    "https://cdn.discordapp.com/embed/avatars/0.png"
  );
  const avatar = await loadImage(avatarBuffer);
  const palette = await Vibrant.from(avatarBuffer).getPalette();

  const userOptions = new UserOptions(
    avatar,
    "TestUser",
    1612,
    1315,
    1655,
    9,
    1,
    palette
  );

  console.log("Rendering static content...");
  const [ctx, stencilCtx] = renderStatic(userOptions, placementOptions);

  glOptions.ctx = ctx;
  glOptions.stencilCtx = stencilCtx;

  console.log("Rendering GL frames...");
  const frames = renderGl(placementOptions, userOptions, glOptions);

  console.log(`Generated ${frames.length} frames`);

  // Check a few pixels from the first frame
  const firstFrame = frames[0];
  console.log(
    `First frame - first pixel RGBA: ${firstFrame[0]}, ${firstFrame[1]}, ${firstFrame[2]}, ${firstFrame[3]}`
  );
  console.log(
    `First frame - middle pixel RGBA: ${
      firstFrame[
        (placementOptions.width * Math.floor(placementOptions.height / 2) +
          Math.floor(placementOptions.width / 2)) *
          4
      ]
    }, ${
      firstFrame[
        (placementOptions.width * Math.floor(placementOptions.height / 2) +
          Math.floor(placementOptions.width / 2)) *
          4 +
          1
      ]
    }, ${
      firstFrame[
        (placementOptions.width * Math.floor(placementOptions.height / 2) +
          Math.floor(placementOptions.width / 2)) *
          4 +
          2
      ]
    }, ${
      firstFrame[
        (placementOptions.width * Math.floor(placementOptions.height / 2) +
          Math.floor(placementOptions.width / 2)) *
          4 +
          3
      ]
    }`
  );

  console.log("Main shader test completed");
}

testMainShader().catch(console.error);
