use serde::{Deserialize, Serialize};
use std::{
    sync::{Mutex, MutexGuard},
    time::{SystemTime, UNIX_EPOCH},
};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TimerRecord {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) hourly_rate_usd: f64,
    pub(crate) accumulated_seconds: u64,
    pub(crate) is_running: bool,
    pub(crate) started_at: Option<u64>,
}

impl TimerRecord {
    pub(crate) fn new(name: String, hourly_rate_usd: f64) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            hourly_rate_usd,
            accumulated_seconds: 0,
            is_running: false,
            started_at: None,
        }
    }

    pub(crate) fn set_running(&mut self, running: bool, now: u64) {
        match (self.is_running, running) {
            (false, true) => {
                self.is_running = true;
                self.started_at = Some(now);
            }
            (true, false) => {
                if let Some(started_at) = self.started_at {
                    self.accumulated_seconds = self
                        .accumulated_seconds
                        .saturating_add(now.saturating_sub(started_at));
                }
                self.is_running = false;
                self.started_at = None;
            }
            _ => {}
        }
    }

    pub(crate) fn reset(&mut self, now: u64) {
        self.accumulated_seconds = 0;
        self.started_at = self.is_running.then_some(now);
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppStateData {
    pub(crate) timers: Vec<TimerRecord>,
    pub(crate) usd_jpy_rate: Option<f64>,
    pub(crate) exchange_rate_updated_at: Option<u64>,
}

pub(crate) type SharedState = Mutex<AppStateData>;

pub(crate) fn now_epoch_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

pub(crate) fn lock_state(state: &SharedState) -> Result<MutexGuard<'_, AppStateData>, String> {
    state
        .lock()
        .map_err(|_| "内部状態のロックに失敗しました".to_string())
}

pub(crate) fn normalize_name(name: String) -> Result<String, String> {
    let trimmed = name.trim().to_string();
    if trimmed.is_empty() {
        return Err("名前を入力してください".to_string());
    }
    Ok(trimmed)
}

pub(crate) fn validate_hourly_rate(hourly_rate_usd: f64) -> Result<(), String> {
    if !hourly_rate_usd.is_finite() || hourly_rate_usd < 0.0 {
        return Err("時給は0以上の数値を入力してください".to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn running_timer_accumulates_only_elapsed_time() {
        let mut timer = TimerRecord::new("Test".into(), 20.0);
        timer.set_running(true, 100);
        timer.set_running(false, 145);

        assert_eq!(timer.accumulated_seconds, 45);
        assert!(!timer.is_running);
        assert_eq!(timer.started_at, None);
    }

    #[test]
    fn reset_keeps_running_timer_running_from_reset_time() {
        let mut timer = TimerRecord::new("Test".into(), 20.0);
        timer.accumulated_seconds = 500;
        timer.set_running(true, 100);
        timer.reset(200);

        assert_eq!(timer.accumulated_seconds, 0);
        assert!(timer.is_running);
        assert_eq!(timer.started_at, Some(200));
    }

    #[test]
    fn validation_rejects_blank_name_and_invalid_rate() {
        assert!(normalize_name("   ".into()).is_err());
        assert!(validate_hourly_rate(-1.0).is_err());
        assert!(validate_hourly_rate(f64::NAN).is_err());
    }
}
