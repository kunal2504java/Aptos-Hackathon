import { NextRequest, NextResponse } from 'next/server';
import { bot, handleWalletConnection } from '@/lib/telegram-bot';

// Telegram webhook endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

// Wallet connection callback endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user');
  const address = searchParams.get('address');
  const action = searchParams.get('action');

  if (userId && address && action === 'connect') {
    handleWalletConnection(parseInt(userId), address);
    return NextResponse.json({ 
      success: true, 
      message: 'Wallet connected successfully!' 
    });
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
}
