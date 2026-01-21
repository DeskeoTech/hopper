---
description: Pull dev, bump version, create PR to main
argument-hint: [patch|minor|major]
model: haiku
allowed-tools: Bash(git checkout:*), Bash(git pull:*), Bash(git push:*), Bash(npm version:*), Bash(gh pr:*), Bash(node:*), Bash(git fetch:*), Bash(git merge:*), Bash(git add:*), Bash(git commit:*), Bash(npm install:*)
---

## Context

- Version type: $ARGUMENTS (default: patch)

## Task

Execute these commands in order:

1. `node -p "require('./package.json').version"` - Get and display current version
2. `git checkout dev`
3. `git pull origin dev`
4. `git fetch origin main`
5. `git merge origin/main -m "chore: sync dev with main"` - Sync dev with main to prevent PR conflicts
   - If merge conflicts occur on `package-lock.json`:
     1. Run `git checkout --theirs package-lock.json`
     2. Run `npm install` to regenerate the lock file
     3. Run `git add package-lock.json`
     4. Run `git commit -m "fix: resolve package-lock.json conflict"`
   - If merge conflicts occur on other files: STOP and inform the user
6. `npm version {type} -m "chore: bump to %s"` where {type} is $ARGUMENTS or "patch" if empty
7. `git push origin dev`
8. `gh pr create --base main --head dev --title "Deploy v{new_version} to production" --body "Release"`

Return the PR URL when done.
