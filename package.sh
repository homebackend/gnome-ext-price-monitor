#!/bin/sh

ZIP_FILE=price-monitor-neerajcd@gmail.com.zip
DIST_DIR="dist"

npm run compile:schemas
npm run build
mkdir -p "$DIST_DIR"

cd "$DIST_DIR"
rm -rf metadata.json 
cp -r ../src/metadata.json ../src/schemas .

rm -f "$ZIP_FILE"
zip -qr "$ZIP_FILE" *.js schemas metadata.json 
