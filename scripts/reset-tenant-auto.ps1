# PowerShell script to reset tenant with automatic answers to migration prompts
# This script pipes answers to handle all Drizzle migration prompts automatically

param(
    [Parameter(Mandatory=$true)]
    [string]$Tenant
)

Write-Host "🔄 Resetting tenant: $Tenant" -ForegroundColor Yellow
Write-Host "📝 Pre-answering all migration prompts..." -ForegroundColor Cyan
Write-Host ""

# Answers for migration prompts (one per line)
# Format: ~ for rename, + for create
# Order matters - answer each prompt as it appears
$answers = @(
    "~",  # content in cta_banner: rename description → content
    "~",  # content in hero: rename subtitle → content  
    "~",  # content in card_grid: rename subtitle → content
    "~",  # content in image_text: rename subtitle/description → content
    "~",  # content in image_gallery: rename subtitle/description → content
    "~",  # content in programs: rename subtitle/description → content
    "~",  # content in sponsors: rename subtitle/description → content
    "~",  # content in rich_text: rename subtitle/description → content
    "~",  # button_label in hero: rename cta_label → button_label (first ~ option)
    "~",  # button_url in hero: rename cta_url → button_url (second ~ option)
    "~",  # button_label in other blocks: rename cta_label → button_label
    "~",  # button_url in other blocks: rename cta_url → button_url
    "y"   # Confirm migration if asked
) -join "`n"

# Run the reset script with piped answers
$answers | pnpm reset:tenant --tenant $Tenant

Write-Host ""
Write-Host "✅ Reset complete!" -ForegroundColor Green

