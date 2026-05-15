use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorConfig {
    pub name: String,
    pub display_name: String,
    pub config_path: String,
    pub exists: bool,
    pub is_custom: bool,
    pub mcp_servers: Option<HashMap<String, serde_json::Value>>,
    pub skills: Option<Vec<String>>,
    pub rules: Option<Vec<String>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorDefinition {
    pub name: String,
    pub display_name: String,
    pub config_files: Vec<String>,
    pub dir_patterns: Vec<String>,
    pub skills_paths: Vec<Vec<String>>,
    pub rules_paths: Vec<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub editors: Vec<EditorConfig>,
    pub scan_time: String,
}

fn get_home_dir() -> Option<PathBuf> {
    dirs::home_dir()
}

fn get_config_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("nexusai"))
}

fn get_default_editors() -> Vec<EditorDefinition> {
    vec![
        EditorDefinition {
            name: "trae".to_string(),
            display_name: "Trae".to_string(),
            config_files: vec!["mcp.json".to_string()],
            dir_patterns: vec![
                "trae".to_string(),
                "trae cn".to_string(),
                "trae-cn".to_string(),
                ".trae".to_string(),
                ".trae-cn".to_string(),
            ],
            skills_paths: vec![
                vec![".trae-cn".to_string(), "skills".to_string()],
                vec![".trae".to_string(), "skills".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Trae CN".to_string(), "skills".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Trae".to_string(), "skills".to_string()],
            ],
            rules_paths: vec![
                vec![".trae-cn".to_string(), "user_rules".to_string()],
                vec![".trae".to_string(), "user_rules".to_string()],
                vec![".trae-cn".to_string(), "rules".to_string()],
                vec![".trae".to_string(), "rules".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Trae CN".to_string(), "user_rules".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Trae".to_string(), "user_rules".to_string()],
            ],
        },
        EditorDefinition {
            name: "cursor".to_string(),
            display_name: "Cursor".to_string(),
            config_files: vec!["mcp.json".to_string()],
            dir_patterns: vec![
                "cursor".to_string(),
                ".cursor".to_string(),
            ],
            skills_paths: vec![
                vec![".cursor".to_string(), "skills".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Cursor".to_string(), "skills".to_string()],
            ],
            rules_paths: vec![
                vec![".cursor".to_string(), "user_rules".to_string()],
                vec![".cursor".to_string(), "rules".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Cursor".to_string(), "user_rules".to_string()],
            ],
        },
        EditorDefinition {
            name: "claude".to_string(),
            display_name: "Claude Code".to_string(),
            config_files: vec!["claude_desktop_config.json".to_string(), "mcp.json".to_string()],
            dir_patterns: vec![
                "claude".to_string(),
                "claude desktop".to_string(),
                ".claude".to_string(),
            ],
            skills_paths: vec![
                vec![".claude".to_string(), "skills".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Claude".to_string(), "skills".to_string()],
            ],
            rules_paths: vec![
                vec![".claude".to_string(), "user_rules".to_string()],
                vec![".claude".to_string(), "rules".to_string()],
                vec!["Library".to_string(), "Application Support".to_string(), "Claude".to_string(), "user_rules".to_string()],
            ],
        },
    ]
}

fn get_custom_editors_path() -> Option<PathBuf> {
    get_config_dir().map(|d| d.join("custom_editors.json"))
}

fn load_custom_editors() -> Vec<EditorDefinition> {
    let path = match get_custom_editors_path() {
        Some(p) => p,
        None => return vec![],
    };

    if !path.exists() {
        return vec![];
    }

    match fs::read_to_string(&path) {
        Ok(content) => {
            serde_json::from_str(&content).unwrap_or_default()
        }
        Err(_) => vec![],
    }
}

fn save_custom_editors(editors: &[EditorDefinition]) -> Result<(), String> {
    let config_dir = get_config_dir().ok_or("无法获取配置目录")?;
    fs::create_dir_all(&config_dir).map_err(|e| format!("创建配置目录失败: {}", e))?;

    let path = get_custom_editors_path().ok_or("无法获取配置文件路径")?;
    let content = serde_json::to_string_pretty(editors).map_err(|e| format!("序列化失败: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("写入文件失败: {}", e))?;

    Ok(())
}

fn get_all_editor_definitions() -> Vec<EditorDefinition> {
    let mut all = get_default_editors();
    let custom = load_custom_editors();
    all.extend(custom);
    all
}

#[cfg(target_os = "macos")]
fn get_scan_directories() -> Vec<PathBuf> {
    let mut dirs = vec![];
    if let Some(home) = get_home_dir() {
        dirs.push(home.join("Library").join("Application Support"));
        dirs.push(home.join(".config"));
        dirs.push(home.clone());
    }
    dirs
}

#[cfg(target_os = "windows")]
fn get_scan_directories() -> Vec<PathBuf> {
    let mut dirs = vec![];
    if let Some(home) = get_home_dir() {
        dirs.push(home.join("AppData").join("Roaming"));
        dirs.push(home.join("AppData").join("Local"));
        dirs.push(home.clone());
    }
    dirs
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn get_scan_directories() -> Vec<PathBuf> {
    let mut dirs = vec![];
    if let Some(home) = get_home_dir() {
        dirs.push(home.join(".config"));
        dirs.push(home);
    }
    dirs
}

fn should_skip_dir(dirname: &str) -> bool {
    let skip = ["node_modules", "target", "build", "dist", "vendor", ".git", ".svn", "__pycache__"];
    skip.contains(&dirname)
}

fn scan_directory(
    dir: &PathBuf,
    target_files: &[String],
    max_depth: usize,
    current_depth: usize,
) -> Vec<PathBuf> {
    let mut results = vec![];

    if current_depth > max_depth {
        return results;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();

            if path.is_file() {
                if let Some(filename) = path.file_name() {
                    let filename_str = filename.to_string_lossy();
                    if target_files.iter().any(|t| filename_str == t.as_str()) {
                        results.push(path);
                    }
                }
            } else if path.is_dir() {
                if let Some(dirname) = path.file_name() {
                    let dirname_str = dirname.to_string_lossy();
                    if should_skip_dir(&dirname_str) {
                        continue;
                    }
                }

                results.extend(scan_directory(&path, target_files, max_depth, current_depth + 1));
            }
        }
    }

    results
}

fn scan_subdirectories(dir: &PathBuf) -> Vec<String> {
    let mut results = vec![];

    if !dir.exists() {
        return results;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(dirname) = path.file_name() {
                    let dirname_str = dirname.to_string_lossy().to_string();
                    if !dirname_str.starts_with('.') && dirname_str != "_shared" {
                        results.push(dirname_str);
                    }
                }
            }
        }
    }

    results
}

fn scan_markdown_files(dir: &PathBuf) -> Vec<String> {
    let mut results = vec![];

    if !dir.exists() {
        return results;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(filename) = path.file_name() {
                    let filename_str = filename.to_string_lossy().to_string();
                    if filename_str.ends_with(".md") {
                        results.push(filename_str);
                    }
                }
            }
        }
    }

    results
}

fn path_matches_pattern(path: &PathBuf, pattern: &str) -> bool {
    let path_lower = path.to_string_lossy().to_lowercase();
    let pattern_lower = pattern.to_lowercase();

    if let Some(parent) = path.parent() {
        let parent_lower = parent.to_string_lossy().to_lowercase();
        if parent_lower.ends_with(&format!("/{}", pattern_lower))
            || parent_lower.ends_with(&format!("\\{}", pattern_lower))
            || parent_lower == pattern_lower
        {
            return true;
        }
    }

    path_lower.contains(&format!("/{}/", pattern_lower))
        || path_lower.contains(&format!("\\{}\\", pattern_lower))
        || path_lower.contains(&format!("/{}", pattern_lower))
        || path_lower.contains(&format!("\\{}", pattern_lower))
}

fn match_editor_for_path(path: &PathBuf, definition: &EditorDefinition) -> bool {
    for pattern in &definition.dir_patterns {
        if path_matches_pattern(path, pattern) {
            return true;
        }
    }

    let path_str = path.to_string_lossy().to_string();
    for config_file in &definition.config_files {
        if path_str.ends_with(config_file) {
            let prefix = &path_str[..path_str.len() - config_file.len()];
            let prefix_lower = prefix.to_lowercase();
            for pattern in &definition.dir_patterns {
                if prefix_lower.contains(&pattern.to_lowercase()) {
                    return true;
                }
            }
        }
    }

    false
}

fn find_editor_config(definition: &EditorDefinition) -> (PathBuf, bool, bool) {
    let scan_dirs = get_scan_directories();
    let target_files = &definition.config_files;
    let mut editor_dir: Option<PathBuf> = None;

    // 首先查找编辑器配置目录
    for dir in &scan_dirs {
        if !dir.exists() {
            continue;
        }

        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(dirname) = path.file_name() {
                        let dirname_lower = dirname.to_string_lossy().to_lowercase();
                        let is_match = definition.dir_patterns.iter().any(|p| {
                            dirname_lower == p.to_lowercase()
                                || dirname_lower.starts_with(&format!("{} ", p.to_lowercase()))
                        });

                        if is_match {
                            editor_dir = Some(path.clone());
                            // 查找配置文件
                            for target in target_files {
                                let config_path = path.join(target);
                                if config_path.exists() {
                                    return (config_path, true, true);
                                }
                            }
                            // 在目录内递归查找配置文件
                            let found = scan_directory(&path, target_files, 3, 0);
                            if let Some(first) = found.first() {
                                return (first.clone(), true, true);
                            }
                        }
                    }
                }
            }
        }
    }

    // 全局搜索配置文件
    for dir in &scan_dirs {
        if !dir.exists() {
            continue;
        }
        let found = scan_directory(dir, target_files, 4, 0);
        for path in found {
            if match_editor_for_path(&path, definition) {
                return (path, true, true);
            }
        }
    }

    // 如果找到了编辑器目录但没有配置文件，返回目录路径
    if let Some(dir) = editor_dir {
        return (dir, true, false);
    }

    (PathBuf::from(""), false, false)
}

fn find_skills_dir(definition: &EditorDefinition) -> Option<PathBuf> {
    let home = get_home_dir()?;

    for path_parts in &definition.skills_paths {
        let mut full_path = home.clone();
        for part in path_parts {
            full_path = full_path.join(part);
        }
        if full_path.exists() {
            return Some(full_path);
        }
    }

    None
}

fn find_rules_dir(definition: &EditorDefinition) -> Option<PathBuf> {
    let home = get_home_dir()?;

    for path_parts in &definition.rules_paths {
        let mut full_path = home.clone();
        for part in path_parts {
            full_path = full_path.join(part);
        }
        if full_path.exists() {
            return Some(full_path);
        }
    }

    None
}

fn read_mcp_config(path: &PathBuf) -> Result<Option<HashMap<String, serde_json::Value>>, String> {
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path).map_err(|e| format!("读取文件失败: {}", e))?;

    if content.trim().is_empty() {
        return Ok(None);
    }

    let config: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("JSON 格式错误: {}", e))?;

    let mcp_servers = config
        .get("mcpServers")
        .and_then(|v| v.as_object())
        .map(|obj| obj.iter().map(|(k, v)| (k.clone(), v.clone())).collect());

    Ok(mcp_servers)
}

fn scan_single_editor(definition: &EditorDefinition, is_custom: bool) -> EditorConfig {
    let (config_path, exists, has_config_file) = find_editor_config(definition);
    
    // 只有在存在配置文件时才尝试读取 MCP 配置
    let mcp_servers = if exists && has_config_file {
        read_mcp_config(&config_path).ok().flatten()
    } else {
        None
    };
    
    let error = if exists && has_config_file {
        read_mcp_config(&config_path).err()
    } else {
        None
    };
    
    let skills = find_skills_dir(definition).map(|dir| scan_subdirectories(&dir));
    let rules = find_rules_dir(definition).map(|dir| scan_markdown_files(&dir));

    EditorConfig {
        name: definition.name.clone(),
        display_name: definition.display_name.clone(),
        config_path: config_path.to_string_lossy().to_string(),
        exists,
        is_custom,
        mcp_servers,
        skills,
        rules,
        error,
    }
}

#[tauri::command]
fn scan_editors() -> ScanResult {
    let definitions = get_all_editor_definitions();
    let default_names: Vec<String> = get_default_editors().iter().map(|d| d.name.clone()).collect();

    let editors: Vec<EditorConfig> = definitions
        .iter()
        .map(|def| {
            let is_custom = !default_names.contains(&def.name);
            scan_single_editor(def, is_custom)
        })
        .collect();

    let scan_time = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    ScanResult {
        editors,
        scan_time,
    }
}

#[tauri::command]
fn add_custom_editor(
    name: String,
    display_name: String,
    config_files: Vec<String>,
    dir_patterns: Vec<String>,
) -> Result<Vec<EditorDefinition>, String> {
    if name.trim().is_empty() {
        return Err("编辑器名称不能为空".to_string());
    }
    if display_name.trim().is_empty() {
        return Err("显示名称不能为空".to_string());
    }
    if config_files.is_empty() {
        return Err("至少需要一个配置文件名".to_string());
    }
    if dir_patterns.is_empty() {
        return Err("至少需要一个目录匹配模式".to_string());
    }

    let existing_defaults = get_default_editors();
    if existing_defaults.iter().any(|d| d.name == name) {
        return Err(format!("'{}' 是内置编辑器，不能覆盖", name));
    }

    let mut custom_editors = load_custom_editors();
    if custom_editors.iter().any(|d| d.name == name) {
        return Err(format!("'{}' 已存在", name));
    }

    let definition = EditorDefinition {
        name: name.clone(),
        display_name: display_name.clone(),
        config_files,
        dir_patterns,
        skills_paths: vec![],
        rules_paths: vec![],
    };

    custom_editors.push(definition);
    save_custom_editors(&custom_editors)?;

    Ok(custom_editors)
}

#[tauri::command]
fn remove_custom_editor(name: String) -> Result<Vec<EditorDefinition>, String> {
    let existing_defaults = get_default_editors();
    if existing_defaults.iter().any(|d| d.name == name) {
        return Err(format!("'{}' 是内置编辑器，不能删除", name));
    }

    let mut custom_editors = load_custom_editors();
    let original_len = custom_editors.len();
    custom_editors.retain(|d| d.name != name);

    if custom_editors.len() == original_len {
        return Err(format!("未找到 '{}'", name));
    }

    save_custom_editors(&custom_editors)?;

    Ok(custom_editors)
}

#[tauri::command]
fn list_custom_editors() -> Vec<EditorDefinition> {
    load_custom_editors()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_editors,
            add_custom_editor,
            remove_custom_editor,
            list_custom_editors
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}