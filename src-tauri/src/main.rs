// Prevents additional console window on Windows in release. We're macOS-first
// but keep this gate for cross-platform parity.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    quanta_lib::run();
}
