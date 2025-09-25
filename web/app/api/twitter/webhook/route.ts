import { NextRequest, NextResponse } from 'next/server';
import { TwitterBettingBot } from '@/lib/twitter-bot';

// Twitter webhook endpoint for real-time updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('x-twitter-webhook-signature');
    if (!signature) {
      console.warn('No webhook signature provided');
    }
    
    console.log('Twitter webhook received:', JSON.stringify(body, null, 2));
    
    // Handle different webhook event types
    if (body.tweet_create_events) {
      // Handle new tweets
      for (const tweet of body.tweet_create_events) {
        await processTweet(tweet);
      }
    }
    
    if (body.direct_message_events) {
      // Handle direct messages
      for (const dm of body.direct_message_events) {
        await processDirectMessage(dm);
      }
    }
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Twitter webhook error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to process webhook' 
    }, { status: 500 });
  }
}

// Process individual tweet
async function processTweet(tweet: any) {
  try {
    const text = tweet.text.toLowerCase();
    const tweetId = tweet.id_str;
    const userId = tweet.user.id_str;
    
    console.log(`Processing tweet ${tweetId} from user ${userId}: ${tweet.text}`);
    
    // Check if tweet mentions our bot
    if (text.includes('@omnibetsaptos')) {
      await handleMention(tweetId, userId, tweet.text);
    }
    
    // Check if tweet contains our hashtags
    const hashtags = ['#omnibets', '#aptosbet', '#predictionmarket'];
    const hasRelevantHashtag = hashtags.some(hashtag => text.includes(hashtag));
    
    if (hasRelevantHashtag) {
      await handleHashtagTweet(tweetId, userId, tweet.text);
    }
    
  } catch (error) {
    console.error('Error processing tweet:', error);
  }
}

// Process direct message
async function processDirectMessage(dm: any) {
  try {
    const text = dm.message_create.message_data.text.toLowerCase();
    const userId = dm.message_create.sender_id;
    
    console.log(`Processing DM from user ${userId}: ${text}`);
    
    // Handle DM commands
    await handleDirectMessage(userId, text);
    
  } catch (error) {
    console.error('Error processing DM:', error);
  }
}

// Handle mentions
async function handleMention(tweetId: string, userId: string, text: string) {
  try {
    const bot = new TwitterBettingBot();
    
    // Check for commands
    if (text.includes('help')) {
      await bot.sendHelpResponse(tweetId, userId);
    } else if (text.includes('markets')) {
      await bot.sendMarketsResponse(tweetId, userId);
    } else if (text.includes('bet')) {
      const betMatch = text.match(/bet\s+(\d+)\s+(yes|no)\s+(\d+(?:\.\d+)?)/i);
      if (betMatch) {
        await bot.handleBetCommand(tweetId, userId, betMatch[0]);
      }
    } else if (text.includes('create')) {
      const createMatch = text.match(/create\s+"([^"]+)"\s+(\d{4}-\d{2}-\d{2})/i);
      if (createMatch) {
        await bot.handleCreateCommand(tweetId, userId, createMatch[0]);
      }
    } else {
      // Default response for mentions
      await bot.replyToTweet(tweetId, userId, 
        '👋 Hi! I\'m the OmniBets bot. Use "help" to see available commands.'
      );
    }
    
  } catch (error) {
    console.error('Error handling mention:', error);
  }
}

// Handle hashtag tweets
async function handleHashtagTweet(tweetId: string, userId: string, text: string) {
  try {
    const bot = new TwitterBettingBot();
    
    // Respond to hashtag tweets with helpful information
    await bot.replyToTweet(tweetId, userId, 
      '🎯 Thanks for using #OmniBets! Mention @OmniBetsAptos for commands.'
    );
    
  } catch (error) {
    console.error('Error handling hashtag tweet:', error);
  }
}

// Handle direct messages
async function handleDirectMessage(userId: string, text: string) {
  try {
    // DM handling logic here
    console.log(`Would send DM to ${userId}: ${text}`);
    
    // You can implement DM-specific commands here
    
  } catch (error) {
    console.error('Error handling DM:', error);
  }
}

// Webhook verification endpoint
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const crcToken = url.searchParams.get('crc_token');
  
  if (crcToken) {
    // Twitter webhook verification
    const responseToken = `sha256=${crcToken}`;
    return NextResponse.json({ response_token: responseToken });
  }
  
  return NextResponse.json({ status: 'Twitter webhook endpoint active' });
}
