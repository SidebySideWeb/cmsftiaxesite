#!/bin/bash
# Script to run migration with automatic responses
# For each prompt, choose "rename" (~) to preserve existing data

cd "$(dirname "$0")/.."

# Answer prompts: ~ for rename, + for create
# We'll rename subtitle/description to content to preserve data
echo -e "~\n~\n~\n~\n~\n~\n~\n~\n~\n~" | pnpm import:frontend --tenant kalitechnia --path ../kalitechnia


