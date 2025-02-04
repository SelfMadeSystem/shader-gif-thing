// import { Canvas, FontLibrary } from "skia-canvas";
import { createCanvas, registerFont } from "canvas";
import { PlacementOptions, UserOptions } from "./options.ts";

// FontLibrary.use("Noto Custom", ["./assets/NotoSans-Custom.ttf"]);
registerFont("./assets/NotoSans-Custom.ttf", { family: "Noto Custom" });

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
  const stencilCanvas = createCanvas(width, height);
  const stencilCtx = stencilCanvas.getContext("2d");
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

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
  ctx.roundRect(sliderLeft, sliderTop, sliderWidth, sliderHeight, sliderHeight / 2);
  stencilCtx.roundRect(sliderLeft, sliderTop, sliderWidth, sliderHeight, sliderHeight / 2);
  ctx.clip();
  stencilCtx.clip();
  ctx.fill();

  ctx.beginPath();
  stencilCtx.beginPath();
  ctx.roundRect(
    sliderLeft - sliderHeight / 2,
    sliderTop,
    sliderWidth * sliderValue + sliderHeight / 2,
    sliderHeight,
    sliderHeight / 2
  );
  stencilCtx.roundRect(
    sliderLeft - sliderHeight / 2,
    sliderTop,
    sliderWidth * sliderValue + sliderHeight / 2,
    sliderHeight,
    sliderHeight / 2
  );
  ctx.clip();
  stencilCtx.clip();
  ctx.fillStyle = "#f0f0";
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

  return [ctx, stencilCtx] as const;
}
