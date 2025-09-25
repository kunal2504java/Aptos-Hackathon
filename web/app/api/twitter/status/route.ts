import { NextRequest, NextResponse } from 'next/server';

// Twitter bot status endpoint
export async function GET(request: NextRequest) {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Twitter bearer token not configured' 
      }, { status: 500 });
    }

    // Check if Twitter API is working by getting user info
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        status: 'online',
        user: data.data,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: data.detail || 'Twitter API error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Twitter status check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check Twitter bot status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Test Twitter mention endpoint
export async function POST(request: NextRequest) {
  try {
    const { mention } = await request.json();
    
    if (!mention) {
      return NextResponse.json({ error: 'Mention is required' }, { status: 400 });
    }

    // Simulate mention processing
    const result = {
      mention,
      status: 'processed',
      message: `Mention "${mention}" would be processed by the bot`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Twitter test error:', error);
    return NextResponse.json({ 
      error: 'Failed to test Twitter mention' 
    }, { status: 500 });
  }
}
