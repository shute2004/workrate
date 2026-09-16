mod commands;
mod exchange;
mod model;
mod storage;
mod tray;

use crate::{exchange::spawn_exchange_rate_refresh, storage::load_state};
use std::sync::Mutex;
use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_app_state,
            commands::create_timer,
            commands::update_timer,
            commands::set_timer_running,
            commands::reset_timer,
            commands::delete_timer,
            commands::refresh_exchange_rate,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            app.manage(Mutex::new(load_state(app.handle())));
            tray::setup_tray(app)?;
            spawn_exchange_rate_refresh(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Workrate");
}
