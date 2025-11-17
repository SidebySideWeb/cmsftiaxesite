import React from 'react'

export const FooterRowLabel: React.FC<{ data?: { title?: string }, index?: number }> = ({ data, index }) => {
  return <>{data?.title || `Footer Menu ${String((index ?? 0) + 1).padStart(2, '0')}`}</>
}

