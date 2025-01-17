import { config } from "dotenv";

config();

const discordToken = process.env.DISCORD_TOKEN;

export function getUserLevel(xp: number) {
  let level = 0;
  let totalXp = 0;
  const additions = [35, 20];

  while (totalXp <= xp) {
    let addition: number;
    if (level < additions.length) {
      addition = additions[level];
    } else {
      addition =
        additions[additions.length - 1] + 40 * (level - additions.length + 1);
    }

    totalXp += addition;
    if (totalXp > xp) {
      totalXp -= addition;
      break;
    }
    level++;
  }

  const currentLevelXp = totalXp;
  const nextLevelXp =
    totalXp +
    (level < additions.length
      ? additions[level]
      : additions[additions.length - 1] + 40 * (level - additions.length + 1));
  const percentToNextLevel =
    ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    percentToNextLevel,
  };
}

const defaultAccountInfo = {
  avatar:
    "https://cdn.discordapp.com/avatars/299298175825739776/568dd2233779e3c2a037ac3186116739.webp",
  username: "SelfMadeSystem",
};

export async function fetchAccountInfo(userId: string): Promise<{
  avatar: string;
  username: string;
}> {
  if (userId.length !== 18 || !/^\d+$/.test(userId)) {
    return defaultAccountInfo;
  }

  if (!discordToken) {
    process.emitWarning("DISCORD_TOKEN is not set");
    return defaultAccountInfo;
  }

  const response = await fetch(`https://discord.com/api/v9/users/${userId}`, {
    headers: {
      Authorization: `Bot ${discordToken}`,
    },
  });

  if (!response.ok) {
    process.emitWarning(
      `Failed to fetch account info for user ${userId}: ${response.status}`
    );
    return defaultAccountInfo;
  }

  const data = await response.json();

  return {
    avatar: `https://cdn.discordapp.com/avatars/${userId}/${data.avatar}.webp`,
    username: data.global_name,
  };
}
