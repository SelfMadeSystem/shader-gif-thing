import { Canvas, FontLibrary, loadImage } from "skia-canvas";
import { PlacementOptions, UserOptions } from "./options.ts";
import { bufferFromUrl } from "./utils.ts";
import { Vibrant } from "node-vibrant/node";

FontLibrary.use("Noto Custom", ["./assets/NotoSans-Custom.ttf"]);

export function renderStatic(
  {
    avatar,
    username,
    points,
    pointsToNextLevel,
    level,
    rank,
    sliderValue,
  }: UserOptions,
  {
    width,
    height,
    avatarSize,
    boxMargin,
    boxRadius,
    textMargin,
    sliderHeight,
    placement,
    sliderLeft,
    sliderRight,
    sliderWidth,
    sliderTop,
  }: PlacementOptions
) {
  const stencilCanvas = new Canvas(width, height);
  const stencilCtx = stencilCanvas.getContext("2d");
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  // Stencil should be black by default
  stencilCtx.fillStyle = "black";
  stencilCtx.fillRect(0, 0, width, height);

  // Draw the box
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.roundRect(
    boxMargin,
    boxMargin,
    width - boxMargin * 2,
    height - boxMargin * 2,
    boxRadius
  );
  ctx.fill();

  // Clip the avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(
    placement + avatarSize / 2,
    placement + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2
  );
  ctx.clip();

  // Draw a blur effect
  ctx.filter = "blur(12px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";

  // Draw the avatar background
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fill();

  // Draw the avatar
  ctx.drawImage(avatar, placement, placement, avatarSize, avatarSize);

  // Restore the clip
  ctx.restore();

  // Draw the slider
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.save();
  stencilCtx.save();
  ctx.beginPath();
  stencilCtx.beginPath();
  ctx.roundRect(sliderLeft, sliderTop, sliderWidth, sliderHeight, sliderHeight);
  stencilCtx.roundRect(sliderLeft, sliderTop, sliderWidth, sliderHeight, sliderHeight);
  ctx.clip();
  stencilCtx.clip();
  ctx.filter = "blur(8px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  ctx.fill();

  ctx.beginPath();
  stencilCtx.beginPath();
  ctx.roundRect(
    sliderLeft - sliderHeight / 2,
    sliderTop,
    sliderWidth * sliderValue + sliderHeight / 2,
    sliderHeight,
    sliderHeight
  );
  stencilCtx.roundRect(
    sliderLeft - sliderHeight / 2,
    sliderTop,
    sliderWidth * sliderValue + sliderHeight / 2,
    sliderHeight,
    sliderHeight
  );
  ctx.clip();
  stencilCtx.clip();
  ctx.fillStyle = "#f0f";
  stencilCtx.fillStyle = "#fff";
  ctx.fill();
  stencilCtx.fill();
  ctx.restore();
  stencilCtx.restore();

  // Write the slider value
  ctx.font = "14px Montserrat";
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText(
    `${points} / ${pointsToNextLevel}`,
    sliderLeft + 8,
    sliderTop - 3
  );

  // Write the level
  ctx.font = "14px Montserrat";
  ctx.textAlign = "right";
  ctx.fillStyle = "white";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`Level ${level}`, sliderRight - 8, sliderTop - 3);

  // Write the rank
  ctx.font = "13px Montserrat";
  ctx.textAlign = "right";
  ctx.fillStyle = "#ddd";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  ctx.fillText(`#${rank}`, sliderRight - 8, sliderTop - 20);

  // Clip the username
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(
    boxMargin,
    boxMargin,
    width - boxMargin * 2,
    height - boxMargin * 2,
    boxRadius
  );
  ctx.clip();

  // Write the username
  ctx.font = "24px 'Noto Custom'";
  ctx.fillStyle = "white";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(username, placement + avatarSize, boxMargin + textMargin);

  // Restore the clip
  ctx.restore();

  return [canvas, stencilCanvas] as const;
}
