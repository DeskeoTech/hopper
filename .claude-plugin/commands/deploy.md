---
description: Pull dev, bump version, create PR to main
argument-hint: [patch|minor|major]
model: haiku
allowed-tools: Bash(git checkout:*), Bash(git pull:*), Bash(git push:*), Bash(npm version:*), Bash(gh pr:*)
---

## Context

- Current version: !`node -p "require('./package.json').version"`
- Version type: $ARGUMENTS (default: patch)

## Task

Execute these commands in order. Stop if any fails:

1. `git checkout dev`
2. `git pull origin dev`
3. `npm version {type} -m "chore: bump to %s"` where {type} is $ARGUMENTS or "patch" if empty
4. `git push origin dev`
5. `gh pr create --base main --head dev --title "Deploy v{new_version} to production" --body "Release"`

Return the PR URL when done.
