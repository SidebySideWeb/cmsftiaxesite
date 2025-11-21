# Migration Prompt Answers Guide

When running `pnpm import:frontend --tenant kalitechnia --path ..\kalitechnia`, you will encounter interactive prompts. Here are the **exact answers** to select:

## Prompt 1: `content` column in `pages_blocks_cta_banner`
**Question:** Is content column in pages_blocks_cta_banner table created or renamed from another column?

**Answer:** 
- Use arrow keys to select: `~ description › content rename column`
- Press Enter

**Reason:** Rename `description` → `content` to preserve existing data.

---

## Prompt 2: `content` column in `pages_blocks_hero`
**Question:** Is content column in pages_blocks_hero table created or renamed from another column?

**Answer:**
- Use arrow keys to select: `~ subtitle › content rename column`
- Press Enter

**Reason:** Rename `subtitle` → `content` to preserve existing data.

---

## Prompt 3: `button_label` column in `pages_blocks_hero`
**Question:** Is button_label column in pages_blocks_hero table created or renamed from another column?

**Answer:**
- Use arrow keys to select: `~ cta_label › button_label rename column` (FIRST `~` option)
- Press Enter

**Reason:** Rename `cta_label` → `button_label` to preserve existing data.

---

## Prompt 4: `button_url` column in `pages_blocks_hero`
**Question:** Is button_url column in pages_blocks_hero table created or renamed from another column?

**Answer:**
- Use arrow keys to select: `~ cta_url › button_url rename column` (SECOND `~` option)
- Press Enter

**Reason:** Rename `cta_url` → `button_url` to preserve existing data.

---

## Quick Reference

| Column | Table | Action | Select |
|--------|-------|--------|--------|
| `content` | `pages_blocks_cta_banner` | Rename `description` → `content` | `~ description › content` |
| `content` | `pages_blocks_hero` | Rename `subtitle` → `content` | `~ subtitle › content` |
| `button_label` | `pages_blocks_hero` | Rename `cta_label` → `button_label` | `~ cta_label › button_label` (first ~) |
| `button_url` | `pages_blocks_hero` | Rename `cta_url` → `button_url` | `~ cta_url › button_url` (second ~) |

## Navigation Tips

- Use **↑** and **↓** arrow keys to navigate between options
- Press **Enter** to confirm your selection
- Look for the `~` symbol which indicates "rename column"
- Always choose rename options to preserve existing data

