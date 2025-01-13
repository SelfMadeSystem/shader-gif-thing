import { exec } from "child_process";
import os from "os";

function getGPUInfoLinux(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec("lspci | grep VGA", (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        const lines = stdout.split("\n");
        const gpus = lines.map((line) => {
          const match = line.match(/VGA compatible controller: (.*)/);
          return match ? match[1] : "";
        });
        resolve(gpus);
      }
    });
  });
}

function getGPUInfoDarwin(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec("system_profiler SPDisplaysDataType", (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        const lines = stdout.split("\n");
        const gpus = [];
        let i = 0;
        while (i < lines.length) {
          const line = lines[i];
          if (line.startsWith("Chipset Model: ")) {
            gpus.push(line.slice("Chipset Model: ".length));
          }
          i++;
        }
        resolve(gpus);
      }
    });
  });
}

function getGPUInfoWindows(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec(
      "wmic path win32_videocontroller get caption",
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          const lines = stdout.split("\n");
          const gpus = lines.map((line) => {
            return line.trim();
          });
          resolve(gpus);
        }
      }
    );
  });
}

export async function getGPUInfo(): Promise<string[]> {
  try {
    let result: string[];
    switch (os.platform()) {
      case "linux":
        result = await getGPUInfoLinux();
        break;
      case "darwin":
        result = await getGPUInfoDarwin();
        break;
      case "win32":
        result = await getGPUInfoWindows();
        break;
      default:
        return [];
    }

    return result.filter((gpu) => gpu.length > 0);
  } catch (e) {
    console.error("Failed to get GPU info:");
    console.error(e);
    return [];
  }
}
