'use client'

import React from 'react'
import NextLink from 'next/link'
export { useRouter, usePathname, useParams, useSearchParams } from 'next/navigation'

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href?: string
  to?: string
  children?: React.ReactNode
  replace?: boolean
  scroll?: boolean
  prefetch?: boolean
}

export function Link({ href, to, children, replace, scroll, prefetch, ...rest }: LinkProps) {
  const target = href ?? to ?? '#'
  return React.createElement(
    NextLink,
    { href: target, replace, scroll, prefetch, ...rest },
    children
  )
}

export default Link
