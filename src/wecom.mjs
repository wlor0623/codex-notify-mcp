import { getRequiredEnv } from "./env.mjs";

const MAX_TEXT_LENGTH = 1800;

export async function sendWeComNotification(input = {}) {
  const webhookUrl = getRequiredEnv("WECOM_WEBHOOK_URL");
  const message = buildMessage(input);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      msgtype: "text",
      text: {
        content: message
      }
    })
  });

  const body = await response.text();
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    payload = { raw: body };
  }

  if (!response.ok || payload.errcode !== 0) {
    const detail = payload.errmsg || payload.raw || response.statusText;
    throw new Error(`WeCom webhook failed: ${response.status} ${detail}`);
  }

  return {
    ok: true,
    message,
    response: payload
  };
}

export function buildMessage(input = {}) {
  const title =
    clean(input.title) ||
    clean(process.env.CODEX_NOTIFY_DEFAULT_TITLE) ||
    "Codex 任务完成";
  const status = clean(input.status);
  const task = clean(input.task);
  const summary = clean(input.summary || input.content);
  const repo = clean(input.repo || process.env.CODEX_NOTIFY_REPO);
  const cwd = clean(input.cwd || process.env.CODEX_NOTIFY_CWD || process.cwd());
  const timestamp =
    clean(input.timestamp) ||
    new Date().toLocaleString("zh-CN", {
      hour12: false,
      timeZone: process.env.TZ || "Asia/Shanghai"
    });

  const lines = [
    title,
    status ? `状态：${status}` : "",
    task ? `任务：${task}` : "",
    summary ? `摘要：${summary}` : "",
    repo ? `仓库：${repo}` : "",
    cwd ? `路径：${cwd}` : "",
    `时间：${timestamp}`
  ].filter(Boolean);

  const message = lines.join("\n");
  if (message.length <= MAX_TEXT_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_TEXT_LENGTH - 20)}\n...(已截断)`;
}

function clean(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}
