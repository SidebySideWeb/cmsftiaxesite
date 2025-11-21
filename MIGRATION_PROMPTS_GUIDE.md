# Migration Prompts Guide

When running migrations or imports, you may encounter interactive prompts from Drizzle (the database migration tool). Here's what to answer for each prompt:

## Quick Reference

**Always choose RENAME (`~`) to preserve existing data**, unless you're intentionally creating new columns.

## Common Prompts and Answers

### 1. Content Column Prompts

**Prompt:** `Is content column in pages_blocks_<table> table created or renamed from another column?`

**Options:**
- `+ content` - create column (will lose existing data)
- `~ description › content` - rename description → content (preserves data) ✅
- `~ subtitle › content` - rename subtitle → content (preserves data) ✅

**Answer:** Choose `~ description › content` or `~ subtitle › content` (whichever appears)

---

### 2. Button Label Column Prompts

**Prompt:** `Is button_label column in pages_blocks_<table> table created or renamed from another column?`

**Options:**
- `+ button_label` - create column
- `~ cta_label › button_label` - rename cta_label → button_label ✅

**Answer:** Choose `~ cta_label › button_label` (FIRST `~` option)

---

### 3. Button URL Column Prompts

**Prompt:** `Is button_url column in pages_blocks_<table> table created or renamed from another column?`

**Options:**
- `+ button_url` - create column
- `~ cta_url › button_url` - rename cta_url → button_url ✅

**Answer:** Choose `~ cta_url › button_url` (SECOND `~` option)

---

## Navigation Tips

- Use **↑** and **↓** arrow keys to navigate between options
- Press **Enter** to confirm your selection
- Look for the `~` symbol which indicates "rename column"
- Always choose rename options to preserve existing data

## Complete Answer Sequence

When running `pnpm import:frontend` or `pnpm reset:tenant`, you may see multiple prompts. Answer them in this order:

1. **content in cta_banner** → `~ description › content`
2. **content in hero** → `~ subtitle › content`
3. **content in card_grid** → `~ subtitle › content`
4. **content in image_text** → `~ subtitle › content` or `~ description › content`
5. **content in image_gallery** → `~ subtitle › content`
6. **content in programs** → `~ subtitle › content`
7. **content in sponsors** → `~ subtitle › content`
8. **content in rich_text** → `~ subtitle › content`
9. **button_label in hero** → `~ cta_label › button_label` (first `~`)
10. **button_url in hero** → `~ cta_url › button_url` (second `~`)
11. **button_label in other blocks** → `~ cta_label › button_label`
12. **button_url in other blocks** → `~ cta_url › button_url`

## Automated Answers

If you want to automate this, you can pipe answers:

```bash
# Windows PowerShell
echo "~`n~`n~`n~`n~`n~`n~`n~`n~`n~`n~`n~" | pnpm import:frontend --tenant kalitechnia --path ..\kalitechnia

# Linux/Mac
echo -e "~\n~\n~\n~\n~\n~\n~\n~\n~\n~\n~\n~" | pnpm import:frontend --tenant kalitechnia --path ../kalitechnia
```

**Note:** Automated answers may not work perfectly if prompts require arrow key navigation. In that case, run the command interactively and use the guide above.

## Troubleshooting

### If you accidentally chose "create column" (+)

The old column data will be lost. You can:
1. Restore from database backup
2. Re-run the import script to populate new columns
3. Manually migrate data using SQL

### If prompts keep appearing

This usually means:
1. Schema changes detected by Drizzle
2. Need to run migrations first: `pnpm payload migrate`
3. Or columns need to be manually renamed using the fix-schema script

### If migration fails

Check:
1. Database connection is working
2. You have proper permissions
3. No conflicting migrations are running
4. Database is not locked

## Need Help?

If you're unsure about a prompt:
1. **Always choose RENAME (`~`)** - it's safer and preserves data
2. Check the table name in the prompt to understand which block it's for
3. Look for the column name pattern (description/subtitle → content, cta_* → button_*)

