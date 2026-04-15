#!/bin/bash

INPUT=$(cat)

# Validate JSON input
if ! echo "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo "ERROR: Invalid JSON input" >&2
  exit 1
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Validate command exists
if [[ -z "$COMMAND" || "$COMMAND" == "null" ]]; then
  echo "ERROR: Missing or empty command in input" >&2
  exit 1
fi

DANGEROUS_PATTERNS=(
  "git push"
  "git reset --hard"
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
  "push --force"
  "reset --hard"
)

# Normalize command: strip flags to find the actual subcommand
# Handles cases like `git -C /path push` or `git -c user.name=x reset --hard`
tokens=($COMMAND)
normalized="git"
found_subcommand=false

for ((i=1; i<${#tokens[@]}; i++)); do
  token="${tokens[$i]}"
  if [[ "$found_subcommand" == "true" ]]; then
    normalized="$normalized $token"
  elif [[ "$token" == -* ]]; then
    # Skip flag and its potential value for common git global options
    if [[ "$token" == "-C" || "$token" == "-c" || "$token" == "--git-dir" || "$token" == "--work-tree" || "$token" == "-p" ]]; then
      ((i++))
    fi
    continue
  else
    # First non-flag token after 'git' is the subcommand
    normalized="$normalized $token"
    found_subcommand=true
  fi
done

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$normalized" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. This command is restricted to prevent accidental data loss or unauthorized changes." >&2
    exit 2
  fi
done

exit 0
