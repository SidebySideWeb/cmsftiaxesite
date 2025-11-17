import React from 'react'

export const MenuItemRowLabel: React.FC<{ data?: { label?: string }, index?: number }> = ({ data, index }) => {
  return <>{data?.label || `Menu Item ${String((index ?? 0) + 1).padStart(2, '0')}`}</>
}

