"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Calendar, 
  Clock, 
  MessageCircle, 
  Paperclip, 
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft,
  Send,
  Download,
  X
} from "lucide-react"
import { format } from "date-fns"
import { EditTaskDialog } from "./edit-task-dialog"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  createdAt: string
  updatedAt: string
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
  user: {
    id: string
    name: string | null
    email: string
  }
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

interface TaskDetailsProps {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: () => void
}

export function TaskDetails({ 
  taskId, 
  open, 
  onOpenChange, 
  onTaskUpdated
}: TaskDetailsProps) {
  const { data: session } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Get user email from session
  const currentUserId = session?.user?.email || ""

  useEffect(() => {
    if (open && taskId && session?.user?.email) {
      fetchTaskDetails()
    } else {
      setTask(null)
      setError(null)
    }
  }, [open, taskId, session])

  const fetchTaskDetails = async () => {
    if (!taskId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch task details")
      }

      const taskData = await response.json()
      setTask(taskData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = () => {
    setEditDialogOpen(true)
  }

  const handleTaskUpdated = () => {
    fetchTaskDetails() // Refresh task details
    onTaskUpdated?.() // Call parent callback if provided
  }

  const handleDeleteTask = async () => {
    if (!taskId || !task) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      onTaskUpdated?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleStatusChange = async (newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    if (!taskId || !task) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task status")
      }

      setTask({ ...task, status: newStatus })
      onTaskUpdated?.()
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  const handleAddComment = async () => {
    if (!taskId || !newComment.trim()) return

    try {
      setAddingComment(true)
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          userEmail: currentUserId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add comment")
      }

      const comment = await response.json()
      setTask(prevTask => {
        if (!prevTask) return prevTask
        return {
          ...prevTask,
          comments: [...(prevTask.comments || []), comment]
        }
      })
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setAddingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!taskId) return

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete comment")
      }

      setTask(prevTask => {
        if (!prevTask) return prevTask
        return {
          ...prevTask,
          comments: (prevTask.comments || []).filter(c => c.id !== commentId)
        }
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const getPriorityColor = (priority: { name: string; color: string | null }) => {
    if (priority.color) {
      return `bg-[${priority.color}]/10 text-[${priority.color}] border-[${priority.color}]/20`
    }
    switch (priority.name.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800 border-red-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getProjectColor = (project: { name: string; color: string | null } | null) => {
    if (!project) return "bg-gray-100 text-gray-800 border-gray-200"
    if (project.color) {
      return `bg-[${project.color}]/10 text-[${project.color}] border-[${project.color}]/20`
    }
    switch (project.name.toLowerCase()) {
      case "work": return "bg-blue-100 text-blue-800 border-blue-200"
      case "health": return "bg-green-100 text-green-800 border-green-200"
      case "personal": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTaskDetails}>Retry</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!task) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-2 pb-4 pt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl font-semibold">
              {task.title}
            </DialogTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditTask}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteTask}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Left side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Quick Actions */}
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={
                  task.status === "TODO" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  task.status === "IN_PROGRESS" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  "bg-green-50 text-green-700 border-green-200"
                }
              >
                {task.status === "TODO" ? "To Do" : 
                 task.status === "IN_PROGRESS" ? "In Progress" : "Done"}
              </Badge>

              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={task.status === "TODO" ? "default" : "outline"}
                  onClick={() => handleStatusChange("TODO")}
                >
                  To Do
                </Button>
                <Button
                  size="sm"
                  variant={task.status === "IN_PROGRESS" ? "default" : "outline"}
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={task.status === "DONE" ? "default" : "outline"}
                  onClick={() => handleStatusChange("DONE")}
                >
                  Done
                </Button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {task.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">Comments ({task.comments?.length || 0})</span>
                </div>
                
                {/* Comments List */}
                <div className="space-y-3 mb-4">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {comment.user.name?.split(' ').map(n => n[0]).join('') || 
                                 comment.user.email.split('@')[0].slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {comment.user.name || comment.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), "PPp")}
                            </span>
                          </div>
                          {comment.user.email === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No comments yet. Be the first to add one!
                    </p>
                  )}
                </div>

                {/* Add Comment Form */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addingComment}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {addingComment ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Paperclip className="h-4 w-4" />
                  <span className="font-medium">Attachments ({task.attachments?.length || 0})</span>
                </div>
                
                {task.attachments && task.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {task.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground">({attachment.originalName})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.path, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No attachments yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right side */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Assignee */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Assignee</h4>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {task.user.name?.split(' ').map(n => n[0]).join('') || 
                           task.user.email.split('@')[0].slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {task.user.name || task.user.email}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Due Date */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Due Date</h4>
                    {task.dueDate ? (
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(task.dueDate), "PPP")}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No due date</span>
                    )}
                  </div>

                  <Separator />

                  {/* Priority */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Priority</h4>
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(task.priority)}
                    >
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: task.priority.color || '#6b7280' }}
                        />
                        {task.priority.name}
                      </div>
                    </Badge>
                  </div>

                  <Separator />

                  {/* Project */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Project</h4>
                    {task.project ? (
                      <Badge 
                        variant="outline" 
                        className={getProjectColor(task.project)}
                      >
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: task.project.color || '#6b7280' }}
                          />
                          {task.project.name}
                        </div>
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No project</span>
                    )}
                  </div>

                  <Separator />

                  {/* Timestamps */}
                  <div className="space-y-2">
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Created</h5>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(task.createdAt), "PPp")}</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Last Updated</h5>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(task.updatedAt), "PPp")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
      
      {/* Edit Task Dialog */}
      <EditTaskDialog
        taskId={taskId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </Dialog>
  )
}
