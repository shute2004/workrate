use crate::{
    exchange::refresh_exchange_rate_internal,
    model::{
        lock_state, normalize_name, now_epoch_seconds, validate_hourly_rate, AppStateData,
        SharedState, TimerRecord,
    },
    storage::save_state,
};
use tauri::{AppHandle, State};

#[tauri::command]
pub(crate) fn get_app_state(state: State<'_, SharedState>) -> Result<AppStateData, String> {
    Ok(lock_state(&state)?.clone())
}

#[tauri::command]
pub(crate) fn create_timer(
    app: AppHandle,
    state: State<'_, SharedState>,
    name: String,
    hourly_rate_usd: f64,
) -> Result<AppStateData, String> {
    let name = normalize_name(name)?;
    validate_hourly_rate(hourly_rate_usd)?;

    let snapshot = {
        let mut data = lock_state(&state)?;
        data.timers.push(TimerRecord::new(name, hourly_rate_usd));
        data.clone()
    };

    save_state(&app, &snapshot)?;
    Ok(snapshot)
}

#[tauri::command]
pub(crate) fn update_timer(
    app: AppHandle,
    state: State<'_, SharedState>,
    id: String,
    name: String,
    hourly_rate_usd: f64,
) -> Result<AppStateData, String> {
    let name = normalize_name(name)?;
    validate_hourly_rate(hourly_rate_usd)?;

    let snapshot = {
        let mut data = lock_state(&state)?;
        let timer = data
            .timers
            .iter_mut()
            .find(|timer| timer.id == id)
            .ok_or_else(|| "タイマーが見つかりません".to_string())?;
        timer.name = name;
        timer.hourly_rate_usd = hourly_rate_usd;
        data.clone()
    };

    save_state(&app, &snapshot)?;
    Ok(snapshot)
}

#[tauri::command]
pub(crate) fn set_timer_running(
    app: AppHandle,
    state: State<'_, SharedState>,
    id: String,
    running: bool,
) -> Result<AppStateData, String> {
    let now = now_epoch_seconds();

    let snapshot = {
        let mut data = lock_state(&state)?;
        let timer = data
            .timers
            .iter_mut()
            .find(|timer| timer.id == id)
            .ok_or_else(|| "タイマーが見つかりません".to_string())?;
        timer.set_running(running, now);
        data.clone()
    };

    save_state(&app, &snapshot)?;
    Ok(snapshot)
}

#[tauri::command]
pub(crate) fn reset_timer(
    app: AppHandle,
    state: State<'_, SharedState>,
    id: String,
) -> Result<AppStateData, String> {
    let now = now_epoch_seconds();

    let snapshot = {
        let mut data = lock_state(&state)?;
        let timer = data
            .timers
            .iter_mut()
            .find(|timer| timer.id == id)
            .ok_or_else(|| "タイマーが見つかりません".to_string())?;
        timer.reset(now);
        data.clone()
    };

    save_state(&app, &snapshot)?;
    Ok(snapshot)
}

#[tauri::command]
pub(crate) fn delete_timer(
    app: AppHandle,
    state: State<'_, SharedState>,
    id: String,
) -> Result<AppStateData, String> {
    let snapshot = {
        let mut data = lock_state(&state)?;
        let previous_len = data.timers.len();
        data.timers.retain(|timer| timer.id != id);
        if data.timers.len() == previous_len {
            return Err("タイマーが見つかりません".to_string());
        }
        data.clone()
    };

    save_state(&app, &snapshot)?;
    Ok(snapshot)
}

#[tauri::command]
pub(crate) async fn refresh_exchange_rate(
    app: AppHandle,
    force: bool,
) -> Result<AppStateData, String> {
    refresh_exchange_rate_internal(&app, force).await
}
