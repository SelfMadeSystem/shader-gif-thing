const addon = require("./build/Release/cgif_addon");
const fs = require("fs");
const { PNG } = require("pngjs");

const start = process.hrtime();

const width = 256;
const height = 256;
const delay = 10;
const numFrames = 12;
const frames = [];

const hsvToRgb = (h, s, v) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r, g, b;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return [r + m, g + m, b + m];
};

for (let i = 0; i < numFrames; i++) {
  const frame = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const hue = (i * 360 + y) / numFrames;
      const [r, g, b] = hsvToRgb(hue, x / width, (y + x) / (width + height));
      frame[index] = Math.round(r * 255);
      frame[index + 1] = Math.round(g * 255);
      frame[index + 2] = Math.round(b * 255);
      frame[index + 3] = 255;
    }
  }
  frames.push(frame);
  // Save each frame as a PNG file
  const png = new PNG({ width, height });
  frame.copy(png.data);
  const frameNumber = i.toString().padStart(3, "0");
  png.pack().pipe(fs.createWriteStream(`output/frame_${frameNumber}.png`));
}

addon.createGif("output/output.gif", frames, width, height, delay);

const end = process.hrtime(start);
console.log(`Execution time: ${end[0]}s ${end[1] / 1e6}ms`);
