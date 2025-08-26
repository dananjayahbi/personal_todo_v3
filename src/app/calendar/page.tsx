"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/sidebar"
import { TaskCard } from "@/components/task-card"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { TaskDetails } from "@/components/task-details"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns"

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
}

export default function CalendarPage() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      return isSameDay(parseISO(task.dueDate), date)
    })
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

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskDetailsOpen(true)
  }

  const handleTaskUpdated = () => {
    fetchTasks()
  }

  const handleTaskDeleted = () => {
    fetchTasks()
    setIsTaskDetailsOpen(false)
  }

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskDetailsOpen(false)
    setIsEditTaskOpen(true)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading calendar...</p>
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
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Calendar</h1>
            </div>
            
            <Button onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View and manage your tasks by date
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {format(currentDate, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                        {day}
                      </div>
                    ))}
                    
                    {daysInMonth.map(day => {
                      const dayTasks = getTasksForDate(day)
                      const isToday = isSameDay(day, new Date())
                      const isSelected = selectedDate && isSameDay(day, selectedDate)
                      
                      return (
                        <div
                          key={day.toString()}
                          className={`
                            min-h-[80px] p-1 border border-border rounded cursor-pointer
                            ${isToday ? 'bg-primary/5' : ''}
                            ${isSelected ? 'ring-2 ring-primary' : ''}
                            hover:bg-muted
                          `}
                          onClick={() => handleDateClick(day)}
                        >
                          <div className="text-sm font-medium mb-1">
                            {format(day, 'd')}
                          </div>
                          <div className="space-y-1">
                            {dayTasks.slice(0, 3).map(task => (
                              <div
                                key={task.id}
                                className={`
                                  text-xs p-1 rounded truncate
                                  ${getPriorityColor(task.priority)}
                                `}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTaskClick(task.id)
                                }}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayTasks.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Tasks */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="space-y-3">
                      {getTasksForDate(selectedDate).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No tasks scheduled for this date
                        </p>
                      ) : (
                        getTasksForDate(selectedDate).map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            onClick={handleTaskClick}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select a date to view tasks
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tasks
                      .filter(task => task.dueDate && new Date(task.dueDate) >= new Date())
                      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                      .slice(0, 10)
                      .map(task => (
                        <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(task.dueDate!), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority.name}
                          </Badge>
                        </div>
                      ))}
                    
                    {tasks.filter(task => task.dueDate && new Date(task.dueDate) >= new Date()).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming tasks
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
        taskId={selectedTaskId}
        open={isEditTaskOpen}
        onOpenChange={setIsEditTaskOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  )
}