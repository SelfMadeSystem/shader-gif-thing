import type { Palette } from "@vibrant/color";
import type { Canvas, Image } from "skia-canvas";

export class PlacementOptions {
  public width = 375;
  public height = 150;
  public avatarSize = 100;
  public boxMargin = 10;
  public boxRadius = 20;
  public textMargin = 20;
  public sliderHeight = 20;

  get placement() {
    return (this.height - this.avatarSize) / 2;
  }

  get sliderLeft() {
    return this.placement + this.avatarSize;
  }

  get sliderRight() {
    return this.width - this.boxMargin * 2;
  }

  get sliderWidth() {
    return this.sliderRight - this.sliderLeft;
  }

  get sliderBottom() {
    return this.height - this.placement;
  }

  get sliderTop() {
    return this.sliderBottom - this.sliderHeight;
  }
}

export class GlOptions {
  public fps = 30;
  public duration = 4;
  public canvas: Canvas;
  public stencilCanvas: Canvas;

  constructor(canvas: Canvas, stencilCanvas: Canvas) {
    this.canvas = canvas;
    this.stencilCanvas = stencilCanvas;
  }

  get frames() {
    return this.fps * this.duration;
  }
}

export class UserOptions {
  public avatar: Image;
  public username: string;
  public points: number;
  public pointsPrevLevel: number;
  public pointsToNextLevel: number;
  public level: number;
  public rank: number;
  public palette: Palette;

  constructor(
    avatar: Image,
    username: string,
    points: number,
    pointsPrevLevel: number,
    pointsToNextLevel: number,
    level: number,
    rank: number,
    palette: Palette
  ) {
    this.avatar = avatar;
    this.username = username;
    this.points = points;
    this.pointsPrevLevel = pointsPrevLevel;
    this.pointsToNextLevel = pointsToNextLevel;
    this.level = level;
    this.rank = rank;
    this.palette = palette;
  }

  get sliderValue() {
    return (
      (this.points - this.pointsPrevLevel) /
      (this.pointsToNextLevel - this.pointsPrevLevel)
    );
  }
}
