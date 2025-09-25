import { NextRequest, NextResponse } from 'next/server';

// Telegram bot status endpoint
export async function GET(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Telegram bot token not configured' 
      }, { status: 500 });
    }

    // Check if bot is working by getting bot info
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({
        status: 'online',
        bot: data.result,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: data.description,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Telegram status check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check Telegram bot status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Test Telegram command endpoint
export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    
    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Simulate command processing
    const result = {
      command,
      status: 'processed',
      message: `Command "${command}" would be processed by the bot`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Telegram test error:', error);
    return NextResponse.json({ 
      error: 'Failed to test Telegram command' 
    }, { status: 500 });
  }
}
