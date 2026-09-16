use crate::{
    model::{lock_state, now_epoch_seconds, AppStateData, SharedState},
    storage::save_state,
};
use serde_json::Value;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

pub(crate) const EXCHANGE_RATE_REFRESH_SECONDS: u64 = 60 * 60;
const EXCHANGE_RATE_URL: &str = "https://open.er-api.com/v6/latest/USD";

async fn fetch_usd_jpy_rate() -> Result<f64, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|error| format!("為替レート取得クライアントを作成できませんでした: {error}"))?;

    let response = client
        .get(EXCHANGE_RATE_URL)
        .send()
        .await
        .map_err(|error| format!("為替レートを取得できませんでした: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "為替レートAPIがエラーを返しました: {}",
            response.status()
        ));
    }

    let payload = response
        .json::<Value>()
        .await
        .map_err(|error| format!("為替レートの応答を解析できませんでした: {error}"))?;

    payload
        .get("rates")
        .and_then(|rates| rates.get("JPY"))
        .and_then(Value::as_f64)
        .filter(|rate| rate.is_finite() && *rate > 0.0)
        .ok_or_else(|| "USD/JPYレートが応答に含まれていませんでした".to_string())
}

pub(crate) async fn refresh_exchange_rate_internal(
    app: &AppHandle,
    force: bool,
) -> Result<AppStateData, String> {
    let now = now_epoch_seconds();
    let shared = app.state::<SharedState>();

    if !force {
        let current = lock_state(&shared)?;
        if current.exchange_rate_updated_at.is_some_and(|updated_at| {
            now.saturating_sub(updated_at) < EXCHANGE_RATE_REFRESH_SECONDS
        }) {
            return Ok(current.clone());
        }
    }

    let rate = match fetch_usd_jpy_rate().await {
        Ok(rate) => rate,
        Err(error) => {
            log::warn!("{error}");
            return Ok(lock_state(&shared)?.clone());
        }
    };

    let snapshot = {
        let mut data = lock_state(&shared)?;
        data.usd_jpy_rate = Some(rate);
        data.exchange_rate_updated_at = Some(now);
        data.clone()
    };

    save_state(app, &snapshot)?;
    let _ = app.emit("exchange-rate-updated", &snapshot);
    Ok(snapshot)
}

pub(crate) fn spawn_exchange_rate_refresh(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let _ = refresh_exchange_rate_internal(&app, false).await;
        loop {
            tokio::time::sleep(Duration::from_secs(EXCHANGE_RATE_REFRESH_SECONDS)).await;
            let _ = refresh_exchange_rate_internal(&app, true).await;
        }
    });
}
