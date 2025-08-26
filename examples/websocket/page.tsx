'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  text?: string;
  message?: string;
  senderId: string;
  timestamp: string;
  type?: string;
}

export default function RealtimeDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    // Create EventSource for Server-Sent Events
    const es = new EventSource('/api/realtime');
    setEventSource(es);

    es.onopen = () => {
      setIsConnected(true);
      console.log('Connected to real-time stream');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      console.log('Connection lost');
    };

    // Cleanup on unmount
    return () => {
      es.close();
      setEventSource(null);
      setIsConnected(false);
    };
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputMessage,
          senderId: 'user-' + Math.random().toString(36).substr(2, 9),
        }),
      });

      if (response.ok) {
        setInputMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Real-time Demo (Server-Sent Events)
            <span className={`px-2 py-1 rounded text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo shows real-time communication using Server-Sent Events (SSE) instead of WebSockets.
            Perfect for Vercel deployment!
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!isConnected}
              />
              <Button onClick={sendMessage} disabled={!isConnected || !inputMessage.trim()}>
                Send
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No messages yet...</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm text-blue-600">
                              {msg.senderId}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{msg.text || msg.message}</p>
                          {msg.type && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                              {msg.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About This Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ <strong>Vercel Compatible:</strong> Uses Server-Sent Events instead of WebSockets</p>
            <p>✅ <strong>Real-time Updates:</strong> Supports live message broadcasting</p>
            <p>✅ <strong>No Custom Server:</strong> Uses Next.js API routes</p>
            <p>✅ <strong>Automatic Reconnection:</strong> Browser handles reconnection automatically</p>
            <p>✅ <strong>Lightweight:</strong> No additional dependencies required</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
