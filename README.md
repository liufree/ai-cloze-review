# AI Cloze Review (AI 挖空复习)

AI-powered cloze deletion review for Obsidian. Generate fill-in-the-blank content with AI and review interactively.

## Features

- **AI 生成挖空** — One-click AI analysis of your notes, automatically identifying key content and generating cloze deletions
- **即时复习模式** — Hide cloze answers, click to reveal, track progress (revealed/total)
- **不修改原文** — All cloze content is cached in memory, your original notes remain untouched
- **自适应密度** — Cloze density automatically adjusts based on note length and difficulty (easy/medium/hard/extreme)
- **底部工具栏** — Quick action buttons: AI generate, toggle review, reveal/reset, exit review
- **Readable Line Length 适配** — Respects Obsidian's readable line length setting
- **移动端适配** — Optimized for mobile with compact button layout and reduced placeholder size
- **多 API 支持** — Works with OpenAI, DeepSeek, Zhipu, Moonshot, Ollama, and any OpenAI-compatible API

## Usage

1. **Configure API** in settings (endpoint, key, model)
2. Click **AI 挖空** to generate cloze deletions for the current note
3. AI automatically enters review mode, hiding answers as blanks
4. **Click** any blank to reveal the answer
5. Use **显示答案** to reveal all, **重置** to hide all again
6. Click **退出复习** to restore the original note view

## 挖空语法 (Cloze Syntax)

```
{{c1::关键内容}}          — Basic cloze
{{c1::答案::提示}}         — Cloze with hint
```

In review mode, cloze answers are hidden as `［ ］` placeholders. Click to reveal.

## Installation

### From Obsidian Community Plugins (coming soon)

1. Open Settings → Community Plugins
2. Browse and install "AI Cloze Review"
3. Configure API settings

### Manual Installation

1. Download `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/liufree/ai-cloze-review/releases)
2. Place them in `{your-vault}/.obsidian/plugins/ai-cloze-review/`
3. Enable the plugin in Settings → Community Plugins
4. Configure API settings in the plugin settings

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| API 端点 | OpenAI-compatible API URL | `https://api.openai.com/v1/chat/completions` |
| API Key | Your API key | — |
| 模型 | Model name | `gpt-4o-mini` |
| 温度 | Generation temperature (0-1) | `0.3` |
| 难度 | Cloze density: easy / medium / hard / extreme | `medium` |
| 自动进入复习 | Auto-enter review after AI generation | `true` |
| 自定义提示词 | Custom AI prompt | Default prompt |

## Difficulty & Density

Cloze count automatically adapts to your note content length:

| Difficulty | Density | 3000 chars example |
|------------|---------|-------------------|
| 简单 (Easy) | 250 chars/cloze | ~12 clozes |
| 中等 (Medium) | 120 chars/cloze | ~25 clozes |
| 困难 (Hard) | 60 chars/cloze | ~50 clozes |
| 超密集 (Extreme) | 30 chars/cloze | ~100 clozes |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Dev with watch mode
npm run dev
```

## License

MIT
