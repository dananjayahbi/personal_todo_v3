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
import { ProfileDropdown } from "@/components/profile-dropdown"
import { 
  Plus, 
  Search, 
  Filter,
  SortAsc,
  Calendar,
  User,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"

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

export default function TasksPage() {
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
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")

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

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || task.status === filterStatus
    const matchesProject = filterProject === "all" || task.project?.id === filterProject
    const matchesPriority = filterPriority === "all" || task.priority.id === filterPriority
    
    return matchesSearch && matchesStatus && matchesProject && matchesPriority
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case "priority":
        return b.priority.level - a.priority.level
      case "title":
        return a.title.localeCompare(b.title)
      case "createdAt":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const tasksByStatus = {
    todo: tasks.filter(task => task.status === "TODO"),
    inProgress: tasks.filter(task => task.status === "IN_PROGRESS"),
    done: tasks.filter(task => task.status === "DONE")
  }

  const projects = tasks
    .map(task => task.project)
    .filter(Boolean)
    .filter((project, index, array) => 
      array.findIndex(p => p!.id === project!.id) === index
    )
  const priorities = tasks
    .map(task => task.priority)
    .filter((priority, index, array) => 
      array.findIndex(p => p.id === priority.id) === index
    )

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

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      fetchTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
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
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
                
                <select 
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  <option value="all">All Projects</option>
                  {projects.map(project => (
                    <option key={project!.id} value={project!.id}>
                      {project!.name}
                    </option>
                  ))}
                </select>
                
                <select 
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  <option value="all">All Priorities</option>
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
                
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  <option value="createdAt">Sort by Created</option>
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
            <p className="text-muted-foreground">
              Manage and organize all your tasks in one place
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tasksByStatus.todo.length}</p>
                    <p className="text-sm text-muted-foreground">To Do</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tasksByStatus.inProgress.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{tasksByStatus.done.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {sortedTasks.length} {sortedTasks.length === 1 ? "Task" : "Tasks"}
              </h2>
              <Button onClick={() => setIsAddTaskOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>

            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={handleTaskClick}
                  onEdit={handleEditTask}
                  onMove={handleMoveTask}
                  onDelete={handleDeleteTask}
                />
              ))}
              
              {sortedTasks.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || filterStatus !== "all" || filterProject !== "all" || filterPriority !== "all"
                        ? "Try adjusting your filters or search query"
                        : "Create your first task to get started"
                      }
                    </p>
                    <Button onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
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
    </div>
  )
}