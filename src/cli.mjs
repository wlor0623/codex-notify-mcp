#!/usr/bin/env node
import { loadDotEnv } from "./env.mjs";
import { sendWeComNotification } from "./wecom.mjs";

loadDotEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  const result = await sendWeComNotification({
    title: args.title,
    status: args.status,
    task: args.task,
    summary: args.summary || args._.join(" "),
    repo: args.repo,
    cwd: args.cwd
  });

  console.log(`Notification sent: ${result.message.split("\n")[0]}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        parsed[key] = next;
        index += 1;
      } else {
        parsed[key] = true;
      }
      continue;
    }

    parsed._.push(arg);
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: codex-notify-wecom [message] [options]

Options:
  --title <text>    Message title
  --status <text>   Task status, for example done or failed
  --task <text>     Task name
  --summary <text>  Task summary
  --repo <text>     Repository name
  --cwd <path>      Working directory
  -h, --help        Show this help

Environment:
  WECOM_WEBHOOK_URL is required. A local .env file is also supported.`);
}
