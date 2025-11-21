import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

dotenvConfig();

import { uploadMediaIfNeeded } from "./helpers/media.js";
import { upsertDocument } from "./helpers/upsert.js";
import { mapBlocks } from "./helpers/blockMapper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive script to scan all frontend pages and populate CMS
 * Extracts content from all page.tsx files and maps to CMS blocks
 */
export async function scanAllPages(tenantCode, frontendSitePath) {
  console.log(`\n🔍 Scanning all pages for tenant: ${tenantCode}`);
  console.log(`📂 Frontend site path: ${frontendSitePath}\n`);

  // Load config
  let config;
  try {
    console.log("📋 Loading Payload config...");
    const configPath = path.resolve(__dirname, "../../payload.config.ts");
    const configUrl = path.isAbsolute(configPath)
      ? `file:///${configPath.replace(/\\/g, "/")}`
      : configPath;
    const configModule = await import(configUrl);
    config = configModule.default;
    console.log("✓ Payload config loaded\n");
  } catch (err) {
    console.error("✗ Failed to load Payload config:", err);
    process.exit(1);
  }

  // Init Payload
  let payload;
  try {
    payload = await getPayload({ config });
    console.log("✓ Connected to Payload CMS\n");
  } catch (err) {
    console.error("✗ Failed to connect to Payload CMS:", err);
    process.exit(1);
  }

  // Resolve frontend site path
  const projectRoot = process.cwd();
  let sitePath;
  if (path.isAbsolute(frontendSitePath)) {
    sitePath = frontendSitePath;
  } else if (frontendSitePath.startsWith("..")) {
    sitePath = path.resolve(projectRoot, frontendSitePath);
  } else {
    sitePath = path.resolve(projectRoot, "..", frontendSitePath);
  }

  if (!fs.existsSync(sitePath)) {
    console.error(`✗ Frontend site not found: ${sitePath}`);
    process.exit(1);
  }

  try {
    // 1. Create/Update Tenant
    console.log("📋 Creating/updating tenant...");
    const tenantId = await createOrUpdateTenant(payload, tenantCode, sitePath);
    console.log(`   ✓ Tenant ready (ID: ${tenantId})\n`);

    // 2. Upload Images
    console.log("🖼️  Uploading images...");
    await uploadImages(payload, tenantId, tenantCode, sitePath);
    console.log("   ✓ Images processed\n");

    // 3. Scan all pages
    console.log("📄 Scanning all pages...");
    const pages = await scanPages(sitePath);
    console.log(`   ✓ Found ${pages.length} page(s)\n`);

    // 4. Extract page data and create/update pages in CMS
    const pageMap = {};
    for (const pageInfo of pages) {
      console.log(`   📄 Processing: ${pageInfo.slug}...`);
      try {
        const pageData = await extractPageData(pageInfo.filePath, pageInfo.content, pageInfo.slug, sitePath, payload, tenantId, tenantCode);
        if (pageData) {
          const pageId = await createOrUpdatePage(payload, tenantId, pageData, tenantCode);
          pageMap[pageInfo.slug] = pageId;
          console.log(`   ✓ Page ${pageInfo.slug} processed (ID: ${pageId})`);
        }
      } catch (err) {
        console.error(`   ✗ Error processing ${pageInfo.slug}:`, err.message);
      }
    }
    console.log("");

    console.log("✅ Scan complete!\n");
    console.log(`📊 Summary:`);
    console.log(`   - Pages processed: ${pages.length}`);
    console.log(`   - Tenant: ${tenantCode} (ID: ${tenantId})\n`);

  } catch (err) {
    console.error("\n✗ Error during scan:", err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

/**
 * Scan all page.tsx files in the app directory
 */
async function scanPages(sitePath) {
  const pages = [];
  const appDir = path.join(sitePath, "app");

  if (!fs.existsSync(appDir)) {
    console.log("   ⚠ No app directory found");
    return pages;
  }

  // Find all page.tsx files recursively
  const pageFiles = findPageFiles(appDir);

  for (const pageFile of pageFiles) {
    try {
      const relativePath = path.relative(appDir, pageFile);
      const slug = getSlugFromPath(relativePath);
      const content = fs.readFileSync(pageFile, "utf-8");

      console.log(`   📖 Reading: ${relativePath} → slug: ${slug}`);

      // Extract page data (will be populated after payload is initialized)
      pages.push({
        filePath: pageFile,
        content: content,
        slug: slug,
      });
    } catch (err) {
      console.log(`   ⚠ Error reading ${pageFile}: ${err.message}`);
    }
  }

  return pages;
}

/**
 * Extract data from a page file
 */
async function extractPageData(filePath, content, slug, sitePath, payload, tenantId, tenantCode) {
  const pageData = {
    slug,
    title: extractPageTitle(content, slug),
    blocks: [],
  };

  // Extract blocks based on page type
  if (slug === "homepage" || slug === "") {
    pageData.blocks = await extractHomepageBlocks(content, sitePath, payload, tenantId, tenantCode);
  } else if (slug === "programs") {
    pageData.blocks = await extractProgramsPageBlocks(content, sitePath, payload, tenantId, tenantCode);
  } else if (slug === "registration") {
    pageData.blocks = await extractRegistrationPageBlocks(content, sitePath, payload, tenantId, tenantCode);
  } else {
    // Generic page - extract all sections
    pageData.blocks = await extractGenericPageBlocks(content, sitePath, payload, tenantId, tenantCode);
  }

  return pageData;
}

/**
 * Extract blocks for homepage
 */
async function extractHomepageBlocks(content, sitePath, payload, tenantId, tenantCode) {
  const blocks = [];

  // 1. Hero Section
  const heroBlock = await extractHeroBlock(content, sitePath, payload, tenantId, tenantCode);
  if (heroBlock) blocks.push(heroBlock);

  // 2. Welcome Section (ImageText)
  const welcomeBlock = await extractWelcomeBlock(content, sitePath, payload, tenantId, tenantCode);
  if (welcomeBlock) blocks.push(welcomeBlock);

  // 3. Programs Section (CardGrid)
    const programsBlock = await extractProgramsSection(content, sitePath, payload, tenantId, tenantCode);
    if (programsBlock) blocks.push(programsBlock);

  // 4. Moments Section (ImageGallery)
    const momentsBlock = await extractMomentsSection(content, sitePath, payload, tenantId, tenantCode);
    if (momentsBlock) blocks.push(momentsBlock);

  // 5. Latest News Section (RichText - posts are fetched dynamically)
  // Skip - posts are fetched via API

  // 6. Sponsors Section
  const sponsorsBlock = extractSponsorsSection(content, sitePath);
  if (sponsorsBlock) blocks.push(sponsorsBlock);

  // 7. Newsletter CTA
  const ctaBlock = extractCtaBlock(content, sitePath);
  if (ctaBlock) blocks.push(ctaBlock);

  return blocks;
}

/**
 * Extract Hero Block
 */
async function extractHeroBlock(content, sitePath, payload, tenantId, tenantCode) {
  // Look for hero section patterns
  const heroPatterns = [
    /<section[^>]*className[^>]*hero[^>]*>([\s\S]*?)<\/section>/i,
    /<section[^>]*relative[^>]*overflow-hidden[^>]*>([\s\S]*?)<\/section>/i,
  ];

  for (const pattern of heroPatterns) {
    const match = content.match(pattern);
    if (match) {
      const sectionContent = match[1];
      
      // Extract title
      const titleMatch = sectionContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                        sectionContent.match(/text-5xl[^>]*>([\s\S]*?)</i);
      const title = titleMatch ? cleanText(titleMatch[1]) : null;

      // Extract image
      const imageMatch = sectionContent.match(/src=["']([^"']+)["']/i) ||
                        sectionContent.match(/Image[^>]*src=["']([^"']+)["']/i);
      const imageUrl = imageMatch ? imageMatch[1] : null;

      // Extract button
      const buttonMatch = sectionContent.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Link>/i) ||
                        sectionContent.match(/href=["']([^"']+)["'][^>]*>([\s\S]*?)</i);
      const buttonUrl = buttonMatch ? buttonMatch[1] : null;
      const buttonLabel = buttonMatch ? cleanText(buttonMatch[2]) : null;

      if (title || imageUrl) {
        let imageId = undefined;
        if (imageUrl && payload && tenantId) {
          imageId = await uploadImageIfNeeded(imageUrl, sitePath, payload, tenantId, tenantCode);
        }
        
        return {
          blockType: "hero",
          blockLabel: "Hero Section",
          title: title || undefined,
          backgroundImage: imageId,
          buttonLabel: buttonLabel || undefined,
          buttonUrl: buttonUrl || undefined,
        };
      }
    }
  }

  return null;
}

/**
 * Extract Welcome Block (ImageText)
 */
async function extractWelcomeBlock(content, sitePath, payload, tenantId, tenantCode) {
  // Look for welcome section
  const welcomePatterns = [
    /Καλώς\s+ήρθατε[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i,
    /Welcome[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i,
  ];

  for (const pattern of welcomePatterns) {
    const match = content.match(pattern);
    if (match) {
      const sectionContent = match[1];
      
      // Extract title
      const titleMatch = sectionContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const title = titleMatch ? cleanText(titleMatch[1]) : null;

      // Extract content paragraphs
      const paragraphs = [];
      const pMatches = sectionContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
      for (const pMatch of pMatches) {
        const text = cleanText(pMatch[1]);
        if (text) paragraphs.push(text);
      }
      const contentText = paragraphs.join("\n\n");

      // Extract image
      const imageMatch = sectionContent.match(/src=["']([^"']+)["']/i);
      const imageUrl = imageMatch ? imageMatch[1] : null;

      if (title || contentText || imageUrl) {
        let imageId = undefined;
        if (imageUrl && payload && tenantId) {
          imageId = await uploadImageIfNeeded(imageUrl, sitePath, payload, tenantId, tenantCode);
        }
        
        return {
          blockType: "imageText",
          blockLabel: "Welcome Section",
          title: title || undefined,
          content: contentText ? htmlToLexical(`<p>${contentText}</p>`) : undefined,
          image: imageId,
          imagePosition: "left",
        };
      }
    }
  }

  return null;
}

/**
 * Extract Programs Section (CardGrid)
 */
async function extractProgramsSection(content, sitePath, payload, tenantId, tenantCode) {
  // Look for "Τα Τμήματά μας" or "Programs" section
  const programsPattern = /Τα\s+Τμήματά\s+μας[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i;
  const match = content.match(programsPattern);
  
  if (!match) return null;

  const sectionContent = match[1];
  
  // Extract title and subtitle
  const titleMatch = sectionContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : "Τα Τμήματά μας";
  
  const subtitleMatch = sectionContent.match(/<p[^>]*text-center[^>]*>([\s\S]*?)<\/p>/i);
  const subtitle = subtitleMatch ? cleanText(subtitleMatch[1]) : "Προσφέρουμε προγράμματα για όλες τις ηλικίες και τα επίπεδα";

  // Extract cards
  const cards = [];
  const cardMatches = sectionContent.matchAll(/<Card[^>]*>([\s\S]*?)<\/Card>/gi);
  
  for (const cardMatch of cardMatches) {
    const cardContent = cardMatch[1];
    
    // Extract card image
    const imageMatch = cardContent.match(/src=["']([^"']+)["']/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    // Extract card title
    const cardTitleMatch = cardContent.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const cardTitle = cardTitleMatch ? cleanText(cardTitleMatch[1]) : null;

    // Extract card description
    const descMatch = cardContent.match(/<p[^>]*text-muted[^>]*>([\s\S]*?)<\/p>/i);
    const description = descMatch ? cleanText(descMatch[1]) : null;

    // Extract button
    const buttonMatch = cardContent.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Link>/i);
    const buttonUrl = buttonMatch ? buttonMatch[1] : null;
    const buttonLabel = buttonMatch ? cleanText(buttonMatch[2]) : null;

    if (cardTitle || imageUrl) {
      let imageId = undefined;
      if (imageUrl && payload && tenantId) {
        imageId = await uploadImageIfNeeded(imageUrl, sitePath, payload, tenantId, tenantCode);
      }
      
      cards.push({
        image: imageId,
        title: cardTitle || undefined,
        content: description ? htmlToLexical(`<p>${description}</p>`) : undefined,
        buttonLabel: buttonLabel || undefined,
        buttonUrl: buttonUrl || undefined,
      });
    }
  }

  if (cards.length > 0) {
    return {
      blockType: "cardGrid",
      blockLabel: "Programs Section",
      title: title,
      subtitle: subtitle,
      cards: cards,
    };
  }

  return null;
}

/**
 * Extract Moments Section (ImageGallery)
 */
async function extractMomentsSection(content, sitePath, payload, tenantId, tenantCode) {
  // Look for "Οι Στιγμές μας" or "Moments" section
  const momentsPattern = /Οι\s+Στιγμές\s+μας|Moments[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i;
  const match = content.match(momentsPattern);
  
  if (!match) return null;

  const sectionContent = match[1];
  
  // Extract title and subtitle
  const titleMatch = sectionContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : "Οι Στιγμές μας";
  
  const subtitleMatch = sectionContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const subtitle = subtitleMatch ? cleanText(subtitleMatch[1]) : "Ζήστε τη μαγεία των παραστάσεων και των προπονήσεων μας";

  // Extract images
  const images = [];
  const imageMatches = sectionContent.matchAll(/<Image[^>]*src=["']([^"']+)["'][^>]*>/gi);
  
  for (const imageMatch of imageMatches) {
    const imageUrl = imageMatch[1];
    if (imageUrl && !imageUrl.includes('logo') && !imageUrl.includes('icon')) {
      let imageId = undefined;
      if (payload && tenantId) {
        imageId = await uploadImageIfNeeded(imageUrl, sitePath, payload, tenantId, tenantCode);
      }
      images.push({
        image: imageId,
      });
    }
  }

  if (images.length > 0) {
    return {
      blockType: "imageGallery",
      blockLabel: "Moments Gallery",
      title: title,
      subtitle: subtitle,
      images: images,
    };
  }

  return null;
}

/**
 * Extract Sponsors Section
 */
function extractSponsorsSection(content, sitePath) {
  // Look for sponsors section
  const sponsorsPattern = /Υποστηρικτές|Sponsors[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i;
  const match = content.match(sponsorsPattern);
  
  if (!match) return null;

  const sectionContent = match[1];
  
  const titleMatch = sectionContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : "Οι Υποστηρικτές μας";
  
  const subtitleMatch = sectionContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const subtitle = subtitleMatch ? cleanText(subtitleMatch[1]) : "Ευχαριστούμε θερμά τους υποστηρικτές μας";

  // Extract sponsor logos (if any in the future)
  const sponsors = [];

  return {
    blockType: "sponsors",
    blockLabel: "Sponsors",
    title: title,
    subtitle: subtitle,
    sponsors: sponsors,
  };
}

/**
 * Extract CTA Block
 */
function extractCtaBlock(content, sitePath) {
  // Look for CTA banner
  const ctaPatterns = [
    /newsletter|CTA|Call to Action[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i,
    /gradient-purple-orange[\s\S]*?<section[^>]*>([\s\S]*?)<\/section>/i,
  ];

  for (const pattern of ctaPatterns) {
    const match = content.match(pattern);
    if (match) {
      const sectionContent = match[1];
      
      const titleMatch = sectionContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const title = titleMatch ? cleanText(titleMatch[1]) : null;

      const descMatch = sectionContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const description = descMatch ? cleanText(descMatch[1]) : null;

      const buttonMatch = sectionContent.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Link>/i);
      const buttonUrl = buttonMatch ? buttonMatch[1] : null;
      const buttonLabel = buttonMatch ? cleanText(buttonMatch[2]) : null;

      if (title) {
        return {
          blockType: "ctaBanner",
          blockLabel: "Newsletter CTA",
          title: title,
          content: description ? htmlToLexical(`<p>${description}</p>`) : undefined,
          buttonLabel: buttonLabel || undefined,
          buttonUrl: buttonUrl || undefined,
        };
      }
    }
  }

  return null;
}

/**
 * Extract Programs Page Blocks
 */
async function extractProgramsPageBlocks(content, sitePath, payload, tenantId, tenantCode) {
  const blocks = [];

  // Extract each program section with timetable and coach
  const programSections = content.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi);
  
  for (const sectionMatch of programSections) {
    const sectionContent = sectionMatch[1];
    
    // Check if this is a program section (has title and description)
    const titleMatch = sectionContent.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (!titleMatch) continue;

    const programTitle = cleanText(titleMatch[1]);
    
    // Extract program image
    const imageMatch = sectionContent.match(/src=["']([^"']+)["']/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;

    // Extract description
    const descMatches = sectionContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    const descriptions = [];
    for (const descMatch of descMatches) {
      const text = cleanText(descMatch[1]);
      if (text && !text.includes('href') && !text.includes('http')) {
        descriptions.push(text);
      }
    }
    const description = descriptions.join("\n\n");

    // Extract timetable
    const timetable = extractTimetable(sectionContent);

    // Extract coach info
    const coach = await extractCoachInfo(sectionContent, sitePath, payload, tenantId, tenantCode);

    // Extract button
    const buttonMatch = sectionContent.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Link>/i);
    const buttonUrl = buttonMatch ? buttonMatch[1] : null;
    const buttonLabel = buttonMatch ? cleanText(buttonMatch[2]) : null;

    blocks.push({
      blockType: "programs",
      blockLabel: "Programs",
      programs: [{
        title: programTitle,
        image: imageUrl && payload && tenantId ? await uploadImageIfNeeded(imageUrl, sitePath, payload, tenantId, tenantCode) : undefined,
        content: description ? htmlToLexical(`<p>${description}</p>`) : undefined,
        timetable: timetable,
        coach: coach,
        buttonLabel: buttonLabel || undefined,
        buttonUrl: buttonUrl || undefined,
      }],
    });
  }

  return blocks;
}

/**
 * Extract timetable from section
 */
function extractTimetable(sectionContent) {
  // Look for table or schedule
  const tableMatch = sectionContent.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return null;

  const tableContent = tableMatch[1];
  const schedule = [];

  // Extract table rows
  const rowMatches = tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const rowMatch of rowMatches) {
    const rowContent = rowMatch[1];
    const cellMatches = rowContent.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    const cells = Array.from(cellMatches).map(m => cleanText(m[1]));
    
    if (cells.length >= 3) {
      schedule.push({
        day: cells[0] || "",
        time: cells[1] || "",
        level: cells[2] || "",
      });
    }
  }

  if (schedule.length > 0) {
    return {
      title: "Εβδομαδιαίο Πρόγραμμα",
      schedule: schedule,
    };
  }

  return null;
}

/**
 * Extract coach information
 */
async function extractCoachInfo(sectionContent, sitePath, payload, tenantId, tenantCode) {
  // Look for coach section
  const coachPattern = /Προπονητής|Coach[\s\S]*?<h[34][^>]*>([\s\S]*?)<\/h[34]/i;
  const coachMatch = sectionContent.match(coachPattern);
  
  if (!coachMatch) return null;

  const coachSection = sectionContent.substring(coachMatch.index);
  
  // Extract coach name
  const nameMatch = coachSection.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
  const name = nameMatch ? cleanText(nameMatch[1]) : null;

  // Extract coach photo
  const photoMatch = coachSection.match(/src=["']([^"']+)["']/i);
  const photoUrl = photoMatch ? photoMatch[1] : null;

  // Extract coach bio
  const bioMatches = coachSection.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  const bioTexts = [];
  for (const bioMatch of bioMatches) {
    const text = cleanText(bioMatch[1]);
    if (text) bioTexts.push(text);
  }
  const bio = bioTexts.join("\n\n");

  if (name) {
    return {
      title: "Προπονητής/τρια",
      name: name,
      photo: photoUrl && payload && tenantId ? await uploadImageIfNeeded(photoUrl, sitePath, payload, tenantId, tenantCode) : undefined,
      bio: bio ? htmlToLexical(`<p>${bio}</p>`) : undefined,
    };
  }

  return null;
}

/**
 * Extract Registration Page Blocks
 */
async function extractRegistrationPageBlocks(content, sitePath, payload, tenantId, tenantCode) {
  const blocks = [];

  // Extract contact details sections
  const contactPattern = /Διεύθυνση|Τηλέφωνο|Email|Ωράριο[\s\S]*?<Card[^>]*>([\s\S]*?)<\/Card>/gi;
  const cardMatches = content.matchAll(contactPattern);

  const items = [];
  for (const cardMatch of cardMatches) {
    const cardContent = cardMatch[1];
    
    // Determine icon type
    let icon = "location";
    if (cardContent.includes("Τηλέφωνο") || cardContent.includes("Phone")) icon = "phone";
    else if (cardContent.includes("Email") || cardContent.includes("@")) icon = "email";
    else if (cardContent.includes("Ωράριο") || cardContent.includes("Hours")) icon = "clock";

    // Extract title
    const titleMatch = cardContent.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const title = titleMatch ? cleanText(titleMatch[1]) : null;

    // Extract content
    const contentMatches = cardContent.matchAll(/<[^>]*>([\s\S]*?)</gi);
    const contentTexts = [];
    for (const contentMatch of contentMatches) {
      const text = cleanText(contentMatch[1]);
      if (text && text !== title) contentTexts.push(text);
    }
    const contentText = contentTexts.join("\n");

    if (title) {
      items.push({
        title: title,
        icon: icon,
        content: contentText ? htmlToLexical(`<p>${contentText}</p>`) : undefined,
      });
    }
  }

  if (items.length > 0) {
    blocks.push({
      blockType: "contactDetails",
      blockLabel: "Contact Details",
      items: items,
    });
  }

  return blocks;
}

/**
 * Extract generic page blocks
 */
async function extractGenericPageBlocks(content, sitePath, payload, tenantId, tenantCode) {
  const blocks = [];

  // Extract hero if exists
  const heroBlock = await extractHeroBlock(content, sitePath, payload, tenantId, tenantCode);
  if (heroBlock) blocks.push(heroBlock);

  // Extract image-text sections
  const imageTextBlocks = await extractImageTextBlocks(content, sitePath, payload, tenantId, tenantCode);
  blocks.push(...imageTextBlocks);

  // Extract rich text sections
  const richTextBlocks = extractRichTextBlocks(content, sitePath);
  blocks.push(...richTextBlocks);

  return blocks;
}

/**
 * Extract ImageText blocks
 */
async function extractImageTextBlocks(content, sitePath, payload, tenantId, tenantCode) {
  const blocks = [];
  const sectionMatches = content.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi);

  for (const sectionMatch of sectionMatches) {
    const sectionContent = sectionMatch[1];
    
    // Check if has both image and text
    const hasImage = /<Image|<img/i.test(sectionContent);
    const hasText = /<h[12]|<p/i.test(sectionContent);

    if (hasImage && hasText) {
      const imageMatch = sectionContent.match(/src=["']([^"']+)["']/i);
      const imageUrl = imageMatch ? imageMatch[1] : null;

      const titleMatch = sectionContent.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
      const title = titleMatch ? cleanText(titleMatch[1]) : null;

      const pMatches = sectionContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
      const paragraphs = [];
      for (const pMatch of pMatches) {
        const text = cleanText(pMatch[1]);
        if (text) paragraphs.push(text);
      }
      const contentText = paragraphs.join("\n\n");

      if (title || contentText || imageUrl) {
        blocks.push({
          blockType: "imageText",
          blockLabel: "Image & Text",
          title: title || undefined,
          content: contentText ? htmlToLexical(`<p>${contentText}</p>`) : undefined,
          image: imageUrl && payload && tenantId ? await uploadImageIfNeeded(imageUrl, sitePath, payload, tenantId, tenantCode) : undefined,
          imagePosition: "left",
        });
      }
    }
  }

  return blocks;
}

/**
 * Extract RichText blocks
 */
function extractRichTextBlocks(content, sitePath) {
  const blocks = [];
  const sectionMatches = content.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi);

  for (const sectionMatch of sectionMatches) {
    const sectionContent = sectionMatch[1];
    
    // Skip if has images or complex structure
    if (/<Image|<img|<Card/i.test(sectionContent)) continue;

    const pMatches = sectionContent.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    const paragraphs = [];
    for (const pMatch of pMatches) {
      const text = cleanText(pMatch[1]);
      if (text) paragraphs.push(text);
    }

    if (paragraphs.length > 0) {
      blocks.push({
        blockType: "richText",
        blockLabel: "Content",
        content: htmlToLexical(`<p>${paragraphs.join("</p><p>")}</p>`),
      });
    }
  }

  return blocks;
}

/**
 * Helper functions
 */
function findPageFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and .next
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        }
      } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function getSlugFromPath(relativePath) {
  // Remove page.tsx
  let slug = relativePath.replace(/\/page\.(tsx|js)$/i, '');
  
  // Handle root page
  if (slug === 'page' || slug === '') {
    return 'homepage';
  }
  
  // Handle [slug] dynamic routes - skip for now
  if (slug.includes('[') && slug.includes(']')) {
    return null; // Skip dynamic routes
  }
  
  return slug.replace(/\\/g, '/');
}

function extractPageTitle(content, slug) {
  // Try to extract from metadata
  const metadataMatch = content.match(/title:\s*["']([^"']+)["']/i) ||
                        content.match(/metadata.*?title.*?["']([^"']+)["']/is);
  if (metadataMatch) return metadataMatch[1];

  // Try to extract from first h1
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) return cleanText(h1Match[1]);

  // Fallback to slug
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}

function cleanText(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToLexical(html) {
  if (!html || typeof html !== "string") {
    return {
      root: {
        children: [],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    };
  }

  const children = [];
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gis;
  const matches = html.match(paragraphRegex) || [];

  if (matches.length === 0) {
    const textContent = html.replace(/<[^>]*>/g, "").trim();
    if (textContent) {
      children.push({
        children: [{
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: textContent,
          type: "text",
          version: 1,
        }],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      });
    }
  } else {
    matches.forEach((m) => {
      const content = m.replace(/<\/?p[^>]*>/gi, "").trim();
      if (content) {
        children.push({
          children: [{
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: content.replace(/<[^>]*>/g, ""),
            type: "text",
            version: 1,
          }],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        });
      }
    });
  }

  if (children.length === 0) {
    children.push({
      children: [],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "paragraph",
      version: 1,
    });
  }

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

async function uploadImageIfNeeded(imageUrl, sitePath, payload, tenantId, tenantCode) {
  if (!imageUrl || !payload || !tenantId) return undefined;
  
  try {
    // Check if image is already uploaded (by filename)
    const filename = imageUrl.split('/').pop().split('?')[0]; // Remove query params
    const existingMedia = await payload.find({
      collection: "media",
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { filename: { equals: filename } },
        ],
      },
      limit: 1,
    });

    if (existingMedia.docs.length > 0) {
      return existingMedia.docs[0].id;
    }

    // If it's a URL (http/https), download it first
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const downloadedPath = await downloadImage(imageUrl, sitePath, tenantCode);
        if (downloadedPath && fs.existsSync(downloadedPath)) {
          const mediaId = await uploadMediaIfNeeded(payload, downloadedPath, tenantId, filename, tenantCode);
          // Clean up downloaded file
          try {
            fs.unlinkSync(downloadedPath);
          } catch (e) {
            // Ignore cleanup errors
          }
          return mediaId;
        }
      } catch (err) {
        console.log(`   ⚠ Could not download image ${imageUrl}: ${err.message}`);
        return undefined;
      }
    }

    // Try to find local file
    const projectRoot = process.cwd();
    let fullPath;
    
    // Check if it's a relative path from public directory
    if (imageUrl.startsWith('/')) {
      const relativePath = imageUrl.replace(/^\//, '');
      fullPath = path.join(projectRoot, 'public', relativePath);
    } else {
      // Try to resolve from sitePath
      fullPath = path.isAbsolute(imageUrl) ? imageUrl : path.join(sitePath, imageUrl);
    }

    if (fs.existsSync(fullPath)) {
      const mediaId = await uploadMediaIfNeeded(payload, fullPath, tenantId, filename, tenantCode);
      return mediaId;
    } else {
      console.log(`   ⚠ Image file not found: ${fullPath}`);
      return undefined;
    }
  } catch (err) {
    console.log(`   ⚠ Could not upload image ${imageUrl}: ${err.message}`);
    return undefined;
  }
}

async function createOrUpdateTenant(payload, tenantCode, sitePath) {
  // Find or create tenant
  const existingTenants = await payload.find({
    collection: "tenants",
    where: {
      code: {
        equals: tenantCode,
      },
    },
    limit: 1,
  });

  let tenantId;
  if (existingTenants.docs.length > 0) {
    tenantId = existingTenants.docs[0].id;
  } else {
    // Extract tenant name from site path or use code
    const tenantName = tenantCode.charAt(0).toUpperCase() + tenantCode.slice(1);
    
    const newTenant = await payload.create({
      collection: "tenants",
      data: {
        code: tenantCode,
        name: tenantName,
        slug: tenantCode,
      },
    });
    tenantId = newTenant.id;
  }

  return tenantId;
}

async function uploadImages(payload, tenantId, tenantCode, sitePath) {
  // Reuse existing uploadImages function logic
  // This is a placeholder - the actual implementation would scan for images
  // and upload them to Payload CMS
  console.log("   📤 Image upload will be handled during block processing");
}

async function createOrUpdatePage(payload, tenantId, pageData, tenantCode) {
  // Map blocks using the blockMapper
  const mappedBlocks = await mapBlocks(pageData.blocks, payload, tenantId, tenantCode);

  // Create or update page
  const pageDoc = await upsertDocument(
    payload,
    "pages",
    {
      slug: {
        equals: pageData.slug,
      },
      tenant: {
        equals: tenantId,
      },
    },
    {
      slug: pageData.slug,
      title: pageData.title,
      tenant: tenantId,
      blocks: mappedBlocks,
    }
  );

  return pageDoc.id;
}

/**
 * Download image from URL to temporary file
 */
async function downloadImage(url, sitePath, tenantCode) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const filename = path.basename(urlObj.pathname) || 'image.jpg';
    
    // Create temp directory
    const projectRoot = process.cwd();
    const tempDir = path.join(projectRoot, 'temp', tenantCode || 'downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, filename);
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlinkSync(filePath); // Delete the file on error
      reject(err);
    });
  });
}

