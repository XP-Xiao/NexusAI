import { useState, useCallback, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileJson,
  Terminal,
  ScanLine,
  Zap,
  Server,
  Eye,
  EyeOff,
  ChevronRight,
  Wrench,
  BookOpen,
  Cpu,
  Layers,
  Activity,
  X,
  Info,
  Command,
  FileCode,
  Settings,
  Plus,
  Trash2,
  Pencil,
  Package,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ScanResult, EditorConfig, EditorDefinition, PluginAsset } from "@/types"

type DetailType = "mcp" | "skill" | "rule" | "plugin"

interface DetailItem {
  type: DetailType
  name: string
  editorName: string
  description: string
  config?: Record<string, unknown>
}

const EDITOR_COLOR_PRESETS = [
  { color: "from-blue-500 to-indigo-500", gradient: "bg-blue-500", icon: "⌘" },
  { color: "from-orange-500 to-amber-500", gradient: "bg-orange-500", icon: "◆" },
  { color: "from-amber-400 to-orange-500", gradient: "bg-amber-500", icon: "◉" },
  { color: "from-emerald-500 to-teal-500", gradient: "bg-emerald-500", icon: "⬡" },
  { color: "from-violet-500 to-purple-500", gradient: "bg-violet-500", icon: "◇" },
  { color: "from-rose-500 to-pink-500", gradient: "bg-rose-500", icon: "⬢" },
  { color: "from-cyan-500 to-sky-500", gradient: "bg-cyan-500", icon: "◈" },
  { color: "from-lime-500 to-green-500", gradient: "bg-lime-500", icon: "◆" },
  { color: "from-red-500 to-rose-500", gradient: "bg-red-500", icon: "⬟" },
  { color: "from-fuchsia-500 to-pink-500", gradient: "bg-fuchsia-500", icon: "◊" },
]

const mcpDescriptions: Record<string, string> = {
  "github": "GitHub MCP 服务器，用于与 GitHub API 交互，支持代码仓库管理、Issue 追踪、PR 操作等功能。",
  "filesystem": "文件系统 MCP 服务器，提供本地文件读写、目录遍历、文件搜索等能力。",
  "fetch": "HTTP 请求 MCP 服务器，支持发送 GET、POST 等 HTTP 请求获取网络资源。",
  "brave-search": "Brave 搜索 MCP 服务器，提供隐私保护的网页搜索功能。",
  "sqlite": "SQLite 数据库 MCP 服务器，支持本地数据库的查询和管理。",
  "puppeteer": "Puppeteer MCP 服务器，提供浏览器自动化控制能力。",
}

const skillDescriptions: Record<string, string> = {
  "git": "Git 版本控制技能，提供代码提交、分支管理、冲突解决等 Git 操作指导。",
  "github": "GitHub 协作技能，支持 PR 创建、代码审查、Issue 管理等 GitHub 工作流。",
  "refactor": "代码重构技能，提供代码优化建议、设计模式应用、代码清理等指导。",
  "debug": "调试技能，帮助分析代码问题、定位 Bug、提供调试策略和技巧。",
  "test": "测试技能，指导单元测试、集成测试编写，测试用例设计等。",
  "docs": "文档编写技能，协助编写技术文档、API 文档、README 等。",
}

const ruleDescriptions: Record<string, string> = {
  "clean-code": "代码整洁规范，遵循 Clean Code 原则，编写可读性高、易维护的代码。",
  "typescript": "TypeScript 规范，严格类型定义，充分利用 TS 类型系统提高代码质量。",
  "react": "React 最佳实践，遵循 React 设计模式，合理使用 Hooks 和组件化。",
  "security": "安全编码规范，防范常见安全漏洞，编写安全可靠的代码。",
  "performance": "性能优化规范，关注代码执行效率，避免性能瓶颈。",
  "accessibility": "无障碍规范，确保应用对所有用户包括残障人士友好。",
}

const TYPE_CONFIG: Record<DetailType, { icon: typeof Server; label: string; color: string }> = {
  mcp: {
    icon: Server,
    label: "MCP 服务器",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  skill: {
    icon: Wrench,
    label: "Skill",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  },
  rule: {
    icon: BookOpen,
    label: "Rule",
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  plugin: {
    icon: Package,
    label: "插件/扩展",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
}

const TYPE_ITEM_CONFIG: Record<DetailType, { icon: typeof FileJson; hoverBorder: string; activeBorder: string; activeBg: string; iconColor: string }> = {
  mcp: {
    icon: FileJson,
    hoverBorder: "hover:border-blue-500/30 hover:bg-blue-500/5",
    activeBorder: "border-blue-500/50",
    activeBg: "bg-blue-500/10",
    iconColor: "text-blue-500/60",
  },
  skill: {
    icon: Layers,
    hoverBorder: "hover:border-purple-500/30 hover:bg-purple-500/5",
    activeBorder: "border-purple-500/50",
    activeBg: "bg-purple-500/10",
    iconColor: "text-purple-500/60",
  },
  rule: {
    icon: Activity,
    hoverBorder: "hover:border-amber-500/30 hover:bg-amber-500/5",
    activeBorder: "border-amber-500/50",
    activeBg: "bg-amber-500/10",
    iconColor: "text-amber-500/60",
  },
  plugin: {
    icon: Package,
    hoverBorder: "hover:border-cyan-500/30 hover:bg-cyan-500/5",
    activeBorder: "border-cyan-500/50",
    activeBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500/60",
  },
}

const TYPE_SECTION_CONFIG: Record<DetailType, { icon: typeof Server; label: string; iconBg: string; iconColor: string; chevronActiveColor: string }> = {
  mcp: { icon: Server, label: "MCP 服务器", iconBg: "bg-blue-500/10", iconColor: "text-blue-400", chevronActiveColor: "text-blue-400" },
  skill: { icon: Wrench, label: "Skills", iconBg: "bg-purple-500/10", iconColor: "text-purple-400", chevronActiveColor: "text-purple-400" },
  rule: { icon: BookOpen, label: "Rules", iconBg: "bg-amber-500/10", iconColor: "text-amber-400", chevronActiveColor: "text-amber-400" },
  plugin: { icon: Package, label: "插件/扩展", iconBg: "bg-cyan-500/10", iconColor: "text-cyan-400", chevronActiveColor: "text-cyan-400" },
}

const isString = (value: unknown): value is string => typeof value === "string"
const isArray = (value: unknown): value is unknown[] => Array.isArray(value)
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

const hashName = (name: string): number => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const getEditorPreset = (name: string) => {
  const index = hashName(name) % EDITOR_COLOR_PRESETS.length
  return EDITOR_COLOR_PRESETS[index]
}

const getEditorIcon = (name: string): string => {
  return getEditorPreset(name).icon
}

const getEditorColor = (name: string): string => {
  return getEditorPreset(name).color
}

const getEditorGradient = (name: string): string => {
  return getEditorPreset(name).gradient
}

const generateMcpDescription = (name: string, config?: Record<string, unknown>): string => {
  if (mcpDescriptions[name]) return mcpDescriptions[name]

  const command = config?.command
  const lowerName = name.toLowerCase()

  if (lowerName.includes("github")) return `${name} MCP 服务器，用于与 GitHub API 交互，支持代码仓库管理、Issue 追踪等功能。`
  if (lowerName.includes("file")) return `${name} MCP 服务器，提供本地文件读写、目录遍历、文件搜索等文件系统操作能力。`
  if (lowerName.includes("fetch") || lowerName.includes("http")) return `${name} MCP 服务器，支持发送 HTTP 请求获取网络资源，支持 GET、POST 等方法。`
  if (lowerName.includes("search")) return `${name} MCP 服务器，提供网络搜索功能，帮助获取实时信息和知识。`
  if (lowerName.includes("db") || lowerName.includes("sql")) return `${name} MCP 服务器，提供数据库查询和管理能力，支持 SQL 操作。`
  if (lowerName.includes("browser") || lowerName.includes("puppeteer")) return `${name} MCP 服务器，提供浏览器自动化控制能力，支持网页操作和截图。`
  if (lowerName.includes("git")) return `${name} MCP 服务器，提供 Git 版本控制操作能力，支持代码仓库管理。`
  if (isString(command)) return `${name} MCP 服务器，通过 ${command} 命令运行，提供特定的功能服务。`

  return `${name} MCP 服务器，提供特定的功能服务，增强 AI 编辑器的扩展能力。`
}

const generateSkillDescription = (name: string): string => {
  if (skillDescriptions[name]) return skillDescriptions[name]

  const lowerName = name.toLowerCase()
  if (lowerName.includes("git")) return `${name} 技能，提供 Git 版本控制操作指导，包括提交、分支、合并等工作流。`
  if (lowerName.includes("refactor")) return `${name} 技能，协助代码重构和优化，提升代码质量和可维护性。`
  if (lowerName.includes("debug")) return `${name} 技能，帮助分析和定位代码问题，提供调试策略和解决方案。`
  if (lowerName.includes("test")) return `${name} 技能，指导测试用例编写和测试策略，确保代码质量。`
  if (lowerName.includes("doc")) return `${name} 技能，协助编写技术文档、注释和 README，提升文档质量。`
  if (lowerName.includes("code")) return `${name} 技能，提供代码编写指导和最佳实践建议。`
  if (lowerName.includes("review")) return `${name} 技能，协助代码审查，发现潜在问题和改进点。`
  if (lowerName.includes("design")) return `${name} 技能，提供软件设计指导，包括架构和模式选择。`

  return `${name} 技能，提供专业的开发辅助能力，在 AI 对话中自动应用以提升效率。`
}

const generateRuleDescription = (name: string): string => {
  if (ruleDescriptions[name]) return ruleDescriptions[name]

  const lowerName = name.toLowerCase()
  if (lowerName.includes("typescript") || lowerName.includes("ts")) return `${name} 规则，TypeScript 编码规范，确保类型安全和代码质量。`
  if (lowerName.includes("react")) return `${name} 规则，React 开发规范，遵循组件化和 Hooks 最佳实践。`
  if (lowerName.includes("clean")) return `${name} 规则，代码整洁规范，遵循 Clean Code 原则编写可维护代码。`
  if (lowerName.includes("security")) return `${name} 规则，安全编码规范，防范常见安全漏洞和风险。`
  if (lowerName.includes("performance")) return `${name} 规则，性能优化规范，关注代码执行效率和资源使用。`
  if (lowerName.includes("accessibility") || lowerName.includes("a11y")) return `${name} 规则，无障碍规范，确保应用对所有用户友好。`
  if (lowerName.includes("style")) return `${name} 规则，代码风格规范，统一代码格式和命名约定。`
  if (lowerName.includes("import")) return `${name} 规则，导入规范，管理依赖和模块导入顺序。`

  return `${name} 规则，定义代码质量和风格规范，指导 AI 生成符合标准的代码。`
}

const generateDescription = (type: DetailType, name: string, config?: Record<string, unknown>): string => {
  if (type === "mcp") return generateMcpDescription(name, config)
  if (type === "skill") return generateSkillDescription(name)
  if (type === "plugin") return `${name} 是扫描到的 AI 编程插件或扩展，可作为后续打包、迁移和注入流程的候选资产。`
  return generateRuleDescription(name)
}

const getStatusConfig = (editor: EditorConfig) => {
  if (editor.error) {
    return {
      icon: <AlertCircle className="h-5 w-5 text-red-400" />,
      badge: (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20">
          错误
        </Badge>
      ),
      cardClass: "border-red-500/30 bg-red-500/5",
      statusText: "配置异常",
    }
  }
  if (editor.exists) {
    const serverCount = editor.mcp_servers ? Object.keys(editor.mcp_servers).length : 0
    const skillCount = editor.skills?.length ?? 0
    const ruleCount = editor.rules?.length ?? 0
    const pluginCount = editor.plugins?.length ?? 0
    const totalAssets = serverCount + skillCount + ruleCount + pluginCount
    return {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
      badge: (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-medium">
          <Zap className="h-3 w-3 mr-1" />
          {totalAssets} 资源
        </Badge>
      ),
      cardClass: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent",
      statusText: "已就绪",
    }
  }
  return {
    icon: <XCircle className="h-5 w-5 text-slate-500" />,
    badge: (
      <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/30">
        <EyeOff className="h-3 w-3 mr-1" />
        未找到
      </Badge>
    ),
    cardClass: "border-slate-700/50 bg-slate-500/5",
    statusText: "未安装",
  }
}

export function EditorScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null)
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<DetailType>>(new Set())
  const [customEditors, setCustomEditors] = useState<EditorDefinition[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addFormError, setAddFormError] = useState<string | null>(null)

  const [newEditorName, setNewEditorName] = useState("")
  const [newEditorDisplay, setNewEditorDisplay] = useState("")
  const [newEditorConfigFiles, setNewEditorConfigFiles] = useState("mcp.json")
  const [newEditorDirPatterns, setNewEditorDirPatterns] = useState("")

  const loadCustomEditors = useCallback(async () => {
    try {
      const list = await invoke<EditorDefinition[]>("list_custom_editors")
      setCustomEditors(list)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    loadCustomEditors()
  }, [loadCustomEditors])

  const handleScan = useCallback(async () => {
    setIsScanning(true)
    setError(null)
    setSelectedDetail(null)
    setSelectedEditor(null)
    setExpandedTypes(new Set())

    try {
      const result = await invoke<ScanResult>("scan_editors")
      setScanResult(result)
      await loadCustomEditors()
    } catch (err) {
      setError(err instanceof Error ? err.message : "扫描失败")
    } finally {
      setIsScanning(false)
    }
  }, [loadCustomEditors])

  const handleShowDetail = (
    type: DetailType,
    name: string,
    editorName: string,
    config?: Record<string, unknown>
  ) => {
    const description = generateDescription(type, name, config)
    setSelectedDetail({ type, name, editorName, description, config })
  }

  const handleCloseDetail = () => {
    setSelectedDetail(null)
  }

  const handleToggleType = (type: DetailType) => {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const handleEditorToggle = (editorName: string) => {
    setSelectedEditor(prev => prev === editorName ? null : editorName)
    setSelectedDetail(null)
  }

  const isTypeExpanded = (type: DetailType) => expandedTypes.has(type)

  const handleSectionKeyDown = (e: React.KeyboardEvent, type: DetailType) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleToggleType(type)
    }
  }

  const handleItemKeyDown = (
    e: React.KeyboardEvent,
    type: DetailType,
    name: string,
    editorName: string,
    config?: Record<string, unknown>
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleShowDetail(type, name, editorName, config)
    }
  }

  const handleEditorToggleKeyDown = (e: React.KeyboardEvent, editorName: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleEditorToggle(editorName)
    }
  }

  const handleCloseDetailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleCloseDetail()
    }
  }

  const handleOpenAddDialog = () => {
    setNewEditorName("")
    setNewEditorDisplay("")
    setNewEditorConfigFiles("mcp.json")
    setNewEditorDirPatterns("")
    setAddFormError(null)
    setShowAddDialog(true)
  }

  const handleCloseAddDialog = () => {
    setShowAddDialog(false)
    setAddFormError(null)
  }

  const handleAddCustomEditor = async () => {
    setAddFormError(null)

    if (!newEditorName.trim()) {
      setAddFormError("请输入编辑器标识名称")
      return
    }
    if (!newEditorDisplay.trim()) {
      setAddFormError("请输入显示名称")
      return
    }
    if (!newEditorConfigFiles.trim()) {
      setAddFormError("请输入配置文件名")
      return
    }
    if (!newEditorDirPatterns.trim()) {
      setAddFormError("请输入目录匹配模式")
      return
    }

    const configFiles = newEditorConfigFiles
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const dirPatterns = newEditorDirPatterns
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0)

    if (configFiles.length === 0) {
      setAddFormError("至少需要一个配置文件名")
      return
    }
    if (dirPatterns.length === 0) {
      setAddFormError("至少需要一个目录匹配模式")
      return
    }

    try {
      await invoke<EditorDefinition[]>("add_custom_editor", {
        name: newEditorName.trim(),
        displayName: newEditorDisplay.trim(),
        configFiles,
        dirPatterns,
      })
      setShowAddDialog(false)
      await loadCustomEditors()
    } catch (err) {
      setAddFormError(err instanceof Error ? err.message : "添加失败")
    }
  }

  const handleRemoveCustomEditor = async (name: string) => {
    try {
      await invoke<EditorDefinition[]>("remove_custom_editor", { name })
      await loadCustomEditors()
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败")
    }
  }

  const handleRemoveCustomEditorKeyDown = (e: React.KeyboardEvent, name: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleRemoveCustomEditor(name)
    }
  }

  const handleAddFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddCustomEditor()
    }
    if (e.key === "Escape") {
      handleCloseAddDialog()
    }
  }

  const handleAddDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCloseAddDialog()
    }
  }

  const renderMcpConfig = (config: Record<string, unknown>) => {
    const command = config.command
    const args = config.args
    const env = config.env

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Settings className="h-4 w-4 text-slate-500" />
          <span>配置详情</span>
        </div>

        <div className="pl-6 space-y-2">
          {isString(command) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 shrink-0">命令:</span>
              <code className="px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-slate-300 font-mono truncate">
                {command}
              </code>
            </div>
          )}
          {isArray(args) && args.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-slate-500 shrink-0">参数:</span>
              <div className="flex flex-wrap gap-1">
                {args.map((arg, i) => (
                  <code key={i} className="px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-slate-300 font-mono">
                    {String(arg)}
                  </code>
                ))}
              </div>
            </div>
          )}
          {isObject(env) && Object.keys(env).length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-slate-500">环境变量:</span>
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-2 space-y-1">
                {Object.entries(env).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 shrink-0">{key}:</span>
                    <span className="text-slate-400 truncate font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <details className="pl-6">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
            查看完整配置
          </summary>
          <div className="mt-2 rounded-xl bg-black/30 border border-white/[0.06] p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-slate-400">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    )
  }

  const renderResourceSection = (
    type: DetailType,
    count: number,
    editor: EditorConfig
  ) => {
    if (count === 0) return null

    const sectionConfig = TYPE_SECTION_CONFIG[type]
    const itemConfig = TYPE_ITEM_CONFIG[type]
    const expanded = isTypeExpanded(type)
    const SectionIcon = sectionConfig.icon
    const ItemIcon = itemConfig.icon

    const items = type === "mcp"
      ? Object.entries(editor.mcp_servers ?? {})
      : type === "skill"
        ? (editor.skills ?? []).map(s => [s, undefined] as [string, undefined])
        : type === "rule"
          ? (editor.rules ?? []).map(r => [r, undefined] as [string, undefined])
          : (editor.plugins ?? []).map((p: PluginAsset) => [
              p.name,
              { path: p.path, source: p.source },
            ] as [string, Record<string, unknown>])

    return (
      <div className="space-y-2">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${sectionConfig.label} (${count})`}
          className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3 cursor-pointer select-none"
          onClick={() => handleToggleType(type)}
          onKeyDown={(e) => handleSectionKeyDown(e, type)}
        >
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", sectionConfig.iconBg)}>
            <SectionIcon className={cn("h-3.5 w-3.5", sectionConfig.iconColor)} />
          </div>
          <span>{sectionConfig.label}</span>
          <span className="text-xs text-slate-500">({count})</span>
          <ChevronRight className={cn(
            "h-4 w-4 ml-auto transition-transform duration-200",
            expanded ? `${sectionConfig.chevronActiveColor} rotate-90` : "text-slate-600"
          )} />
        </div>
        <div className={cn(
          "scrollbar-thin pr-1 transition-all duration-300",
          expanded ? "max-h-64 overflow-y-auto" : "max-h-0 overflow-hidden"
        )}>
          <div className="space-y-1.5">
            {items.map(([itemName, serverConfig]) => (
              <button
                key={itemName}
                onClick={() => handleShowDetail(type, itemName, editor.name, serverConfig as Record<string, unknown> | undefined)}
                onKeyDown={(e) => handleItemKeyDown(e, type, itemName, editor.name, serverConfig as Record<string, unknown> | undefined)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-left transition-all duration-200",
                  "bg-white/[0.03] border border-white/[0.06]",
                  itemConfig.hoverBorder,
                  selectedDetail?.name === itemName && selectedDetail?.type === type && cn(itemConfig.activeBorder, itemConfig.activeBg)
                )}
              >
                <ItemIcon className={cn("h-3.5 w-3.5 shrink-0", itemConfig.iconColor)} />
                <span className="truncate text-slate-400">{itemName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderEditorCard = (editor: EditorConfig, index: number) => {
    const config = getStatusConfig(editor)
    const serverCount = editor.mcp_servers ? Object.keys(editor.mcp_servers).length : 0
    const skillCount = editor.skills?.length ?? 0
    const ruleCount = editor.rules?.length ?? 0
    const pluginCount = editor.plugins?.length ?? 0
    const isSelected = selectedEditor === editor.name

    return (
      <Card
        key={editor.name}
        className={cn(
          "overflow-hidden border bg-[#12121a]/80 backdrop-blur-sm transition-all duration-300",
          config.cardClass,
          isSelected && "ring-1 ring-indigo-500/50"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className={cn("h-1 bg-gradient-to-r", getEditorColor(editor.name))} />

        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-white text-2xl font-bold shadow-lg",
                getEditorColor(editor.name)
              )}>
                {getEditorIcon(editor.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-white">
                    {editor.display_name}
                  </CardTitle>
                  {editor.is_custom && (
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-[10px] px-1.5 py-0">
                      自定义
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">{config.statusText}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {config.badge}
              <button
                onClick={() => handleEditorToggle(editor.name)}
                onKeyDown={(e) => handleEditorToggleKeyDown(e, editor.name)}
                aria-label={isSelected ? `折叠 ${editor.display_name}` : `展开 ${editor.display_name}`}
                aria-expanded={isSelected}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  "bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06]",
                  isSelected && "bg-indigo-500/20 border-indigo-500/30"
                )}
              >
                <ChevronRight className={cn(
                  "h-5 w-5 text-slate-400 transition-transform duration-300",
                  isSelected && "rotate-90 text-indigo-400"
                )} />
              </button>
            </div>
          </div>

          {editor.config_path && (
            <CardDescription className="text-xs text-slate-600 mt-3 truncate font-mono bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.06]">
              {editor.config_path}
            </CardDescription>
          )}
        </CardHeader>

        {isSelected && (
          <CardContent className="pt-0 pb-6">
            <div className={cn(
              "grid gap-4",
              selectedDetail ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-4"
            )}>
              {renderResourceSection("mcp", serverCount, editor)}
              {renderResourceSection("skill", skillCount, editor)}
              {renderResourceSection("rule", ruleCount, editor)}
              {renderResourceSection("plugin", pluginCount, editor)}
            </div>

            {serverCount === 0 && skillCount === 0 && ruleCount === 0 && pluginCount === 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Eye className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-sm text-amber-400/80">
                  编辑器已安装，但未找到任何配置
                </p>
              </div>
            )}
          </CardContent>
        )}

        {editor.error && (
          <CardContent className="pt-0 pb-6">
            <div className="flex items-center gap-3 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-sm text-red-400/80">{editor.error}</p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-400">环境扫描器</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            发现你的 <span className="text-gradient">AI 编辑器</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            一键扫描系统中已安装的 AI 编辑器，自动识别 MCP、Skills、Rules 和 AI 插件扩展
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className={cn(
                "relative group px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300",
                "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500",
                "hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] hover:scale-[1.02]",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100",
                "overflow-hidden"
              )}
            >
              {isScanning && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent animate-scan-line" />
                </div>
              )}

              <span className="relative flex items-center gap-3">
                <RefreshCw className={cn("h-5 w-5", isScanning && "animate-spin")} />
                {isScanning ? "正在扫描系统..." : "开始扫描"}
              </span>
            </button>

            {scanResult && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Terminal className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-400">{scanResult.scan_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="flex gap-6 animate-fade-in min-w-0">
          <div className={cn(
            "min-w-0 transition-all duration-500",
            selectedDetail ? "w-1/2 shrink-0" : "flex-1"
          )}>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                {
                  label: "已检测",
                  value: scanResult.editors.filter(e => e.exists).length,
                  icon: CheckCircle2,
                  color: "text-emerald-400",
                  bgColor: "bg-emerald-500/10",
                  borderColor: "border-emerald-500/20",
                },
                {
                  label: "MCP",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.mcp_servers ? Object.keys(e.mcp_servers).length : 0), 0),
                  icon: Server,
                  color: "text-blue-400",
                  bgColor: "bg-blue-500/10",
                  borderColor: "border-blue-500/20",
                },
                {
                  label: "Skills",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.skills?.length ?? 0), 0),
                  icon: Wrench,
                  color: "text-purple-400",
                  bgColor: "bg-purple-500/10",
                  borderColor: "border-purple-500/20",
                },
                {
                  label: "Rules",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.rules?.length ?? 0), 0),
                  icon: BookOpen,
                  color: "text-amber-400",
                  bgColor: "bg-amber-500/10",
                  borderColor: "border-amber-500/20",
                },
                {
                  label: "插件",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.plugins?.length ?? 0), 0),
                  icon: Package,
                  color: "text-cyan-400",
                  bgColor: "bg-cyan-500/10",
                  borderColor: "border-cyan-500/20",
                },
                {
                  label: "未找到",
                  value: scanResult.editors.filter(e => !e.exists).length,
                  icon: EyeOff,
                  color: "text-slate-400",
                  bgColor: "bg-slate-500/10",
                  borderColor: "border-slate-500/20",
                },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn(
                    "relative group rounded-xl p-3 border transition-all duration-300",
                    "bg-white/[0.02] hover:bg-white/[0.04]",
                    stat.borderColor
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                    <span className="text-xs text-slate-500">{stat.label}</span>
                  </div>
                  <div className={cn("text-xl font-bold", stat.color)}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {scanResult.editors.filter(e => e.exists).map((editor, index) => renderEditorCard(editor, index))}
            </div>

            {scanResult.editors.some(e => !e.exists) && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <EyeOff className="h-4 w-4" />
                  <span>未检测到的编辑器</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scanResult.editors.filter(e => !e.exists).map(editor => (
                    <span key={editor.name} className="px-3 py-1.5 rounded-lg bg-slate-500/5 border border-slate-500/10 text-xs text-slate-500">
                      {editor.display_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Pencil className="h-4 w-4" />
                  <span>自定义 AI 编辑器</span>
                  {customEditors.length > 0 && (
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs">
                      {customEditors.length}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={handleOpenAddDialog}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-violet-500/10 text-violet-400 border border-violet-500/20
                    hover:bg-violet-500/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加编辑器
                </button>
              </div>

              {customEditors.length === 0 ? (
                <p className="text-xs text-slate-600">
                  暂无自定义编辑器。点击「添加编辑器」可以添加其他 AI 编程工具（如 Windsurf、Copilot 等）。
                </p>
              ) : (
                <div className="space-y-2">
                  {customEditors.map(def => (
                    <div
                      key={def.name}
                      className="flex items-center justify-between px-4 py-3 rounded-xl
                        bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white text-sm font-bold",
                          getEditorColor(def.name)
                        )}>
                          {getEditorIcon(def.name)}
                        </div>
                        <div>
                          <span className="text-sm text-slate-300 font-medium">{def.display_name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-[10px] text-slate-500 font-mono">{def.name}</code>
                            <span className="text-[10px] text-slate-600">
                              配置: {def.config_files.join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomEditor(def.name)}
                        onKeyDown={(e) => handleRemoveCustomEditorKeyDown(e, def.name)}
                        aria-label={`删除 ${def.display_name}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedDetail && (
            <div className="w-1/2 shrink-0 animate-slide-in-right">
              <Card className="sticky top-28 border bg-[#12121a]/90 backdrop-blur-xl overflow-hidden">
                <div className={cn("h-1 bg-gradient-to-r", getEditorColor(selectedDetail.editorName))} />

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl border",
                        TYPE_CONFIG[selectedDetail.type].color
                      )}>
                        {(() => {
                          const TypeIcon = TYPE_CONFIG[selectedDetail.type].icon
                          return <TypeIcon className="h-5 w-5" />
                        })()}
                      </div>
                      <div className="min-w-0">
                        <Badge className={cn("mb-1.5", TYPE_CONFIG[selectedDetail.type].color)}>
                          {TYPE_CONFIG[selectedDetail.type].label}
                        </Badge>
                        <CardTitle className="text-lg font-bold text-white truncate">
                          {selectedDetail.name}
                        </CardTitle>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseDetail}
                      onKeyDown={handleCloseDetailKeyDown}
                      aria-label="关闭详情面板"
                      className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors shrink-0"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <Info className="h-4 w-4 text-slate-500" />
                      <span>说明</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed pl-6">
                      {selectedDetail.description}
                    </p>
                  </div>

                  {selectedDetail.type === "mcp" && selectedDetail.config && renderMcpConfig(selectedDetail.config)}

                  {selectedDetail.type === "skill" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <FileCode className="h-4 w-4 text-slate-500" />
                        <span>功能说明</span>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">类型:</span>
                          <span className="text-slate-400">AI 辅助技能</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">状态:</span>
                          <span className="text-emerald-400">已启用</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          此技能会在 AI 对话中自动应用，帮助提升代码质量和开发效率。
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDetail.type === "rule" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <BookOpen className="h-4 w-4 text-slate-500" />
                        <span>规则说明</span>
                      </div>
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">类型:</span>
                          <span className="text-slate-400">代码规范</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">适用范围:</span>
                          <span className="text-slate-400">当前编辑器</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">状态:</span>
                          <span className="text-emerald-400">已应用</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          此规则会指导 AI 在生成代码时遵循特定的编码标准和最佳实践。
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedDetail.type === "plugin" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <Package className="h-4 w-4 text-slate-500" />
                        <span>插件信息</span>
                      </div>
                      <div className="pl-6 space-y-2">
                        {isString(selectedDetail.config?.source) && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 shrink-0">来源:</span>
                            <span className="text-slate-400">{selectedDetail.config.source}</span>
                          </div>
                        )}
                        {isString(selectedDetail.config?.path) && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-slate-500 shrink-0">路径:</span>
                            <code className="px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-slate-300 font-mono break-all">
                              {selectedDetail.config.path}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <Command className="h-4 w-4 text-slate-500" />
                      <span>所属编辑器</span>
                    </div>
                    <div className="flex items-center gap-3 pl-6">
                      <div className={cn("h-3 w-3 rounded-full", getEditorGradient(selectedDetail.editorName))} />
                      <span className="text-sm text-slate-400 capitalize">{selectedDetail.editorName}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06]">
                    <div className="flex flex-wrap gap-2">
                      {selectedDetail.type === "mcp" && (
                        <>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">API 服务</Badge>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">已启用</Badge>
                          {isString(selectedDetail.config?.command) && (
                            <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">
                              {String(selectedDetail.config!.command)}
                            </Badge>
                          )}
                        </>
                      )}
                      {selectedDetail.type === "skill" && (
                        <>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">AI 技能</Badge>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">可用</Badge>
                          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">自动应用</Badge>
                        </>
                      )}
                      {selectedDetail.type === "rule" && (
                        <>
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">代码规范</Badge>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">已应用</Badge>
                          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">AI 提示</Badge>
                        </>
                      )}
                      {selectedDetail.type === "plugin" && (
                        <>
                          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">AI 插件</Badge>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">已发现</Badge>
                          {isString(selectedDetail.config?.source) && (
                            <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">
                              {selectedDetail.config.source}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {!scanResult && !isScanning && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-16 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur-xl opacity-20 animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1e1e2e] to-[#12121a] border border-white/[0.08] shadow-2xl">
                <ScanLine className="h-12 w-12 text-cyan-400 animate-float" />
              </div>
              <div className="absolute -inset-4 border border-white/[0.03] rounded-[2rem]" />
              <div className="absolute -inset-8 border border-white/[0.02] rounded-[2.5rem]" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">准备扫描</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
              点击上方「开始扫描」按钮，我们将自动检测您系统中安装的 AI 编辑器及其配置
            </p>

            <div className="flex items-center gap-6">
              {(["trae", "cursor", "claude"] as const).map((name) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", getEditorGradient(name))} />
                  <span className="text-xs text-slate-500">
                    {name === "trae" ? "Trae" : name === "cursor" ? "Cursor" : "Claude Code"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCloseAddDialog}
          onKeyDown={handleAddDialogKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="添加自定义编辑器"
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-[#12121a] shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <Plus className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">添加 AI 编辑器</h3>
                    <p className="text-xs text-slate-500">自定义添加其他 AI 编程工具</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAddDialog}
                  aria-label="关闭"
                  className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4" onKeyDown={handleAddFormKeyDown}>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    标识名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEditorName}
                    onChange={(e) => setNewEditorName(e.target.value)}
                    placeholder="例如: windsurf"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-sm text-slate-300 placeholder:text-slate-600
                      focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-colors"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-600 mt-1">内部标识，仅支持英文和数字</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    显示名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEditorDisplay}
                    onChange={(e) => setNewEditorDisplay(e.target.value)}
                    placeholder="例如: Windsurf"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-sm text-slate-300 placeholder:text-slate-600
                      focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    配置文件名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEditorConfigFiles}
                    onChange={(e) => setNewEditorConfigFiles(e.target.value)}
                    placeholder="例如: mcp.json"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-sm text-slate-300 placeholder:text-slate-600
                      focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-colors"
                  />
                  <p className="text-[10px] text-slate-600 mt-1">多个文件用逗号分隔，如: mcp.json,config.json</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    目录匹配模式 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEditorDirPatterns}
                    onChange={(e) => setNewEditorDirPatterns(e.target.value)}
                    placeholder="例如: windsurf,.windsurf"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]
                      text-sm text-slate-300 placeholder:text-slate-600
                      focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-colors"
                  />
                  <p className="text-[10px] text-slate-600 mt-1">用于匹配目录名，多个模式用逗号分隔</p>
                </div>

                {addFormError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                    <p className="text-xs text-red-400">{addFormError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCloseAddDialog}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400
                      bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddCustomEditor}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white
                      bg-gradient-to-r from-violet-500 to-purple-500
                      hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)] transition-all"
                  >
                    确认添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
