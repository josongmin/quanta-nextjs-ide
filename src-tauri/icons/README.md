# Quanta — Icon set

Replace these placeholders with the production icon set before shipping.

Required by `tauri.conf.json` → `bundle.icon`:

```
icons/
├── 32x32.png            # 32×32   (1x)
├── 128x128.png          # 128×128 (1x)
├── 128x128@2x.png       # 256×256 (Retina)
├── icon.icns            # macOS app icon (multi-resolution .icns bundle)
└── icon.ico             # Windows fallback
```

Required by tray icon registration in `src/lib.rs`:

```
icons/tray-icon.png      # 22×22 monochrome PNG with alpha (rendered as
                          # template image — macOS tints automatically for
                          # light/dark menu bar)
```

## Generation

```bash
# After producing icon-source.png (1024×1024, transparent background):
npx @tauri-apps/cli icon icon-source.png --output icons
# Then create tray-icon.png at 22×22 (template):
sips -z 22 22 icon-source.png --out icons/tray-icon.png
```

The `--icon-as-template` flag in `lib.rs` requires the tray PNG to be a
black-on-transparent silhouette so macOS can invert it for dark mode.
