export interface TaskCreatedTemplateData {
  task: {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    status: string;
    project?: {
      name: string;
      color?: string | null;
    } | null;
    priority: {
      name: string;
      level: number;
      color?: string | null;
    };
    attachments?: {
      id: string;
      name: string;
      originalName: string;
      size?: number | null;
    }[];
    user: {
      name?: string | null;
      email: string;
    };
  };
}

export function generateTaskCreatedMessage(data: TaskCreatedTemplateData): string {
  const { task } = data;
  
  let message = `🆕 **NEW TASK CREATED**\n\n`;
  message += `📝 **Title:** ${escapeMarkdown(task.title)}\n`;
  
  if (task.description) {
    message += `📄 **Description:** ${escapeMarkdown(task.description)}\n`;
  }
  
  message += `👤 **Created by:** ${escapeMarkdown(task.user.name || task.user.email)}\n`;
  message += `🎯 **Priority:** ${escapeMarkdown(task.priority.name)} (Level ${task.priority.level})\n`;
  message += `📊 **Status:** ${escapeMarkdown(task.status.replace('_', ' '))}\n`;
  
  if (task.project) {
    message += `📁 **Project:** ${escapeMarkdown(task.project.name)}\n`;
  }
  
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    message += `⏰ **Due Date:** ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}\n`;
  }
  
  if (task.attachments && task.attachments.length > 0) {
    message += `\n📎 **Attachments (${task.attachments.length}):**\n`;
    task.attachments.forEach((attachment, index) => {
      const sizeText = attachment.size ? ` (${formatFileSize(attachment.size)})` : '';
      message += `${index + 1}. ${escapeMarkdown(attachment.originalName)}${sizeText}\n`;
    });
  }
  
  message += `\n🆔 **Task ID:** \`${task.id}\``;
  message += `\n🕒 **Created:** ${new Date().toLocaleString()}`;
  
  return message;
}

function escapeMarkdown(text: string): string {
  if (!text) return '';
  // Escape special markdown characters
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
