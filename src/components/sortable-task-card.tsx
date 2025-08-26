"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './task-card'

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

interface SortableTaskCardProps {
  task: Task
  onClick: (taskId: string) => void
  onEdit: (taskId: string) => void
  onMove: (taskId: string, newStatus: string) => void
  onDelete: (taskId: string) => void
}

export function SortableTaskCard({
  task,
  onClick,
  onEdit,
  onMove,
  onDelete
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onClick={onClick}
        onEdit={onEdit}
        onMove={onMove}
        onDelete={onDelete}
      />
    </div>
  )
}
