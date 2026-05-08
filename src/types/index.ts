export interface EditorConfig {
  name: string
  display_name: string
  config_path: string
  exists: boolean
  mcp_servers?: Record<string, unknown> | null
  skills?: string[] | null
  rules?: string[] | null
  error?: string | null
}

export interface ScanResult {
  editors: EditorConfig[]
  scan_time: string
}
