import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  ExternalLink,
  Zap
} from 'lucide-react';

interface Market {
  id: number;
  question: string;
  endTime: string;
  state: number;
}

interface AIResolutionResult {
  shouldResolve: boolean;
  outcome: 'YES' | 'NO' | 'UNKNOWN';
  confidence: number;
  reasoning: string;
  evidence: string[];
  currentData?: any;
}

interface AIResolutionButtonProps {
  market: Market;
  onResolutionComplete?: (result: AIResolutionResult) => void;
}

export default function AIResolutionButton({ market, onResolutionComplete }: AIResolutionButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<AIResolutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkMarketResolution = async () => {
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/resolve-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId: market.id.toString(),
          question: market.question,
          endTime: market.endTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AIResolutionResult = await response.json();
      setResult(data);
      
      if (onResolutionComplete) {
        onResolutionComplete(data);
      }

    } catch (err) {
      console.error('AI Resolution Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check market resolution');
    } finally {
      setIsChecking(false);
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'YES':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'NO':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'YES':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'NO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 border-purple-400/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Market Resolution
            <Badge variant="outline" className="ml-auto bg-purple-600/20 text-purple-300 border-purple-400/30">
              Beta
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300">
            Check if this market should be resolved early based on current data and AI analysis.
          </p>
          
          <Button
            onClick={checkMarketResolution}
            disabled={isChecking || market.state !== 0}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Check Market Resolution
              </>
            )}
          </Button>

          {market.state !== 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This market is no longer active and cannot be resolved.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-400/30 bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Card className="bg-black/40 border-gray-600/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getOutcomeIcon(result.outcome)}
                    <span className="font-semibold text-white">AI Analysis Result</span>
                  </div>
                  <Badge className={getOutcomeColor(result.outcome)}>
                    {result.outcome}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Confidence:</span>
                    <span className={`font-semibold ${getConfidenceColor(result.confidence)}`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Should Resolve:</span>
                    <Badge variant={result.shouldResolve ? "default" : "secondary"}>
                      {result.shouldResolve ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Reasoning:</h4>
                  <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded">
                    {result.reasoning}
                  </p>
                </div>

                {result.evidence && result.evidence.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">Evidence:</h4>
                    <ul className="space-y-1">
                      {result.evidence.map((evidence, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          {evidence}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.currentData && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">Current Data:</h4>
                    <div className="bg-gray-800/50 p-3 rounded text-sm text-gray-300">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.currentData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {result.shouldResolve && result.outcome !== 'UNKNOWN' && (
                  <Alert className="border-green-400/30 bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      <strong>Ready to Resolve!</strong> The AI analysis suggests this market can be resolved early with {result.outcome} outcome.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
