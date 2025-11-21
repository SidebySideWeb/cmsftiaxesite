# Deployment Guide for Hertzner Server

## Quick Deployment Steps

1. **SSH into server:**
   ```bash
   ssh root@your-hertzner-ip
   ```

2. **Navigate to CMS directory:**
   ```bash
   cd /var/www/cmsftiaxesite
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Install new dependencies (if package.json changed):**
   ```bash
   pnpm install
   ```

5. **Generate Payload types:**
   ```bash
   pnpm generate:types
   ```

6. **Build the project:**
   ```bash
   pnpm build
   ```

7. **Restart PM2:**
   ```bash
   pm2 restart cmsftiaxesite
   ```

8. **Check logs:**
   ```bash
   pm2 logs cmsftiaxesite --lines 50
   ```

## What's New in This Deployment

- ✅ 10 new Payload block types (FAQ, Tabs, Video, Slider, Testimonials, LogoCloud, PricingTable, ContactForm, Map, FeatureList)
- ✅ V0 → Payload Block Mapping Engine
- ✅ Fixed admin panel access control (superadmins can now see all pages)
- ✅ Improved navigation menu delete error handling

## Verification

After deployment, verify:
1. Visit `https://cms.ftiaxesite.gr/admin`
2. Create/edit a page
3. Check that all new block types are available in the block selector
4. Verify pages are visible (if you're a superadmin)

