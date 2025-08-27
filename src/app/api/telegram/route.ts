import { NextRequest, NextResponse } from "next/server";
import { telegramService } from "@/lib/telegram/telegramService";
import { taskReminderService } from "@/lib/telegram/reminderService";

// GET /api/telegram - Check Telegram service status
export async function GET() {
  try {
    const isConfigured = telegramService.isConfigured();
    const configError = telegramService.getConfigError();
    
    let connectionTest: { success: boolean; error?: string } | null = null;
    if (isConfigured) {
      connectionTest = await telegramService.testConnection();
    }
    
    return NextResponse.json({
      configured: isConfigured,
      configError: configError,
      connectionTest: connectionTest,
      reminderServiceRunning: taskReminderService['isRunning'] || false,
    });
  } catch (error) {
    console.error("Error checking Telegram status:", error);
    return NextResponse.json(
      { error: "Failed to check Telegram status" },
      { status: 500 }
    );
  }
}

// POST /api/telegram - Send test message or control reminder service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message } = body;

    if (action === "test") {
      if (!telegramService.isConfigured()) {
        const configError = telegramService.getConfigError();
        return NextResponse.json(
          { 
            error: "Telegram service not configured", 
            details: configError,
            help: "Please check your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env file"
          },
          { status: 400 }
        );
      }

      // Test connection first
      const connectionTest = await telegramService.testConnection();
      if (!connectionTest.success) {
        return NextResponse.json(
          { 
            error: "Telegram connection test failed", 
            details: connectionTest.error,
            help: "Please verify your bot token and chat ID are correct"
          },
          { status: 400 }
        );
      }

      const testMessage = message || "🤖 Test message from Personal Todo App\n\n✅ Telegram integration is working correctly!";
      const result = await telegramService.sendCustomMessage(testMessage);
      
      if (result) {
        return NextResponse.json({ 
          success: true, 
          messageId: result.messageId,
          message: "Test message sent successfully" 
        });
      } else {
        return NextResponse.json(
          { error: "Failed to send test message" },
          { status: 500 }
        );
      }
    }

    if (action === "test-connection") {
      if (!telegramService.isConfigured()) {
        const configError = telegramService.getConfigError();
        return NextResponse.json(
          { 
            error: "Telegram service not configured", 
            details: configError 
          },
          { status: 400 }
        );
      }

      const connectionTest = await telegramService.testConnection();
      return NextResponse.json(connectionTest);
    }

    if (action === "start-reminders") {
      taskReminderService.start();
      return NextResponse.json({ 
        success: true, 
        message: "Reminder service started" 
      });
    }

    if (action === "stop-reminders") {
      taskReminderService.stop();
      return NextResponse.json({ 
        success: true, 
        message: "Reminder service stopped" 
      });
    }

    if (action === "check-reminders") {
      await taskReminderService.checkNow();
      return NextResponse.json({ 
        success: true, 
        message: "Reminder check completed" 
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'test', 'test-connection', 'start-reminders', 'stop-reminders', or 'check-reminders'" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error handling Telegram request:", error);
    return NextResponse.json(
      { error: "Failed to handle request" },
      { status: 500 }
    );
  }
}
