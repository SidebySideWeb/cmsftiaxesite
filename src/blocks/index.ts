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
if (HeroBlock && HeroBlock.slug) blocks.push(HeroBlock)
if (RichTextBlock && RichTextBlock.slug) blocks.push(RichTextBlock)
if (ImageGalleryBlock && ImageGalleryBlock.slug) blocks.push(ImageGalleryBlock)
if (ImageTextBlock && ImageTextBlock.slug) blocks.push(ImageTextBlock)
if (CardGridBlock && CardGridBlock.slug) blocks.push(CardGridBlock)
if (SponsorsBlock && SponsorsBlock.slug) blocks.push(SponsorsBlock)
if (ProgramsBlock && ProgramsBlock.slug) blocks.push(ProgramsBlock)
if (CtaBannerBlock && CtaBannerBlock.slug) blocks.push(CtaBannerBlock)
if (ContactDetailsBlock && ContactDetailsBlock.slug) blocks.push(ContactDetailsBlock)
if (FAQBlock && FAQBlock.slug) blocks.push(FAQBlock)
if (TabsBlock && TabsBlock.slug) blocks.push(TabsBlock)
if (VideoBlock && VideoBlock.slug) blocks.push(VideoBlock)
if (SliderBlock && SliderBlock.slug) blocks.push(SliderBlock)
if (TestimonialsBlock && TestimonialsBlock.slug) blocks.push(TestimonialsBlock)
if (LogoCloudBlock && LogoCloudBlock.slug) blocks.push(LogoCloudBlock)
if (PricingTableBlock && PricingTableBlock.slug) blocks.push(PricingTableBlock)
if (ContactFormBlock && ContactFormBlock.slug) blocks.push(ContactFormBlock)
if (MapBlock && MapBlock.slug) blocks.push(MapBlock)
if (FeatureListBlock && FeatureListBlock.slug) blocks.push(FeatureListBlock)

export const sharedBlocks: Block[] = blocks
