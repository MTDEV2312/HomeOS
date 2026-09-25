'use client'

import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer as BaseResponsiveContainer,
  type ResponsiveContainerProps,
} from 'recharts'

export {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function ResponsiveContainer({
  children,
  minHeight = 240,
  ...props
}: ResponsiveContainerProps & { minHeight?: number | string }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    const height = typeof props.height === 'number' ? props.height : minHeight
    return (
      <div
        style={{ width: '100%', height }}
        className="flex items-center justify-center text-muted dark:text-dark-muted text-xs bg-bg/50 dark:bg-dark-bg/50 rounded"
        aria-hidden="true"
      />
    )
  }

  return (
    <BaseResponsiveContainer {...props}>
      {children}
    </BaseResponsiveContainer>
  )
}

export default ResponsiveContainer
