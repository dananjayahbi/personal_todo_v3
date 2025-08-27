"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, X } from "lucide-react"

interface BulkActionsBarProps {
  selectedCount: number
  onDelete: () => void
  onClearSelection: () => void
}

export function BulkActionsBar({ selectedCount, onDelete, onClearSelection }: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
