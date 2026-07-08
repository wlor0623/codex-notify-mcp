# AGENTS.md instructions

- 禁止使用 Playwright，而是引导用户手动查看页面排版效果。
- 每次回复用户前，先称呼“老大”。
- 每次任务完成并准备回复用户前，调用 `wecom-notify` MCP 的 `notify_wecom` 工具发送企业微信通知。
- 通知内容应包含任务状态、简短摘要、仓库名和当前路径。
