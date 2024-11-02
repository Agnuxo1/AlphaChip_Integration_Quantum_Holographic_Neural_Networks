import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  MessageSquare, 
  Network, 
  Cloud, 
  Upload, 
  Loader2, 
  Zap,
  Save,
  Download,
  Power,
  Settings,
  Users,
  Wifi,
  Shield
} from 'lucide-react';
import { HuggingFaceClient } from '../lib/llm/HuggingFaceClient';
import { HolographicProcessor } from '../lib/holographic/HolographicProcessor';
import { P2PNetwork } from '../lib/p2p/P2PNetwork';
import { DocumentProcessor } from '../lib/document/DocumentProcessor';

interface ChatInterfaceProps {
  isDarkMode: boolean;
  onProcessComplete: (stats: { tokens: number; coherence: number }) => void;
}

export function ChatInterface({ isDarkMode, onProcessComplete }: ChatInterfaceProps) {
  const [processor] = useState(() => new HolographicProcessor());
  const [llmClient] = useState(() => new HuggingFaceClient());
  const [p2pNetwork] = useState(() => new P2PNetwork());
  const [docProcessor] = useState(() => new DocumentProcessor());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [networkStatus, setNetworkStatus] = useState('disconnected');
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [isLLMEnabled, setIsLLMEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [processingMetrics, setProcessingMetrics] = useState({
    coherence: 0,
    entanglement: 0,
    efficiency: 0
  });
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>>([]);
  const [documentContext, setDocumentContext] = useState<string[]>([]);
  const [hasLoadedDocuments, setHasLoadedDocuments] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('hf_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      llmClient.setToken(storedKey);
      setIsLLMEnabled(true);
    }

    p2pNetwork.onNetworkStatus((status) => {
      setNetworkStatus(status);
    });

    p2pNetwork.onPeerJoin(() => {
      setConnectedPeers(prev => prev + 1);
    });

    p2pNetwork.onPeerLeave(() => {
      setConnectedPeers(prev => Math.max(0, prev - 1));
    });

    return () => {
      processor.dispose();
      p2pNetwork.disconnect();
    };
  }, [processor, p2pNetwork, llmClient]);

  const connectToP2P = async () => {
    try {
      await p2pNetwork.initializeNetwork();
      setError(null);
    } catch (err) {
      setError('Failed to connect to P2P network');
    }
  };

  const disconnectFromP2P = () => {
    p2pNetwork.disconnect();
  };

  const saveNetworkState = () => {
    try {
      const state = processor.saveState();
      const stateString = JSON.stringify(state);
      const blob = new Blob([stateString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'network-state.json';
      a.click();
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      setError('Failed to save network state');
    }
  };

  const loadNetworkState = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const state = JSON.parse(text);
      await processor.loadState(state);
      setError(null);
    } catch (err) {
      setError('Failed to load network state');
    }
  };

  const toggleLLM = () => {
    setIsLLMEnabled(!isLLMEnabled);
    if (!isLLMEnabled && !apiKey) {
      setError('Please set your HuggingFace API key first');
    }
  };

  const processDocument = async (file: File) => {
    try {
      setLoading(true);
      const result = await docProcessor.processDocument(file);
      
      if (result.success && result.chunks) {
        setDocumentContext(prev => [...prev, ...result.chunks.map(chunk => chunk.text)]);
        setHasLoadedDocuments(true);
        
        onProcessComplete({
          tokens: result.chunks.reduce((acc, chunk) => acc + chunk.text.split(/\s+/).length, 0),
          coherence: 0.8 + Math.random() * 0.2
        });
        
        return result;
      } else {
        throw new Error(result.error || 'Document processing failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error processing document';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const context = getRelevantContext(input);
      const response = await generateResponse(input, context);

      const newMessage = {
        role: 'user' as const,
        content: input,
        timestamp: Date.now()
      };
      
      const assistantResponse = {
        role: 'assistant' as const,
        content: response,
        timestamp: Date.now()
      };

      setChatHistory(prev => [...prev, newMessage, assistantResponse]);
      setProgress(100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Chat processing error:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const getRelevantContext = useCallback((input: string) => {
    if (!documentContext.length) return '';
    
    const words = input.toLowerCase().split(/\s+/);
    const relevantChunks = documentContext
      .filter(context => 
        words.some(word => context.toLowerCase().includes(word))
      )
      .slice(0, 3);

    return relevantChunks.length ? relevantChunks.join('\n\n') : documentContext[0];
  }, [documentContext]);

  const generateResponse = async (input: string, context: string): Promise<string> => {
    if (!context) {
      return hasLoadedDocuments
        ? "I found no relevant information in the loaded documents for your query. Could you please rephrase or ask something else?"
        : "Please load some documents first so I can provide relevant information based on their content.";
    }

    if (isLLMEnabled && apiKey) {
      try {
        const prompt = `
          Based on the following context:
          ${context}

          Question: ${input}

          Please provide a detailed response that:
          1. Directly addresses the question
          2. Uses specific information from the context
          3. Is clear and concise
          4. Maintains a professional tone

          Response:
        `;
        return await llmClient.generateText(prompt);
      } catch (error) {
        console.error('LLM generation error:', error);
        return `I found relevant information but encountered an error processing it. Here's the relevant context:\n\n${context}`;
      }
    } else {
      return `I found relevant information but need an API key for advanced processing. Here's the relevant context:\n\n${context}`;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await processDocument(file);
        setProgress((i + 1) / files.length * 100);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process documents';
      setError(errorMessage);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey) {
      localStorage.setItem('hf_api_key', apiKey);
      llmClient.setToken(apiKey);
      setIsLLMEnabled(true);
      setError(null);
    }
  };

  return (
    <Card className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Neural Chat Interface
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className={isDarkMode ? 'border-gray-700' : ''}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={networkStatus === 'disconnected' ? connectToP2P : disconnectFromP2P}
              className={`${isDarkMode ? 'border-gray-700' : ''} ${
                networkStatus !== 'disconnected' ? 'bg-green-500 hover:bg-green-600' : ''
              }`}
            >
              <Wifi className="w-4 h-4" />
            </Button>
            {connectedPeers > 0 && (
              <span className="text-sm">
                <Users className="w-4 h-4 inline mr-1" />
                {connectedPeers}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-auto">
        {showSettings && (
          <div className="space-y-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <form onSubmit={handleApiKeySubmit} className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter HuggingFace API key..."
                className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
              />
              <Button type="submit">
                <Shield className="w-4 h-4 mr-2" />
                Save API Key
              </Button>
            </form>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleLLM}
                className={`${isDarkMode ? 'border-gray-700' : ''} ${
                  isLLMEnabled ? 'bg-green-500 hover:bg-green-600' : ''
                }`}
              >
                <Power className="w-4 h-4 mr-2" />
                {isLLMEnabled ? 'Disable LLM' : 'Enable LLM'}
              </Button>
              
              <Button
                variant="outline"
                onClick={saveNetworkState}
                className={isDarkMode ? 'border-gray-700' : ''}
              >
                <Save className="w-4 h-4 mr-2" />
                Save State
              </Button>
              
              <Button
                variant="outline"
                onClick={() => document.getElementById('load-state')?.click()}
                className={isDarkMode ? 'border-gray-700' : ''}
              >
                <Download className="w-4 h-4 mr-2" />
                Load State
              </Button>
              <input
                id="load-state"
                type="file"
                accept=".json"
                className="hidden"
                onChange={loadNetworkState}
              />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 space-y-4 overflow-auto">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                  : isDarkMode ? 'bg-blue-900' : 'bg-blue-50'
              }`}
            >
              <p className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {message.role === 'user' ? 'You:' : 'Assistant:'}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>

        {loading && (
          <Progress value={progress} className="w-full" />
        )}
        
        <form onSubmit={handleSubmit} className="mt-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your message..."
              className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className={isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('file-upload')?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Documents
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </div>
          <Button 
            variant="outline" 
            disabled={!apiKey || loading}
            className="flex items-center gap-2"
          >
            <Network className="w-4 h-4" />
            Train Network
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}