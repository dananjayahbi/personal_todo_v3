# Telegram Integration Setup Guide

This guide will help you set up Telegram notifications for your Personal Todo App.

## Prerequisites

1. A Telegram account
2. Access to BotFather on Telegram

## Step 1: Create a Telegram Bot

1. Open Telegram and search for "@BotFather"
2. Start a conversation with BotFather by sending `/start`
3. Create a new bot by sending `/newbot`
4. Follow the prompts to choose a name and username for your bot
5. BotFather will provide you with a **Bot Token** - save this for later

## Step 2: Get Your Chat ID

1. Start a conversation with your newly created bot
2. Send any message to the bot
3. Open this URL in your browser (replace `YOUR_BOT_TOKEN` with your actual bot token):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. Look for the `"chat"` object in the response and note the `"id"` value - this is your **Chat ID**

Alternative method:
1. Search for "@userinfobot" on Telegram
2. Start a conversation and send `/start`
3. The bot will reply with your Chat ID

## Step 3: Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

## Step 4: Test the Integration

1. Restart your Next.js application
2. Make a GET request to `/api/telegram` to check the configuration status
3. Send a POST request to `/api/telegram` with the following body to test:
   ```json
   {
     "action": "test",
     "message": "Hello from Personal Todo App!"
   }
   ```

## API Endpoints

### GET /api/telegram
Check Telegram service status

Response:
```json
{
  "configured": true,
  "reminderServiceRunning": true
}
```

### POST /api/telegram
Control Telegram services

Actions:
- `test` - Send a test message
- `start-reminders` - Start the reminder service
- `stop-reminders` - Stop the reminder service
- `check-reminders` - Manually trigger reminder check

Example:
```json
{
  "action": "test",
  "message": "Custom test message"
}
```

## Features

### 1. Task Creation Notifications
When a new task is created, you'll receive a notification with:
- Task title and description
- Creator information
- Priority level
- Project (if assigned)
- Due date (if set)
- Attachments (if any)

### 2. Task Update Notifications
When a task is updated, you'll receive a notification with:
- Changes made (highlighted)
- Current task state
- If attachments are added/removed, the old message is deleted and a new one is sent

### 3. Task Reminder Notifications
For overdue tasks, you'll receive reminders at:
- 1 hour after due date
- 6 hours after due date
- 12 hours after due date
- 24 hours after due date
- 48 hours after due date
- 72 hours after due date

## Troubleshooting

### Bot token invalid
- Double-check the token from BotFather
- Make sure there are no extra spaces

### Chat ID not working
- Make sure you've sent at least one message to your bot
- Try the alternative method using @userinfobot

### Messages not sending
- Check server logs for error messages
- Verify both token and chat ID are correct
- Ensure your bot hasn't been blocked

## Security Notes

- Keep your bot token secret
- Don't commit the `.env` file to version control
- Consider using environment-specific tokens for development vs production
