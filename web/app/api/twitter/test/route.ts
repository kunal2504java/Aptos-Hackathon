import { NextRequest, NextResponse } from 'next/server';
import { TwitterBettingBot } from '@/lib/twitter-bot';

// Test Twitter mention endpoint
export async function POST(request: NextRequest) {
  try {
    const { mention } = await request.json();
    
    if (!mention) {
      return NextResponse.json({ error: 'Mention is required' }, { status: 400 });
    }

    console.log('Testing Twitter mention:', mention);
    
    // Create a mock tweet object for testing
    const mockTweet = {
      id: 'test_' + Date.now(),
      text: mention,
      author_id: 'test_user',
      user: {
        id: 'test_user',
        username: 'test_user',
        name: 'Test User'
      }
    };
    
    // Initialize bot and process the mention
    const bot = new TwitterBettingBot();
    
    // Simulate processing
    const result = {
      mention,
      status: 'processed',
      message: `Mention "${mention}" processed successfully`,
      timestamp: new Date().toISOString(),
      mockTweet,
      botResponse: await simulateBotResponse(mention, bot)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Twitter test error:', error);
    return NextResponse.json({ 
      error: 'Failed to test Twitter mention',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Simulate bot response
async function simulateBotResponse(mention: string, bot: TwitterBettingBot) {
  const text = mention.toLowerCase();
  
  try {
    if (text.includes('help')) {
      return 'Help response: Shows available commands';
    } else if (text.includes('markets')) {
      const markets = await bot.getAllMarkets();
      return `Markets response: Found ${markets.length} markets`;
    } else if (text.includes('bet')) {
      const betMatch = text.match(/bet\s+(\d+)\s+(yes|no)\s+(\d+(?:\.\d+)?)/i);
      if (betMatch) {
        return `Bet response: Market ${betMatch[1]}, Side ${betMatch[2]}, Amount ${betMatch[3]}`;
      }
    } else if (text.includes('create')) {
      const createMatch = text.match(/create\s+"([^"]+)"\s+(\d{4}-\d{2}-\d{2})/i);
      if (createMatch) {
        return `Create response: Question "${createMatch[1]}", Date ${createMatch[2]}`;
      }
    }
    
    return 'Default response: Thanks for mentioning @OmniBetsAptos!';
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
