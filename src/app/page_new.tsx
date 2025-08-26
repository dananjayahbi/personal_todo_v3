"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sidebar } from "@/components/sidebar"
import { TaskCard } from "@/components/task-card"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { TaskDetails } from "@/components/task-details"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { SortableTaskCard } from "@/components/sortable-task-card"
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
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

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

    // Check if we're dropping over a column
    const overColumn = ['TODO', 'IN_PROGRESS', 'DONE'].find(status => 
      overId === status || overId.startsWith(status + '-')
    )

    if (overColumn) {
      const activeTask = tasks.find(task => task.id === activeId)
      if (activeTask && activeTask.status !== overColumn) {
        // Update the task status immediately for better UX
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeId
              ? { ...task, status: overColumn as "TODO" | "IN_PROGRESS" | "DONE" }
              : task
          )
        )
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if we're dropping over a column
    const overColumn = ['TODO', 'IN_PROGRESS', 'DONE'].find(status => 
      overId === status || overId.startsWith(status + '-')
    )

    if (overColumn) {
      const activeTask = tasks.find(task => task.id === activeId)
      if (activeTask && activeTask.status !== overColumn) {
        // Update the task status on the server
        await handleMoveTask(activeId, overColumn)
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
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">John Doe</span>
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
              <Card className="flex flex-col" id="TODO">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between">
                    <span>To Do</span>
                    <Badge variant="secondary">{tasksByStatus.todo.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <SortableContext items={tasksByStatus.todo.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {tasksByStatus.todo.map((task) => (
                      <SortableTaskCard 
                        key={task.id} 
                        task={task} 
                        onClick={handleTaskClick}
                        onEdit={handleEditTask}
                        onMove={handleMoveTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </SortableContext>
                  {tasksByStatus.todo.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No tasks in this column
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* In Progress Column */}
              <Card className="flex flex-col" id="IN_PROGRESS">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between">
                    <span>In Progress</span>
                    <Badge variant="secondary">{tasksByStatus.inProgress.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <SortableContext items={tasksByStatus.inProgress.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {tasksByStatus.inProgress.map((task) => (
                      <SortableTaskCard 
                        key={task.id} 
                        task={task} 
                        onClick={handleTaskClick}
                        onEdit={handleEditTask}
                        onMove={handleMoveTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </SortableContext>
                  {tasksByStatus.inProgress.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No tasks in this column
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Done Column */}
              <Card className="flex flex-col" id="DONE">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between">
                    <span>Done</span>
                    <Badge variant="secondary">{tasksByStatus.done.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <SortableContext items={tasksByStatus.done.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {tasksByStatus.done.map((task) => (
                      <SortableTaskCard 
                        key={task.id} 
                        task={task} 
                        onClick={handleTaskClick}
                        onEdit={handleEditTask}
                        onMove={handleMoveTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </SortableContext>
                  {tasksByStatus.done.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No tasks in this column
                    </p>
                  )}
                </CardContent>
              </Card>
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
