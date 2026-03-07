#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

SOURCE_DIR="${1:-${REPO_ROOT}/.claude/skills}"
CODEX_HOME="${CODEX_HOME:-${HOME}/.codex}"
TARGET_DIR="${2:-${CODEX_HOME}/skills}"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Source skills directory not found: ${SOURCE_DIR}" >&2
  exit 1
fi

mkdir -p "${TARGET_DIR}"

linked_count=0

for skill_dir in "${SOURCE_DIR}"/*; do
  [[ -d "${skill_dir}" ]] || continue
  [[ -f "${skill_dir}/SKILL.md" ]] || continue

  skill_name="$(basename "${skill_dir}")"
  link_path="${TARGET_DIR}/${skill_name}"

  if [[ -L "${link_path}" ]]; then
    rm "${link_path}"
  elif [[ -e "${link_path}" ]]; then
    backup_path="${link_path}.backup.${TIMESTAMP}"
    mv "${link_path}" "${backup_path}"
    echo "Backed up existing ${skill_name} to ${backup_path}"
  fi

  ln -s "${skill_dir}" "${link_path}"
  echo "Linked ${skill_name} -> ${link_path}"
  linked_count=$((linked_count + 1))
done

if [[ "${linked_count}" -eq 0 ]]; then
  echo "No skills found in ${SOURCE_DIR}."
  exit 1
fi

echo "Codex skill activation complete. Linked ${linked_count} skill(s) into ${TARGET_DIR}."

