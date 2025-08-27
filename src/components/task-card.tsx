"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Clock, MessageCircle, Paperclip } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  createdAt: string
  priority: {
    id: string
    name: string
    level: number
    color: string | null
  }
  project: {
    id: string
    name: string
    description: string | null
    color: string | null
  } | null
  attachments?: {
    id: string
    name: string
    originalName: string
    path: string
  }[]
  comments?: {
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }[]
}

interface TaskCardProps {
  task: Task
  onClick?: (taskId: string) => void
  onEdit?: (taskId: string) => void
  onMove?: (taskId: string, newStatus: string) => void
  onDelete?: (taskId: string) => void
  isSelected?: boolean
  onSelect?: (taskId: string, checked: boolean) => void
  showSelection?: boolean
}

export function TaskCard({ task, onClick, onEdit, onMove, onDelete, isSelected = false, onSelect, showSelection = false }: TaskCardProps) {
  const getPriorityColor = (priority: { name: string; color: string | null }) => {
    if (priority.color) {
      return `bg-[${priority.color}]/10 text-[${priority.color}] border-[${priority.color}]/20`
    }
    // Assign unique colors based on priority name
    const colorMap: { [key: string]: string } = {
      "critical": "bg-red-100 text-red-800 border-red-200",
      "high": "bg-orange-100 text-orange-800 border-orange-200", 
      "medium": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "low": "bg-green-100 text-green-800 border-green-200",
      "urgent": "bg-purple-100 text-purple-800 border-purple-200",
      "normal": "bg-blue-100 text-blue-800 border-blue-200"
    }
    return colorMap[priority.name.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getProjectColor = (project: { name: string; color: string | null } | null) => {
    if (!project) return "bg-gray-100 text-gray-800 border-gray-200"
    if (project.color) {
      return `bg-[${project.color}]/10 text-[${project.color}] border-[${project.color}]/20`
    }
    // Assign unique colors based on project name
    const colorMap: { [key: string]: string } = {
      "work": "bg-blue-100 text-blue-800 border-blue-200",
      "personal": "bg-purple-100 text-purple-800 border-purple-200",
      "health": "bg-green-100 text-green-800 border-green-200",
      "finance": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "education": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "family": "bg-pink-100 text-pink-800 border-pink-200",
      "hobbies": "bg-teal-100 text-teal-800 border-teal-200",
      "travel": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "shopping": "bg-amber-100 text-amber-800 border-amber-200",
      "social": "bg-rose-100 text-rose-800 border-rose-200"
    }
    return colorMap[project.name.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getDefaultPriorityColor = (priorityName: string) => {
    const colorMap: { [key: string]: string } = {
      "critical": "#ef4444",
      "high": "#f97316", 
      "medium": "#eab308",
      "low": "#22c55e",
      "urgent": "#a855f7",
      "normal": "#3b82f6"
    }
    return colorMap[priorityName.toLowerCase()] || "#6b7280"
  }

  const getDefaultProjectColor = (projectName: string) => {
    const colorMap: { [key: string]: string } = {
      "work": "#3b82f6",
      "personal": "#a855f7",
      "health": "#22c55e",
      "finance": "#eab308",
      "education": "#6366f1",
      "family": "#ec4899",
      "hobbies": "#14b8a6",
      "travel": "#06b6d4",
      "shopping": "#f59e0b",
      "social": "#f43f5e"
    }
    return colorMap[projectName.toLowerCase()] || "#6b7280"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    })
  }

  const getProjectBackgroundColor = (project: { name: string; color: string | null } | null) => {
    if (!project) return ""
    const color = project.color || getDefaultProjectColor(project.name)
    // Convert hex to RGB and add alpha for faded background
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return `rgba(${r}, ${g}, ${b}, 0.05)`
  }

  const getProjectRibbonColor = (project: { name: string; color: string | null } | null) => {
    if (!project) return ""
    return project.color || getDefaultProjectColor(project.name)
  }

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => !showSelection && onClick?.(task.id)}
      style={{ 
        backgroundColor: task.project ? getProjectBackgroundColor(task.project) : undefined
      }}
    >
      {/* Project Color Ribbon */}
      {task.project && (
        <div 
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: getProjectRibbonColor(task.project) }}
        />
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect?.(task.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <h3 
              className="font-medium text-sm leading-tight flex-1 pr-2"
              onClick={() => showSelection && onClick?.(task.id)}
            >
              {task.title}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(task.id)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  // Show submenu or move to next status
                  const nextStatus = task.status === "TODO" ? "IN_PROGRESS" : 
                                   task.status === "IN_PROGRESS" ? "DONE" : "TODO"
                  onMove?.(task.id, nextStatus)
                }}
              >
                Move to {task.status === "TODO" ? "In Progress" : 
                        task.status === "IN_PROGRESS" ? "Done" : "To Do"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(task.id)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge 
            variant="outline" 
            className={`text-xs ${getPriorityColor(task.priority)}`}
          >
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: task.priority.color || getDefaultPriorityColor(task.priority.name) }}
              />
              {task.priority.name}
            </div>
          </Badge>
          {task.project && (
            <Badge 
              variant="outline" 
              className={`text-xs ${getProjectColor(task.project)}`}
            >
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: task.project.color || getDefaultProjectColor(task.project.name) }}
                />
                {task.project.name}
              </div>
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{task.comments?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments?.length || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}