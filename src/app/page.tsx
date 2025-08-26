"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sidebar } from "@/components/sidebar"
import { TaskCard } from "@/components/task-card"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { TaskDetails } from "@/components/task-details"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { DroppableColumn } from "@/components/droppable-column"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Plus, Search } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: "TODO" | "IN_PROGRESS" | "DONE"
  createdAt: string
  order: number
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

export default function Home() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    if (session?.user?.email) {
      fetchTasks()
    }
  }, [session])

  const fetchTasks = async () => {
    try {
      if (!session?.user?.email) return
      setLoading(true)
      const response = await fetch(`/api/tasks?userId=${session.user.email}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tasks")
      }
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === "TODO"),
    inProgress: filteredTasks.filter(task => task.status === "IN_PROGRESS"),
    done: filteredTasks.filter(task => task.status === "DONE")
  }

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

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskDetailsOpen(true)
  }

  const handleEditTask = (taskId: string) => {
    setEditTaskId(taskId)
    setIsEditTaskOpen(true)
    setIsTaskDetailsOpen(false)
  }

  const handleMoveTask = async (taskId: string, newStatus: string) => {
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
        throw new Error("Failed to move task")
      }

      fetchTasks()
    } catch (error) {
      console.error("Error moving task:", error)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId)
    setIsConfirmDeleteOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      const response = await fetch(`/api/tasks/${taskToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      fetchTasks()
      setTaskToDelete(null)
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the active task
    const activeTask = tasks.find(task => task.id === activeId)
    if (!activeTask) return

    // If we're over a column (TODO, IN_PROGRESS, DONE), allow the drop
    if (['TODO', 'IN_PROGRESS', 'DONE'].includes(overId)) {
      if (activeTask.status !== overId) {
        // Update the task status immediately for better UX
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeId
              ? { ...task, status: overId as "TODO" | "IN_PROGRESS" | "DONE" }
              : task
          )
        )
      }
      return
    }

    // If we're over another task
    const overTask = tasks.find(task => task.id === overId)
    if (overTask) {
      if (activeTask.status !== overTask.status) {
        // Moving to different column
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeId
              ? { ...task, status: overTask.status }
              : task
          )
        )
      }
      // Note: For same-column reordering, we'll handle it in handleDragEnd
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeTask = tasks.find(task => task.id === activeId)
    
    console.log('Drag ended:', { activeId, overId, activeTaskStatus: activeTask?.status })
    
    if (!activeTask) return

    let newStatus = activeTask.status
    let targetColumn = newStatus

    // Determine target column
    if (['TODO', 'IN_PROGRESS', 'DONE'].includes(overId)) {
      targetColumn = overId as "TODO" | "IN_PROGRESS" | "DONE"
      console.log('Dropped on column:', targetColumn)
    } else {
      const overTask = tasks.find(task => task.id === overId)
      if (overTask) {
        targetColumn = overTask.status
        console.log('Dropped on task in column:', targetColumn)
      }
    }

    console.log('Target column determined:', { 
      originalStatus: activeTask.status, 
      targetColumn, 
      isColumnChange: targetColumn !== activeTask.status 
    })

    // Get all tasks in the target column
    const targetColumnTasks = tasks.filter(task => 
      task.status === targetColumn && task.id !== activeId
    )

    let newOrder = 0
    let insertPosition = targetColumnTasks.length

    // If dropping over a specific task, calculate insertion position
    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(overId)) {
      const overTask = tasks.find(task => task.id === overId)
      if (overTask) {
        insertPosition = targetColumnTasks.findIndex(task => task.id === overId)
        if (insertPosition === -1) insertPosition = targetColumnTasks.length
      }
    }

    // Calculate new order values
    const updates: Array<{ id: string; order: number; status?: string }> = []

    // Insert the active task at the correct position
    targetColumnTasks.splice(insertPosition, 0, { ...activeTask, status: targetColumn })

    // Recalculate orders for all tasks in the target column
    targetColumnTasks.forEach((task, index) => {
      if (task.id === activeId) {
        // Always include status if moving to a different column
        const statusUpdate = targetColumn !== activeTask.status ? targetColumn : undefined
        console.log('Active task update:', { 
          taskId: task.id, 
          order: index, 
          originalStatus: activeTask.status, 
          targetColumn, 
          statusUpdate,
          willUpdateStatus: statusUpdate !== undefined
        })
        const updateData: { id: string; order: number; status?: string } = {
          id: task.id,
          order: index
        }
        // CRITICAL DEBUG: Forcefully add status for testing
        console.log('CRITICAL DEBUG:', {
          targetColumn,
          activeTaskStatus: activeTask.status,
          isDifferent: targetColumn !== activeTask.status,
          targetColumnType: typeof targetColumn,
          activeTaskStatusType: typeof activeTask.status
        })
        // TEMPORARY FIX: Always include status to test if that works
        updateData.status = targetColumn
        console.log('FORCED STATUS UPDATE TO:', targetColumn)
        updates.push(updateData)
      } else if (task.order !== index) {
        updates.push({
          id: task.id,
          order: index
        })
      }
    })

    // If moving to a different column, also update the source column orders
    if (targetColumn !== activeTask.status) {
      const sourceColumnTasks = tasks
        .filter(task => task.status === activeTask.status && task.id !== activeId)
        .sort((a, b) => a.order - b.order)

      sourceColumnTasks.forEach((task, index) => {
        if (task.order !== index) {
          updates.push({
            id: task.id,
            order: index
          })
        }
      })
    }

    // Only make API call if there are updates
    if (updates.length > 0) {
      try {
        // Optimistically update the UI
        setTasks(prevTasks => {
          const newTasks = [...prevTasks]
          updates.forEach(update => {
            const taskIndex = newTasks.findIndex(t => t.id === update.id)
            if (taskIndex !== -1) {
              newTasks[taskIndex] = {
                ...newTasks[taskIndex],
                order: update.order,
                ...(update.status && { status: update.status as "TODO" | "IN_PROGRESS" | "DONE" })
              }
            }
          })
          return newTasks.sort((a, b) => {
            if (a.status !== b.status) {
              const statusOrder = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }
              return statusOrder[a.status] - statusOrder[b.status]
            }
            return a.order - b.order
          })
        })

        // Make batch API call
        console.log('Sending batch update:', JSON.stringify(updates, null, 2))
        const response = await fetch('/api/tasks/batch-update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates }),
        })

        if (!response.ok) {
          throw new Error('Failed to update task orders')
        }
      } catch (error) {
        console.error('Error updating task orders:', error)
        // Revert optimistic update by refetching
        fetchTasks()
      }
    }
  }

  const handleTaskUpdated = () => {
    fetchTasks()
  }

  const handleTaskDeleted = () => {
    fetchTasks()
    setIsTaskDetailsOpen(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading tasks...</p>
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
            <Button onClick={fetchTasks}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-background">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
              
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Button onClick={() => setIsAddTaskOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </nav>
                
                <div className="flex items-center space-x-2">
                  <ProfileDropdown />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
              <p className="text-muted-foreground">
                Manage your tasks and stay organized
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do Column */}
              <DroppableColumn
                id="TODO"
                title="To Do"
                tasks={tasksByStatus.todo}
                onTaskClick={handleTaskClick}
                onEditTask={handleEditTask}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
              />

              {/* In Progress Column */}
              <DroppableColumn
                id="IN_PROGRESS"
                title="In Progress"
                tasks={tasksByStatus.inProgress}
                onTaskClick={handleTaskClick}
                onEditTask={handleEditTask}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
              />

              {/* Done Column */}
              <DroppableColumn
                id="DONE"
                title="Done"
                tasks={tasksByStatus.done}
                onTaskClick={handleTaskClick}
                onEditTask={handleEditTask}
                onMoveTask={handleMoveTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
          </main>
        </div>

        <DragOverlay>
          {activeId ? (
            <TaskCard
              task={tasks.find(task => task.id === activeId)!}
              onClick={() => {}}
              onEdit={() => {}}
              onMove={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </div>

      <AddTaskDialog 
        open={isAddTaskOpen} 
        onOpenChange={setIsAddTaskOpen}
        onTaskCreated={fetchTasks}
      />

      <TaskDetails
        taskId={selectedTaskId}
        open={isTaskDetailsOpen}
        onOpenChange={setIsTaskDetailsOpen}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
        onEditTask={handleEditTask}
      />

      <EditTaskDialog
        taskId={editTaskId}
        open={isEditTaskOpen}
        onOpenChange={setIsEditTaskOpen}
        onTaskUpdated={handleTaskUpdated}
      />

      <ConfirmationDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        icon="delete"
        onConfirm={confirmDeleteTask}
      />
    </DndContext>
  )
}
