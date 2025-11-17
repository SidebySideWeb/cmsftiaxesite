import { config as dotenvConfig } from "dotenv";
import { getPayload } from "payload";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Load environment variables
dotenvConfig();

import { uploadMediaIfNeeded } from "./helpers/media.js";
import { upsertDocument } from "./helpers/upsert.js";
import { mapBlocks } from "./helpers/blockMapper.js";

// Get current file directory for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------------------------------------
// MAIN IMPORT FUNCTION
// -------------------------------------------------------------
// Global counter for generating unique card IDs across all pages
let globalCardIdCounter = Date.now() * 1000;

export async function importFrontendSite(tenantCode, frontendSitePath) {
  console.log(`\n🚀 Starting import for tenant: ${tenantCode}`);
  console.log(`📂 Frontend site path: ${frontendSitePath}\n`);
  
  // Reset global counter at start of import
  globalCardIdCounter = Date.now() * 1000;

  // Load config
  let config;
  try {
    console.log("📋 Loading Payload config...");
    const configPath = path.resolve(__dirname, "../../payload.config.ts");
    // Convert to file:// URL for Windows compatibility
    const configUrl = path.isAbsolute(configPath)
      ? `file:///${configPath.replace(/\\/g, "/")}`
      : configPath;
    const configModule = await import(configUrl);
    config = configModule.default;
    console.log("✓ Payload config loaded\n");
  } catch (err) {
    console.error("✗ Failed to load Payload config:", err);
    if (err.stack) console.error("Stack:", err.stack);
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
    // Relative path starting with .. - resolve from project root
    sitePath = path.resolve(projectRoot, frontendSitePath);
  } else {
    // Relative path - assume it's a sibling directory
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

    // 2. Delete all existing pages for this tenant to avoid uniqueness conflicts
    // This also cascades to delete all card grid cards
    console.log("🗑️  Deleting existing pages...");
    try {
      const existingPages = await payload.find({
        collection: "pages",
        where: {
          tenant: {
            equals: tenantId,
          },
        },
        limit: 1000,
        depth: 0,
      });
      
      if (existingPages.docs.length > 0) {
        for (const page of existingPages.docs) {
          try {
            await payload.delete({
              collection: "pages",
              id: page.id,
            });
          } catch (err) {
            console.log(`   ⚠️  Could not delete page ${page.id}: ${err.message}`);
          }
        }
        console.log(`   ✓ Deleted ${existingPages.docs.length} existing page(s)\n`);
        
        // Wait a moment to ensure cascade deletes complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log("   ✓ No existing pages to delete\n");
      }
    } catch (err) {
      console.log(`   ⚠️  Error deleting existing pages: ${err.message}\n`);
    }

    // 3. Upload Images
    console.log("🖼️  Uploading images...");
    await uploadImages(payload, tenantId, tenantCode, sitePath);
    console.log("   ✓ Images uploaded\n");

    // 4. Extract and Create Pages
    console.log("📄 Extracting pages...");
    const pages = await extractPages(sitePath);
    console.log(`   ✓ Found ${pages.length} page(s)\n`);

    const pageMap = {};
    for (const page of pages) {
      console.log(`   📄 Creating page: ${page.slug}...`);
      const pageId = await createPage(payload, tenantId, page, tenantCode);
      pageMap[page.slug] = pageId;
      console.log(`   ✓ Page created: ${page.title} (ID: ${pageId})`);
    }
    console.log("");

    // 4b. Posts are managed through CMS, not imported from frontend
    // (Posts extraction skipped - add posts manually through Payload admin)

    // 5. Extract and Create Navigation Menu
    console.log("🔗 Creating navigation menu...");
    const menuId = await createNavigationMenu(payload, tenantId, sitePath, pageMap);
    console.log(`   ✓ Navigation menu created (ID: ${menuId})\n`);

    // 6. Extract and Create Header
    console.log("📌 Creating header...");
    const headerId = await createHeader(payload, tenantId, menuId, tenantCode, sitePath);
    console.log(`   ✓ Header created (ID: ${headerId})\n`);

    // 7. Extract and Create Footer
    console.log("📎 Creating footer...");
    const footerId = await createFooter(payload, tenantId, sitePath, pageMap);
    console.log(`   ✓ Footer created (ID: ${footerId})\n`);

    console.log("🎉 Import completed successfully!\n");
  } catch (err) {
    console.error("✗ Import ERROR:", err);
    if (err.stack) console.error("Stack:", err.stack);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// CREATE OR UPDATE TENANT
// -------------------------------------------------------------
async function createOrUpdateTenant(payload, tenantCode, sitePath) {
  // Try to read package.json for project name
  const packageJsonPath = path.join(sitePath, "package.json");
  let projectName = tenantCode;

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      projectName = packageJson.name || tenantCode;
    } catch (err) {
      // Use default
    }
  }

  // Extract domain from site path or use default
  const domain = `${tenantCode}.gr`;

  return upsertDocument(
    payload,
    "tenants",
    { code: { equals: tenantCode } },
    {
      projectName: projectName,
      code: tenantCode,
      domains: [{ domain: domain }],
      status: "active",
    }
  );
}

// -------------------------------------------------------------
// UPLOAD IMAGES
// -------------------------------------------------------------
async function uploadImages(payload, tenantId, tenantCode, sitePath) {
  // Check multiple possible public directories
  const publicDirs = [
    path.join(sitePath, "public"),
    path.join(sitePath, "code", "public"),
    path.join(sitePath, "clean-code", "public"),
  ];

  let publicDir = null;
  for (const dir of publicDirs) {
    if (fs.existsSync(dir)) {
      publicDir = dir;
      break;
    }
  }

  if (!publicDir) {
    console.log("   ⚠ No public directory found, skipping image upload");
    return;
  }

  // Create target directory in CMS
  const targetDir = path.join(process.cwd(), "public", "sync-assets", tenantCode);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy and upload images
  const imageExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp", ".gif"];
  const files = getAllFiles(publicDir);

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
      const relativePath = path.relative(publicDir, file);
      const targetPath = path.join(targetDir, relativePath);

      // Create subdirectories if needed
      const targetDirPath = path.dirname(targetPath);
      if (!fs.existsSync(targetDirPath)) {
        fs.mkdirSync(targetDirPath, { recursive: true });
      }

      // Copy file
      fs.copyFileSync(file, targetPath);
      console.log(`   📤 Copied: ${relativePath}`);

      // Upload to Payload
      const alt = path.basename(file, ext);
      await uploadMediaIfNeeded(payload, `/sync-assets/${tenantCode}/${relativePath}`, tenantId, alt, tenantCode);
    }
  }
}

// -------------------------------------------------------------
// EXTRACT PAGES
// -------------------------------------------------------------
async function extractPages(sitePath) {
  const pages = [];
  const appDirs = [
    path.join(sitePath, "app"),
    path.join(sitePath, "code", "app"),
    path.join(sitePath, "clean-code", "app"),
  ];

  let appDir = null;
  for (const dir of appDirs) {
    if (fs.existsSync(dir)) {
      appDir = dir;
      break;
    }
  }

  if (!appDir) {
    console.log("   ⚠ No app directory found");
    return pages;
  }

  // Find all page.tsx files
  const pageFiles = findPageFiles(appDir);

  for (const pageFile of pageFiles) {
    const relativePath = path.relative(appDir, pageFile);
    const slug = getSlugFromPath(relativePath);
    let content = fs.readFileSync(pageFile, "utf-8");

    // Check if page uses component imports (component-based architecture)
    const componentImports = content.matchAll(/import\s+(\w+)\s+from\s+["']@\/components\/(\w+)["']/g);
    const componentMatches = Array.from(componentImports);
    
    // Map component names to data object names
    const componentToDataMap = {
      Hero: "defaultHero",
      Features: "defaultFeatures",
      Process: "defaultProcess",
      ContactForm: "defaultContact",
      Contact: "defaultContact",
    };
    
    // Read data.ts if it exists
    let dataValues = {};
    const dataFile = path.join(sitePath, "lib", "data.ts");
    if (fs.existsSync(dataFile)) {
      try {
        const dataContent = fs.readFileSync(dataFile, "utf-8");
        // Extract defaultHero, defaultFeatures, etc. by searching for each field individually
        for (const [compName, dataName] of Object.entries(componentToDataMap)) {
          // Find the start of the object definition
          const objStartPattern = new RegExp(`export\\s+const\\s+${dataName}\\s*=\\s*{`, "g");
          const objStartMatch = objStartPattern.exec(dataContent);
          
          if (objStartMatch) {
            const startIndex = objStartMatch.index + objStartMatch[0].length;
            // Find the matching closing brace by counting braces
            let braceCount = 1;
            let endIndex = startIndex;
            for (let i = startIndex; i < dataContent.length && braceCount > 0; i++) {
              if (dataContent[i] === '{') braceCount++;
              if (dataContent[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
            
            const objContent = dataContent.substring(startIndex, endIndex);
            
            // Extract key fields using regex
            const headlineMatch = objContent.match(/headline:\s*["']([^"']+)["']/);
            const titleMatch = objContent.match(/title:\s*["']([^"']+)["']/);
            const subtitleMatch = objContent.match(/subtitle:\s*["']([^"']+)["']/);
            const subheadlineMatch = objContent.match(/subheadline:\s*["']([^"']+)["']/);
            const ctaMatch = objContent.match(/cta:\s*["']([^"']+)["']/);
            const imageMatch = objContent.match(/image:\s*["']([^"']+)["']/);
            
            dataValues[dataName] = {
              headline: headlineMatch ? headlineMatch[1] : "",
              title: titleMatch ? titleMatch[1] : "",
              subtitle: subtitleMatch ? subtitleMatch[1] : "",
              subheadline: subheadlineMatch ? subheadlineMatch[1] : "",
              cta: ctaMatch ? ctaMatch[1] : "",
              image: imageMatch ? imageMatch[1] : "",
            };
            
            // Extract items array for Features
            if (dataName === "defaultFeatures" && objContent.includes("items:")) {
              const itemsStart = objContent.indexOf("items:");
              if (itemsStart >= 0) {
                const itemsContent = objContent.substring(itemsStart);
                const itemMatches = itemsContent.matchAll(/icon:\s*["']([^"']+)["'][\s\S]*?title:\s*["']([^"']+)["'][\s\S]*?description:\s*["']([^"']+)["']/g);
                dataValues[dataName].items = Array.from(itemMatches).map(m => ({
                  icon: m[1],
                  title: m[2],
                  description: m[3],
                }));
              }
            }
            
            // Extract steps array for Process
            if (dataName === "defaultProcess" && objContent.includes("steps:")) {
              const stepsStart = objContent.indexOf("steps:");
              if (stepsStart >= 0) {
                const stepsContent = objContent.substring(stepsStart);
                const stepMatches = stepsContent.matchAll(/number:\s*["']([^"']+)["'][\s\S]*?icon:\s*["']([^"']+)["'][\s\S]*?title:\s*["']([^"']+)["'][\s\S]*?description:\s*["']([^"']+)["']/g);
                dataValues[dataName].steps = Array.from(stepMatches).map(m => ({
                  number: m[1],
                  icon: m[2],
                  title: m[3],
                  description: m[4],
                }));
              }
            }
          }
        }
      } catch (err) {
        console.log(`   ⚠ Could not read data.ts: ${err.message}`);
      }
    }
    
    // Store component data for block extraction
    const pageComponentData = {};
    
    if (componentMatches.length > 0) {
      // This page uses components - read component files and extract their sections
      const componentsDir = path.join(sitePath, "components");
      let combinedContent = "";
      
      for (const match of componentMatches) {
        const componentName = match[2]; // e.g., "Hero" from "@/components/Hero"
        const componentFile = path.join(componentsDir, `${componentName}.tsx`);
        const dataName = componentToDataMap[componentName] || `default${componentName}`;
        const componentData = dataValues[dataName] || {};
        
        // Store component data for later use in block extraction
        pageComponentData[componentName] = componentData;
        
        if (fs.existsSync(componentFile)) {
          let componentContent = fs.readFileSync(componentFile, "utf-8");
          
          // Substitute JSX variables with actual values from data
          // Replace {headline} with actual headline value
          if (componentData.headline) {
            componentContent = componentContent.replace(/\{headline\}/g, componentData.headline);
            componentContent = componentContent.replace(/\{data\.headline\}/g, componentData.headline);
          }
          if (componentData.title) {
            componentContent = componentContent.replace(/\{title\}/g, componentData.title);
            componentContent = componentContent.replace(/\{data\.title\}/g, componentData.title);
          }
          if (componentData.subtitle) {
            componentContent = componentContent.replace(/\{subtitle\}/g, componentData.subtitle);
            componentContent = componentContent.replace(/\{data\.subtitle\}/g, componentData.subtitle);
          }
          if (componentData.subheadline) {
            componentContent = componentContent.replace(/\{subheadline\}/g, componentData.subheadline);
            componentContent = componentContent.replace(/\{data\.subheadline\}/g, componentData.subheadline);
          }
          if (componentData.cta) {
            componentContent = componentContent.replace(/\{cta\}/g, componentData.cta);
            componentContent = componentContent.replace(/\{data\.cta\}/g, componentData.cta);
          }
          
          // Extract all sections from the component, preserving component name info
          const sectionMatches = componentContent.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi);
          for (const sectionMatch of sectionMatches) {
            // Add a comment to identify which component this section came from
            combinedContent += `<section data-component="${componentName}">${sectionMatch[1]}</section>\n`;
          }
        } else {
          console.log(`   ⚠ Component file not found: ${componentFile}`);
        }
      }
      
      // Use combined content from components if we found any
      if (combinedContent.trim().length > 0) {
        content = combinedContent;
      }
    }

    // Extract title from content (look for h1 or title patterns)
    const title = extractTitle(content, slug);
    
    // Extract headline for homepage (slug is empty or "homepage")
    let headline = null;
    if (slug === "" || slug === "homepage") {
      const headlineMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      headline = headlineMatch ? headlineMatch[1].trim() : null;
    }

    pages.push({
      slug: slug,
      title: title,
      headline: headline,
      path: relativePath,
      content: content,
      componentData: pageComponentData, // Pass component data for block extraction
    });
  }

  return pages;
}

// -------------------------------------------------------------
// CREATE PAGE
// -------------------------------------------------------------
async function createPage(payload, tenantId, page, tenantCode) {
  console.log(`   🔍 Parsing content for: ${page.title}`);
  
  // Extract raw blocks from frontend content
  const rawBlocks = await extractPageBlocks(page, payload, tenantId, tenantCode);
  console.log(`   ✓ Extracted ${rawBlocks.length} raw block(s)`);
  
  // Map blocks using the blockMapper helper (converts to Payload format)
  const helpers = {
    uploadMediaIfNeeded: (file, tid, alt) =>
      uploadMediaIfNeeded(payload, file, tid, alt, tenantCode),
    payload,
    tenantId,
    tenantCode,
  };
  
  const mappedBlocks = await mapBlocks(rawBlocks, helpers);
  console.log(`   ✓ Mapped to ${mappedBlocks.length} Payload block(s)`);

  return upsertDocument(
    payload,
    "pages",
    {
      and: [
        { slug: { equals: page.slug } },
        { tenant: { equals: tenantId } },
      ],
    },
    {
      tenant: tenantId,
      title: page.title,
      headline: page.headline || undefined, // Only include if present
      slug: page.slug,
      blocks: mappedBlocks,
      seoTitle: page.title,
      seoDescription: `Page content for ${page.title}`,
    }
  );
}

// -------------------------------------------------------------
// EXTRACT PAGE BLOCKS FROM FRONTEND CONTENT
// -------------------------------------------------------------
async function extractPageBlocks(page, payload, tenantId, tenantCode) {
  const rawBlocks = []; // Raw blocks with 'type' field (will be mapped later)
  const content = page.content;
  const componentData = page.componentData || {}; // Get component data passed from extractPages

  // Helper function to extract section title from comment or h2
  function extractSectionTitle(sectionContent, beforeSection) {
    // Try to find comment before section: {/* Title */}
    // Look for the last comment before the section (within last 500 chars)
    const recentContent = beforeSection.slice(-500);
    const commentMatches = [...recentContent.matchAll(/\{\/\*\s*([^*]+?)\s*\*\/}/g)];
    if (commentMatches.length > 0) {
      const lastComment = commentMatches[commentMatches.length - 1];
      return lastComment[1].trim();
    }
    
    // Try to find h2 tag in section
    const h2Match = sectionContent.match(/<h2[^>]*>([^<]+)<\/h2>/i);
    if (h2Match) {
      return h2Match[1].trim();
    }
    
    return null;
  }

  // Helper function to detect component name from content
  function detectComponentName(sectionContent, blockIndex) {
    const sectionIndex = content.indexOf(sectionContent);
    const beforeSection = sectionIndex >= 0 ? content.substring(0, sectionIndex) : "";
    
    // Match component imports and usage patterns (various formats)
    const componentPatterns = [
      { pattern: /<Hero\s+[^>]*\/?>/i, name: "Hero" },
      { pattern: /<Hero\s*\/>/i, name: "Hero" },
      { pattern: /<Features\s+[^>]*\/?>/i, name: "Features" },
      { pattern: /<Features\s*\/>/i, name: "Features" },
      { pattern: /<Process\s+[^>]*\/?>/i, name: "Process" },
      { pattern: /<Process\s*\/>/i, name: "Process" },
      { pattern: /<ContactForm\s+[^>]*\/?>/i, name: "Contact" },
      { pattern: /<ContactForm\s*\/>/i, name: "Contact" },
      { pattern: /<Contact\s+[^>]*\/?>/i, name: "Contact" },
      { pattern: /<Contact\s*\/>/i, name: "Contact" },
      { pattern: /<Footer\s+[^>]*\/?>/i, name: "Footer" },
      { pattern: /<Footer\s*\/>/i, name: "Footer" },
      { pattern: /<About\s+[^>]*\/?>/i, name: "About" },
      { pattern: /<About\s*\/>/i, name: "About" },
      { pattern: /<Services\s+[^>]*\/?>/i, name: "Services" },
      { pattern: /<Services\s*\/>/i, name: "Services" },
      { pattern: /<Testimonials\s+[^>]*\/?>/i, name: "Testimonials" },
      { pattern: /<Testimonials\s*\/>/i, name: "Testimonials" },
      { pattern: /<Gallery\s+[^>]*\/?>/i, name: "Gallery" },
      { pattern: /<Gallery\s*\/>/i, name: "Gallery" },
    ];

    // Find the last component match before this section
    let lastMatch = null;
    let lastIndex = -1;
    
    for (const { pattern, name } of componentPatterns) {
      // Create a global version of the regex for matchAll
      const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
      const globalPattern = new RegExp(pattern.source, flags);
      const matches = [...beforeSection.matchAll(globalPattern)];
      if (matches.length > 0) {
        const match = matches[matches.length - 1];
        if (match.index > lastIndex) {
          lastIndex = match.index;
          lastMatch = name;
        }
      }
    }

    // Also check if section content itself contains component references
    for (const { pattern, name } of componentPatterns) {
      if (pattern.test(sectionContent)) {
        return name;
      }
    }

    // Try to detect from class names or IDs in the section
    const classMatch = sectionContent.match(/class(?:Name)?=["']([^"']*hero[^"']*|features|process|contact|footer|about|services|testimonials|gallery|sponsors|χορηγοί)[^"']*["']/i);
    if (classMatch) {
      const className = classMatch[1].toLowerCase();
      if (className.includes('hero')) return "Hero";
      if (className.includes('features')) return "Features";
      if (className.includes('process')) return "Process";
      if (className.includes('contact')) return "Contact";
      if (className.includes('footer')) return "Footer";
      if (className.includes('about')) return "About";
      if (className.includes('services')) return "Services";
      if (className.includes('testimonials')) return "Testimonials";
      if (className.includes('gallery')) return "Gallery";
      if (className.includes('sponsors') || className.includes('χορηγοί')) return "Sponsors";
    }

    return lastMatch || null;
  }

  // Helper function to convert HTML to Lexical format
  function htmlToLexicalSimple(html) {
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
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    
    if (textContent) {
      // Split by paragraphs
      const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
      if (paragraphs.length > 0) {
        paragraphs.forEach((p) => {
          const text = p.replace(/<[^>]+>/g, "").trim();
          if (text) {
            children.push({
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: text,
                  type: "text",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            });
          }
        });
      } else {
        // Single paragraph
        children.push({
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: textContent,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        });
      }
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

  // 1. Extract Hero Section (first section with h1 or hero class, or Hero component)
  const heroComponentMatch = content.match(/<Hero\s+[^>]*\/?>/i);
  const heroMatch = content.match(/<section[^>]*>[\s\S]*?<h1[^>]*>([^<]+)<\/h1>[\s\S]*?<\/section>/i);
  
  if (heroComponentMatch || heroMatch) {
    const heroTitle = heroMatch ? heroMatch[1].trim() : page.title;
    // Try to find hero image
    const heroImageMatch = content.match(/<section[^>]*>[\s\S]*?<Image[^>]*src=["']([^"']+)["']/i);
    let heroImageId = null;
    if (heroImageMatch) {
      const imageUrl = heroImageMatch[1];
      if (!imageUrl.startsWith("http") || imageUrl.includes("blob.vercel-storage.com")) {
        heroImageId = await uploadMediaIfNeeded(
          payload,
          imageUrl,
          tenantId,
          heroTitle || page.title,
          tenantCode
        );
      }
    }
    
    rawBlocks.push({
      type: "hero",
      blockLabel: "Hero",
      title: heroTitle || page.title,
      subtitle: "",
      backgroundImage: heroImageId,
    });
  }

  // Check if this is a programs page (has programs array)
  const programsArrayMatch = content.match(/const\s+programs\s*=\s*\[([\s\S]*?)\]\s*(?=return|export|function|$)/);
  if (programsArrayMatch && (page.slug === "programs" || page.slug === "programms")) {
    const programsContent = programsArrayMatch[1];
    
    // Extract individual program objects by finding balanced braces
    const programMatches = [];
    let braceCount = 0;
    let currentProgram = "";
    let inProgram = false;
    let inString = false;
    let stringChar = null;
    
    for (let i = 0; i < programsContent.length; i++) {
      const char = programsContent[i];
      const prevChar = i > 0 ? programsContent[i - 1] : '';
      
      // Handle string literals (both single and double quotes, and template literals)
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }
      
      // Only process braces if not inside a string
      if (!inString) {
        if (char === '{') {
          if (!inProgram) {
            inProgram = true;
            currentProgram = "";
          }
          braceCount++;
          currentProgram += char;
        } else if (char === '}') {
          currentProgram += char;
          braceCount--;
          if (braceCount === 0 && inProgram) {
            programMatches.push(currentProgram);
            currentProgram = "";
            inProgram = false;
          }
        } else if (inProgram) {
          currentProgram += char;
        }
      } else if (inProgram) {
        currentProgram += char;
      }
    }
    
    // Parse each program
    const programItems = [];
    for (const programStr of programMatches) {
      // Helper function to extract multiline string value
      function extractMultilineString(str, fieldName) {
        // Match field: "value" or field: 'value' where value can span multiple lines
        // Handle both single-line and multiline strings
        const patterns = [
          // Multiline with double quotes
          new RegExp(`${fieldName}:\\s*"((?:[^"\\\\]|\\\\.|\\n)*)"`, 's'),
          // Multiline with single quotes  
          new RegExp(`${fieldName}:\\s*'((?:[^'\\\\]|\\\\.|\\n)*)'`, 's'),
          // Single line fallback
          new RegExp(`${fieldName}:\\s*["']([^"']+)["']`),
        ];
        
        for (const pattern of patterns) {
          const match = str.match(pattern);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return null;
      }
      
      // Extract title
      const titleMatch = programStr.match(/title:\s*["']([^"']+)["']/);
      // Extract image (handle URLs with special characters)
      const imageMatch = programStr.match(/image:\s*["']([^"']+)["']/);
      // Extract description (handle multiline strings)
      const descValue = extractMultilineString(programStr, 'description') || "";
      // Extract additionalInfo
      const additionalInfoValue = extractMultilineString(programStr, 'additionalInfo') || "";
      // Extract imagePosition
      const imagePosMatch = programStr.match(/imagePosition:\s*["']([^"']+)["']/);
      
      // Extract schedule array
      const scheduleMatch = programStr.match(/schedule:\s*\[([\s\S]*?)\]/);
      const scheduleItems = [];
      if (scheduleMatch) {
        const scheduleContent = scheduleMatch[1];
        // Extract schedule items: { day: "...", time: "...", level: "..." }
        const scheduleItemMatches = scheduleContent.matchAll(/\{\s*day:\s*["']([^"']+)["'],\s*time:\s*["']([^"']+)["'],\s*level:\s*["']([^"']*)["']\s*\}/g);
        for (const itemMatch of scheduleItemMatches) {
          scheduleItems.push({
            day: itemMatch[1],
            time: itemMatch[2],
            level: itemMatch[3] || "",
          });
        }
      }
      
      // Extract coach object (handle nested braces)
      let coachData = null;
      const coachStart = programStr.indexOf('coach:');
      if (coachStart !== -1) {
        const coachSection = programStr.substring(coachStart);
        // Find the coach object by matching balanced braces
        let braceCount = 0;
        let coachContent = "";
        let inCoach = false;
        let inString = false;
        let stringChar = null;
        
        for (let i = 0; i < coachSection.length; i++) {
          const char = coachSection[i];
          const prevChar = i > 0 ? coachSection[i - 1] : '';
          
          // Handle string literals
          if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
              stringChar = null;
            }
          }
          
          if (!inString) {
            if (char === '{') {
              if (!inCoach) {
                inCoach = true;
              }
              braceCount++;
              if (braceCount > 1) coachContent += char;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                break;
              } else if (braceCount > 0) {
                coachContent += char;
              }
            } else if (inCoach && braceCount > 1) {
              coachContent += char;
            }
          } else if (inCoach && braceCount > 1) {
            coachContent += char;
          }
        }
        
        if (coachContent) {
          const coachNameMatch = coachContent.match(/name:\s*["']([^"']+)["']/);
          const coachPhotoMatch = coachContent.match(/photo:\s*["']([^"']+)["']/);
          const coachStudiesMatch = coachContent.match(/studies:\s*["']([^"']+)["']/);
          const coachBioValue = extractMultilineString(coachContent, 'bio') || "";
          const coachImagePosMatch = coachContent.match(/imagePosition:\s*["']([^"']+)["']/);
          
          coachData = {
            name: coachNameMatch ? coachNameMatch[1] : "",
            photo: coachPhotoMatch ? coachPhotoMatch[1] : null,
            studies: coachStudiesMatch ? coachStudiesMatch[1] : "",
            bio: coachBioValue,
            imagePosition: coachImagePosMatch ? coachImagePosMatch[1] : "left",
          };
        }
      }
      
      if (titleMatch) {
        programItems.push({
          title: titleMatch[1],
          image: imageMatch ? imageMatch[1] : null,
          description: descValue || "",
          additionalInfo: additionalInfoValue || "",
          imagePosition: imagePosMatch ? imagePosMatch[1] : "left",
          schedule: scheduleItems,
          coach: coachData,
        });
      }
    }
    
    if (programItems.length > 0) {
      // Extract page title and subtitle from hero section
      const heroTitleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const heroSubtitleMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);
      
      rawBlocks.push({
        type: "programs",
        blockLabel: "Programs",
        title: heroTitleMatch ? heroTitleMatch[1].trim() : "Τμήματα",
        subtitle: heroSubtitleMatch ? heroSubtitleMatch[1].trim() : "",
        programs: programItems,
      });
      
      // Return early since we've processed the entire programs page
      return rawBlocks;
    }
  }

  // Check if this is a news page (has newsItems array)
  const newsItemsArrayMatch = content.match(/const\s+newsItems\s*=\s*\[([\s\S]*?)\]\s*(?=return|export|function|$)/);
  if (newsItemsArrayMatch && page.slug === "news") {
    const newsItemsContent = newsItemsArrayMatch[1];
    
    // Extract news items (similar to programs but simpler structure)
    const newsItemMatches = [];
    let braceCount = 0;
    let currentItem = "";
    let inItem = false;
    let inString = false;
    let stringChar = null;
    
    for (let i = 0; i < newsItemsContent.length; i++) {
      const char = newsItemsContent[i];
      const prevChar = i > 0 ? newsItemsContent[i - 1] : '';
      
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }
      
      if (!inString) {
        if (char === '{') {
          if (!inItem) {
            inItem = true;
            currentItem = "";
          }
          braceCount++;
          currentItem += char;
        } else if (char === '}') {
          currentItem += char;
          braceCount--;
          if (braceCount === 0 && inItem) {
            newsItemMatches.push(currentItem);
            currentItem = "";
            inItem = false;
          }
        } else if (inItem) {
          currentItem += char;
        }
      } else if (inItem) {
        currentItem += char;
      }
    }
    
    // Parse each news item
    const newsCardItems = [];
    for (const itemStr of newsItemMatches) {
      const titleMatch = itemStr.match(/title:\s*["']([^"']+)["']/);
      const dateMatch = itemStr.match(/date:\s*["']([^"']+)["']/);
      const excerptMatch = itemStr.match(/excerpt:\s*["']([^"']+)["']/);
      const imageMatch = itemStr.match(/image:\s*["']([^"']+)["']/);
      
      if (titleMatch) {
        newsCardItems.push({
          title: titleMatch[1],
          image: imageMatch ? imageMatch[1] : null,
          description: excerptMatch ? excerptMatch[1] : "",
          date: dateMatch ? dateMatch[1] : "",
          buttonLabel: "Διαβάστε περισσότερα",
          buttonUrl: `/news/${titleMatch[1].toLowerCase().replace(/\s+/g, '-')}`,
        });
      }
    }
    
    if (newsCardItems.length > 0) {
      const heroTitleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const heroSubtitleMatch = content.match(/<p[^>]*>([^<]+)<\/p>/i);
      
      // Build descriptive blockLabel using section title and card titles
      const newsTitle = heroTitleMatch ? heroTitleMatch[1].trim() : "Νέα & Ανακοινώσεις";
      const newsCardTitles = newsCardItems
        .map(card => card.title)
        .filter(title => title && title.trim().length > 0)
        .slice(0, 3);
      
      let newsBlockLabel = newsTitle;
      if (newsCardTitles.length > 0) {
        newsBlockLabel = `${newsTitle} - ${newsCardTitles.join(", ")}`;
        if (newsCardItems.length > 3) {
          newsBlockLabel += ` (+${newsCardItems.length - 3} more)`;
        }
      }
      
      rawBlocks.push({
        type: "cardGrid",
        blockLabel: newsBlockLabel,
        title: newsTitle,
        subtitle: heroSubtitleMatch ? heroSubtitleMatch[1].trim() : "",
        cards: newsCardItems,
      });
      
      // Don't return early - continue to process other sections
    }
  }

  // 2. Extract all sections with content (hierarchical structure: Section -> Subsections -> Cards)
  const sectionMatches = content.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/gi);
  const sections = Array.from(sectionMatches);
  
  // Helper function to detect if content has cards with IDs (structured data)
  function hasStructuredCards(sectionContent) {
    // Check for cards with IDs (like in programs: id: 1, id: 2, etc.)
    const idPattern = /id:\s*\d+/;
    // Check for Card components
    const cardPattern = /<Card[^>]*>/i;
    // Check for array structures (programs.map, cards.map, etc.)
    const mapPattern = /\.map\(/;
    
    return idPattern.test(sectionContent) || 
           (cardPattern.test(sectionContent) && mapPattern.test(sectionContent));
  }
  
  // Helper function to extract subsections from a section
  function extractSubsections(sectionContent) {
    const subsections = [];
    // Look for nested sections or divs with subsection-like structure
    // Check for h2/h3 tags that might indicate subsections
    const headingMatches = sectionContent.matchAll(/<(h2|h3)[^>]*>([^<]+)<\/(h2|h3)>/gi);
    const headings = Array.from(headingMatches);
    
    // Also check for divs with class names indicating subsections
    const subsectionDivs = sectionContent.matchAll(/<div[^>]*class[^>]*(?:subsection|sub-section|card-container|program)[^>]*>([\s\S]*?)<\/div>/gi);
    
    return { headings, subsectionDivs: Array.from(subsectionDivs) };
  }
  
  for (let i = 0; i < sections.length; i++) {
    const sectionContent = sections[i][1];
    const sectionFullMatch = sections[i][0]; // Full match including <section> tags
    const sectionIndex = content.indexOf(sectionContent);
    const beforeSection = sectionIndex >= 0 ? content.substring(0, sectionIndex) : "";
    
    // Extract component name from data-component attribute if present
    let componentNameFromAttr = null;
    if (sectionFullMatch) {
      const componentAttrMatch = sectionFullMatch.match(/data-component=["']([^"']+)["']/i);
      if (componentAttrMatch) {
        componentNameFromAttr = componentAttrMatch[1];
      }
    }
    
    // Skip hero section (already processed)
    if (sectionContent.includes("<h1")) continue;
    
    // Extract section title
    const sectionTitle = extractSectionTitle(sectionContent, beforeSection);
    
    // Detect component name for this section (use attribute if available, otherwise detect)
    const componentName = componentNameFromAttr || detectComponentName(sectionContent, i);
    
    // Check if this is a Features or Process section and has component data
    const isFeaturesSection = componentName === "Features" && componentData.Features && componentData.Features.items;
    const isProcessSection = componentName === "Process" && componentData.Process && componentData.Process.steps;
    
    // Handle Features section with structured data
    if (isFeaturesSection) {
      const featuresData = componentData.Features;
      const cardItems = (featuresData.items || []).map((item, idx) => ({
        title: item.title || "",
        description: item.description || "",
        image: null, // Features don't have images in ftiaxesite
        buttonLabel: "",
        buttonUrl: "",
      }));
      
      if (cardItems.length > 0) {
        let blockLabel = sectionTitle || componentName || "Features";
        const cardTitles = cardItems
          .map(card => card.title)
          .filter(title => title && title.trim().length > 0)
          .slice(0, 3);
        if (cardTitles.length > 0) {
          blockLabel = `${blockLabel} - ${cardTitles.join(", ")}`;
          if (cardItems.length > 3) {
            blockLabel += ` (+${cardItems.length - 3} more)`;
          }
        }
        
        rawBlocks.push({
          type: "cardGrid",
          blockLabel: blockLabel,
          title: featuresData.title || sectionTitle || "Features",
          subtitle: featuresData.subtitle || "",
          cards: cardItems,
        });
        continue; // Skip further processing for this section
      }
    }
    
    // Handle Process section with structured data
    if (isProcessSection) {
      const processData = componentData.Process;
      const cardItems = (processData.steps || []).map((step, idx) => ({
        title: step.title || "",
        description: step.description || "",
        image: null, // Process steps don't have images in ftiaxesite
        buttonLabel: "",
        buttonUrl: "",
      }));
      
      if (cardItems.length > 0) {
        let blockLabel = sectionTitle || componentName || "Process";
        const cardTitles = cardItems
          .map(card => card.title)
          .filter(title => title && title.trim().length > 0)
          .slice(0, 3);
        if (cardTitles.length > 0) {
          blockLabel = `${blockLabel} - ${cardTitles.join(", ")}`;
          if (cardItems.length > 3) {
            blockLabel += ` (+${cardItems.length - 3} more)`;
          }
        }
        
        rawBlocks.push({
          type: "cardGrid",
          blockLabel: blockLabel,
          title: processData.title || sectionTitle || "Process",
          subtitle: processData.subtitle || "",
          cards: cardItems,
        });
        continue; // Skip further processing for this section
      }
    }
    
    // Check if this section has structured cards with IDs
    const hasStructuredCardData = hasStructuredCards(sectionContent);
    
    // Extract subsections
    const { headings: subsectionHeadings } = extractSubsections(sectionContent);
    
    // Check for sponsors section (has "sponsors" or "χορηγοί" in title/class)
    const isSponsorsSection = 
      sectionTitle?.toLowerCase().includes('χορηγοί') ||
      sectionTitle?.toLowerCase().includes('sponsors') ||
      sectionTitle?.toLowerCase().includes('υποστηρικτές') ||
      sectionContent.match(/sponsors|χορηγοί|υποστηρικτές/i);
    
    if (isSponsorsSection) {
      // Extract sponsors (look for grid with multiple items)
      const sponsorItems = [];
      
      // First, try to find Link components wrapping images (most common pattern)
      // Pattern: <Link href="..."><Image ... /></Link>
      const linkImagePattern = /<Link[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<Image[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>[\s\S]*?<\/Link>/gi;
      const linkImageMatches = [...sectionContent.matchAll(linkImagePattern)];
      
      for (const match of linkImageMatches) {
        const url = match[1];
        const imageUrl = match[2];
        const altText = match[3] || "";
        
        sponsorItems.push({
          image: imageUrl,
          title: altText || `Sponsor ${sponsorItems.length + 1}`,
          url: url,
        });
      }
      
      // If no Link-wrapped images found, look for images inside divs/containers that might have links nearby
      if (sponsorItems.length === 0) {
        // Look for grid items or divs that might contain sponsor info
        const gridItems = sectionContent.matchAll(/<div[^>]*class[^>]*>([\s\S]*?)<\/div>/gi);
        let itemIndex = 0;
        for (const item of gridItems) {
          const itemContent = item[0]; // Full div including tags
          const itemInnerContent = item[1]; // Content inside div
          
          // Check if this div contains an image
          const imageMatch = itemContent.match(/<Image[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i);
          
          if (imageMatch) {
            // Look for Link wrapping this div or nearby
            // Check if parent element is a Link
            const beforeDiv = sectionContent.substring(Math.max(0, sectionContent.indexOf(itemContent) - 200), sectionContent.indexOf(itemContent));
            const afterDiv = sectionContent.substring(sectionContent.indexOf(itemContent) + itemContent.length, sectionContent.indexOf(itemContent) + itemContent.length + 200);
            
            // Check for Link before or after this div
            let sponsorUrl = "";
            const linkBeforeMatch = beforeDiv.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>/i);
            const linkAfterMatch = afterDiv.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>/i);
            
            if (linkBeforeMatch) {
              sponsorUrl = linkBeforeMatch[1];
            } else if (linkAfterMatch) {
              sponsorUrl = linkAfterMatch[1];
            } else {
              // Check if Link is inside the div
              const linkInsideMatch = itemContent.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>/i);
              if (linkInsideMatch) {
                sponsorUrl = linkInsideMatch[1];
              }
            }
            
            sponsorItems.push({
              image: imageMatch[1],
              title: imageMatch[2] || `Sponsor ${itemIndex + 1}`,
              url: sponsorUrl,
            });
            itemIndex++;
          }
        }
      }
      
      if (sponsorItems.length > 0) {
        // Build descriptive blockLabel using section title and sponsor names
        const sponsorNames = sponsorItems
          .map(sponsor => sponsor.title)
          .filter(title => title && title.trim().length > 0 && !title.match(/Sponsor \d+/))
          .slice(0, 3);
        
        let sponsorsBlockLabel = componentName || sectionTitle || "";
        if (sponsorNames.length > 0) {
          if (sponsorsBlockLabel) {
            sponsorsBlockLabel = `${sponsorsBlockLabel} - ${sponsorNames.join(", ")}`;
          } else {
            sponsorsBlockLabel = sponsorNames.join(", ");
          }
          if (sponsorItems.length > 3) {
            sponsorsBlockLabel += ` (+${sponsorItems.length - 3} more)`;
          }
        } else {
          sponsorsBlockLabel = sponsorsBlockLabel || `Sponsors (${sponsorItems.length} logos)`;
        }
        
        rawBlocks.push({
          type: "sponsors",
          blockLabel: sponsorsBlockLabel,
          title: sectionTitle || "Οι Υποστηρικτές μας",
          subtitle: "",
          sponsors: sponsorItems,
        });
        continue;
      }
    }
    
    // Check for news section (has "news" or "νέα" or "ανακοινώσεις" in title/comment)
    // News sections should NOT be mapped as cardGrid - they fetch posts dynamically
    const isNewsSection = 
      sectionTitle?.toLowerCase().includes('νέα') ||
      sectionTitle?.toLowerCase().includes('ανακοινώσεις') ||
      sectionTitle?.toLowerCase().includes('news') ||
      sectionTitle?.toLowerCase().includes('announcements') ||
      beforeSection.match(/νέα|ανακοινώσεις|news|announcements/i) ||
      sectionContent.match(/fetchLatestPosts|fetchPosts|posts\.map/i);
    
    if (isNewsSection) {
      // Skip news sections - they should fetch posts dynamically, not be imported as static cards
      console.log(`   ⏭️  Skipping news section: "${sectionTitle || 'News'}" (will fetch posts dynamically)`);
      continue;
    }
    
    // Check for card grid section (has multiple Card components or grid with cards)
    // Look for Card components first
    const cardMatches = sectionContent.matchAll(/<Card[^>]*>([\s\S]*?)<\/Card>/gi);
    const cards = Array.from(cardMatches);
    
    // Also check for grid with card-like structure
    const gridPattern = /grid[^>]*(?:md:grid-cols-[234]|lg:grid-cols-[234])[^>]*>([\s\S]*?)<\/div>/i;
    const gridMatch = sectionContent.match(gridPattern);
    
    // Check if this section has a grid with cards (same structure: image, title, link)
    // Also check for cards with IDs (structured data like programs)
    const hasCardGrid = cards.length >= 2 || 
                       (gridMatch && (
                         sectionContent.match(/CardContent|CardHeader/i) ||
                         // Check if grid contains multiple items with same structure (image + title)
                         (sectionContent.match(/<Image[^>]*>/gi) || []).length >= 2
                       )) ||
                       hasStructuredCardData;
    
    if (hasCardGrid) {
      // Extract section title and subtitle (before the grid)
      const sectionTitleMatch = sectionContent.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      const sectionSubtitleMatch = sectionContent.match(/<p[^>]*class[^>]*text-center[^>]*>([^<]+)<\/p>/i);
      
      const cardItems = [];
      
      // Process Card components
      if (cards.length >= 2) {
        for (let cardIdx = 0; cardIdx < cards.length; cardIdx++) {
          const cardMatch = cards[cardIdx];
          // cardMatch[0] is the full match including <Card>...</Card>, cardMatch[1] is the content inside
          const cardFullContent = cardMatch[0]; // Full Card including tags
          const cardInnerContent = cardMatch[1]; // Content inside Card tags
          
          // Try to extract card ID if it exists (from data structures like programs.map)
          // Look for id in the context before this card
          const cardStartIndex = sectionContent.indexOf(cardFullContent);
          const beforeCard = sectionContent.substring(Math.max(0, cardStartIndex - 500), cardStartIndex);
          const idMatch = beforeCard.match(/id:\s*(\d+)/);
          const cardId = idMatch ? parseInt(idMatch[1]) : cardIdx + 1;
          
          // Extract image (can be anywhere in Card, including nested divs)
          const cardImageMatch = cardFullContent.match(/<Image[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i);
          
          // Extract title from h3 (usually in CardContent)
          const cardTitleMatch = cardInnerContent.match(/<h3[^>]*>([^<]+)<\/h3>/i);
          
          // Extract description from p tags (but skip if it's in a Button)
          const cardDescMatches = [...cardInnerContent.matchAll(/<p[^>]*>([^<]+)<\/p>/gi)];
          let cardDesc = "";
          for (const descMatch of cardDescMatches) {
            const descText = descMatch[1].trim();
            // Check if this paragraph is inside a Button by looking at context before it
            const descIndex = cardInnerContent.indexOf(descMatch[0]);
            const beforeDesc = cardInnerContent.substring(Math.max(0, descIndex - 300), descIndex);
            // Count unclosed Button tags before this paragraph
            const openButtons = (beforeDesc.match(/<Button[^>]*>/g) || []).length;
            const closeButtons = (beforeDesc.match(/<\/Button>/g) || []).length;
            // If there are unclosed Button tags, skip this paragraph
            if (openButtons <= closeButtons) {
              cardDesc = descText;
              break; // Take first non-button paragraph
            }
          }
          
          // Extract button link and label (Button with Link inside, or Link directly)
          let cardButtonLabel = "";
          let cardButtonUrl = "";
          
          // Try Button > Link pattern first (Button with asChild and Link inside)
          const buttonLinkMatch = cardInnerContent.match(/<Button[^>]*>[\s\S]*?<Link[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/Link>/i);
          if (buttonLinkMatch) {
            cardButtonUrl = buttonLinkMatch[1];
            cardButtonLabel = buttonLinkMatch[2].trim();
          } else {
            // Try direct Link pattern (Link that's not inside Button)
            const linkMatches = [...cardInnerContent.matchAll(/<Link[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/Link>/gi)];
            for (const linkMatch of linkMatches) {
              const linkIndex = cardInnerContent.indexOf(linkMatch[0]);
              const beforeLink = cardInnerContent.substring(Math.max(0, linkIndex - 200), linkIndex);
              // Count unclosed Button tags before this link
              const openButtons = (beforeLink.match(/<Button[^>]*>/g) || []).length;
              const closeButtons = (beforeLink.match(/<\/Button>/g) || []).length;
              // Only use link if it's not inside a Button
              if (openButtons <= closeButtons) {
                cardButtonUrl = linkMatch[1];
                cardButtonLabel = linkMatch[2].trim();
                break;
              }
            }
          }
          
          // Only add card if it has at least image or title
          if (cardImageMatch || cardTitleMatch) {
            cardItems.push({
              id: cardId, // Include ID if found
              image: cardImageMatch ? cardImageMatch[1] : null,
              title: cardTitleMatch ? cardTitleMatch[1].trim() : "",
              description: cardDesc || "",
              buttonLabel: cardButtonLabel,
              buttonUrl: cardButtonUrl,
            });
          }
        }
      } else if (gridMatch) {
        // Extract cards from grid structure (divs with same pattern)
        const gridContent = gridMatch[1];
        
        // Split grid content by Card components or by div patterns
        // Look for divs that contain Image + h3 (card-like structure)
        const potentialCards = gridContent.split(/<Card[^>]*>/i).filter(c => c.trim());
        
        for (let i = 0; i < potentialCards.length; i++) {
          const cardContent = potentialCards[i].split(/<\/Card>/i)[0];
          
          // Extract image
          const cardImageMatch = cardContent.match(/<Image[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i);
          
          // Extract title
          const cardTitleMatch = cardContent.match(/<h3[^>]*>([^<]+)<\/h3>/i);
          
          // Extract description
          const cardDescMatches = cardContent.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
          let cardDesc = "";
          for (const descMatch of cardDescMatches) {
            const descText = descMatch[1].trim();
            if (descText && !descText.includes("Button") && !descText.includes("Link")) {
              cardDesc = descText;
              break;
            }
          }
          
          // Extract link
          const linkMatch = cardContent.match(/<Link[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/Link>/i);
          
          if (cardImageMatch || cardTitleMatch) {
            cardItems.push({
              image: cardImageMatch ? cardImageMatch[1] : null,
              title: cardTitleMatch ? cardTitleMatch[1].trim() : "",
              description: cardDesc || "",
              buttonLabel: linkMatch ? linkMatch[2].trim() : "",
              buttonUrl: linkMatch ? linkMatch[1] : "",
            });
          }
        }
      }
      
      if (cardItems.length > 0) {
        // Check if we have subsections (multiple h2/h3 headings)
        const hasSubsections = subsectionHeadings.length > 1;
        
        // Build descriptive blockLabel using section title and card titles
        let blockLabel = componentName || sectionTitle || sectionTitleMatch?.[1] || "";
        
        // Add card titles to the label for better identification
        const cardTitles = cardItems
          .map(card => card.title)
          .filter(title => title && title.trim().length > 0)
          .slice(0, 3); // Limit to first 3 card titles
        
        if (cardTitles.length > 0) {
          if (blockLabel) {
            // If we have a section title, append card titles
            blockLabel = `${blockLabel} - ${cardTitles.join(", ")}`;
            if (cardItems.length > 3) {
              blockLabel += ` (+${cardItems.length - 3} more)`;
            }
          } else {
            // If no section title, use card titles
            blockLabel = cardTitles.join(", ");
            if (cardItems.length > 3) {
              blockLabel += ` (+${cardItems.length - 3} more)`;
            }
          }
        }
        
        // Fallback if still empty
        if (!blockLabel || blockLabel.trim().length === 0) {
          blockLabel = `Card Grid (${cardItems.length} cards)`;
        }
        
        rawBlocks.push({
          type: "cardGrid",
          blockLabel: blockLabel,
          title: sectionTitle || sectionTitleMatch?.[1] || "",
          subtitle: sectionSubtitleMatch ? sectionSubtitleMatch[1].trim() : "",
          cards: cardItems,
          // Add metadata about structure
          _hasSubsections: hasSubsections,
          _subsectionCount: subsectionHeadings.length,
        });
        continue;
      }
    }
    
    // Check for subsections within this section (hierarchical structure)
    if (subsectionHeadings.length > 1) {
      // This section has multiple subsections
      // Extract each subsection as a separate block or group them
      const subsectionBlocks = [];
      
      // Split section by subsection headings
      for (let j = 0; j < subsectionHeadings.length; j++) {
        const headingMatch = subsectionHeadings[j];
        const headingText = headingMatch[2];
        const headingTag = headingMatch[1];
        
        // Find content between this heading and next heading
        const headingIndex = sectionContent.indexOf(headingMatch[0]);
        const nextHeadingIndex = j < subsectionHeadings.length - 1 
          ? sectionContent.indexOf(subsectionHeadings[j + 1][0])
          : sectionContent.length;
        
        const subsectionContent = sectionContent.substring(headingIndex, nextHeadingIndex);
        
        // Extract images, text, etc. from subsection
        const subsectionImageMatch = subsectionContent.match(/<Image[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i);
        const subsectionTextMatches = subsectionContent.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
        const subsectionText = Array.from(subsectionTextMatches).map(m => m[1]).join(" ");
        
        if (headingText || subsectionImageMatch || subsectionText) {
          subsectionBlocks.push({
            title: headingText,
            image: subsectionImageMatch ? subsectionImageMatch[1] : null,
            description: subsectionText || "",
          });
        }
      }
      
      // If we found subsections, create a structured block
      if (subsectionBlocks.length > 0) {
        // Check if subsections have cards
        const subsectionCards = [];
        for (const subBlock of subsectionBlocks) {
          // Look for cards within this subsection
          const subCardMatches = sectionContent.matchAll(/<Card[^>]*>([\s\S]*?)<\/Card>/gi);
          // Extract card data if found
        }
        
        // Create a block that represents the section with subsections
        // Build descriptive blockLabel using section title and subsection titles
        const subsectionTitles = subsectionBlocks
          .map(sub => sub.title)
          .filter(title => title && title.trim().length > 0)
          .slice(0, 3);
        
        let subsectionBlockLabel = componentName || sectionTitle || "";
        if (subsectionTitles.length > 0) {
          if (subsectionBlockLabel) {
            subsectionBlockLabel = `${subsectionBlockLabel} - ${subsectionTitles.join(", ")}`;
          } else {
            subsectionBlockLabel = subsectionTitles.join(", ");
          }
          if (subsectionBlocks.length > 3) {
            subsectionBlockLabel += ` (+${subsectionBlocks.length - 3} more)`;
          }
        }
        
        if (!subsectionBlockLabel || subsectionBlockLabel.trim().length === 0) {
          subsectionBlockLabel = `Section with ${subsectionBlocks.length} Subsections`;
        }
        
        rawBlocks.push({
          type: "richText",
          blockLabel: subsectionBlockLabel,
          title: sectionTitle || "",
          content: `<h2>${sectionTitle || ""}</h2>${subsectionBlocks.map(sub => `<h3>${sub.title}</h3><p>${sub.description}</p>`).join("")}`,
          _subsections: subsectionBlocks,
        });
        continue;
      }
    }
    
    // Check for image + text section (grid with 2 columns, one has image, one has text)
    const gridMatch2Col = sectionContent.match(/grid[^>]*md:grid-cols-2[^>]*>([\s\S]*?)<\/div>/i);
    if (gridMatch2Col) {
      const gridContent = gridMatch2Col[1];
      const imageMatch = gridContent.match(/<Image[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i);
      const h2Match = gridContent.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      const paragraphs = gridContent.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
      const textContent = Array.from(paragraphs).map(p => p[1]).join(" ");
      
      if (imageMatch && (h2Match || textContent)) {
        // Determine image position (check if image comes before or after text)
        const imageIndex = gridContent.indexOf(imageMatch[0]);
        const textIndex = gridContent.indexOf(h2Match ? h2Match[0] : (textContent || ""));
        const imagePosition = imageIndex < textIndex ? "left" : "right";
        
        // Extract clean HTML for text content (keep h2 and paragraphs)
        let cleanHtml = "";
        if (h2Match) {
          cleanHtml += `<h2>${h2Match[1]}</h2>`;
        }
        const paraMatches = gridContent.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
        for (const para of paraMatches) {
          cleanHtml += `<p>${para[1]}</p>`;
        }
        
        if (cleanHtml || textContent) {
          // Build descriptive blockLabel using section title or h2 title
          const imageTextTitle = h2Match ? h2Match[1].trim() : sectionTitle || "";
          const imageTextBlockLabel = componentName || imageTextTitle || "Image & Text";
          
          rawBlocks.push({
            type: "imageText",
            blockLabel: imageTextBlockLabel,
            title: imageTextTitle,
            subtitle: "",
            image: imageMatch[1],
            imagePosition: imagePosition,
            content: cleanHtml || `<p>${textContent}</p>`,
          });
          continue;
        }
      }
    }
    
    // Extract images from section
    const imageMatches = sectionContent.matchAll(/<Image[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/gi);
    const images = Array.from(imageMatches);
    
    // Extract text content
    const textContent = extractTextFromSection(sectionContent);
    
    // If section has multiple images (3+), create image gallery
    if (images.length >= 3) {
      const galleryImages = [];
      for (const imgMatch of images) {
        const imageUrl = imgMatch[1];
        const alt = imgMatch[2] || "Image";
        galleryImages.push({
          image: imageUrl,
          caption: alt,
        });
      }
      
      if (galleryImages.length > 0) {
        // Build descriptive blockLabel using section title and image count
        let galleryBlockLabel = componentName || sectionTitle || "";
        if (galleryBlockLabel) {
          galleryBlockLabel = `${galleryBlockLabel} (${galleryImages.length} images)`;
        } else {
          galleryBlockLabel = `Gallery (${galleryImages.length} images)`;
        }
        
        rawBlocks.push({
          type: "imageGallery",
          blockLabel: galleryBlockLabel,
          images: galleryImages,
        });
        continue;
      }
    }
    
    // Extract headings and paragraphs for rich text
    if (textContent && textContent.trim().length > 0) {
      // Extract clean HTML from section for rich text block
      const cleanHtml = sectionContent
        .replace(/\{.*?\}/g, "")
        .replace(/className=["'][^"']*["']/g, "")
        .replace(/style=\{.*?\}/g, "")
        .replace(/<Image[^>]*\/?>/g, "")
        .replace(/<Link[^>]*>/g, "")
        .replace(/<\/Link>/g, "")
        .trim();
      
      if (cleanHtml.length > 0) {
        // Try to extract a heading from the content for better blockLabel
        const headingMatch = cleanHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
        const contentTitle = headingMatch ? headingMatch[1].trim() : null;
        
        let richTextBlockLabel = componentName || sectionTitle || contentTitle || "";
        if (!richTextBlockLabel || richTextBlockLabel.trim().length === 0) {
          // Extract first few words from content as fallback
          const firstWords = textContent.substring(0, 50).trim();
          richTextBlockLabel = firstWords ? `${firstWords}...` : "Content";
        }
        
        rawBlocks.push({
          type: "richText",
          blockLabel: richTextBlockLabel,
          content: cleanHtml,
        });
      }
    }
  }

  // If no blocks were created, create at least a rich text block with page title
  if (rawBlocks.length === 0) {
    const textContent = extractTextContent(page.content);
    if (textContent) {
      // Use page title for blockLabel
      const pageTitleBlockLabel = page.title || "Content";
      rawBlocks.push({
        type: "richText",
        blockLabel: pageTitleBlockLabel,
        content: `<p>${textContent.substring(0, 1000)}</p>`,
      });
    }
  }

  return rawBlocks;
}

// Extract text content from a section (removes JSX/React code)
function extractTextFromSection(sectionContent) {
  // Remove JSX tags but keep text
  let text = sectionContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\{.*?\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  return text;
}

// Convert HTML to Lexical format
function htmlToLexical(html) {
  // Remove JSX/React specific syntax
  let cleanHtml = html
    .replace(/\{.*?\}/g, "")
    .replace(/className=["'][^"']*["']/g, "")
    .replace(/style=\{.*?\}/g, "")
    .replace(/<Image[^>]*>/g, "")
    .replace(/<Link[^>]*>/g, "")
    .replace(/<\/Link>/g, "")
    .trim();

  // Extract paragraphs
  const paragraphs = [];
  const pMatches = cleanHtml.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
  for (const match of pMatches) {
    paragraphs.push(match[1].trim());
  }

  // Extract headings
  const headings = [];
  const h2Matches = cleanHtml.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
  for (const match of h2Matches) {
    headings.push({ level: 2, text: match[1].trim() });
  }
  const h3Matches = cleanHtml.matchAll(/<h3[^>]*>([^<]+)<\/h3>/gi);
  for (const match of h3Matches) {
    headings.push({ level: 3, text: match[1].trim() });
  }

  // Build Lexical structure
  const children = [];
  
  // Add headings
  for (const heading of headings) {
    children.push({
      children: [
        {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: heading.text,
          type: "text",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: heading.level === 2 ? "heading" : "heading",
      tag: heading.level === 2 ? "h2" : "h3",
      version: 1,
    });
  }

  // Add paragraphs
  for (const para of paragraphs) {
    if (para.length > 0) {
      children.push({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: para,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      });
    }
  }

  // If no content extracted, create empty paragraph
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
      children: children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// -------------------------------------------------------------
// EXTRACT POSTS
// -------------------------------------------------------------
async function extractPosts(sitePath) {
  const posts = [];
  
  // First, try to extract from Next.js App Router structure
  // Check for /app/news, /app/posts, /app/blog directories
  const newsDirs = [
    path.join(sitePath, "app", "news"),
    path.join(sitePath, "app", "posts"),
    path.join(sitePath, "app", "blog"),
  ];

  for (const newsDir of newsDirs) {
    if (fs.existsSync(newsDir) && fs.statSync(newsDir).isDirectory()) {
      // Check for [slug]/page.tsx - this contains individual posts
      // List directory contents to find [slug] folder (PowerShell wildcard issue)
      try {
        const dirEntries = fs.readdirSync(newsDir, { withFileTypes: true });
        for (const entry of dirEntries) {
          if (entry.isDirectory() && entry.name.includes('slug')) {
            const slugPagePath = path.join(newsDir, entry.name, "page.tsx");
            if (fs.existsSync(slugPagePath)) {
              console.log(`   📂 Found posts in: ${slugPagePath}`);
              const postsFromSlugPage = extractPostsFromSlugPage(slugPagePath);
              posts.push(...postsFromSlugPage);
              console.log(`   ✓ Extracted ${postsFromSlugPage.length} post(s) from [slug]/page.tsx`);
            }
          }
        }
      } catch (err) {
        console.log(`   ⚠ Error reading directory ${newsDir}: ${err.message}`);
      }

      // Check for page.tsx - this might contain a posts array
      const gridPagePath = path.join(newsDir, "page.tsx");
      if (fs.existsSync(gridPagePath)) {
        console.log(`   📂 Found grid page: ${gridPagePath}`);
        const postsFromGridPage = extractPostsFromGridPage(gridPagePath);
        posts.push(...postsFromGridPage);
        console.log(`   ✓ Extracted ${postsFromGridPage.length} post(s) from page.tsx`);
      }
    }
  }

  // Also check for traditional posts directories (markdown files, etc.)
  const postsDirs = [
    path.join(sitePath, "posts"),
    path.join(sitePath, "blog"),
    path.join(sitePath, "content", "posts"),
  ];

  for (const postsDir of postsDirs) {
    if (fs.existsSync(postsDir) && fs.statSync(postsDir).isDirectory()) {
      const postFiles = findPostFiles(postsDir);
      
      for (const postFile of postFiles) {
        const relativePath = path.relative(postsDir, postFile);
        const slug = getSlugFromPath(relativePath).replace(/\.(md|mdx|tsx|ts|json)$/, "");
        const content = fs.readFileSync(postFile, "utf-8");

        // Extract metadata and content
        const title = extractTitle(content, slug);
        const excerpt = extractExcerpt(content);
        const publishedAt = extractPublishedDate(postFile, content);

        posts.push({
          slug: slug,
          title: title,
          excerpt: excerpt,
          content: content,
          publishedAt: publishedAt,
          featuredImage: extractFeaturedImage(content),
          path: relativePath,
        });
      }
    }
  }

  // Remove duplicates based on slug
  const uniquePosts = [];
  const seenSlugs = new Set();
  for (const post of posts) {
    if (!seenSlugs.has(post.slug)) {
      seenSlugs.add(post.slug);
      uniquePosts.push(post);
    }
  }

  return uniquePosts;
}

// Extract posts from [slug]/page.tsx (contains blogPosts object)
function extractPostsFromSlugPage(filePath) {
  const posts = [];
  const content = fs.readFileSync(filePath, "utf-8");

  // Try to find blogPosts object: const blogPosts = { ... }
  // Match from "const blogPosts = {" to the closing "}" before "export"
  const blogPostsMatch = content.match(/const\s+blogPosts\s*=\s*\{([\s\S]*?)\}\s*(?=export|$)/);
  if (!blogPostsMatch) {
    console.log(`   ⚠ Could not find blogPosts object in ${filePath}`);
    return posts;
  }

  const blogPostsContent = blogPostsMatch[1];
  
  // Extract individual post objects using a more careful approach
  // Pattern: "slug": { ... } where content can span multiple lines
  // Use regex to find all post entries: "slug": { ... }
  const postPattern = /"([^"]+)":\s*\{/g;
  let match;
  const postMatches = [];
  
  while ((match = postPattern.exec(blogPostsContent)) !== null) {
    postMatches.push({
      slug: match[1],
      startIndex: match.index + match[0].length - 1, // Position after opening {
    });
  }
  
  // Extract each post object
  for (let i = 0; i < postMatches.length; i++) {
    const postMatch = postMatches[i];
    const postStart = postMatch.startIndex;
    const postEnd = i < postMatches.length - 1 
      ? postMatches[i + 1].startIndex - 1  // Up to next post
      : blogPostsContent.length;  // Or end of content
    
    // Find matching closing brace for this post
    let braceCount = 1;
    let actualEnd = postStart;
    while (braceCount > 0 && actualEnd < postEnd) {
      const char = blogPostsContent[actualEnd];
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      actualEnd++;
    }
    
    if (braceCount === 0) {
      const postContent = blogPostsContent.slice(postStart, actualEnd - 1);
      
      // Extract fields
      const titleMatch = postContent.match(/title:\s*["']([^"']+)["']/);
      const title = titleMatch ? titleMatch[1] : postMatch.slug;

      const dateMatch = postContent.match(/date:\s*["']([^"']+)["']/);
      const date = dateMatch ? dateMatch[1] : null;

      // Extract content (HTML) - handle template literals with backticks
      // Match from content: ` to closing ` (non-greedy, multiline)
      const contentMatch = postContent.match(/content:\s*`([\s\S]*?)`/);
      const htmlContent = contentMatch ? contentMatch[1].trim() : "";

      const imageMatch = postContent.match(/heroImage:\s*["']([^"']+)["']/);
      const featuredImage = imageMatch ? imageMatch[1] : null;

      const authorMatch = postContent.match(/author:\s*["']([^"']+)["']/);
      const author = authorMatch ? authorMatch[1] : "";

      // Convert HTML to text for excerpt
      const textContent = htmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const excerpt = textContent.substring(0, 200) + (textContent.length > 200 ? "..." : "");

      if (title && htmlContent) {
        posts.push({
          slug: postMatch.slug,
          title: title,
          excerpt: excerpt,
          content: htmlContent,
          publishedAt: date ? parseDate(date) : new Date(),
          featuredImage: featuredImage,
          author: author,
        });
      }
    }
  }

  return posts;
}

// Extract posts from page.tsx (contains newsItems array)
function extractPostsFromGridPage(filePath) {
  const posts = [];
  const content = fs.readFileSync(filePath, "utf-8");

  // Try to find newsItems array: const newsItems = [ ... ]
  const newsItemsMatch = content.match(/const\s+newsItems\s*=\s*\[([^\]]+(?:\[[^\]]*\][^\]]*)*)\]/s);
  if (!newsItemsMatch) {
    return posts;
  }

  const newsItemsContent = newsItemsMatch[1];
  
  // Extract individual items: { title: "...", excerpt: "...", ... }
  const itemMatches = newsItemsContent.matchAll(/\{\s*title:\s*["']([^"']+)["'],\s*date:\s*["']([^"']+)["'],\s*excerpt:\s*["']([^"']+)["'],\s*image:\s*["']([^"']+)["']\s*\}/g);
  
  for (const match of itemMatches) {
    const title = match[1];
    const date = match[2];
    const excerpt = match[3];
    const image = match[4];
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    posts.push({
      slug: slug,
      title: title,
      excerpt: excerpt,
      content: `<p>${excerpt}</p>`, // Use excerpt as content for now
      publishedAt: parseDate(date),
      featuredImage: image,
    });
  }

  return posts;
}

// Helper to parse date strings (handles Greek dates and various formats)
function parseDate(dateString) {
  // Try standard Date parsing first
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle Greek date format: "15 Ιανουαρίου 2025"
  const greekMonths = {
    "ιανουαρίου": "01", "φεβρουαρίου": "02", "μαρτίου": "03",
    "απριλίου": "04", "μαΐου": "05", "ιουνίου": "06",
    "ιουλίου": "07", "αυγούστου": "08", "σεπτεμβρίου": "09",
    "οκτωβρίου": "10", "νοεμβρίου": "11", "δεκεμβρίου": "12",
  };

  const greekMatch = dateString.match(/(\d+)\s+(\w+)\s+(\d+)/);
  if (greekMatch) {
    const day = greekMatch[1].padStart(2, "0");
    const monthName = greekMatch[2].toLowerCase();
    const year = greekMatch[3];
    const month = greekMonths[monthName] || "01";
    return new Date(`${year}-${month}-${day}`);
  }

  // Fallback to current date
  return new Date();
}

function extractFeaturedImage(content) {
  const imageMatch = content.match(/(?:heroImage|image|featuredImage):\s*["']([^"']+)["']/);
  return imageMatch ? imageMatch[1] : null;
}

// -------------------------------------------------------------
// HELPER: Empty Lexical State
// -------------------------------------------------------------
function getEmptyLexicalState() {
  return {
    root: {
      children: [
        {
          children: [],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// -------------------------------------------------------------
// CREATE POST
// -------------------------------------------------------------
async function createPost(payload, tenantId, post, tenantCode) {
  // Handle featured image if present
  let featuredImageId = null;
  if (post.featuredImage) {
    featuredImageId = await uploadMediaIfNeeded(
      payload,
      post.featuredImage,
      tenantId,
      post.title || "Post Featured Image",
      tenantCode
    );
  }

  // Convert post content to Lexical format
  // If content is HTML, convert to text first
  const textContent = post.content.startsWith('<') 
    ? post.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : extractTextContent(post.content);
  
  const lexicalContent = {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: textContent.substring(0, 5000), // Limit length
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };

  // Normalize slug
  const normalizedSlug = post.slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return upsertDocument(
    payload,
    "posts",
    {
      and: [
        { slug: { equals: normalizedSlug } },
        { tenant: { equals: tenantId } },
      ],
    },
    {
      tenant: tenantId,
      title: post.title,
      slug: normalizedSlug,
      excerpt: post.excerpt || "",
      content: lexicalContent,
      seoTitle: post.title,
      seoDescription: post.excerpt || `Post content for ${post.title}`,
      featuredImage: featuredImageId,
      publishedAt: post.publishedAt || new Date(),
    }
  );
}

// -------------------------------------------------------------
// CREATE NAVIGATION MENU
// -------------------------------------------------------------
async function createNavigationMenu(payload, tenantId, sitePath, pageMap) {
  // Try to find navigation component
  const navFiles = [
    path.join(sitePath, "components", "navigation.tsx"),
    path.join(sitePath, "components", "navigation.ts"),
  ];

  let navContent = "";
  for (const navFile of navFiles) {
    if (fs.existsSync(navFile)) {
      navContent = fs.readFileSync(navFile, "utf-8");
      break;
    }
  }

  // Extract menu items from navigation component
  const menuItems = extractMenuItems(navContent, pageMap);

  return upsertDocument(
    payload,
    "navigation-menus",
    {
      and: [
        { title: { equals: "Main Menu" } },
        { tenant: { equals: tenantId } },
      ],
    },
    {
      tenant: tenantId,
      title: "Main Menu",
      items: menuItems,
    }
  );
}

// -------------------------------------------------------------
// CREATE HEADER
// -------------------------------------------------------------
async function createHeader(payload, tenantId, menuId, tenantCode, sitePath) {
  // Try to find logo
  let logoId = null;
  const logoPaths = [
    path.join(sitePath, "public", "logo.png"),
    path.join(sitePath, "public", "icon.svg"),
    path.join(sitePath, "code", "public", "icon.svg"),
  ];

  for (const logoPath of logoPaths) {
    if (fs.existsSync(logoPath)) {
      const relativePath = path.relative(
        path.join(sitePath, path.dirname(logoPath).includes("code") ? "code" : "", "public"),
        logoPath
      );
      logoId = await uploadMediaIfNeeded(
        payload,
        `/sync-assets/${tenantCode}/${relativePath}`,
        tenantId,
        "Logo",
        tenantCode
      );
      break;
    }
  }

  return upsertDocument(
    payload,
    "headers",
    { tenant: { equals: tenantId } },
    {
      tenant: tenantId,
      label: "Default Header",
      logo: logoId,
      navigationMenu: menuId,
      enableTopBar: false,
      topBarText: "",
    }
  );
}

// -------------------------------------------------------------
// CREATE FOOTER
// -------------------------------------------------------------
async function createFooter(payload, tenantId, sitePath, pageMap) {
  // Extract footer links from footer component
  const footerMenus = [
    {
      title: "Quick Links",
      menu: null, // Will be set if we create a footer menu
    },
  ];

  return upsertDocument(
    payload,
    "footers",
    { tenant: { equals: tenantId } },
    {
      tenant: tenantId,
      label: "Default Footer",
      copyrightText: `© ${new Date().getFullYear()} All rights reserved.`,
      footerMenus: footerMenus,
      socialLinks: [],
    }
  );
}


// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function findPageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip certain directories
      if (!["node_modules", ".next", ".git"].includes(entry.name)) {
        findPageFiles(fullPath, fileList);
      }
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function getSlugFromPath(filePath) {
  // Convert path like "app/about/page.tsx" to "about"
  const parts = filePath.split(path.sep);
  const pageIndex = parts.findIndex((p) => p === "page.tsx" || p === "page.ts");

  if (pageIndex > 0) {
    return parts[pageIndex - 1] || "homepage";
  }

  return "homepage";
}

function extractTitle(content, slug) {
  // Try to find h1 tag
  const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Try to find title in metadata
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Capitalize slug as fallback
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

function extractTextContent(content) {
  // Remove JSX tags and extract text
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/\{.*?\}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 1000);
}

function findPostFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!["node_modules", ".next", ".git"].includes(entry.name)) {
        findPostFiles(fullPath, fileList);
      }
    } else if (
      entry.name.endsWith(".md") ||
      entry.name.endsWith(".mdx") ||
      entry.name.endsWith(".tsx") ||
      entry.name.endsWith(".ts") ||
      entry.name.endsWith(".json")
    ) {
      // Skip page.tsx files (those are pages, not posts)
      if (entry.name !== "page.tsx" && entry.name !== "page.ts") {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

function extractExcerpt(content) {
  // Try to find excerpt in frontmatter
  const excerptMatch = content.match(/excerpt:\s*["']([^"']+)["']/i);
  if (excerptMatch) {
    return excerptMatch[1].trim();
  }

  // Extract first paragraph as excerpt
  const text = extractTextContent(content);
  return text.substring(0, 200).trim() + (text.length > 200 ? "..." : "");
}

function extractPublishedDate(filePath, content) {
  // Try to find date in frontmatter
  const dateMatch = content.match(/date:\s*["']([^"']+)["']/i);
  if (dateMatch) {
    return new Date(dateMatch[1]);
  }

  // Try to get date from filename (e.g., 2024-01-15-post-title.md)
  const filename = path.basename(filePath);
  const dateFromFilename = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateFromFilename) {
    return new Date(dateFromFilename[1]);
  }

  // Use file modification time as fallback
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch {
    return new Date();
  }
}

function extractMenuItems(navContent, pageMap) {
  const items = [];

  // Try to find navItems array
  const navItemsMatch = navContent.match(/const\s+navItems\s*=\s*\[([^\]]+)\]/s);
  if (navItemsMatch) {
    const itemsText = navItemsMatch[1];
    const itemMatches = itemsText.matchAll(/\{\s*href:\s*["']([^"']+)["'],\s*label:\s*["']([^"']+)["']\s*\}/g);

    for (const match of itemMatches) {
      const href = match[1];
      const label = match[2];
      const slug = href === "/" ? "homepage" : href.replace(/^\//, "");

      items.push({
        label: label,
        type: pageMap[slug] ? "internal" : "external",
        page: pageMap[slug] || undefined,
        url: pageMap[slug] ? undefined : href,
        openInNewTab: false,
      });
    }
  }

  return items;
}

// -------------------------------------------------------------
// DEFAULT EXPORT FOR PAYLOAD CLI
// -------------------------------------------------------------
export default async function (args = []) {
  // Payload CLI may pass args as function parameter or via process.argv
  const cliArgs = args.length > 0 ? args : process.argv.slice(2);

  console.log("📝 Frontend Site Import Script Started");
  console.log(`📝 Function args: ${JSON.stringify(args)}`);
  console.log(`📝 Process args: ${process.argv.join(" ")}`);
  console.log(`📝 Parsed CLI args: ${JSON.stringify(cliArgs)}\n`);

  const tenantIdx = cliArgs.indexOf("--tenant");
  const pathIdx = cliArgs.indexOf("--path");

  if (tenantIdx === -1 || !cliArgs[tenantIdx + 1]) {
    console.error("✗ Error: --tenant <code> is required");
    console.error("Usage: payload run importFrontendSite -- --tenant <code> --path <frontendSitePath>");
    console.error(`Received args: ${JSON.stringify(cliArgs)}`);
    process.exit(1);
  }

  if (pathIdx === -1 || !cliArgs[pathIdx + 1]) {
    console.error("✗ Error: --path <frontendSitePath> is required");
    console.error("Usage: payload run importFrontendSite -- --tenant <code> --path <frontendSitePath>");
    console.error(`Received args: ${JSON.stringify(cliArgs)}`);
    process.exit(1);
  }

  const tenantCode = cliArgs[tenantIdx + 1];
  const frontendSitePath = cliArgs[pathIdx + 1];

  console.log(`✓ Tenant code: ${tenantCode}`);
  console.log(`✓ Frontend path: ${frontendSitePath}\n`);

  await importFrontendSite(tenantCode, frontendSitePath);
}

