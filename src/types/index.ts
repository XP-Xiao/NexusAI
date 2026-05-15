export interface PluginAsset {
  name: string
  path: string
  source: string
}

export interface EditorConfig {
  name: string
  display_name: string
  config_path: string
  exists: boolean
  is_custom: boolean
  mcp_servers?: Record<string, unknown> | null
  skills?: string[] | null
  rules?: string[] | null
  plugins?: PluginAsset[] | null
  error?: string | null
}

export interface EditorDefinition {
  name: string
  display_name: string
  config_files: string[]
  dir_patterns: string[]
  skills_paths?: string[][]
  rules_paths?: string[][]
}

export interface ScanResult {
  editors: EditorConfig[]
  scan_time: string
}
