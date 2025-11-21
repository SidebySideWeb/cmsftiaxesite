# Quick Migration Answers Guide

## TL;DR: Always Answer `~` (Rename)

When you see migration prompts, **always choose the `~` option** (rename column) to preserve existing data.

## Common Prompts

| Prompt | Answer | Why |
|--------|--------|-----|
| `content` column | `~ description › content` or `~ subtitle › content` | Preserves existing text data |
| `button_label` column | `~ cta_label › button_label` | Preserves existing button labels |
| `button_url` column | `~ cta_url › button_url` | Preserves existing button URLs |

## Navigation

- **Arrow Keys**: Navigate up/down
- **Enter**: Confirm selection
- **`~`**: Means "rename" (preserves data) ✅
- **`+`**: Means "create" (loses data) ❌

## Example Session

```
Prompt: Is content column in pages_blocks_hero table created or renamed?
Options:
  ❯ + content            create column
    ~ subtitle › content  rename column  ← SELECT THIS

Answer: Press ↓ then Enter
```

## Automated (if needed)

```bash
# Windows PowerShell
echo "~`n~`n~`n~`n~`n~`n~`n~`n~`n~`n~`n~" | pnpm import:frontend --tenant kalitechnia --path ..\kalitechnia
```

**Remember**: If unsure, always choose `~` (rename)!

