// Global counter for generating unique card IDs across all pages and imports
let cardIdCounter = Date.now() * 1000000;

/**
 * Convert simple HTML string → Lexical JSON structure
 */
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

  // Capture <p>...</p> blocks
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gis;
  const matches = html.match(paragraphRegex) || [];

  if (matches.length === 0) {
    // Plain text
    const textContent = html.replace(/<[^>]*>/g, "").trim();
    if (textContent) {
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
  } else {
    matches.forEach((m) => {
      const content = m.replace(/<\/?p[^>]*>/gi, "").trim();
      if (content) {
        children.push({
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: content.replace(/<[^>]*>/g, ""),
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

/**
 * Map a single block
 */
async function mapBlock(block, helpers) {
  const { type, ...rest } = block;

  if (!type) {
    throw new Error(`Block missing required "type" field: ${JSON.stringify(block)}`);
  }

  switch (type) {
    // --------------------------------------------------------------
    // HERO BLOCK
    // --------------------------------------------------------------
    case "hero": {
      let backgroundImageId = null;

      if (rest.image || rest.backgroundImage) {
        backgroundImageId = await helpers.uploadMediaIfNeeded(
          rest.image || rest.backgroundImage,
          helpers.tenantId,
          rest.title || "Hero Background Image",
          helpers.tenantCode
        );
      }

      return {
        blockType: "hero",
        blockLabel: rest.blockLabel || "Hero",
        title: rest.title || "",
        subtitle: rest.subtitle || "",
        backgroundImage: backgroundImageId,
        ctaLabel: rest.buttonLabel || rest.button?.label || rest.ctaLabel || "",
        ctaUrl: rest.buttonLink || rest.button?.link || rest.ctaUrl || "",
      };
    }

    // --------------------------------------------------------------
    // IMAGE GALLERY
    // --------------------------------------------------------------
    case "imageGallery": {
      const images = rest.images || [];
      const galleryItems = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imagePath = typeof img === "string" ? img : img.image;
        const caption = typeof img === "object" ? img.caption : "";

        const imageId = await helpers.uploadMediaIfNeeded(
          imagePath,
          helpers.tenantId,
          caption || `Gallery Image ${i + 1}`,
          helpers.tenantCode
        );

        if (imageId) {
          galleryItems.push({
            image: imageId,
            caption: caption || "",
          });
        }
      }

      return {
        blockType: "imageGallery",
        blockLabel: rest.blockLabel || "Gallery",
        images: galleryItems,
      };
    }

    // --------------------------------------------------------------
    // RICH TEXT BLOCK (HTML → Lexical)
    // --------------------------------------------------------------
    case "richText": {
      const html = rest.content || rest.html || "";
      const lexical = htmlToLexical(html);

      return {
        blockType: "richText",
        blockLabel: rest.blockLabel || "Content",
        content: lexical,
      };
    }

    // --------------------------------------------------------------
    // IMAGE + TEXT BLOCK
    // --------------------------------------------------------------
    case "imageText": {
      let imageId = null;

      if (rest.image) {
        imageId = await helpers.uploadMediaIfNeeded(
          rest.image,
          helpers.tenantId,
          rest.title || "Image & Text Image",
          helpers.tenantCode
        );
      }

      const html = rest.content || "";
      const lexical = htmlToLexical(html);

      return {
        blockType: "imageText",
        blockLabel: rest.blockLabel || "Image & Text",
        title: rest.title || "",
        subtitle: rest.subtitle || "",
        image: imageId,
        imagePosition: rest.imagePosition || "left",
        content: lexical,
      };
    }

    // --------------------------------------------------------------
    // CARD GRID BLOCK
    // --------------------------------------------------------------
    case "cardGrid": {
      const cards = rest.cards || [];
      const cardItems = [];

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        let cardImageId = null;

        if (card.image) {
          cardImageId = await helpers.uploadMediaIfNeeded(
            card.image,
            helpers.tenantId,
            card.title || `Card ${i + 1} Image`,
            helpers.tenantCode
          );
        }

        // Never include id field - always let Payload auto-generate it
        // This avoids Drizzle's uniqueness validation conflicts completely
        // Payload will handle ID generation internally for array items
        const cardItem = {
          image: cardImageId,
          title: card.title || "",
          description: card.description || "",
          buttonLabel: card.buttonLabel || "",
          buttonUrl: card.buttonUrl || "",
        };
        
        // Explicitly do NOT include id field - Payload will auto-generate

        cardItems.push(cardItem);
      }

      return {
        blockType: "cardGrid",
        blockLabel: rest.blockLabel || "Card Grid",
        title: rest.title || "",
        subtitle: rest.subtitle || "",
        cards: cardItems,
      };
    }

    // --------------------------------------------------------------
    // SPONSORS BLOCK
    // --------------------------------------------------------------
    case "sponsors": {
      const sponsors = rest.sponsors || [];
      const sponsorItems = [];

      for (let i = 0; i < sponsors.length; i++) {
        const sponsor = sponsors[i];
        let sponsorImageId = null;

        if (sponsor.image) {
          sponsorImageId = await helpers.uploadMediaIfNeeded(
            sponsor.image,
            helpers.tenantId,
            sponsor.title || `Sponsor ${i + 1} Logo`,
            helpers.tenantCode
          );
        }

        sponsorItems.push({
          image: sponsorImageId,
          title: sponsor.title || "",
          url: sponsor.url || "",
        });
      }

      return {
        blockType: "sponsors",
        blockLabel: rest.blockLabel || "Sponsors",
        title: rest.title || "",
        subtitle: rest.subtitle || "",
        sponsors: sponsorItems,
      };
    }

    // --------------------------------------------------------------
    // PROGRAMS BLOCK
    // --------------------------------------------------------------
    case "programs": {
      const programs = rest.programs || [];
      const programItems = [];

      for (let i = 0; i < programs.length; i++) {
        const program = programs[i];
        let programImageId = null;
        let coachPhotoId = null;

        // Upload program image
        if (program.image) {
          programImageId = await helpers.uploadMediaIfNeeded(
            program.image,
            helpers.tenantId,
            program.title || `Program ${i + 1} Image`,
            helpers.tenantCode
          );
        }

        // Upload coach photo if exists
        if (program.coach && program.coach.photo) {
          coachPhotoId = await helpers.uploadMediaIfNeeded(
            program.coach.photo,
            helpers.tenantId,
            program.coach.name || `Coach ${i + 1} Photo`,
            helpers.tenantCode
          );
        }

        const programItem = {
          title: program.title || "",
          image: programImageId,
          description: program.description || "",
          additionalInfo: program.additionalInfo || "",
          imagePosition: program.imagePosition || "left",
          schedule: program.schedule || [],
        };
        
        // Only include coach if it exists and has data
        if (program.coach && program.coach.name) {
          programItem.coach = {
            name: program.coach.name || "",
            photo: coachPhotoId,
            studies: program.coach.studies || "",
            bio: program.coach.bio || "",
            imagePosition: program.coach.imagePosition || "left",
          };
        }

        programItems.push(programItem);
      }

      return {
        blockType: "programs",
        blockLabel: rest.blockLabel || "Programs",
        title: rest.title || "",
        subtitle: rest.subtitle || "",
        programs: programItems,
      };
    }

    // --------------------------------------------------------------
    // CTA BANNER BLOCK
    // --------------------------------------------------------------
    case "ctaBanner": {
      return {
        blockType: "ctaBanner",
        blockLabel: rest.blockLabel || "CTA Banner",
        title: rest.title || "",
        description: rest.description || "",
        buttonLabel: rest.buttonLabel || "",
        buttonUrl: rest.buttonUrl || "",
        backgroundGradient: rest.backgroundGradient || "purple-orange",
      };
    }

    // --------------------------------------------------------------
    // FALLBACK
    // --------------------------------------------------------------
    default:
      throw new Error(
        `Unsupported block type "${type}". Supported: hero, imageGallery, richText, imageText, cardGrid, sponsors, programs, ctaBanner`
      );
  }
}

/**
 * Map an array of blocks
 */
export async function mapBlocks(blocks, helpers) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    console.log(`   📦 No blocks to map`);
    return [];
  }

  console.log(`   📦 Mapping ${blocks.length} block(s)...`);
  const mapped = [];

  for (let i = 0; i < blocks.length; i++) {
    try {
      const blockType = blocks[i]?.type || "unknown";
      console.log(`     - Mapping block ${i + 1}/${blocks.length}: ${blockType}`);
      const mappedBlock = await mapBlock(blocks[i], helpers);
      mapped.push(mappedBlock);
      console.log(`       ✓ Block ${i + 1} mapped successfully`);
    } catch (err) {
      console.error(`   ✗ Failed to map block at index ${i}:`, err.message);
      if (err.stack) console.error(`     Stack: ${err.stack}`);
      // Continue mapping (non-fatal)
    }
  }

  console.log(`   ✓ Mapped ${mapped.length}/${blocks.length} block(s)\n`);
  return mapped;
}
