import type { Palette } from "@vibrant/color";
import type { SKRSContext2D, Image } from "@napi-rs/canvas";

export class PlacementOptions {
  public fps = 30;
  public duration = 4;
  public width = 375;
  public height = 150;
  public avatarSize = 100;
  public boxMargin = 10;
  public boxRadius = 20;
  public textMargin = 20;
  public sliderHeight = 20;

  get frames() {
    return this.fps * this.duration;
  }

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
  public ctx: SKRSContext2D | undefined;
  public stencilCtx: SKRSContext2D | undefined;
  public bgProgram: number;
  public sliderProgram: number;
  public simpleProgram: number;
  public sliderStencilLocation: number;
  public bgFrameLocation: number;
  public sliderFrameLocation: number;
  public bgColorLocation: number;
  public bgPositionLocation: number;
  public sliderPositionLocation: number;
  public simplePositionLocation: number;
  public positionBuffer: number;

  constructor(
    bgProgram: number,
    sliderProgram: number,
    simpleProgram: number,
    sliderStencilLocation: number,
    bgFrameLocation: number,
    sliderFrameLocation: number,
    bgColorLocation: number,
    bgPositionLocation: number,
    sliderPositionLocation: number,
    simplePositionLocation: number,
    positionBuffer: number
  ) {
    this.bgProgram = bgProgram;
    this.sliderProgram = sliderProgram;
    this.simpleProgram = simpleProgram;
    this.sliderStencilLocation = sliderStencilLocation;
    this.bgFrameLocation = bgFrameLocation;
    this.sliderFrameLocation = sliderFrameLocation;
    this.bgColorLocation = bgColorLocation;
    this.bgPositionLocation = bgPositionLocation;
    this.sliderPositionLocation = sliderPositionLocation;
    this.simplePositionLocation = simplePositionLocation;
    this.positionBuffer = positionBuffer;
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
