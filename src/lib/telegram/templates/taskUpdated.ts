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
    comments?: {
      id: string;
      content: string;
      createdAt: Date;
      user: {
        name?: string | null;
        email: string;
      };
    }[];
    user: {
      name?: string | null;
      email: string;
    };
  };
}

export function generateTaskUpdatedMessage(data: TaskUpdatedTemplateData): string {
  const { task } = data;
  
  let message = `✏️ **TASK UPDATED**\n\n`;
  message += `📝 **Title:** ${escapeMarkdown(task.title)}\n`;
  
  if (task.description) {
    message += `📄 **Description:** ${escapeMarkdown(task.description)}\n`;
  }
  
  message += `� **Assigned to:** ${escapeMarkdown(task.user.name || task.user.email)}\n`;
  message += `🎯 **Priority:** ${escapeMarkdown(task.priority.name)} \\(Level ${task.priority.level}\\)\n`;
  message += `📊 **Status:** ${escapeMarkdown(task.status.replace('_', ' '))}\n`;
  
  if (task.project) {
    message += `📁 **Project:** ${escapeMarkdown(task.project.name)}\n`;
  }
  
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    message += `📅 **Due Date:** ${escapeMarkdown(dueDate.toLocaleDateString())}\n`;
    message += `⏰ **Due Time:** ${escapeMarkdown(dueDate.toLocaleTimeString())}\n`;
  }
  
  // Comments section
  if (task.comments && task.comments.length > 0) {
    message += `\n� **Comments \\(${task.comments.length}\\):**\n`;
    task.comments.forEach((comment, index) => {
      const commentDate = new Date(comment.createdAt).toLocaleDateString();
      const userName = comment.user.name || comment.user.email;
      message += `${index + 1}\\. *${escapeMarkdown(userName)}* \\(${escapeMarkdown(commentDate)}\\): ${escapeMarkdown(comment.content)}\n`;
    });
  } else {
    message += `\n💬 **Comments:** No comments\n`;
  }
  
  if (task.attachments && task.attachments.length > 0) {
    message += `\n📎 **Attachments \\(${task.attachments.length}\\):**\n`;
    task.attachments.forEach((attachment, index) => {
      const sizeText = attachment.size ? ` \\(${escapeMarkdown(formatFileSize(attachment.size))}\\)` : '';
      message += `${index + 1}\\. ${escapeMarkdown(attachment.originalName)}${sizeText}\n`;
    });
  }
  
  message += `\n🕒 **Updated:** ${escapeMarkdown(new Date().toLocaleString())}`;
  
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
