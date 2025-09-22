import { NextRequest, NextResponse } from 'next/server';
import { twitterBot } from '@/lib/twitter-bot';

// Twitter webhook endpoint for mentions and hashtags
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different types of Twitter events
    if (body.tweet_create_events) {
      for (const tweet of body.tweet_create_events) {
        await twitterBot.processTweet(tweet);
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Twitter webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

// Manual trigger for processing mentions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'process-mentions') {
      await twitterBot.processMentions();
      return NextResponse.json({ success: true, message: 'Mentions processed' });
    }
    
    if (action === 'process-hashtags') {
      await twitterBot.processHashtags();
      return NextResponse.json({ success: true, message: 'Hashtags processed' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Twitter API error:', error);
    return NextResponse.json({ error: 'API call failed' }, { status: 500 });
  }
}
