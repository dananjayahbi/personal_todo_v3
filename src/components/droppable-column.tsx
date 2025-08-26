"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SortableTaskCard } from './sortable-task-card'

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

interface DroppableColumnProps {
  id: string
  title: string
  tasks: Task[]
  onTaskClick: (taskId: string) => void
  onEditTask: (taskId: string) => void
  onMoveTask: (taskId: string, newStatus: string) => void
  onDeleteTask: (taskId: string) => void
}

export function DroppableColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onEditTask,
  onMoveTask,
  onDeleteTask
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  const style = {
    backgroundColor: isOver ? 'rgba(0, 0, 0, 0.05)' : undefined,
  }

  return (
    <Card className="flex flex-col" style={style}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent 
        ref={setNodeRef}
        className="space-y-3 flex-1 min-h-[200px]"
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard 
              key={task.id} 
              task={task} 
              onClick={onTaskClick}
              onEdit={onEditTask}
              onMove={onMoveTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tasks in this column
          </p>
        )}
      </CardContent>
    </Card>
  )
}
