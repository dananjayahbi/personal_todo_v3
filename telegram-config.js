#!/usr/bin/env node

// Telegram Configuration Helper
// Run with: node telegram-config.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(colorize(question, 'yellow'), resolve);
  });
}

async function main() {
  console.clear();
  console.log(colorize('═'.repeat(60), 'cyan'));
  console.log(colorize('🤖 TELEGRAM CONFIGURATION HELPER', 'cyan'));
  console.log(colorize('═'.repeat(60), 'cyan'));
  console.log();
  
  console.log(colorize('This helper will guide you through setting up Telegram integration.', 'blue'));
  console.log();
  
  // Step 1: Check if .env exists
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log(colorize('✅ Found existing .env file', 'green'));
  } else {
    console.log(colorize('⚠️  No .env file found, will create one', 'yellow'));
  }
  
  console.log();
  console.log(colorize('📚 SETUP GUIDE:', 'cyan'));
  console.log(colorize('─'.repeat(40), 'cyan'));
  console.log('1. Open Telegram and search for "@BotFather"');
  console.log('2. Send /newbot to create a new bot');
  console.log('3. Follow the prompts to name your bot');
  console.log('4. Copy the bot token provided by BotFather');
  console.log('5. Message your bot to activate it');
  console.log('6. Get your chat ID from the URL below (after messaging your bot):');
  console.log(colorize('   https://api.telegram.org/botYOUR_TOKEN/getUpdates', 'blue'));
  console.log();
  
  const proceed = await askQuestion('Have you completed the setup above? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log(colorize('\n📖 Please complete the setup and run this script again.', 'yellow'));
    rl.close();
    return;
  }
  
  console.log();
  console.log(colorize('🔧 CONFIGURATION:', 'cyan'));
  console.log(colorize('─'.repeat(40), 'cyan'));
  
  // Get bot token
  const botToken = await askQuestion('Enter your bot token from BotFather: ');
  if (!botToken.trim()) {
    console.log(colorize('❌ Bot token is required!', 'red'));
    rl.close();
    return;
  }
  
  // Validate token format
  const tokenPattern = /^\d+:[A-Za-z0-9_-]{35}$/;
  if (!tokenPattern.test(botToken.trim())) {
    console.log(colorize('❌ Invalid token format! Should be like: 123456789:ABCDefGhIJKLmnopQRSTUVWXYZ', 'red'));
    rl.close();
    return;
  }
  
  // Get chat ID
  const chatId = await askQuestion('Enter your chat ID: ');
  if (!chatId.trim()) {
    console.log(colorize('❌ Chat ID is required!', 'red'));
    rl.close();
    return;
  }
  
  // Validate chat ID format
  if (!/^-?\d+$/.test(chatId.trim())) {
    console.log(colorize('❌ Invalid chat ID format! Should be a number like: 123456789', 'red'));
    rl.close();
    return;
  }
  
  console.log();
  console.log(colorize('🧪 Testing connection...', 'blue'));
  
  try {
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(botToken.trim(), { polling: false });
    
    const botInfo = await bot.getMe();
    console.log(colorize(`✅ Connection successful! Bot: ${botInfo.first_name} (@${botInfo.username})`, 'green'));
    
    // Test sending a message
    const testResult = await bot.sendMessage(chatId.trim(), '🎉 Telegram integration configured successfully!\n\nYour Personal Todo App can now send notifications to this chat.');
    console.log(colorize(`✅ Test message sent! Message ID: ${testResult.message_id}`, 'green'));
    
  } catch (error) {
    console.log(colorize(`❌ Connection test failed: ${error.message}`, 'red'));
    if (error.code === 'ETELEGRAM') {
      if (error.response?.statusCode === 401) {
        console.log(colorize('💡 This usually means your bot token is invalid', 'yellow'));
      } else if (error.response?.statusCode === 400) {
        console.log(colorize('💡 This usually means your chat ID is invalid or bot was blocked', 'yellow'));
      }
    }
    rl.close();
    return;
  }
  
  // Update .env file
  console.log();
  console.log(colorize('💾 Updating .env file...', 'blue'));
  
  const telegramConfig = `
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=${botToken.trim()}
TELEGRAM_CHAT_ID=${chatId.trim()}`;
  
  // Check if telegram config already exists in .env
  if (envContent.includes('TELEGRAM_BOT_TOKEN') || envContent.includes('TELEGRAM_CHAT_ID')) {
    // Update existing config
    envContent = envContent.replace(/TELEGRAM_BOT_TOKEN=.*/g, `TELEGRAM_BOT_TOKEN=${botToken.trim()}`);
    envContent = envContent.replace(/TELEGRAM_CHAT_ID=.*/g, `TELEGRAM_CHAT_ID=${chatId.trim()}`);
    
    // Add if not found
    if (!envContent.includes('TELEGRAM_BOT_TOKEN')) {
      envContent += `\nTELEGRAM_BOT_TOKEN=${botToken.trim()}`;
    }
    if (!envContent.includes('TELEGRAM_CHAT_ID')) {
      envContent += `\nTELEGRAM_CHAT_ID=${chatId.trim()}`;
    }
  } else {
    // Append new config
    envContent += telegramConfig;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(colorize('✅ .env file updated successfully!', 'green'));
  
  console.log();
  console.log(colorize('🎉 SETUP COMPLETE!', 'green'));
  console.log(colorize('─'.repeat(40), 'green'));
  console.log('Your Telegram integration is now configured and tested.');
  console.log();
  console.log(colorize('📋 NEXT STEPS:', 'cyan'));
  console.log('1. Restart your Next.js application to load the new config');
  console.log('2. Create a task in your app to test the integration');
  console.log('3. Use test_telegram.js to test different message types');
  console.log();
  console.log(colorize('🧪 Test different message types with:', 'blue'));
  console.log(colorize('   node test_telegram.js', 'blue'));
  
  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Setup cancelled.', 'yellow'));
  rl.close();
  process.exit(0);
});

main().catch(error => {
  console.error(colorize('Fatal error:', 'red'), error);
  process.exit(1);
});
