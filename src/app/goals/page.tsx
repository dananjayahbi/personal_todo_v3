"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/sidebar"
import { 
  Plus, 
  Target, 
  Calendar, 
  CheckCircle, 
  TrendingUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  Award,
  BarChart3,
  Zap,
  Clock,
  Users,
  Star,
  Trophy,
  Flame,
  Activity
} from "lucide-react"
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths } from "date-fns"
import { useSession } from "next-auth/react"

interface Task {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  createdAt: string
  updatedAt: string
  dueDate?: string
}

interface Goal {
  id: string
  title: string
  description: string | null
  targetDate: string | null
  status: "ACTIVE" | "COMPLETED" | "PAUSED"
  progress: number
  category: string
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM"
  linkedTaskIds: string[]
  targetValue?: number
  currentValue?: number
  unit?: string
  createdAt: string
  updatedAt: string
}

interface GoalAchievementData {
  period: string
  achieved: number
  total: number
  percentage: number
}

export default function GoalsPage() {
  const { data: session } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetDate: "",
    category: "personal",
    progress: 0,
    type: "CUSTOM" as Goal["type"],
    targetValue: 1,
    unit: ""
  })

  useEffect(() => {
    if (session?.user) {
      fetchGoals()
      fetchTasks()
    }
  }, [session])

  const fetchTasks = async () => {
    try {
      if (!session?.user?.email) return
      
      const response = await fetch(`/api/tasks?userId=${session.user.email}`)
      if (response.ok) {
        const tasksData = await response.json()
        setTasks(tasksData)
      }
    } catch (err) {
      console.error("Error fetching tasks:", err)
    }
  }

  const fetchGoals = async () => {
    try {
      setLoading(true)
      // Generate default goals if none exist
      const defaultGoals: Goal[] = [
        {
          id: "daily-tasks",
          title: "Daily Tasks Completion",
          description: "Complete daily tasks consistently",
          targetDate: format(new Date(), "yyyy-MM-dd"),
          status: "ACTIVE",
          progress: calculateDailyProgress(),
          category: "productivity",
          type: "DAILY",
          linkedTaskIds: [],
          targetValue: 3,
          currentValue: 0,
          unit: "tasks",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "weekly-focus",
          title: "Weekly Goal Achievement",
          description: "Achieve weekly objectives",
          targetDate: format(startOfWeek(new Date()), "yyyy-MM-dd"),
          status: "ACTIVE",
          progress: calculateWeeklyProgress(),
          category: "productivity",
          type: "WEEKLY",
          linkedTaskIds: [],
          targetValue: 15,
          currentValue: 0,
          unit: "tasks",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "monthly-targets",
          title: "Monthly Target Achievement",
          description: "Complete monthly objectives",
          targetDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
          status: "ACTIVE",
          progress: calculateMonthlyProgress(),
          category: "productivity",
          type: "MONTHLY",
          linkedTaskIds: [],
          targetValue: 60,
          currentValue: 0,
          unit: "tasks",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "yearly-vision",
          title: "Yearly Vision Achievement",
          description: "Achieve annual goals and vision",
          targetDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
          status: "ACTIVE",
          progress: calculateYearlyProgress(),
          category: "life",
          type: "YEARLY",
          linkedTaskIds: [],
          targetValue: 365,
          currentValue: 0,
          unit: "days",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      // Merge with any existing custom goals
      const existingCustomGoals = goals.filter(g => g.type === "CUSTOM")
      setGoals([...defaultGoals, ...existingCustomGoals])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const calculateDailyProgress = () => {
    const today = startOfDay(new Date())
    const todayTasks = tasks.filter(task => 
      startOfDay(new Date(task.createdAt)).getTime() === today.getTime()
    )
    const completedToday = todayTasks.filter(task => task.status === "DONE").length
    return todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0
  }

  const calculateWeeklyProgress = () => {
    const weekStart = startOfWeek(new Date())
    const weekTasks = tasks.filter(task => 
      new Date(task.createdAt) >= weekStart
    )
    const completedWeek = weekTasks.filter(task => task.status === "DONE").length
    return weekTasks.length > 0 ? Math.round((completedWeek / weekTasks.length) * 100) : 0
  }

  const calculateMonthlyProgress = () => {
    const monthStart = startOfMonth(new Date())
    const monthTasks = tasks.filter(task => 
      new Date(task.createdAt) >= monthStart
    )
    const completedMonth = monthTasks.filter(task => task.status === "DONE").length
    return monthTasks.length > 0 ? Math.round((completedMonth / monthTasks.length) * 100) : 0
  }

  const calculateYearlyProgress = () => {
    const yearStart = startOfYear(new Date())
    const yearTasks = tasks.filter(task => 
      new Date(task.createdAt) >= yearStart
    )
    const completedYear = yearTasks.filter(task => task.status === "DONE").length
    return yearTasks.length > 0 ? Math.round((completedYear / yearTasks.length) * 100) : 0
  }

  const calculateAchievementRate = (): GoalAchievementData[] => {
    const periods = [
      { name: "Last 7 Days", start: subDays(new Date(), 7) },
      { name: "Last 30 Days", start: subDays(new Date(), 30) },
      { name: "Last 3 Months", start: subMonths(new Date(), 3) },
      { name: "This Year", start: startOfYear(new Date()) }
    ]

    return periods.map(period => {
      const periodGoals = goals.filter(goal => 
        new Date(goal.createdAt) >= period.start && goal.type !== "CUSTOM"
      )
      const achievedGoals = periodGoals.filter(goal => goal.progress >= 80).length
      const percentage = periodGoals.length > 0 ? Math.round((achievedGoals / periodGoals.length) * 100) : 0
      
      return {
        period: period.name,
        achieved: achievedGoals,
        total: periodGoals.length,
        percentage
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newGoal: Goal = {
      id: editingGoal?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      targetDate: formData.targetDate || null,
      status: "ACTIVE",
      progress: formData.progress,
      category: formData.category,
      type: formData.type,
      linkedTaskIds: selectedTasks,
      targetValue: formData.targetValue,
      currentValue: 0,
      unit: formData.unit,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? newGoal : g))
    } else {
      setGoals(prev => [...prev, newGoal])
    }

    setIsDialogOpen(false)
    setEditingGoal(null)
    setSelectedTasks([])
    setFormData({
      title: "",
      description: "",
      targetDate: "",
      category: "personal",
      progress: 0,
      type: "CUSTOM",
      targetValue: 1,
      unit: ""
    })
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setSelectedTasks(goal.linkedTaskIds)
    setFormData({
      title: goal.title,
      description: goal.description || "",
      targetDate: goal.targetDate || "",
      category: goal.category,
      progress: goal.progress,
      type: goal.type,
      targetValue: goal.targetValue || 1,
      unit: goal.unit || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) {
      return
    }

    setGoals(prev => prev.filter(g => g.id !== goalId))
  }

  const handleProgressUpdate = (goalId: string, progress: number) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId 
        ? { ...g, progress: Math.max(0, Math.min(100, progress)), updatedAt: new Date().toISOString() }
        : g
    ))
  }

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId])
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId))
    }
  }

  const goalsByType = goals.reduce((acc, goal) => {
    if (!acc[goal.type]) {
      acc[goal.type] = []
    }
    acc[goal.type].push(goal)
    return acc
  }, {} as Record<string, Goal[]>)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      case "PAUSED": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "work": return "bg-blue-100 text-blue-800"
      case "health": return "bg-green-100 text-green-800"
      case "personal": return "bg-purple-100 text-purple-800"
      case "finance": return "bg-yellow-100 text-yellow-800"
      case "productivity": return "bg-orange-100 text-orange-800"
      case "life": return "bg-pink-100 text-pink-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: Goal["type"]) => {
    switch (type) {
      case "DAILY": return <Clock className="h-4 w-4" />
      case "WEEKLY": return <Calendar className="h-4 w-4" />
      case "MONTHLY": return <Target className="h-4 w-4" />
      case "YEARLY": return <Trophy className="h-4 w-4" />
      case "CUSTOM": return <Star className="h-4 w-4" />
      default: return <Flag className="h-4 w-4" />
    }
  }

  const getMotivationalMessage = (achievementRate: number) => {
    if (achievementRate >= 90) return { message: "Outstanding! You're crushing your goals! 🔥", color: "text-green-600", icon: <Flame className="h-5 w-5 text-orange-500" /> }
    if (achievementRate >= 70) return { message: "Great progress! Keep up the momentum! 💪", color: "text-blue-600", icon: <TrendingUp className="h-5 w-5 text-blue-500" /> }
    if (achievementRate >= 50) return { message: "Good effort! You're on the right track! 👍", color: "text-purple-600", icon: <Activity className="h-5 w-5 text-purple-500" /> }
    if (achievementRate >= 25) return { message: "Time to refocus and push harder! 💡", color: "text-yellow-600", icon: <Zap className="h-5 w-5 text-yellow-500" /> }
    return { message: "Every champion was once a beginner! Start now! 🚀", color: "text-red-600", icon: <Target className="h-5 w-5 text-red-500" /> }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline"
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const completedGoals = goals.filter(g => g.status === "COMPLETED").length
  const activeGoals = goals.filter(g => g.status === "ACTIVE").length
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0

  const achievementData = calculateAchievementRate()
  const overallAchievementRate = achievementData.length > 0 
    ? Math.round(achievementData.reduce((sum, data) => sum + data.percentage, 0) / achievementData.length)
    : 0

  const motivationalData = getMotivationalMessage(overallAchievementRate)

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading goals...</p>
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
            <Button onClick={fetchGoals}>Retry</Button>
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
              <Target className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Goals & Progress</h1>
            </div>
            
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Goal
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Goals & Achievement Center</h1>
            <p className="text-muted-foreground">
              Track your progress across daily, weekly, monthly, and yearly objectives
            </p>
          </div>

          {/* Motivational Section */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {motivationalData.icon}
                <div>
                  <h3 className="text-lg font-semibold">Achievement Status</h3>
                  <p className={`text-sm ${motivationalData.color} font-medium`}>
                    {motivationalData.message}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overall Achievement Rate: {overallAchievementRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{goals.length}</p>
                    <p className="text-sm text-muted-foreground">Total Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeGoals}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Award className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedGoals}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Flag className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgProgress}%</p>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievement Rate Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Goal Achievement Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievementData.map((data, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm text-muted-foreground">{data.period}</h4>
                    <div className="mt-2">
                      <div className="text-2xl font-bold">{data.percentage}%</div>
                      <div className="text-sm text-muted-foreground">
                        {data.achieved}/{data.total} goals
                      </div>
                      <Progress value={data.percentage} className="mt-2 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Daily Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateDailyProgress()}%</div>
                <Progress value={calculateDailyProgress()} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">Today's task completion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateWeeklyProgress()}%</div>
                <Progress value={calculateWeeklyProgress()} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">This week's achievements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Monthly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateMonthlyProgress()}%</div>
                <Progress value={calculateMonthlyProgress()} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">This month's targets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-purple-500" />
                  Yearly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateYearlyProgress()}%</div>
                <Progress value={calculateYearlyProgress()} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">Annual vision progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Goals by Type */}
          <div className="space-y-6">
            {Object.entries(goalsByType).map(([type, typeGoals]) => (
              <div key={type}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {getTypeIcon(type as Goal["type"])}
                  {type.charAt(0) + type.slice(1).toLowerCase()} Goals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeGoals.map((goal) => (
                    <Card key={goal.id} className="relative hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {getTypeIcon(goal.type)}
                              {goal.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getStatusColor(goal.status)}>
                                {goal.status}
                              </Badge>
                              <Badge className={getCategoryColor(goal.category)}>
                                {goal.category}
                              </Badge>
                            </div>
                          </div>
                          
                          {goal.type === "CUSTOM" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(goal)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(goal.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {goal.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {goal.description}
                          </p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress 
                            value={goal.progress} 
                            className="h-2"
                          />
                          {goal.type === "CUSTOM" && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProgressUpdate(goal.id, Math.max(0, goal.progress - 10))}
                              >
                                -10%
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProgressUpdate(goal.id, Math.min(100, goal.progress + 10))}
                              >
                                +10%
                              </Button>
                            </div>
                          )}
                        </div>

                        {goal.targetValue && goal.unit && (
                          <div className="text-sm text-muted-foreground">
                            Target: {goal.currentValue || 0}/{goal.targetValue} {goal.unit}
                          </div>
                        )}

                        {goal.linkedTaskIds.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Linked Tasks: </span>
                            <span className="text-muted-foreground">
                              {goal.linkedTaskIds.length} task{goal.linkedTaskIds.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(goal.targetDate)}</span>
                          </div>
                          
                          {goal.progress === 100 && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {goals.filter(g => g.type === "CUSTOM").length === 0 && (
            <Card className="mt-6">
              <CardContent className="p-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No custom goals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create custom goals linked to your tasks for better tracking
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Add/Edit Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Edit Custom Goal" : "Add New Custom Goal"}
            </DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? "Update the goal details below."
                : "Create a custom goal and link it to your existing tasks."
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Complete Project Alpha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Goal description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Goal Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Goal["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily Goal</SelectItem>
                    <SelectItem value="WEEKLY">Weekly Goal</SelectItem>
                    <SelectItem value="MONTHLY">Monthly Goal</SelectItem>
                    <SelectItem value="YEARLY">Yearly Goal</SelectItem>
                    <SelectItem value="CUSTOM">Custom Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., tasks, hours, pages"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date (optional)</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>

            {/* Task Selection */}
            <div className="space-y-2">
              <Label>Link Tasks to Goal (optional)</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks available to link</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.slice(0, 10).map((task) => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={task.id}
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                        />
                        <Label htmlFor={task.id} className="text-sm cursor-pointer flex-1">
                          {task.title}
                          <Badge 
                            variant={task.status === "DONE" ? "default" : "secondary"}
                            className="ml-2 text-xs"
                          >
                            {task.status}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                    {tasks.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        Showing first 10 tasks. Total: {tasks.length}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingGoal ? "Update" : "Create"} Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}