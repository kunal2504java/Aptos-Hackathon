import { NextRequest, NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { MODULE_NAMES, CONTRACT_ADDRESSES } from '@/lib/aptos-client';

// Initialize Aptos client
const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, marketId, side, amount, userAddress, privateKey } = body;

    // Validate required fields
    if (!userId || !marketId || !side || !amount || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate side
    if (!['yes', 'no'].includes(side.toLowerCase())) {
      return NextResponse.json(
        { error: 'Side must be "yes" or "no"' },
        { status: 400 }
      );
    }

    // Validate amount
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const isYesToken = side.toLowerCase() === 'yes';
    const amountInSmallestUnit = Math.floor(betAmount * Math.pow(10, 6));

    // Create transaction payload
    const payload = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESSES.PREDICTION_MARKET}::prediction_market::buy_tokens`,
      arguments: [parseInt(marketId), isYesToken, amountInSmallestUnit],
      type_arguments: [],
    };

    // Submit transaction
    const transaction = await aptos.signAndSubmitTransaction({
      signer: userAddress,
      transaction: payload,
    });

    // Wait for transaction to be processed
    const result = await aptos.waitForTransaction({
      transactionHash: transaction.hash,
    });

    return NextResponse.json({
      success: true,
      transactionHash: transaction.hash,
      message: `Bet placed successfully! Transaction: ${transaction.hash}`,
    });

  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { 
        error: 'Failed to place bet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
