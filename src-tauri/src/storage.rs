use crate::model::AppStateData;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

fn state_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("保存先を取得できませんでした: {error}"))?;
    Ok(dir.join("state.json"))
}

pub(crate) fn load_state(app: &AppHandle) -> AppStateData {
    let Ok(path) = state_path(app) else {
        return AppStateData::default();
    };

    let Ok(bytes) = fs::read(&path) else {
        return AppStateData::default();
    };

    match serde_json::from_slice::<AppStateData>(&bytes) {
        Ok(state) => state,
        Err(error) => {
            log::error!("failed to parse state file {}: {error}", path.display());
            AppStateData::default()
        }
    }
}

pub(crate) fn save_state(app: &AppHandle, state: &AppStateData) -> Result<(), String> {
    let path = state_path(app)?;
    let parent = path
        .parent()
        .ok_or_else(|| "保存先ディレクトリを取得できませんでした".to_string())?;
    fs::create_dir_all(parent).map_err(|error| format!("保存先を作成できませんでした: {error}"))?;

    let temp_path = parent.join("state.json.tmp");
    let body = serde_json::to_vec_pretty(state)
        .map_err(|error| format!("状態をシリアライズできませんでした: {error}"))?;
    fs::write(&temp_path, body).map_err(|error| format!("状態を書き込めませんでした: {error}"))?;
    fs::rename(&temp_path, &path)
        .map_err(|error| format!("状態ファイルを更新できませんでした: {error}"))?;
    Ok(())
}
