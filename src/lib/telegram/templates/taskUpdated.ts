export interface TaskUpdatedTemplateData {
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
  changes: {
    title?: { old: string; new: string };
    description?: { old?: string | null; new?: string | null };
    status?: { old: string; new: string };
    dueDate?: { old?: Date | null; new?: Date | null };
    priority?: { old: { name: string; level: number }; new: { name: string; level: number } };
    project?: { old?: { name: string } | null; new?: { name: string } | null };
    attachments?: { old: number; new: number };
  };
}

export function generateTaskUpdatedMessage(data: TaskUpdatedTemplateData): string {
  const { task, changes } = data;
  
  let message = `✏️ **TASK UPDATED**\n\n`;
  message += `📝 **Task:** ${escapeMarkdown(task.title)}\n`;
  message += `🆔 **ID:** \`${task.id}\`\n\n`;
  
  message += `**📋 CHANGES MADE:**\n`;
  
  if (changes.title) {
    message += `📝 **Title:** "${escapeMarkdown(changes.title.old)}" → "${escapeMarkdown(changes.title.new)}"\n`;
  }
  
  if (changes.description) {
    const oldDesc = changes.description.old || 'None';
    const newDesc = changes.description.new || 'None';
    message += `📄 **Description:** "${escapeMarkdown(oldDesc)}" → "${escapeMarkdown(newDesc)}"\n`;
  }
  
  if (changes.status) {
    message += `📊 **Status:** ${escapeMarkdown(changes.status.old.replace('_', ' '))} → ${escapeMarkdown(changes.status.new.replace('_', ' '))}\n`;
  }
  
  if (changes.priority) {
    message += `🎯 **Priority:** ${escapeMarkdown(changes.priority.old.name)} (${changes.priority.old.level}) → ${escapeMarkdown(changes.priority.new.name)} (${changes.priority.new.level})\n`;
  }
  
  if (changes.project) {
    const oldProject = changes.project.old?.name || 'None';
    const newProject = changes.project.new?.name || 'None';
    message += `📁 **Project:** ${escapeMarkdown(oldProject)} → ${escapeMarkdown(newProject)}\n`;
  }
  
  if (changes.dueDate) {
    const oldDate = changes.dueDate.old ? new Date(changes.dueDate.old).toLocaleDateString() : 'None';
    const newDate = changes.dueDate.new ? new Date(changes.dueDate.new).toLocaleDateString() : 'None';
    message += `⏰ **Due Date:** ${oldDate} → ${newDate}\n`;
  }
  
  if (changes.attachments) {
    message += `📎 **Attachments:** ${changes.attachments.old} → ${changes.attachments.new}\n`;
  }
  
  message += `\n**📊 CURRENT STATE:**\n`;
  message += `📊 **Status:** ${escapeMarkdown(task.status.replace('_', ' '))}\n`;
  message += `🎯 **Priority:** ${escapeMarkdown(task.priority.name)} (Level ${task.priority.level})\n`;
  
  if (task.project) {
    message += `📁 **Project:** ${escapeMarkdown(task.project.name)}\n`;
  }
  
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    message += `⏰ **Due Date:** ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}\n`;
  }
  
  if (task.attachments && task.attachments.length > 0) {
    message += `\n📎 **Current Attachments (${task.attachments.length}):**\n`;
    task.attachments.forEach((attachment, index) => {
      const sizeText = attachment.size ? ` (${formatFileSize(attachment.size)})` : '';
      message += `${index + 1}. ${escapeMarkdown(attachment.originalName)}${sizeText}\n`;
    });
  }
  
  message += `\n🕒 **Updated:** ${new Date().toLocaleString()}`;
  
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
