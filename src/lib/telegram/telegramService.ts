import TelegramBot from 'node-telegram-bot-api';
import { 
  generateTaskCreatedMessage, 
  generateTaskUpdatedMessage, 
  generateTaskReminderMessage,
  type TaskCreatedTemplateData,
  type TaskUpdatedTemplateData,
  type TaskReminderTemplateData
} from './templates';

interface TelegramMessage {
  messageId: number;
  chatId: string | number;
}

class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;
  private isInitialized = false;
  private configError: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      // Check if environment variables are set
      if (!botToken || !chatId) {
        this.configError = 'Telegram bot token or chat ID not configured in environment variables';
        console.warn('⚠️ Telegram Configuration Warning:', this.configError);
        console.warn('💡 To enable Telegram notifications:');
        console.warn('   1. Add TELEGRAM_BOT_TOKEN to your .env file');
        console.warn('   2. Add TELEGRAM_CHAT_ID to your .env file');
        console.warn('   3. See TELEGRAM_SETUP.md for detailed instructions');
        return;
      }

      // Validate bot token format
      if (!this.isValidBotToken(botToken)) {
        this.configError = 'Invalid Telegram bot token format';
        console.error('❌ Telegram Error:', this.configError);
        console.error('💡 Bot token should be in format: "123456789:ABCDefGhIJKLmnopQRSTUVWXYZ"');
        return;
      }

      // Validate chat ID format
      if (!this.isValidChatId(chatId)) {
        this.configError = 'Invalid Telegram chat ID format';
        console.error('❌ Telegram Error:', this.configError);
        console.error('💡 Chat ID should be a number (e.g., "123456789" or "-123456789")');
        return;
      }

      this.bot = new TelegramBot(botToken, { polling: false });
      this.chatId = chatId;
      this.isInitialized = true;
      
      console.log('✅ Telegram service initialized successfully');
      console.log(`📱 Bot will send messages to chat ID: ${chatId}`);
    } catch (error) {
      this.configError = `Failed to initialize Telegram service: ${error}`;
      console.error('❌ Telegram Initialization Error:', error);
    }
  }

  private isValidBotToken(token: string): boolean {
    // Telegram bot tokens follow pattern: 123456789:ABCDefGhIJKLmnopQRSTUVWXYZ
    const tokenPattern = /^\d+:[A-Za-z0-9_-]{35}$/;
    return tokenPattern.test(token);
  }

  private isValidChatId(chatId: string): boolean {
    // Chat ID should be a number (positive for users, negative for groups)
    return /^-?\d+$/.test(chatId);
  }

  private async sendMessage(message: string, options?: any): Promise<TelegramMessage | null> {
    if (!this.isInitialized || !this.bot || !this.chatId) {
      if (this.configError) {
        console.warn('🚫 Telegram not configured:', this.configError);
      } else {
        console.warn('🚫 Telegram service not initialized. Skipping message.');
      }
      return null;
    }

    try {
      console.log('📤 Sending Telegram message...');
      const response = await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
        disable_notification: false,
        ...options
      });

      console.log('✅ Telegram message sent successfully:', response.message_id);
      return {
        messageId: response.message_id,
        chatId: this.chatId
      };
    } catch (error: any) {
      console.error('❌ Failed to send Telegram message:', error);
      
      // Provide helpful error messages
      if (error.code === 'ETELEGRAM') {
        if (error.response?.statusCode === 401) {
          console.error('💡 This usually means:');
          console.error('   - Invalid bot token');
          console.error('   - Bot was deleted or deactivated');
          console.error('   - Check your TELEGRAM_BOT_TOKEN in .env file');
        } else if (error.response?.statusCode === 400) {
          console.error('💡 This usually means:');
          console.error('   - Invalid chat ID');
          console.error('   - Bot was blocked by the user');
          console.error('   - Check your TELEGRAM_CHAT_ID in .env file');
        }
      }
      
      return null;
    }
  }

  private async editMessage(messageId: number, message: string, options?: any): Promise<boolean> {
    if (!this.isInitialized || !this.bot || !this.chatId) {
      console.warn('🚫 Telegram service not initialized. Skipping message edit.');
      return false;
    }

    try {
      await this.bot.editMessageText(message, {
        chat_id: this.chatId,
        message_id: messageId,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
        disable_notification: false,
        ...options
      });
      console.log('✅ Telegram message edited successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to edit Telegram message:', error);
      return false;
    }
  }

  private async deleteMessage(messageId: number): Promise<boolean> {
    if (!this.isInitialized || !this.bot || !this.chatId) {
      console.warn('🚫 Telegram service not initialized. Skipping message deletion.');
      return false;
    }

    try {
      await this.bot.deleteMessage(this.chatId, messageId);
      console.log('✅ Telegram message deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete Telegram message:', error);
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized || !this.bot) {
      return { 
        success: false, 
        error: this.configError || 'Service not initialized' 
      };
    }

    try {
      const result = await this.bot.getMe();
      console.log('✅ Telegram bot connection test successful:', result.username);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Telegram bot connection test failed:', error);
      return { 
        success: false, 
        error: `Connection test failed: ${error.message}` 
      };
    }
  }

  async sendTaskCreatedNotification(data: TaskCreatedTemplateData): Promise<TelegramMessage | null> {
    const message = generateTaskCreatedMessage(data);
    return await this.sendMessage(message);
  }

  async sendTaskUpdatedNotification(
    data: TaskUpdatedTemplateData, 
    previousMessageId?: number
  ): Promise<TelegramMessage | null> {
    const message = generateTaskUpdatedMessage(data);
    
    // Always update existing message if we have the message ID
    if (previousMessageId) {
      const editSuccess = await this.editMessage(previousMessageId, message);
      if (editSuccess) {
        return {
          messageId: previousMessageId,
          chatId: this.chatId!
        };
      }
    }
    
    // If edit failed or no previous message ID, send new message
    return await this.sendMessage(message);
  }

  async sendTaskReminderNotification(data: TaskReminderTemplateData): Promise<TelegramMessage | null> {
    const message = generateTaskReminderMessage(data);
    return await this.sendMessage(message);
  }

  async sendCustomMessage(message: string): Promise<TelegramMessage | null> {
    return await this.sendMessage(message);
  }

  isConfigured(): boolean {
    return this.isInitialized;
  }

  getConfigError(): string | null {
    return this.configError;
  }
}

// Export a singleton instance
export const telegramService = new TelegramService();
export default telegramService;
