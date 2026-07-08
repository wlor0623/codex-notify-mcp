#!/usr/bin/env node
import { loadDotEnv } from "./env.mjs";
import { sendWeComNotification } from "./wecom.mjs";

loadDotEnv();

const serverInfo = {
  name: "codex-notify-mcp",
  version: "0.1.0"
};

let buffer = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;

  while (true) {
    const newlineIndex = buffer.indexOf("\n");
    if (newlineIndex === -1) {
      break;
    }

    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (!line) {
      continue;
    }

    handleLine(line).catch((error) => {
      writeLog(error instanceof Error ? error.stack || error.message : String(error));
    });
  }
});

async function handleLine(line) {
  let message;
  try {
    message = JSON.parse(line);
  } catch (error) {
    writeLog(`Ignoring invalid JSON-RPC message: ${error.message}`);
    return;
  }

  if (message.id === undefined) {
    return;
  }

  try {
    const result = await dispatch(message.method, message.params);
    send({
      jsonrpc: "2.0",
      id: message.id,
      result
    });
  } catch (error) {
    send({
      jsonrpc: "2.0",
      id: message.id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

async function dispatch(method, params = {}) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: params.protocolVersion || "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo
      };

    case "tools/list":
      return {
        tools: [
          {
            name: "notify_wecom",
            description: "Send a Codex task notification to a WeCom group robot webhook.",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Notification title."
                },
                status: {
                  type: "string",
                  description: "Task status, for example done, failed, or needs attention."
                },
                task: {
                  type: "string",
                  description: "Short task name."
                },
                summary: {
                  type: "string",
                  description: "Human-readable completion summary."
                },
                repo: {
                  type: "string",
                  description: "Repository or project name."
                },
                cwd: {
                  type: "string",
                  description: "Working directory."
                }
              },
              additionalProperties: false
            }
          }
        ]
      };

    case "tools/call":
      return callTool(params);

    case "ping":
      return {};

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

async function callTool(params = {}) {
  if (params.name !== "notify_wecom") {
    throw new Error(`Unknown tool: ${params.name}`);
  }

  const result = await sendWeComNotification(params.arguments || {});

  return {
    content: [
      {
        type: "text",
        text: `WeCom notification sent: ${result.message.split("\n")[0]}`
      }
    ]
  };
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function writeLog(message) {
  process.stderr.write(`[codex-notify-mcp] ${message}\n`);
}
