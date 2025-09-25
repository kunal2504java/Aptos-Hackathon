import { NextRequest, NextResponse } from 'next/server';

// Test Twitter OAuth credentials
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Twitter OAuth credentials not configured' 
      }, { status: 500 });
    }

    // Test OAuth 2.0 flow
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(process.env.WEBAPP_URL || 'http://localhost:3000')}&scope=tweet.read%20tweet.write%20users.read&state=state&code_challenge=challenge&code_challenge_method=plain`;

    return NextResponse.json({
      status: 'success',
      message: 'Twitter OAuth credentials configured',
      clientId: clientId.substring(0, 8) + '...', // Show partial ID for security
      authUrl: authUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Twitter OAuth test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test Twitter OAuth',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
