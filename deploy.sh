#!/bin/sh

EXTENSION=price-monitor-neerajcd@gmail.com
DEST_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION"

gnome-extensions disable "$EXTENSION"

npm run compile:schemas
npm run build

rm -rf "$DEST_DIR"

mkdir -p "$DEST_DIR"
cp dist/{extension,currencies,prefs}.js "$DEST_DIR"
cp src/metadata.json "$DEST_DIR/metadata.json"
cp -r src/schemas "$DEST_DIR"

gnome-extensions enable "$EXTENSION"

