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
    pub mcp_servers: Option<HashMap<String, serde_json::Value>>,
    pub skills: Option<Vec<String>>,
    pub rules: Option<Vec<String>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScanResult {
    pub editors: Vec<EditorConfig>,
    pub scan_time: String,
}

fn get_home_dir() -> Option<PathBuf> {
    dirs::home_dir()
}

/// 获取扫描起始目录（平台特定）
#[cfg(target_os = "macos")]
fn get_scan_directories() -> Vec<PathBuf> {
    let mut dirs = vec![];
    if let Some(home) = get_home_dir() {
        dirs.push(home.join("Library").join("Application Support"));
        dirs.push(home.join(".config"));
        dirs.push(home);
    }
    dirs
}

#[cfg(target_os = "windows")]
fn get_scan_directories() -> Vec<PathBuf> {
    let mut dirs = vec![];
    if let Some(home) = get_home_dir() {
        dirs.push(home.join("AppData").join("Roaming"));
        dirs.push(home.join("AppData").join("Local"));
        dirs.push(home);
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

/// 递归扫描目录查找配置文件
fn scan_directory(
    dir: &PathBuf,
    target_files: &[&str],
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
                    if target_files.iter().any(|&target| filename_str == target) {
                        results.push(path);
                    }
                }
            } else if path.is_dir() {
                if let Some(dirname) = path.file_name() {
                    let dirname_str = dirname.to_string_lossy();
                    if dirname_str.starts_with('.')
                        && dirname_str != ".cursor"
                        && dirname_str != ".trae"
                    {
                        continue;
                    }
                    if ["node_modules", "target", "build", "dist", "vendor"]
                        .contains(&dirname_str.as_ref())
                    {
                        continue;
                    }
                }

                results.extend(scan_directory(&path, target_files, max_depth, current_depth + 1));
            }
        }
    }

    results
}

/// 扫描指定目录下的子目录（用于扫描 skills）
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
                    // 排除隐藏目录和特殊目录
                    if !dirname_str.starts_with('.') && dirname_str != "_shared" {
                        results.push(dirname_str);
                    }
                }
            }
        }
    }

    results
}

/// 扫描指定目录下的 .md 文件（用于扫描 rules）
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

/// 验证找到的配置文件是否属于指定的编辑器
fn verify_editor_path(path: &PathBuf, editor_name: &str) -> bool {
    let path_str = path.to_string_lossy().to_lowercase();
    match editor_name {
        "cursor" => path_str.contains("cursor") && !path_str.contains("trae"),
        "trae" => path_str.contains("trae") && !path_str.contains("cursor"),
        "claude" => path_str.contains("claude"),
        _ => false,
    }
}

/// 查找编辑器的 skills 目录
fn find_skills_dir(editor_name: &str) -> Option<PathBuf> {
    let home = get_home_dir()?;

    let possible_paths: Vec<PathBuf> = match editor_name {
        "cursor" => vec![
            home.join(".cursor").join("skills"),
            home.join("Library").join("Application Support").join("Cursor").join("skills"),
        ],
        "trae" => vec![
            home.join(".trae-cn").join("skills"),
            home.join(".trae").join("skills"),
            home.join("Library").join("Application Support").join("Trae CN").join("skills"),
            home.join("Library").join("Application Support").join("Trae").join("skills"),
        ],
        "claude" => vec![
            home.join(".claude").join("skills"),
            home.join("Library").join("Application Support").join("Claude").join("skills"),
        ],
        _ => vec![],
    };

    for path in possible_paths {
        if path.exists() {
            return Some(path);
        }
    }

    None
}

/// 查找编辑器的 rules 目录
fn find_rules_dir(editor_name: &str) -> Option<PathBuf> {
    let home = get_home_dir()?;

    let possible_paths: Vec<PathBuf> = match editor_name {
        "cursor" => vec![
            home.join(".cursor").join("user_rules"),
            home.join(".cursor").join("rules"),
            home.join("Library").join("Application Support").join("Cursor").join("user_rules"),
        ],
        "trae" => vec![
            home.join(".trae-cn").join("user_rules"),
            home.join(".trae").join("user_rules"),
            home.join(".trae-cn").join("rules"),
            home.join(".trae").join("rules"),
            home.join("Library").join("Application Support").join("Trae CN").join("user_rules"),
            home.join("Library").join("Application Support").join("Trae").join("user_rules"),
        ],
        "claude" => vec![
            home.join(".claude").join("user_rules"),
            home.join(".claude").join("rules"),
            home.join("Library").join("Application Support").join("Claude").join("user_rules"),
        ],
        _ => vec![],
    };

    for path in possible_paths {
        if path.exists() {
            return Some(path);
        }
    }

    None
}

/// 智能查找编辑器配置
fn find_editor_config(editor_name: &str) -> (PathBuf, bool) {
    let scan_dirs = get_scan_directories();
    let target_files = match editor_name {
        "cursor" => vec!["mcp.json"],
        "trae" => vec!["mcp.json"],
        "claude" => vec!["claude_desktop_config.json"],
        _ => vec![],
    };

    // 首先检查特定关键词目录
    for dir in &scan_dirs {
        if !dir.exists() {
            continue;
        }

        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(dirname) = path.file_name() {
                        let dirname_str = dirname.to_string_lossy().to_lowercase();
                        // 严格匹配编辑器名称
                        let is_match = match editor_name {
                            "cursor" => dirname_str == "cursor" || dirname_str.starts_with("cursor "),
                            "trae" => dirname_str == "trae" || dirname_str.starts_with("trae ") || dirname_str == "trae cn",
                            "claude" => dirname_str.contains("claude"),
                            _ => false,
                        };
                        
                        if is_match {
                            for target in &target_files {
                                let config_path = path.join(target);
                                if config_path.exists() {
                                    return (config_path, true);
                                }
                            }
                            let found = scan_directory(&path, &target_files, 3, 0);
                            if let Some(first) = found.first() {
                                return (first.clone(), true);
                            }
                        }
                    }
                }
            }
        }
    }

    // 全局扫描 - 验证路径确实属于该编辑器
    for dir in &scan_dirs {
        if !dir.exists() {
            continue;
        }
        let found = scan_directory(dir, &target_files, 4, 0);
        for path in found {
            if verify_editor_path(&path, editor_name) {
                return (path, true);
            }
        }
    }

    // 未找到，返回空路径
    (PathBuf::from(""), false)
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

#[tauri::command]
fn scan_editors() -> ScanResult {
    let mut editors = Vec::new();

    // 扫描 Cursor
    let (cursor_path, cursor_exists) = find_editor_config("cursor");
    let cursor_mcp_servers = if cursor_exists {
        read_mcp_config(&cursor_path).ok().flatten()
    } else {
        None
    };
    let cursor_error = if cursor_exists {
        read_mcp_config(&cursor_path).err()
    } else {
        None
    };
    // 扫描 Cursor Skills 和 Rules
    let cursor_skills = find_skills_dir("cursor").map(|dir| scan_subdirectories(&dir));
    let cursor_rules = find_rules_dir("cursor").map(|dir| scan_markdown_files(&dir));

    editors.push(EditorConfig {
        name: "cursor".to_string(),
        display_name: "Cursor".to_string(),
        config_path: cursor_path.to_string_lossy().to_string(),
        exists: cursor_exists,
        mcp_servers: cursor_mcp_servers,
        skills: cursor_skills,
        rules: cursor_rules,
        error: cursor_error,
    });

    // 扫描 Trae
    let (trae_path, trae_exists) = find_editor_config("trae");
    let trae_mcp_servers = if trae_exists {
        read_mcp_config(&trae_path).ok().flatten()
    } else {
        None
    };
    let trae_error = if trae_exists {
        read_mcp_config(&trae_path).err()
    } else {
        None
    };
    // 扫描 Trae Skills 和 Rules
    let trae_skills = find_skills_dir("trae").map(|dir| scan_subdirectories(&dir));
    let trae_rules = find_rules_dir("trae").map(|dir| scan_markdown_files(&dir));

    editors.push(EditorConfig {
        name: "trae".to_string(),
        display_name: "Trae".to_string(),
        config_path: trae_path.to_string_lossy().to_string(),
        exists: trae_exists,
        mcp_servers: trae_mcp_servers,
        skills: trae_skills,
        rules: trae_rules,
        error: trae_error,
    });

    // 扫描 Claude
    let (claude_path, claude_exists) = find_editor_config("claude");
    let claude_mcp_servers = if claude_exists {
        read_mcp_config(&claude_path).ok().flatten()
    } else {
        None
    };
    let claude_error = if claude_exists {
        read_mcp_config(&claude_path).err()
    } else {
        None
    };
    // 扫描 Claude Skills 和 Rules
    let claude_skills = find_skills_dir("claude").map(|dir| scan_subdirectories(&dir));
    let claude_rules = find_rules_dir("claude").map(|dir| scan_markdown_files(&dir));

    editors.push(EditorConfig {
        name: "claude".to_string(),
        display_name: "Claude Desktop".to_string(),
        config_path: claude_path.to_string_lossy().to_string(),
        exists: claude_exists,
        mcp_servers: claude_mcp_servers,
        skills: claude_skills,
        rules: claude_rules,
        error: claude_error,
    });

    let scan_time = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    ScanResult {
        editors,
        scan_time,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![scan_editors])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
