'use client'

import React, { useState, useEffect } from 'react'

export interface UserAvatarProps {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackBg?: string // Optional custom background color
}

const sizeMap: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-12 h-12 text-[15px]',
  xl: 'w-16 h-16 text-[20px]',
}

export function getInitials(name?: string | null, email?: string | null): string {
  const raw = (name && name.trim()) || (email ? email.split('@')[0].trim() : '')
  if (!raw) return 'U'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0][0].toUpperCase()
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 'md',
  className = '',
  fallbackBg,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  const initials = getInitials(name, email)
  const isColorCode =
    fallbackBg?.startsWith('#') ||
    fallbackBg?.startsWith('rgb') ||
    fallbackBg?.startsWith('hsl')

  const bgClasses = isColorCode
    ? 'text-white'
    : (fallbackBg || 'bg-olive dark:bg-dark-olive text-white')

  const hasImage = Boolean(avatarUrl && !imgError)

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden font-semibold select-none ${
        sizeMap[size] || sizeMap.md
      } ${!hasImage ? bgClasses : 'bg-olive-soft/30 dark:bg-dark-olive-soft/30'} ${className}`}
      style={!hasImage && isColorCode ? { backgroundColor: fallbackBg } : undefined}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl!}
          alt={name || email || 'Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
