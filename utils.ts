import sharp from "sharp";
import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";

export async function bufferFromUrl(url: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pngBuffer = await sharp(buffer).png().toBuffer();

  return pngBuffer;
}

export function compileShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to create shader");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Failed to compile shader: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

export function encodeFramesToGif(
  frames: Uint8Array[],
  fps: number,
  width: number,
  height: number,
  outputFile: string
) {
  return new Promise<void>((resolve, reject) => {
    const ffmpegStream = new PassThrough();
    const command = ffmpeg(ffmpegStream)
      .inputFormat("rawvideo")
      .inputOptions(["-pix_fmt rgba", `-s ${width}x${height}`, `-r ${fps}`])
      .outputOptions([
        "-vf split[x][y];[x]palettegen=max_colors=256:stats_mode=full[p];[y][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle",
        `-s ${width}x${height}`,
        "-q:v 1",
        "-compression_level 10",
      ])
      // .outputOptions(["-vf", `scale=${width}:${height}`, "-pix_fmt", "rgb24"])
      .output(outputFile)
      .on("end", () => {
        console.log("Encoding finished.");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error during encoding:", err);
        reject(err);
      });

    command.run();

    for (const frame of frames) {
      const buffer = Buffer.from(frame);
      ffmpegStream.write(buffer);
    }

    ffmpegStream.end();
  });
}
