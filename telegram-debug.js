#!/usr/bin/env node

// Telegram Configuration Debug Script
// Run with: node telegram-debug.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Telegram Configuration Debug Tool\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('💡 Create a .env file in your project root');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('✅ .env file found\n');

// Check for Telegram variables
const botTokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN\s*=\s*(.+)/);
const chatIdMatch = envContent.match(/TELEGRAM_CHAT_ID\s*=\s*(.+)/);

console.log('📋 Environment Variables Check:');
console.log('─'.repeat(40));

if (botTokenMatch) {
  const token = botTokenMatch[1].trim();
  console.log(`✅ TELEGRAM_BOT_TOKEN: ${token.substring(0, 10)}...${token.substring(token.length - 5)} (${token.length} chars)`);
  
  // Validate token format
  const tokenPattern = /^\d+:[A-Za-z0-9_-]{35}$/;
  if (tokenPattern.test(token)) {
    console.log('   ✅ Token format is valid');
  } else {
    console.log('   ❌ Token format is invalid');
    console.log('   💡 Should be like: 123456789:ABCDefGhIJKLmnopQRSTUVWXYZ');
  }
} else {
  console.log('❌ TELEGRAM_BOT_TOKEN: Not found');
  console.log('   💡 Add: TELEGRAM_BOT_TOKEN=your_token_here');
}

if (chatIdMatch) {
  const chatId = chatIdMatch[1].trim();
  console.log(`✅ TELEGRAM_CHAT_ID: ${chatId}`);
  
  // Validate chat ID format
  if (/^-?\d+$/.test(chatId)) {
    console.log('   ✅ Chat ID format is valid');
  } else {
    console.log('   ❌ Chat ID format is invalid');
    console.log('   💡 Should be a number like: 123456789 or -123456789');
  }
} else {
  console.log('❌ TELEGRAM_CHAT_ID: Not found');
  console.log('   💡 Add: TELEGRAM_CHAT_ID=your_chat_id_here');
}

console.log('\n📚 Quick Setup Guide:');
console.log('─'.repeat(40));
console.log('1. Message @BotFather on Telegram');
console.log('2. Send /newbot and follow instructions');
console.log('3. Copy the bot token');
console.log('4. Message your bot and get your chat ID from:');
console.log('   https://api.telegram.org/botYOUR_TOKEN/getUpdates');
console.log('5. Add both to your .env file');
console.log('\n📖 See TELEGRAM_SETUP.md for detailed instructions');

// Test connection if both variables are present
if (botTokenMatch && chatIdMatch) {
  console.log('\n🧪 Testing Connection...');
  console.log('─'.repeat(40));
  
  // Dynamic import for ES modules in Node.js
  (async () => {
    try {
      const TelegramBot = require('node-telegram-bot-api');
      const bot = new TelegramBot(botTokenMatch[1].trim(), { polling: false });
      
      const botInfo = await bot.getMe();
      console.log('✅ Bot connection successful!');
      console.log(`   Bot name: ${botInfo.first_name}`);
      console.log(`   Username: @${botInfo.username}`);
      
      console.log('\n🚀 Try sending a test message through the API:');
      console.log('   POST /api/telegram');
      console.log('   Body: {"action": "test"}');
      
    } catch (error) {
      console.error('❌ Bot connection failed:', error.message);
      if (error.code === 'ETELEGRAM' && error.response?.statusCode === 401) {
        console.log('💡 This means your bot token is invalid');
      }
    }
  })();
}
