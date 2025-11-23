// Blocks are exported here
import { HeroBlock } from './HeroBlock'
import { RichTextBlock } from './RichTextBlock'
import { ImageGalleryBlock } from './ImageGalleryBlock'
import { ImageTextBlock } from './ImageTextBlock'
import { CardGridBlock } from './CardGridBlock'
import { SponsorsBlock } from './SponsorsBlock'
import { ProgramsBlock } from './ProgramsBlock'
import { CtaBannerBlock } from './CtaBannerBlock'
import { ContactDetailsBlock } from './ContactDetailsBlock'
import { NewsBlock } from './NewsBlock'
import { FAQBlock } from './FAQBlock'
import { TabsBlock } from './TabsBlock'
import { VideoBlock } from './VideoBlock'
import { SliderBlock } from './SliderBlock'
import { TestimonialsBlock } from './TestimonialsBlock'
import { LogoCloudBlock } from './LogoCloudBlock'
import { PricingTableBlock } from './PricingTableBlock'
import { ContactFormBlock } from './ContactFormBlock'
import { MapBlock } from './MapBlock'
import { FeatureListBlock } from './FeatureListBlock'
import type { Block } from 'payload'

// Ensure all blocks are defined and have slugs
const blocks: Block[] = []

// Helper to safely add blocks with error handling
function addBlock(block: Block | undefined, name: string): void {
  try {
    if (block && block.slug) {
      blocks.push(block)
    } else {
      console.warn(`[Blocks] Skipping ${name}: missing or invalid`)
    }
  } catch (error) {
    console.error(`[Blocks] Error loading ${name}:`, error)
  }
}

// Add existing blocks
addBlock(HeroBlock, 'HeroBlock')
addBlock(RichTextBlock, 'RichTextBlock')
addBlock(ImageGalleryBlock, 'ImageGalleryBlock')
addBlock(ImageTextBlock, 'ImageTextBlock')
addBlock(CardGridBlock, 'CardGridBlock')
addBlock(SponsorsBlock, 'SponsorsBlock')
addBlock(ProgramsBlock, 'ProgramsBlock')
addBlock(CtaBannerBlock, 'CtaBannerBlock')
addBlock(ContactDetailsBlock, 'ContactDetailsBlock')
addBlock(NewsBlock, 'NewsBlock')

// Add new V0 blocks
// Note: Run migration 20250117_create_v0_blocks_tables first to create database tables
try {
  addBlock(FAQBlock, 'FAQBlock')
  addBlock(TabsBlock, 'TabsBlock')
  addBlock(VideoBlock, 'VideoBlock')
  addBlock(SliderBlock, 'SliderBlock')
  addBlock(TestimonialsBlock, 'TestimonialsBlock')
  addBlock(LogoCloudBlock, 'LogoCloudBlock')
  addBlock(PricingTableBlock, 'PricingTableBlock')
  addBlock(ContactFormBlock, 'ContactFormBlock')
  addBlock(MapBlock, 'MapBlock')
  addBlock(FeatureListBlock, 'FeatureListBlock')
} catch (error) {
  console.error('[Blocks] Error loading V0 blocks:', error)
  // Continue with existing blocks only
}

export const sharedBlocks: Block[] = blocks
