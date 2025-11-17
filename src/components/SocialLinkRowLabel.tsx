import React from 'react'

export const SocialLinkRowLabel: React.FC<{ data?: { platform?: string }, index?: number }> = ({ data, index }) => {
  return <>{data?.platform || `Social Link ${String((index ?? 0) + 1).padStart(2, '0')}`}</>
}

