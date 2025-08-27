import { telegramService } from './telegramService';
import { taskReminderService } from './reminderService';

export function initializeTelegramServices() {
  try {
    console.log('🚀 Initializing Telegram services...');
    
    // Check if Telegram is configured
    if (telegramService.isConfigured()) {
      // Test connection before starting services
      telegramService.testConnection().then((result) => {
        if (result.success) {
          taskReminderService.start();
          console.log('✅ Telegram services initialized successfully');
        } else {
          console.error('❌ Telegram connection test failed:', result.error);
          console.error('💡 Reminder service will not be started');
        }
      }).catch((error) => {
        console.error('❌ Failed to test Telegram connection:', error);
      });
    } else {
      const configError = telegramService.getConfigError();
      console.log('⚠️ Telegram not configured:', configError);
      console.log('💡 Telegram notifications will be disabled');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Telegram services:', error);
  }
}

// Auto-initialize when this module is imported
initializeTelegramServices();
