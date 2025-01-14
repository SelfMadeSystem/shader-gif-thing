import { renderStatic } from "./static.ts";
import { renderGl, setupGl } from "./shader.ts";
import { PlacementOptions, UserOptions } from "./options.ts";
import { bufferFromUrl, encodeFramesToGif } from "./utils.ts";
// import { loadImage } from "skia-canvas";
import { loadImage } from "canvas";
import { Vibrant } from "node-vibrant/node";
import { start, stop, report } from "./bench.ts";

start("total");

start("avatar");
const avatarPath =
  "https://cdn.discordapp.com/avatars/299298175825739776/568dd2233779e3c2a037ac3186116739.webp";
const avatarBuffer = await bufferFromUrl(avatarPath);
const avatar = await loadImage(avatarBuffer);
const palette = await Vibrant.from(avatarBuffer).getPalette();
stop("avatar");

const userOptions = new UserOptions(
  avatar,
  "SelfMadeSystem",
  1354,
  1200,
  1600,
  19,
  1,
  palette
);

const placementOptions = new PlacementOptions();

start("renderStatic");
const [ctx, stencilCtx] = renderStatic(userOptions, placementOptions);
stop("renderStatic");

start("setupGl");
const glOptions = setupGl(placementOptions);
glOptions.ctx = ctx;
glOptions.stencilCtx = stencilCtx;
stop("setupGl");

start("renderGl");
const stuff: Uint8Array[] = renderGl(placementOptions, userOptions, glOptions);
stop("renderGl");

start("encodeFramesToGif");
await encodeFramesToGif(
  stuff,
  placementOptions.fps,
  placementOptions.width,
  placementOptions.height,
  "output/output.gif"
);
stop("encodeFramesToGif");

stop("total");

report();
