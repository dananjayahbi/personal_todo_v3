import * as cron from 'node-cron';
import { db } from '@/lib/db';
import { telegramService } from './telegramService';

class TaskReminderService {
  private job: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
      // You can adjust this schedule as needed
      this.job = cron.schedule('0 * * * *', async () => {
        await this.checkOverdueTasks();
      });

      // Stop the job initially - we'll start it manually
      this.job.stop();

      console.log('Task reminder service initialized');
    } catch (error) {
      console.error('Failed to initialize task reminder service:', error);
    }
  }

  start() {
    if (this.job && !this.isRunning) {
      this.job.start();
      this.isRunning = true;
      console.log('Task reminder service started');
    }
  }

  stop() {
    if (this.job && this.isRunning) {
      this.job.stop();
      this.isRunning = false;
      console.log('Task reminder service stopped');
    }
  }

  private async checkOverdueTasks() {
    if (!telegramService.isConfigured()) {
      console.log('Telegram service not configured, skipping overdue task check');
      return;
    }

    try {
      console.log('Checking for overdue tasks...');
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago

      // Find tasks that are overdue by at least 1 hour and not completed
      const overdueTasks = await db.task.findMany({
        where: {
          dueDate: {
            lte: oneHourAgo // Due date is at least 1 hour in the past
          },
          status: {
            not: 'DONE' // Not completed
          }
        },
        include: {
          project: true,
          priority: true,
          attachments: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        },
      });

      console.log(`Found ${overdueTasks.length} overdue tasks`);

      for (const task of overdueTasks) {
        try {
          if (task.dueDate) {
            const hoursOverdue = Math.floor((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60));
            
            // Only send reminder if it's been exactly 1, 6, 12, 24, 48, 72 hours overdue
            // to avoid spamming
            if ([1, 6, 12, 24, 48, 72].includes(hoursOverdue)) {
              console.log(`Sending reminder for task ${task.id}, ${hoursOverdue} hours overdue`);
              
              await telegramService.sendTaskReminderNotification({
                task,
                hoursOverdue
              });
            }
          }
        } catch (error) {
          console.error(`Failed to send reminder for task ${task.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }

  // Manual trigger for testing
  async checkNow() {
    console.log('Manually triggering overdue task check...');
    await this.checkOverdueTasks();
  }
}

// Export a singleton instance
export const taskReminderService = new TaskReminderService();
export default taskReminderService;
