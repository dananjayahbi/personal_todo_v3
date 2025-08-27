#!/usr/bin/env node

// Telegram Test Script
// Run with: node test_telegram.js

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return envVars;
}

// Load environment variables
const env = loadEnv();
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = env.TELEGRAM_CHAT_ID;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

function printHeader() {
  console.clear();
  console.log(colorize('═'.repeat(60), 'cyan'));
  console.log(colorize('📱 TELEGRAM MESSAGE TESTER', 'cyan'));
  console.log(colorize('═'.repeat(60), 'cyan'));
  console.log();
}

function printError(message) {
  console.log(colorize('❌ Error: ' + message, 'red'));
}

function printSuccess(message) {
  console.log(colorize('✅ Success: ' + message, 'green'));
}

function printInfo(message) {
  console.log(colorize('ℹ️  Info: ' + message, 'blue'));
}

function printWarning(message) {
  console.log(colorize('⚠️  Warning: ' + message, 'yellow'));
}

// Sample messages for different scenarios
const sampleMessages = {
  taskCreated: {
    title: 'Task Created Notification',
    message: `🆕 **NEW TASK CREATED**

📝 **Title:** Implement user authentication
📄 **Description:** Create login and registration system with JWT tokens
👤 **Created by:** John Doe \\(john@example\\.com\\)
🎯 **Priority:** High \\(Level 3\\)
📊 **Status:** TODO
📁 **Project:** Web Application
⏰ **Due Date:** ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()} ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString()}

📎 **Attachments \\(2\\):**
1\\. requirements\\.pdf \\(245 KB\\)
2\\. mockup\\.png \\(1\\.2 MB\\)

🆔 **Task ID:** \`tsk_abc123def456\`
🕒 **Created:** ${new Date().toLocaleString()}`
  },
  
  taskUpdated: {
    title: 'Task Updated Notification',
    message: `✏️ **TASK UPDATED**

📝 **Task:** Implement user authentication
🆔 **ID:** \`tsk_abc123def456\`

**📋 CHANGES MADE:**
📊 **Status:** TODO → IN\\_PROGRESS
🎯 **Priority:** High \\(3\\) → Critical \\(4\\)
📄 **Description:** "Create login system" → "Create login and registration system with JWT tokens"

**📊 CURRENT STATE:**
📊 **Status:** IN\\_PROGRESS
🎯 **Priority:** Critical \\(Level 4\\)
📁 **Project:** Web Application
⏰ **Due Date:** ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}

📎 **Current Attachments \\(3\\):**
1\\. requirements\\.pdf \\(245 KB\\)
2\\. mockup\\.png \\(1\\.2 MB\\)
3\\. updated\\_specs\\.docx \\(89 KB\\)

🕒 **Updated:** ${new Date().toLocaleString()}`
  },
  
  taskReminder: {
    title: 'Task Overdue Reminder',
    message: `🚨 **TASK OVERDUE REMINDER**

⚠️ **This task is 6 hour\\(s\\) overdue\\!**

📝 **Task:** Implement user authentication
📄 **Description:** Create login and registration system with JWT tokens
👤 **Assigned to:** John Doe \\(john@example\\.com\\)
🎯 **Priority:** Critical \\(Level 4\\)
📊 **Current Status:** IN\\_PROGRESS
📁 **Project:** Web Application
⏰ **Was Due:** ${new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleDateString()} ${new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleTimeString()}
🕒 **Current Time:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

📎 **Attachments \\(3\\):**
1\\. requirements\\.pdf \\(245 KB\\)
2\\. mockup\\.png \\(1\\.2 MB\\)
3\\. updated\\_specs\\.docx \\(89 KB\\)

🆔 **Task ID:** \`tsk_abc123def456\`

💡 **Please complete this task as soon as possible\\!**`
  },
  
  simple: {
    title: 'Simple Test Message',
    message: '🤖 Hello! This is a simple test message from your Personal Todo App\\.\n\n✅ If you can see this, Telegram integration is working correctly!'
  },
  
  markdown: {
    title: 'Markdown Formatting Test',
    message: `**Markdown Formatting Test**

*Italic text*
**Bold text**
***Bold and italic***
\`Inline code\`
[Link](https://example.com)

**Lists:**
• Item 1
• Item 2
• Item 3

**Code block:**
\`\`\`javascript
console.log("Hello, World!");
\`\`\`

**Special characters:**
🚀 Rocket
✅ Check mark
❌ Cross mark
⚠️ Warning`
  }
};

async function sendMessage(bot, message, options = {}) {
  try {
    const result = await bot.sendMessage(CHAT_ID, message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
      ...options
    });
    return result;
  } catch (error) {
    throw error;
  }
}

async function sendLongMessage(bot) {
  const longMessage = `📚 **LONG MESSAGE TEST**

${'📝 This is a very long message to test the limits of Telegram message length\\. '.repeat(50)}

**Summary:**
\\- Message repeated 50 times
\\- Testing character limits
\\- Checking message delivery
\\- Verifying formatting

**End of long message test\\.**`;

  return await sendMessage(bot, longMessage);
}

async function sendMessageWithButtons(bot) {
  const message = '🔘 **Message with Inline Buttons**\n\nThis message includes inline keyboard buttons for testing purposes\\.';
  
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Complete Task', callback_data: 'complete_task' },
          { text: '⏸️ Pause Task', callback_data: 'pause_task' }
        ],
        [
          { text: '📝 Edit Task', callback_data: 'edit_task' },
          { text: '🗑️ Delete Task', callback_data: 'delete_task' }
        ],
        [
          { text: '📊 View Details', callback_data: 'view_details' }
        ]
      ]
    }
  };
  
  return await sendMessage(bot, message, options);
}

async function sendDocument(bot) {
  try {
    printInfo('Creating and sending a test document...');
    
    const testContent = `# Sample Task Document

This is a test document attached to demonstrate file sending capabilities.

## Task Details
- **Title:** Sample Task
- **Created:** ${new Date().toISOString()}
- **Priority:** High
- **Status:** In Progress

## Description
This document contains important information about the task.

## Attachments
This file itself is an attachment example.

---
Generated by Personal Todo App Telegram Integration Test
`;
    
    const fileName = 'sample_task_document.md';
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, testContent);
    
    const fileBuffer = fs.readFileSync(filePath);
    
    const documentResult = await bot.sendDocument(CHAT_ID, fileBuffer, {
      caption: '📎 **Test Document Attachment**\n\nThis is a sample document to test file sending capabilities\\.',
      parse_mode: 'MarkdownV2'
    }, {
      filename: fileName,
      contentType: 'text/markdown'
    });
    
    fs.unlinkSync(filePath);
    
    printSuccess(`Document sent! Message ID: ${documentResult.message_id}`);
    return documentResult;
  } catch (error) {
    printError(`Failed to send document: ${error.message}`);
    return null;
  }
}

async function sendPhoto(bot) {
  try {
    printInfo('Creating and sending a test image...');
    
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAiH4XDgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64PNG, 'base64');
    
    const photoResult = await bot.sendPhoto(CHAT_ID, buffer, {
      caption: '🖼️ **Test Image Attachment**\n\nThis is a sample 1x1 blue pixel PNG image to test photo sending capabilities\\.\n\n✅ Image upload successful!',
      parse_mode: 'MarkdownV2',
      filename: 'test_image.png'
    });
    
    printSuccess(`Photo sent! Message ID: ${photoResult.message_id}`);
    return photoResult;
  } catch (error) {
    printError(`Failed to send photo: ${error.message}`);
    
    try {
      printInfo('Trying alternative method...');
      
      const textContent = `📊 PERSONAL TODO APP - TEST IMAGE
      
📅 Generated: ${new Date().toLocaleString()}
🔧 Test Type: Image Upload Test
✅ Status: Alternative method used (document upload)

This file was created because direct image upload failed.
The image upload functionality may need additional configuration.`;
      
      const fileName = 'test_image_fallback.txt';
      const filePath = path.join(__dirname, fileName);
      
      fs.writeFileSync(filePath, textContent);
      
      const fallbackFileBuffer = fs.readFileSync(filePath);
      
      const fallbackResult = await bot.sendDocument(CHAT_ID, fallbackFileBuffer, {
        caption: '📄 **Image Upload Fallback**\n\nDirect image upload failed, sending as document instead\\.',
        parse_mode: 'MarkdownV2'
      }, {
        filename: fileName,
        contentType: 'text/plain'
      });
      
      fs.unlinkSync(filePath);
      
      printSuccess(`Fallback document sent! Message ID: ${fallbackResult.message_id}`);
      return fallbackResult;
      
    } catch (fallbackError) {
      printError(`Fallback method also failed: ${fallbackError.message}`);
      return null;
    }
  }
}

function showMenu() {
  console.log(colorize('\n📋 MESSAGE TYPES:', 'cyan'));
  console.log(colorize('─'.repeat(40), 'cyan'));
  console.log('1. Simple test message');
  console.log('2. Task created notification');
  console.log('3. Task updated notification');
  console.log('4. Task overdue reminder');
  console.log('5. Markdown formatting test');
  console.log('6. Message with inline buttons');
  console.log('7. Long message test');
  console.log('8. Send test document');
  console.log('9. Send test image');
  console.log('0. Exit');
  console.log();
}

async function main() {
  printHeader();
  
  if (!BOT_TOKEN || !CHAT_ID) {
    printError('Telegram bot token or chat ID not found in .env file');
    console.log('\nPlease ensure your .env file contains:');
    console.log('TELEGRAM_BOT_TOKEN=your-bot-token-here');
    console.log('TELEGRAM_CHAT_ID=your-chat-id-here');
    console.log('\nSee TELEGRAM_SETUP.md for setup instructions.');
    process.exit(1);
  }
  
  printInfo(`Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
  printInfo(`Chat ID: ${CHAT_ID}`);
  
  const bot = new TelegramBot(BOT_TOKEN);
  
  try {
    printInfo('Testing bot connection...');
    const botInfo = await bot.getMe();
    printSuccess(`Connected to bot: @${botInfo.username} (${botInfo.first_name})`);
  } catch (error) {
    printError(`Failed to connect to bot: ${error.message}`);
    printWarning('Please check your bot token and try again.');
    process.exit(1);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function askForChoice() {
    return new Promise((resolve) => {
      showMenu();
      rl.question(colorize('👤 Choose a message type (0-9): ', 'yellow'), resolve);
    });
  }
  
  while (true) {
    try {
      const choice = await askForChoice();
      
      if (choice === '0') {
        printInfo('Goodbye! 👋');
        break;
      }
      
      let result = null;
      
      switch (choice) {
        case '1':
          printInfo('Sending Simple Test Message...');
          result = await sendMessage(bot, sampleMessages.simple.message);
          printSuccess(`Message sent! Message ID: ${result.message_id}`);
          break;
          
        case '2':
          printInfo('Sending Task Created Notification...');
          result = await sendMessage(bot, sampleMessages.taskCreated.message);
          printSuccess(`Message sent! Message ID: ${result.message_id}`);
          break;
          
        case '3':
          printInfo('Sending Task Updated Notification...');
          result = await sendMessage(bot, sampleMessages.taskUpdated.message);
          printSuccess(`Message sent! Message ID: ${result.message_id}`);
          break;
          
        case '4':
          printInfo('Sending Task Overdue Reminder...');
          result = await sendMessage(bot, sampleMessages.taskReminder.message);
          printSuccess(`Message sent! Message ID: ${result.message_id}`);
          break;
          
        case '5':
          printInfo('Sending Markdown Formatting Test...');
          result = await sendMessage(bot, sampleMessages.markdown.message);
          printSuccess(`Message sent! Message ID: ${result.message_id}`);
          break;
          
        case '6':
          printInfo('Sending Message with Inline Buttons...');
          result = await sendMessageWithButtons(bot);
          printSuccess(`Message sent! Message ID: ${result.message_id}`);
          break;
          
        case '7':
          printInfo('Sending Long Message Test...');
          result = await sendLongMessage(bot);
          printSuccess(`Message sent! Message ID: ${result.message_id}`);
          break;
          
        case '8':
          await sendDocument(bot);
          break;
          
        case '9':
          await sendPhoto(bot);
          break;
          
        default:
          printWarning('Invalid choice. Please select 0-9.');
          continue;
      }
      
    } catch (error) {
      printError(`Failed to send message: ${error.message}`);
      if (error.code === 'ETELEGRAM') {
        if (error.response?.statusCode === 400) {
          printWarning('This might be due to invalid chat ID or message format');
        } else if (error.response?.statusCode === 401) {
          printWarning('This might be due to invalid bot token');
        }
      }
    }
    
    console.log('\n' + colorize('─'.repeat(60), 'cyan'));
  }
  
  rl.close();
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    printError(`Application error: ${error.message}`);
    process.exit(1);
  });
}
