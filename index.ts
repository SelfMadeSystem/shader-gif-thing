import { renderStatic } from "./static.ts";
import { renderGl, setupGl } from "./shader.ts";
import { PlacementOptions, UserOptions } from "./options.ts";
import { bufferFromUrl, encodeFramesToGif } from "./utils.ts";
// import { loadImage } from "skia-canvas";
import { loadImage } from "canvas";
import { Vibrant } from "node-vibrant/node";
import { start, stop, report } from "./bench.ts";
import * as readline from "readline";
import { fetchAccountInfo, getUserLevel } from "./discordUtils.ts";

const discordToken = process.env.DISCORD_TOKEN;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = async (
  question: string,
  defaultValue: string
): Promise<string> => {
  let q;

  if (defaultValue.length > 28) {
    q = `${question} (${defaultValue.slice(0, 25)}...): `;
  } else if (defaultValue.length > 0) {
    q = `${question} (${defaultValue}): `;
  } else {
    q = `${question}: `;
  }

  return new Promise((resolve) =>
    rl.question(q, (answer) => {
      resolve(answer || defaultValue);
    })
  );
};

const placementOptions = new PlacementOptions();

start("setupGl");
const glOptions = setupGl(placementOptions);
stop("setupGl");

async function main() {
  // Wait for deprecation warnings to pass...
  await new Promise((resolve) => setTimeout(resolve, 300));
  for (let i = 0; i < 50; i++) {
    const accId = discordToken
      ? await askQuestion("Enter accound ID", "optional")
      : "";

    const accInfo = await fetchAccountInfo(accId);

    const avatarPath = await askQuestion("Enter avatar URL", accInfo.avatar);
    const name = await askQuestion("Enter name", accInfo.username);
    const points = parseInt(await askQuestion("Enter points", "1612"), 10);
    const userLevel = getUserLevel(points);
    const pointsPrevLevel = parseInt(
      await askQuestion(
        "Enter pointsPrevLevel",
        userLevel.currentLevelXp.toString()
      ),
      10
    );
    const pointsToNextLevel = parseInt(
      await askQuestion(
        "Enter pointsToNextLevel",
        userLevel.nextLevelXp.toString()
      ),
      10
    );
    const level = parseInt(
      await askQuestion("Enter level", userLevel.level.toString()),
      10
    );
    const rank = parseInt(await askQuestion("Enter rank", "1"), 10);

    start("render");

    start("avatar");
    start("bufferFromUrl");
    const avatarBuffer = await bufferFromUrl(avatarPath);
    stop("bufferFromUrl");
    start("loadImage");
    const avatar = await loadImage(avatarBuffer);
    stop("loadImage");
    start("Vibrant");
    const palette = await Vibrant.from(avatarBuffer).getPalette();
    stop("Vibrant");
    stop("avatar");

    const userOptions = new UserOptions(
      avatar,
      name,
      points,
      pointsPrevLevel,
      pointsToNextLevel,
      level,
      rank,
      palette
    );

    start("renderStatic");
    const [ctx, stencilCtx] = renderStatic(userOptions, placementOptions);
    stop("renderStatic");

    glOptions.ctx = ctx;
    glOptions.stencilCtx = stencilCtx;

    start("renderGl");
    const stuff: Uint8Array[] = renderGl(
      placementOptions,
      userOptions,
      glOptions
    );
    stop("renderGl");

    start("encodeFramesToGif");
    await encodeFramesToGif(
      stuff,
      placementOptions.fps,
      placementOptions.width,
      placementOptions.height,
      `output/${name}.gif`
    );
    stop("encodeFramesToGif");

    stop("render");

    const exitAnswer = await askQuestion(
      "Type 'quit' or 'exit' to exit and report, or press Enter to continue",
      ""
    );
    if (exitAnswer === "quit" || exitAnswer === "exit") {
      break;
    }
  }
  report();
  rl.close();
}

main();
