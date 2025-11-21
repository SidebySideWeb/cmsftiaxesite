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
import type { Block } from 'payload'

// Ensure all blocks are defined and have slugs
const blocks: Block[] = []
if (HeroBlock && HeroBlock.slug) blocks.push(HeroBlock)
if (RichTextBlock && RichTextBlock.slug) blocks.push(RichTextBlock)
if (ImageGalleryBlock && ImageGalleryBlock.slug) blocks.push(ImageGalleryBlock)
if (ImageTextBlock && ImageTextBlock.slug) blocks.push(ImageTextBlock)
if (CardGridBlock && CardGridBlock.slug) blocks.push(CardGridBlock)
if (SponsorsBlock && SponsorsBlock.slug) blocks.push(SponsorsBlock)
if (ProgramsBlock && ProgramsBlock.slug) blocks.push(ProgramsBlock)
if (CtaBannerBlock && CtaBannerBlock.slug) blocks.push(CtaBannerBlock)
if (ContactDetailsBlock && ContactDetailsBlock.slug) blocks.push(ContactDetailsBlock)

export const sharedBlocks: Block[] = blocks
