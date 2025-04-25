"use client"

import React from 'react'
import { CircleAlert, CircleCheck, Wifi, WifiOff, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

interface ConnectionStatusProps {
  isConnected: boolean
  lastUpdated: Date | null
  className?: string
}

export function ConnectionStatus({ 
  isConnected, 
  lastUpdated,
  className
}: ConnectionStatusProps) {
  const formattedTime = lastUpdated 
    ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: nl })
    : 'Geen recente metingen';

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-amber-500" />
        )}
        <span className={cn(
          "font-medium",
          isConnected ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
        )}>
          {isConnected ? "Verbonden" : "Geen verbinding"}
        </span>
      </div>
      
      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        <span>Laatste meting: {formattedTime}</span>
      </span>
    </div>
  )
}
