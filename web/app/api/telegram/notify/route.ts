import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram-bot';

// Send notification to Telegram user
export async function POST(request: NextRequest) {
  try {
    const { userId, message } = await request.json();
    
    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing userId or message' }, { status: 400 });
    }

    // Send message to user
    await bot.telegram.sendMessage(userId, message);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}
