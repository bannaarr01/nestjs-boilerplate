# AI Skills and Agent Usage

## Included Skills
Under `.claude/skills`:
- `sort-imports`
- `typescript-review`
- `security-audit`

## One-Time Codex Activation
macOS/Linux:
```bash
bash scripts/setup-codex-skills.sh
```

Windows:
```powershell
pwsh -File .\scripts\setup-codex-skills.ps1
```

This links shared project skills into your Codex skills directory.

## Agent Rules
See:
- `AGENTS.md`

Key points:
- no `git commit`/`git push` from agent
- prefer plan -> execute -> verify cycle
- keep API/security conventions consistent
