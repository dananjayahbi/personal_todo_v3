"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sidebar } from "@/components/sidebar"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Settings,
  Palette,
  ArrowUp,
  ArrowDown
} from "lucide-react"

interface Priority {
  id: string
  name: string
  level: number
  color: string | null
  _count: {
    tasks: number
  }
}

export default function PrioritiesPage() {
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    level: 1,
    color: ""
  })

  useEffect(() => {
    fetchPriorities()
  }, [])

  const fetchPriorities = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/priorities")
      if (!response.ok) {
        throw new Error("Failed to fetch priorities")
      }
      const data = await response.json()
      setPriorities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingPriority 
        ? `/api/priorities/${editingPriority.id}`
        : "/api/priorities"
      
      const method = editingPriority ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save priority")
      }

      setIsDialogOpen(false)
      setEditingPriority(null)
      setFormData({ name: "", level: 1, color: "" })
      fetchPriorities()
    } catch (err) {
      console.error("Error saving priority:", err)
    }
  }

  const handleEdit = (priority: Priority) => {
    setEditingPriority(priority)
    setFormData({
      name: priority.name,
      level: priority.level,
      color: priority.color || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (priorityId: string) => {
    if (!confirm("Are you sure you want to delete this priority?")) {
      return
    }

    try {
      const response = await fetch(`/api/priorities/${priorityId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete priority")
      }

      fetchPriorities()
    } catch (err) {
      console.error("Error deleting priority:", err)
    }
  }

  const handleMoveUp = async (priorityId: string) => {
    const priority = priorities.find(p => p.id === priorityId)
    if (!priority || priority.level <= 1) return

    const priorityAbove = priorities.find(p => p.level === priority.level - 1)
    if (!priorityAbove) return

    try {
      // Swap levels
      await Promise.all([
        fetch(`/api/priorities/${priorityId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...priority, level: priority.level - 1 }),
        }),
        fetch(`/api/priorities/${priorityAbove.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...priorityAbove, level: priorityAbove.level + 1 }),
        }),
      ])

      fetchPriorities()
    } catch (err) {
      console.error("Error moving priority:", err)
    }
  }

  const handleMoveDown = async (priorityId: string) => {
    const priority = priorities.find(p => p.id === priorityId)
    if (!priority || priority.level >= priorities.length) return

    const priorityBelow = priorities.find(p => p.level === priority.level + 1)
    if (!priorityBelow) return

    try {
      // Swap levels
      await Promise.all([
        fetch(`/api/priorities/${priorityId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...priority, level: priority.level + 1 }),
        }),
        fetch(`/api/priorities/${priorityBelow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...priorityBelow, level: priorityBelow.level - 1 }),
        }),
      ])

      fetchPriorities()
    } catch (err) {
      console.error("Error moving priority:", err)
    }
  }

  const getPriorityBadgeStyle = (priority: Priority) => {
    if (priority.color) {
      return {
        backgroundColor: `${priority.color}20`,
        color: priority.color,
        borderColor: `${priority.color}40`
      }
    }
    
    switch (priority.name.toLowerCase()) {
      case "high":
        return {
          backgroundColor: "#ef444420",
          color: "#ef4444",
          borderColor: "#ef444440"
        }
      case "medium":
        return {
          backgroundColor: "#f59e0b20",
          color: "#f59e0b",
          borderColor: "#f59e0b40"
        }
      case "low":
        return {
          backgroundColor: "#10b98120",
          color: "#10b981",
          borderColor: "#10b98140"
        }
      default:
        return {
          backgroundColor: "#6b728020",
          color: "#6b7280",
          borderColor: "#6b728040"
        }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading priorities...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchPriorities}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Priorities</h1>
            </div>
            
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Priority
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Manage Priorities</h2>
            <p className="text-muted-foreground">
              Define and organize task priority levels
            </p>
          </div>

          <div className="grid gap-4">
            {priorities
              .sort((a, b) => a.level - b.level)
              .map((priority) => (
                <Card key={priority.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className="text-sm"
                            style={getPriorityBadgeStyle(priority)}
                          >
                            {priority.name}
                          </Badge>
                          {priority.color && (
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: priority.color }}
                            />
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Level {priority.level} • {priority._count.tasks} tasks
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(priority.id)}
                          disabled={priority.level <= 1}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(priority.id)}
                          disabled={priority.level >= priorities.length}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(priority)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(priority.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {priorities.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No priorities yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first priority level to get started
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Priority
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Add/Edit Priority Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPriority ? "Edit Priority" : "Add New Priority"}
            </DialogTitle>
            <DialogDescription>
              {editingPriority 
                ? "Update the priority details below."
                : "Create a new priority level for your tasks."
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High, Medium, Low"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max={priorities.length + 1}
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers indicate higher priority
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color (optional)</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#000000"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPriority ? "Update" : "Create"} Priority
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}