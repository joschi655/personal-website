#!/usr/bin/env bash
set -euo pipefail
# Publish an allowlist, never backend source, notes, or secret files.
mkdir -p _site
cp index.html impressum.html styles.css _site/
cp -R assets dist _site/
mkdir -p _site/birdclock
cp birdclock/index.html birdclock/birds.json _site/birdclock/
cp -R birdclock/assets _site/birdclock/
touch _site/.nojekyll
