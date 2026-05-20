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

const EDITOR_ICONS: Record<string, string> = {
  trae: "T",
  cursor: "C",
  claude: "⌘",
  windsurf: "W",
  vscode: "VS",
  zed: "Z",
  jetbrains: "JB",
}

const TYPE_CONFIG: Record<DetailType, { icon: typeof Server; label: string; color: string }> = {
  mcp: {
    icon: Server,
    label: "MCP 服务器",
    color: "text-blue-600",
  },
  skill: {
    icon: Wrench,
    label: "Skill",
    color: "text-purple-600",
  },
  rule: {
    icon: BookOpen,
    label: "Rule",
    color: "text-amber-600",
  },
  plugin: {
    icon: Package,
    label: "插件/扩展",
    color: "text-cyan-600",
  },
}

const isString = (value: unknown): value is string => typeof value === "string"
const isArray = (value: unknown): value is unknown[] => Array.isArray(value)
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)

const getEditorIcon = (name: string): string => EDITOR_ICONS[name] || name.charAt(0).toUpperCase()

const generateMcpDescription = (name: string, config?: Record<string, unknown>): string => {
  const command = config?.command
  const lowerName = name.toLowerCase()

  if (lowerName.includes("github")) return "与 GitHub API 交互，支持代码仓库管理、Issue 追踪等功能"
  if (lowerName.includes("file")) return "本地文件读写、目录遍历、文件搜索等文件系统操作"
  if (lowerName.includes("fetch") || lowerName.includes("http")) return "发送 HTTP 请求获取网络资源"
  if (lowerName.includes("search")) return "网络搜索功能，获取实时信息"
  if (lowerName.includes("db") || lowerName.includes("sql")) return "数据库查询和管理能力"
  if (lowerName.includes("browser") || lowerName.includes("puppeteer")) return "浏览器自动化控制能力"
  if (lowerName.includes("git")) return "Git 版本控制操作能力"
  if (isString(command)) return `通过 ${command} 命令运行`
  return "提供特定的功能服务"
}

const generateSkillDescription = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("git")) return "Git 版本控制操作指导"
  if (lowerName.includes("refactor")) return "代码重构和优化指导"
  if (lowerName.includes("debug")) return "分析和定位代码问题"
  if (lowerName.includes("test")) return "测试用例编写和测试策略"
  if (lowerName.includes("doc")) return "技术文档编写协助"
  return "专业的开发辅助能力"
}

const generateRuleDescription = (name: string): string => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("typescript") || lowerName.includes("ts")) return "TypeScript 编码规范"
  if (lowerName.includes("react")) return "React 开发规范"
  if (lowerName.includes("clean")) return "代码整洁规范"
  if (lowerName.includes("security")) return "安全编码规范"
  if (lowerName.includes("performance")) return "性能优化规范"
  return "代码质量和风格规范"
}

const generateDescription = (type: DetailType, name: string, config?: Record<string, unknown>): string => {
  if (type === "mcp") return generateMcpDescription(name, config)
  if (type === "skill") return generateSkillDescription(name)
  if (type === "plugin") return "AI 编程插件或扩展"
  return generateRuleDescription(name)
}

const getStatusConfig = (editor: EditorConfig) => {
  if (editor.error) {
    return {
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      badge: (
        <Badge variant="destructive" className="text-[10px] h-5">
          错误
        </Badge>
      ),
      cardClass: "border-destructive/30",
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
      icon: <CheckCircle2 className="h-4 w-4 text-success" />,
      badge: (
        <Badge variant="secondary" className="text-[10px] h-5">
          {totalAssets} 资源
        </Badge>
      ),
      cardClass: "border-border",
      statusText: "已就绪",
    }
  }
  return {
    icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
    badge: (
      <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
        未找到
      </Badge>
    ),
    cardClass: "border-border/50 opacity-60",
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
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>配置详情</span>
        </div>

        <div className="pl-6 space-y-2">
          {isString(command) && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">命令:</span>
              <code className="px-2 py-1 rounded bg-secondary text-foreground font-mono text-[10px]">
                {command}
              </code>
            </div>
          )}
          {isArray(args) && args.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">参数:</span>
              <div className="flex flex-wrap gap-1">
                {args.map((arg, i) => (
                  <code key={i} className="px-2 py-1 rounded bg-secondary text-foreground font-mono text-[10px]">
                    {String(arg)}
                  </code>
                ))}
              </div>
            </div>
          )}
          {isObject(env) && Object.keys(env).length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">环境变量:</span>
              <div className="rounded bg-secondary p-2 space-y-1">
                {Object.entries(env).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0">{key}:</span>
                    <span className="text-foreground truncate font-mono text-[10px]">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <details className="pl-6">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            查看完整配置
          </summary>
          <div className="mt-2 rounded bg-background border border-border p-3 overflow-x-auto">
            <pre className="text-xs font-mono text-muted-foreground">
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

    const sectionConfig = TYPE_CONFIG[type]
    const expanded = isTypeExpanded(type)
    const SectionIcon = sectionConfig.icon

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
          className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer select-none"
          onClick={() => handleToggleType(type)}
          onKeyDown={(e) => handleSectionKeyDown(e, type)}
        >
          <SectionIcon className={cn("h-4 w-4", sectionConfig.color)} />
          <span>{sectionConfig.label}</span>
          <span className="text-xs text-muted-foreground">({count})</span>
          <ChevronRight className={cn(
            "h-4 w-4 ml-auto transition-transform duration-150",
            expanded ? "rotate-90" : "text-muted-foreground"
          )} />
        </div>
        <div className={cn(
          "scrollbar-thin pr-1 transition-all duration-200",
          expanded ? "max-h-64 overflow-y-auto" : "max-h-0 overflow-hidden"
        )}>
          <div className="space-y-1">
            {items.map(([itemName, serverConfig]) => (
              <button
                key={itemName}
                onClick={() => handleShowDetail(type, itemName, editor.name, serverConfig as Record<string, unknown> | undefined)}
                onKeyDown={(e) => handleItemKeyDown(e, type, itemName, editor.name, serverConfig as Record<string, unknown> | undefined)}
                className={cn(
                  "w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors",
                  "bg-secondary/50 hover:bg-secondary",
                  selectedDetail?.name === itemName && selectedDetail?.type === type && "bg-primary/10 ring-1 ring-primary"
                )}
              >
                <span className="truncate text-foreground">{itemName}</span>
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
          "overflow-hidden border bg-card transition-all duration-150",
          config.cardClass,
          isSelected && "ring-1 ring-primary"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-secondary text-sm font-semibold text-foreground">
                {getEditorIcon(editor.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {editor.display_name}
                  </CardTitle>
                  {editor.is_custom && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      自定义
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{config.statusText}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.badge}
              <button
                onClick={() => handleEditorToggle(editor.name)}
                onKeyDown={(e) => handleEditorToggleKeyDown(e, editor.name)}
                aria-label={isSelected ? `折叠 ${editor.display_name}` : `展开 ${editor.display_name}`}
                aria-expanded={isSelected}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  "hover:bg-secondary",
                  isSelected && "bg-primary/10"
                )}
              >
                <ChevronRight className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-150",
                  isSelected && "rotate-90 text-primary"
                )} />
              </button>
            </div>
          </div>

          {editor.config_path && (
            <CardDescription className="text-[10px] text-muted-foreground mt-2 truncate font-mono bg-secondary px-2 py-1 rounded">
              {editor.config_path}
            </CardDescription>
          )}
        </CardHeader>

        {isSelected && (
          <CardContent className="pt-0 pb-4">
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
              <div className="flex items-center gap-2 rounded bg-warning/10 border border-warning/20 px-3 py-2">
                <Eye className="h-4 w-4 text-warning" />
                <p className="text-xs text-warning">
                  编辑器已安装，但未找到任何配置
                </p>
              </div>
            )}
          </CardContent>
        )}

        {editor.error && (
          <CardContent className="pt-0 pb-4">
            <div className="flex items-center gap-2 rounded bg-destructive/10 border border-destructive/20 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-destructive">{editor.error}</p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 头部区域 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            环境扫描器
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            自动检测系统中已安装的 AI 编辑器及其配置
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-all duration-150",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isScanning && "animate-spin")} />
            {isScanning ? "扫描中..." : "开始扫描"}
          </button>

          {scanResult && (
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-secondary text-xs text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
              <span>{scanResult.scan_time}</span>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* 扫描结果 */}
      {scanResult && (
        <div className="flex gap-6 animate-fade-in">
          <div className={cn(
            "min-w-0 transition-all duration-200",
            selectedDetail ? "w-3/5" : "flex-1"
          )}>
            {/* 统计卡片 */}
            <div className="grid grid-cols-6 gap-2 mb-6">
              {[
                {
                  label: "已检测",
                  value: scanResult.editors.filter(e => e.exists).length,
                  color: "text-success",
                },
                {
                  label: "MCP",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.mcp_servers ? Object.keys(e.mcp_servers).length : 0), 0),
                  color: "text-blue-400",
                },
                {
                  label: "Skills",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.skills?.length ?? 0), 0),
                  color: "text-purple-400",
                },
                {
                  label: "Rules",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.rules?.length ?? 0), 0),
                  color: "text-amber-400",
                },
                {
                  label: "插件",
                  value: scanResult.editors.reduce((acc, e) => acc + (e.plugins?.length ?? 0), 0),
                  color: "text-cyan-400",
                },
                {
                  label: "未找到",
                  value: scanResult.editors.filter(e => !e.exists).length,
                  color: "text-muted-foreground",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded border border-border bg-card p-3"
                >
                  <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                  <div className={cn("text-lg font-semibold", stat.color)}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* 编辑器列表 */}
            <div className="space-y-3">
              {scanResult.editors.filter(e => e.exists).map((editor, index) => renderEditorCard(editor, index))}
            </div>

            {/* 未检测到的编辑器 */}
            {scanResult.editors.some(e => !e.exists) && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <EyeOff className="h-4 w-4" />
                  <span>未检测到的编辑器</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scanResult.editors.filter(e => !e.exists).map(editor => (
                    <span key={editor.name} className="px-2 py-1 rounded bg-secondary text-xs text-muted-foreground">
                      {editor.display_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 自定义编辑器 */}
            <div className="mt-8 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Pencil className="h-4 w-4" />
                  <span>自定义 AI 编辑器</span>
                  {customEditors.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {customEditors.length}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={handleOpenAddDialog}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium
                    bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加编辑器
                </button>
              </div>

              {customEditors.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  暂无自定义编辑器。点击「添加编辑器」可以添加其他 AI 编程工具（如 Windsurf、Copilot 等）。
                </p>
              ) : (
                <div className="space-y-2">
                  {customEditors.map(def => (
                    <div
                      key={def.name}
                      className="flex items-center justify-between px-3 py-2 rounded
                        bg-card border border-border hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-xs font-semibold text-foreground">
                          {getEditorIcon(def.name)}
                        </div>
                        <div>
                          <span className="text-sm text-foreground font-medium">{def.display_name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-[10px] text-muted-foreground font-mono">{def.name}</code>
                            <span className="text-[10px] text-muted-foreground">
                              配置: {def.config_files.join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomEditor(def.name)}
                        onKeyDown={(e) => handleRemoveCustomEditorKeyDown(e, def.name)}
                        aria-label={`删除 ${def.display_name}`}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 详情面板 */}
          {selectedDetail && (
            <div className="w-2/5 shrink-0 animate-fade-in">
              <Card className="sticky top-20 border bg-card overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded bg-secondary",
                        TYPE_CONFIG[selectedDetail.type].color
                      )}>
                        {(() => {
                          const TypeIcon = TYPE_CONFIG[selectedDetail.type].icon
                          return <TypeIcon className="h-4 w-4" />
                        })()}
                      </div>
                      <div className="min-w-0">
                        <Badge variant="outline" className="text-[10px] h-4 mb-0.5">
                          {TYPE_CONFIG[selectedDetail.type].label}
                        </Badge>
                        <CardTitle className="text-sm font-semibold text-foreground truncate">
                          {selectedDetail.name}
                        </CardTitle>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseDetail}
                      onKeyDown={handleCloseDetailKeyDown}
                      aria-label="关闭详情面板"
                      className="p-1.5 rounded hover:bg-secondary transition-colors shrink-0"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span>说明</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                      {selectedDetail.description}
                    </p>
                  </div>

                  {selectedDetail.type === "mcp" && selectedDetail.config && renderMcpConfig(selectedDetail.config)}

                  {selectedDetail.type === "skill" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                        <span>功能说明</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">类型:</span>
                          <span className="text-foreground">AI 辅助技能</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">状态:</span>
                          <span className="text-success">已启用</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedDetail.type === "rule" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>规则说明</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">类型:</span>
                          <span className="text-foreground">代码规范</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">状态:</span>
                          <span className="text-success">已应用</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedDetail.type === "plugin" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>插件信息</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {isString(selectedDetail.config?.source) && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground shrink-0">来源:</span>
                            <span className="text-foreground">{selectedDetail.config.source}</span>
                          </div>
                        )}
                        {isString(selectedDetail.config?.path) && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-muted-foreground shrink-0">路径:</span>
                            <code className="px-2 py-1 rounded bg-secondary text-foreground font-mono text-[10px] break-all">
                              {selectedDetail.config.path}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Command className="h-4 w-4 text-muted-foreground" />
                      <span>所属编辑器</span>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-sm text-muted-foreground capitalize">{selectedDetail.editorName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!scanResult && !isScanning && (
        <div className="flex flex-col items-center justify-center rounded border border-border bg-card p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-secondary mb-4">
            <ScanLine className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">准备扫描</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            点击「开始扫描」按钮，我们将自动检测您系统中安装的 AI 编辑器及其配置
          </p>
        </div>
      )}

      {/* 添加编辑器对话框 */}
      {showAddDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={handleCloseAddDialog}
          onKeyDown={handleAddDialogKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="添加自定义编辑器"
        >
          <div
            className="w-full max-w-md mx-4 rounded border border-border bg-card shadow-lg overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">添加 AI 编辑器</h3>
                </div>
                <button
                  onClick={handleCloseAddDialog}
                  aria-label="关闭"
                  className="p-1.5 rounded hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3" onKeyDown={handleAddFormKeyDown}>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  标识名称 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newEditorName}
                  onChange={(e) => setNewEditorName(e.target.value)}
                  placeholder="例如: windsurf"
                  className="w-full px-3 py-2 rounded bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground mt-1">内部标识，仅支持英文和数字</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  显示名称 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newEditorDisplay}
                  onChange={(e) => setNewEditorDisplay(e.target.value)}
                  placeholder="例如: Windsurf"
                  className="w-full px-3 py-2 rounded bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  配置文件名 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newEditorConfigFiles}
                  onChange={(e) => setNewEditorConfigFiles(e.target.value)}
                  placeholder="例如: mcp.json"
                  className="w-full px-3 py-2 rounded bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">多个文件用逗号分隔</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  目录匹配模式 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newEditorDirPatterns}
                  onChange={(e) => setNewEditorDirPatterns(e.target.value)}
                  placeholder="例如: windsurf,.windsurf"
                  className="w-full px-3 py-2 rounded bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">用于匹配目录名，多个模式用逗号分隔</p>
              </div>

              {addFormError && (
                <div className="rounded bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-xs text-destructive">{addFormError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCloseAddDialog}
                  className="flex-1 px-4 py-2 rounded text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddCustomEditor}
                  className="flex-1 px-4 py-2 rounded text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
