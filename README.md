# 🚀 NexusAI

> **The ultimate bridge for AI Skills (Rules & MCP) across Cursor, Trae, and Claude.**
>
> Initiated by **XP-Xiao**, NexusAI aims to break the configuration silos between AI editors by enabling "one-click packaging, cross-machine sync, and plug-and-play" AI skills.

---

![Status](https://img.shields.io/badge/Status-Active_Development-orange)
![License](https://img.shields.io/badge/License-MIT-green)
![Tech](https://img.shields.io/badge/Tech-Tauri_2.0_%2B_Rust_%2B_React-blue)

## 💡 The Vision

In the era of AI-native coding, we create massive **Cursor Rules (.cursorrules)** and use various **MCP Servers** (Google Search, Database Query, etc.). 
However, developers face three major pain points:
1. **Migration Barrier**: Syncing MCP configurations and Rules across different machines is a manual nightmare.
2. **Editor Isolation**: Configurations in Cursor are not easily portable to ByteDance's Trae or Claude Desktop.
3. **Sharing Complexity**: Sharing a powerful AI workflow with teammates involves sending scattered JSON files and manual setups.

**NexusAI is built to solve these problems once and for all.**

---

## ✨ Core Features (Roadmap)

### 1. 📂 Asset Scanner
- Automatically detect installed AI editors (Cursor, Trae, Claude Desktop).
- Real-time parsing of editor-specific configurations (e.g., `mcp.json`).

### 2. 📦 .aiskill Protocol
- Define a standardized `.aiskill` manifest to encapsulate `Rules (Prompts)`, `MCP Servers (Binaries/Configs)`, and `Environment Templates`.
- Export everything into a single, portable file.

### 3. 🚀 One-Click Injector
- Cross-editor injection: Sync your Cursor MCP tools to Trae with one click.
- Smart Env-Var prompt: Automatically remind users to fill in missing API keys during import.

### 4. 🌐 Gist Sync
- Built-in support for backing up skill packages to GitHub Gist for seamless multi-device synchronization.

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + shadcn/ui (For a sleek, minimalist dashboard).
- **Backend**: Rust + Tauri 2.0 (For cross-platform file I/O, path detection, and high-performance injection).
- **Protocol**: JSON-based `.aiskill` specification.

---

## 📅 Roadmap

- [ ] **Phase 1**: Environment Scanner - Automate local path detection.
- [ ] **Phase 2**: Protocol Definition - Standardize the `.aiskill` data structure.
- [ ] **Phase 3**: Export Module - Pack local configs into portable assets.
- [ ] **Phase 4**: Injection Engine - Implement safe config writing across editors.

---

## 🤝 Contribution

This is an open-source project maintained by **XP-Xiao**. If you have ideas or find bugs, feel free to open an Issue or submit a Pull Request!

---

© 2026 XP-Xiao. Licensed under the [MIT License](./LICENSE).
