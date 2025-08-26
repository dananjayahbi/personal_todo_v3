import { NextRequest } from 'next/server';

// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to active connections
      connections.add(controller);

      // Send initial connection message
      const data = {
        type: 'connection',
        message: 'Connected to real-time updates',
        timestamp: new Date().toISOString()
      };
      
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        connections.delete(controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Function to broadcast messages to all connected clients
export function broadcast(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      // Remove broken connections
      connections.delete(controller);
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Broadcast the message to all connected clients
    const data = {
      type: 'message',
      ...body,
      timestamp: new Date().toISOString()
    };
    
    broadcast(data);
    
    return Response.json({ success: true, message: 'Message broadcasted' });
  } catch (error) {
    return Response.json({ error: 'Failed to broadcast message' }, { status: 500 });
  }
}
