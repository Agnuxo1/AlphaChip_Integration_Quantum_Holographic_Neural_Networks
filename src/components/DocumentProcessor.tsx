import React, { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface DocumentProcessorProps {
  isDarkMode: boolean;
  onProcessComplete: (stats: { tokens: number; coherence: number }) => void;
}

export function DocumentProcessor({ isDarkMode, onProcessComplete }: DocumentProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const processDocument = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setStatus('Starting document processing...');

    try {
      const text = await file.text();
      const chunks = text.match(/[^.!?]+[.!?]+/g) || [];
      const totalChunks = chunks.length;

      let processedTokens = 0;
      let currentCoherence = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        // Simulate quantum holographic processing
        await new Promise(resolve => setTimeout(resolve, 50));
        
        processedTokens += chunk.split(/\s+/).length;
        currentCoherence = 0.5 + (Math.random() * 0.5);
        
        const currentProgress = ((i + 1) / totalChunks) * 100;
        setProgress(currentProgress);
        setStatus(`Processing chunk ${i + 1} of ${totalChunks}`);
      }

      onProcessComplete({
        tokens: processedTokens,
        coherence: currentCoherence
      });

      setStatus('Document processed successfully');
    } catch (error) {
      setStatus('Error processing document');
      console.error('Document processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      await processDocument(file);
    } else {
      setStatus('Please upload a valid .txt file');
    }
  };

  return (
    <Card className={`mt-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isProcessing}
            className={isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload Document
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </div>

        {(isProcessing || status) && (
          <Alert className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {isProcessing && (
          <Progress value={progress} className="w-full" />
        )}
      </CardContent>
    </Card>
  );
}