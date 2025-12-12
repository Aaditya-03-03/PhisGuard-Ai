"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface NeonTableProps<T> {
  columns: Column<T>[]
  data: T[]
  className?: string
  onRowClick?: (item: T) => void
}

export function NeonTable<T extends { id: string | number }>({
  columns,
  data,
  className,
  onRowClick,
}: NeonTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-cyan/20">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cyan/10">
          {data.map((item) => (
            <tr
              key={item.id}
              className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-cyan/5")}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className={cn("px-4 py-4 text-sm", column.className)}>
                  {column.render ? column.render(item) : String(item[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
