"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Upload, X, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
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
}

interface Priority {
  id: string
  name: string
  level: number
  color: string | null
}

interface Project {
  id: string
  name: string
  description: string | null
  color: string | null
}

interface FileAttachment {
  id: string
  name: string
  originalName: string
  file?: File
  path?: string
}

interface EditTaskDialogProps {
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
}

export function EditTaskDialog({ 
  taskId, 
  open, 
  onOpenChange, 
  onTaskUpdated 
}: EditTaskDialogProps) {
  const { data: session } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date>()
  const [dueTime, setDueTime] = useState("")
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO")
  const [priorityId, setPriorityId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [editingAttachment, setEditingAttachment] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  useEffect(() => {
    if (open && taskId && session?.user?.email) {
      fetchTaskData()
    } else {
      resetForm()
    }
  }, [open, taskId, session])

  const fetchTaskData = async () => {
    if (!taskId) return

    try {
      setLoading(true)
      
      // Fetch task details
      const taskResponse = await fetch(`/api/tasks/${taskId}`)
      if (!taskResponse.ok) throw new Error("Failed to fetch task")
      const taskData = await taskResponse.json()
      
      // Fetch priorities and projects
      const [prioritiesResponse, projectsResponse] = await Promise.all([
        fetch("/api/priorities"),
        fetch(`/api/projects?userId=${session?.user?.email}`)
      ])
      
      if (!prioritiesResponse.ok) throw new Error("Failed to fetch priorities")
      if (!projectsResponse.ok) throw new Error("Failed to fetch projects")
      
      const prioritiesData = await prioritiesResponse.json()
      const projectsData = await projectsResponse.json()
      
      setTask(taskData)
      setPriorities(prioritiesData)
      setProjects(projectsData)
      
      // Set form values
      setTitle(taskData.title)
      setDescription(taskData.description || "")
      
      // Handle date and time
      if (taskData.dueDate) {
        const date = new Date(taskData.dueDate)
        setDueDate(date)
        setDueTime(date.toTimeString().slice(0, 5))
      } else {
        setDueDate(undefined)
        setDueTime("")
      }
      
      setStatus(taskData.status)
      setPriorityId(taskData.priority.id)
      setProjectId(taskData.project?.id || "none")
      
      // Set attachments if any
      setAttachments(taskData.attachments || [])
      
    } catch (error) {
      console.error("Error fetching task data:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTask(null)
    setTitle("")
    setDescription("")
    setDueDate(undefined)
    setDueTime("")
    setStatus("TODO")
    setPriorityId("")
    setProjectId("none")
    setAttachments([])
    setEditingAttachment(null)
    setEditingName("")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const attachment: FileAttachment = {
        id,
        name: file.name.split('.').slice(0, -1).join('.'),
        originalName: file.name,
        file
      }
      setAttachments(prev => [...prev, attachment])
    })

    // Reset the input
    if (e.target) {
      e.target.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const startEditingAttachment = (id: string, currentName: string) => {
    setEditingAttachment(id)
    setEditingName(currentName)
  }

  const saveAttachmentName = (id: string) => {
    setAttachments(prev => prev.map(att => 
      att.id === id ? { ...att, name: editingName } : att
    ))
    setEditingAttachment(null)
    setEditingName("")
  }

  const cancelEditingAttachment = () => {
    setEditingAttachment(null)
    setEditingName("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskId || !title.trim() || !priorityId) return

    try {
      setSubmitting(true)
      
      // Combine date and time
      let combinedDueDate: Date | null = null
      if (dueDate) {
        combinedDueDate = new Date(dueDate)
        if (dueTime) {
          const [hours, minutes] = dueTime.split(':').map(Number)
          combinedDueDate.setHours(hours, minutes, 0, 0)
        }
      }

      // Upload new files if any
      const uploadedFiles: Array<{
        id: string
        name: string
        originalName: string
        path: string
      }> = []
      
      for (const attachment of attachments) {
        if (attachment.file) { // New file to upload
          const formData = new FormData()
          formData.append('file', attachment.file)
          formData.append('fileName', attachment.name)
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            uploadedFiles.push({
              id: attachment.id,
              name: attachment.name,
              originalName: attachment.originalName,
              path: uploadData.path
            })
          }
        } else { // Existing file
          uploadedFiles.push({
            id: attachment.id,
            name: attachment.name,
            originalName: attachment.originalName,
            path: attachment.path || ''
          })
        }
      }
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: combinedDueDate?.toISOString(),
          status,
          priorityId,
          projectId: projectId === "none" ? null : projectId || null,
          attachments: uploadedFiles,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }

      onTaskUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating task:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={priorityId} onValueChange={setPriorityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: priority.color || '#6b7280' }}
                        />
                        {priority.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color || '#6b7280' }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: "TODO" | "IN_PROGRESS" | "DONE") => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-edit"
              />
              <label
                htmlFor="file-upload-edit"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload files</span>
              </label>
            </div>
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    {editingAttachment === attachment.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveAttachmentName(attachment.id)
                            if (e.key === 'Escape') cancelEditingAttachment()
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveAttachmentName(attachment.id)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEditingAttachment}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium flex-1">{attachment.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingAttachment(attachment.id, attachment.name)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAttachment(attachment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !priorityId || submitting}
            >
              {submitting ? "Updating..." : "Update Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
