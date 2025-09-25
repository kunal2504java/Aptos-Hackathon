import { NextRequest, NextResponse } from 'next/server';

interface MarketResolutionRequest {
  marketId: string;
  question: string;
  endTime: string;
  marketType?: string;
}

interface MarketResolutionResponse {
  shouldResolve: boolean;
  outcome: 'YES' | 'NO' | 'UNKNOWN';
  confidence: number;
  reasoning: string;
  evidence: string[];
  currentData?: any;
}

// AI-powered market resolution checker
export async function POST(request: NextRequest) {
  try {
    const body: MarketResolutionRequest = await request.json();
    const { marketId, question, endTime, marketType } = body;

    console.log(`AI Resolution Check for Market ${marketId}: "${question}"`);

    // Check if market has already passed its end time
    const endDate = new Date(endTime);
    const now = new Date();
    
    if (now > endDate) {
      return NextResponse.json({
        shouldResolve: true,
        outcome: 'UNKNOWN',
        confidence: 1.0,
        reasoning: 'Market has passed its end time and should be resolved normally.',
        evidence: ['Market end time has passed'],
        currentData: { endTime: endTime, currentTime: now.toISOString() }
      });
    }

    // AI-powered resolution logic based on market type and question
    const resolution = await analyzeMarketWithAI(question, marketType);

    return NextResponse.json(resolution);

  } catch (error) {
    console.error('AI Market Resolution Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze market',
        shouldResolve: false,
        outcome: 'UNKNOWN',
        confidence: 0,
        reasoning: 'Error occurred during analysis',
        evidence: []
      },
      { status: 500 }
    );
  }
}

async function analyzeMarketWithAI(question: string, marketType?: string): Promise<MarketResolutionResponse> {
  // Extract key information from the question
  const questionLower = question.toLowerCase();
  
  // Crypto price checks
  if (questionLower.includes('bitcoin') || questionLower.includes('btc')) {
    return await checkBitcoinPrice(question);
  }
  
  if (questionLower.includes('ethereum') || questionLower.includes('eth')) {
    return await checkEthereumPrice(question);
  }
  
  // Stock market checks
  if (questionLower.includes('stock') || questionLower.includes('nasdaq') || questionLower.includes('s&p')) {
    return await checkStockMarket(question);
  }
  
  // Sports checks
  if (questionLower.includes('football') || questionLower.includes('soccer') || questionLower.includes('basketball')) {
    return await checkSportsResults(question);
  }
  
  // News/events checks
  if (questionLower.includes('election') || questionLower.includes('president') || questionLower.includes('ceo')) {
    return await checkNewsEvents(question);
  }
  
  // Default: Cannot determine
  return {
    shouldResolve: false,
    outcome: 'UNKNOWN',
    confidence: 0.1,
    reasoning: 'Question type not supported for AI resolution yet.',
    evidence: ['AI resolution not available for this market type'],
    currentData: { question, marketType }
  };
}

async function checkBitcoinPrice(question: string): Promise<MarketResolutionResponse> {
  try {
    // Extract price target from question
    const priceMatch = question.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*k/i);
    const targetPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) * 1000 : null;
    
    if (!targetPrice) {
      return {
        shouldResolve: false,
        outcome: 'UNKNOWN',
        confidence: 0.1,
        reasoning: 'Could not extract price target from question.',
        evidence: ['Price target not found in question'],
        currentData: { question }
      };
    }

    // Fetch current Bitcoin price
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await response.json();
    const currentPrice = data.bitcoin?.usd;

    if (!currentPrice) {
      return {
        shouldResolve: false,
        outcome: 'UNKNOWN',
        confidence: 0.1,
        reasoning: 'Could not fetch current Bitcoin price.',
        evidence: ['API error'],
        currentData: { question, targetPrice }
      };
    }

    const shouldResolve = currentPrice >= targetPrice;
    const outcome = shouldResolve ? 'YES' : 'NO';
    const confidence = shouldResolve ? 0.95 : 0.7; // Higher confidence if target reached

    return {
      shouldResolve,
      outcome,
      confidence,
      reasoning: shouldResolve 
        ? `Bitcoin has reached $${currentPrice.toLocaleString()}, exceeding the target of $${targetPrice.toLocaleString()}.`
        : `Bitcoin is currently at $${currentPrice.toLocaleString()}, below the target of $${targetPrice.toLocaleString()}.`,
      evidence: [
        `Current BTC price: $${currentPrice.toLocaleString()}`,
        `Target price: $${targetPrice.toLocaleString()}`,
        `Price source: CoinGecko API`
      ],
      currentData: { 
        currentPrice, 
        targetPrice, 
        question,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Bitcoin price check error:', error);
    return {
      shouldResolve: false,
      outcome: 'UNKNOWN',
      confidence: 0.1,
      reasoning: 'Error fetching Bitcoin price data.',
      evidence: ['API error'],
      currentData: { question, error: error.message }
    };
  }
}

async function checkEthereumPrice(question: string): Promise<MarketResolutionResponse> {
  try {
    // Extract price target from question
    const priceMatch = question.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*k/i);
    const targetPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) * 1000 : null;
    
    if (!targetPrice) {
      return {
        shouldResolve: false,
        outcome: 'UNKNOWN',
        confidence: 0.1,
        reasoning: 'Could not extract price target from question.',
        evidence: ['Price target not found in question'],
        currentData: { question }
      };
    }

    // Fetch current Ethereum price
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    const currentPrice = data.ethereum?.usd;

    if (!currentPrice) {
      return {
        shouldResolve: false,
        outcome: 'UNKNOWN',
        confidence: 0.1,
        reasoning: 'Could not fetch current Ethereum price.',
        evidence: ['API error'],
        currentData: { question, targetPrice }
      };
    }

    const shouldResolve = currentPrice >= targetPrice;
    const outcome = shouldResolve ? 'YES' : 'NO';
    const confidence = shouldResolve ? 0.95 : 0.7;

    return {
      shouldResolve,
      outcome,
      confidence,
      reasoning: shouldResolve 
        ? `Ethereum has reached $${currentPrice.toLocaleString()}, exceeding the target of $${targetPrice.toLocaleString()}.`
        : `Ethereum is currently at $${currentPrice.toLocaleString()}, below the target of $${targetPrice.toLocaleString()}.`,
      evidence: [
        `Current ETH price: $${currentPrice.toLocaleString()}`,
        `Target price: $${targetPrice.toLocaleString()}`,
        `Price source: CoinGecko API`
      ],
      currentData: { 
        currentPrice, 
        targetPrice, 
        question,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Ethereum price check error:', error);
    return {
      shouldResolve: false,
      outcome: 'UNKNOWN',
      confidence: 0.1,
      reasoning: 'Error fetching Ethereum price data.',
      evidence: ['API error'],
      currentData: { question, error: error.message }
    };
  }
}

async function checkStockMarket(question: string): Promise<MarketResolutionResponse> {
  // Placeholder for stock market checks
  return {
    shouldResolve: false,
    outcome: 'UNKNOWN',
    confidence: 0.1,
    reasoning: 'Stock market resolution not implemented yet.',
    evidence: ['Feature coming soon'],
    currentData: { question, marketType: 'stock' }
  };
}

async function checkSportsResults(question: string): Promise<MarketResolutionResponse> {
  // Placeholder for sports checks
  return {
    shouldResolve: false,
    outcome: 'UNKNOWN',
    confidence: 0.1,
    reasoning: 'Sports resolution not implemented yet.',
    evidence: ['Feature coming soon'],
    currentData: { question, marketType: 'sports' }
  };
}

async function checkNewsEvents(question: string): Promise<MarketResolutionResponse> {
  // Placeholder for news/events checks
  return {
    shouldResolve: false,
    outcome: 'UNKNOWN',
    confidence: 0.1,
    reasoning: 'News/events resolution not implemented yet.',
    evidence: ['Feature coming soon'],
    currentData: { question, marketType: 'news' }
  };
}
