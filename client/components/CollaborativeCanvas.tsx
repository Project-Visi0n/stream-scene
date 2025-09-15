import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

interface DrawingEvent {
  type: 'draw' | 'erase' | 'text' | 'clear' | 'undo' | 'redo' | 'background-color';
  points?: Point[];
  color?: string;
  width?: number;
  tool?: string;
  text?: string;
  position?: Point;
  backgroundColor?: string;
  timestamp: number;
}

interface Collaborator {
  id: string;
  name: string;
  cursor: Point;
  lastSeen: number;
  isGuest?: boolean;
}

interface CanvasProps {
  canvasId: string;
  shareToken?: string;
  isOwner?: boolean;
  allowAnonymousEdit?: boolean;
  onCollaboratorChange?: (collaboratorId: string, action: 'joined' | 'left') => void;
  initialBackgroundColor?: string;
}

interface CanvasSession {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: number;
  collaborators: string[];
  canvasId: string;
  createdAt: string;
}

interface ShareData {
  shareUrl: string;
  shareToken: string;
  expiresAt: string;
}

// Color preset arrays
const BRUSH_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#808080', // Gray
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#4169E1', // Royal Blue
  '#DC143C', // Crimson
];

const BACKGROUND_COLORS = [
  '#FFFFFF', // Pure White
  '#1F2937', // Dark Gray
  '#000000', // Pure Black
  '#FEF3C7', // Light Yellow
  '#DBEAFE', // Light Blue
  '#D1FAE5', // Light Green
  '#FEE2E2', // Light Red/Pink
  '#E0E7FF', // Light Purple
  '#F3E8FF', // Light Lavender
  '#FCE7F3', // Light Rose
  '#F0F9FF', // Very Light Blue
  '#F7FEE7', // Very Light Green
];

const CollaborativeCanvas: React.FC<CanvasProps> = ({
  canvasId,
  shareToken,
  isOwner = false,
  allowAnonymousEdit = false,
  onCollaboratorChange,
  initialBackgroundColor = '#FFFFFF'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'brush' | 'eraser' | 'text'>('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  const [penSize, setPenSize] = useState(2);
  const [brushSize, setBrushSize] = useState(8);
  const [brushWidth, setBrushWidth] = useState(2); // Current active size
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [strokes, setStrokes] = useState<DrawingEvent[]>([]);
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());
  const [drawingHistory, setDrawingHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [textInput, setTextInput] = useState({ x: 0, y: 0, text: '', active: false });
  const [guestName, setGuestName] = useState('');
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState<CanvasSession[]>([]);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    collaborators: ''
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({
    shareUrl: '',
    shareToken: '',
    expiresAt: ''
  });
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Effect to close modals when clicking outside or changing tools
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.color-picker-modal') && !target.closest('.preset-button')) {
        setShowColorPicker(false);
        setShowBackgroundPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modals when tool changes
  useEffect(() => {
    setShowColorPicker(false);
    setShowBackgroundPicker(false);
  }, [currentTool]);

  // WebSocket initialization with environment detection
  useEffect(() => {
    let socketInstance: Socket | null = null;

    // Only initialize socket in production or when explicitly enabled in development
    const shouldInitializeSocket = process.env.NODE_ENV === 'production' || 
                                   process.env.REACT_APP_ENABLE_WEBSOCKET === 'true';

    if (shouldInitializeSocket) {
      try {
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
        socketInstance = io(serverUrl, {
          transports: ['polling', 'websocket'], // Prioritize polling for Cloudflare compatibility
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          forceNew: true, // Force new connection
          upgrade: true, // Allow transport upgrades
          timeout: 10000, // Increase timeout for slow connections
        });

        socketInstance.on('connect', () => {
          console.log('🔌 WebSocket connected successfully to:', serverUrl);
          setIsConnected(true);
          setSocket(socketInstance);
          
          // Identify as guest user
          const guestName = `Guest_${Math.random().toString(36).substring(2, 8)}`;
          socketInstance?.emit('user-identify', {
            guestName,
            guestIdentifier: socketInstance.id,
            canvasId
          });
          
          // Join canvas room
          socketInstance?.emit('join-canvas', canvasId);
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          setIsConnected(false);
        });

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
          console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
          console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
          setIsConnected(true);
        });

        socketInstance.on('reconnect_error', (error) => {
          console.error('❌ WebSocket reconnection error:', error);
        });

        socketInstance.on('canvas-update', (updateData: any) => {
          // Handle incoming drawing events from other users
          if (updateData.canvasData && updateData.operation === 'draw') {
            const drawingEvent = updateData.canvasData;
            
            // Add to strokes state
            setStrokes(prev => [...prev, drawingEvent]);
            
            // Immediately draw the received stroke on the canvas
            const canvas = canvasRef.current;
            if (canvas && drawingEvent.points && drawingEvent.points.length > 1) {
              
              // Draw lines between consecutive points
              for (let i = 1; i < drawingEvent.points.length; i++) {
                const from = drawingEvent.points[i - 1];
                const to = drawingEvent.points[i];
                
                // Use the drawLine function to render the stroke
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  if (drawingEvent.tool === 'pen') {
                    ctx.lineCap = 'butt';
                    ctx.lineJoin = 'miter';
                    ctx.lineWidth = Math.max(1, drawingEvent.width * 0.7);
                  } else if (drawingEvent.tool === 'brush') {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.lineWidth = drawingEvent.width;
                    ctx.globalAlpha = 0.8;
                  } else {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.lineWidth = drawingEvent.width;
                  }
                  
                  if (drawingEvent.tool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                  } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = drawingEvent.color;
                  }

                  ctx.beginPath();
                  ctx.moveTo(from.x, from.y);
                  ctx.lineTo(to.x, to.y);
                  ctx.stroke();
                  
                  // Reset alpha for other operations
                  if (drawingEvent.tool === 'brush') {
                    ctx.globalAlpha = 1.0;
                  }
                }
              }
            }
          } else if (updateData.operation === 'clear') {
            // Clear the canvas
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = backgroundColor;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            setStrokes([]);
          }
        });

        socketInstance.on('collaborator-joined', (data: any) => {
          const collaborator: Collaborator = {
            id: data.socketId,
            name: data.user?.guestName || `User ${data.socketId.slice(0, 6)}`,
            cursor: { x: 0, y: 0 },
            lastSeen: Date.now(),
            isGuest: !data.user?.userId
          };
          setCollaborators(prev => new Map(prev.set(collaborator.id, collaborator)));
          onCollaboratorChange?.(collaborator.id, 'joined');
        });

        socketInstance.on('collaborator-left', (data: any) => {
          setCollaborators(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.socketId);
            return newMap;
          });
          onCollaboratorChange?.(data.socketId, 'left');
        });

        socketInstance.on('cursor-move', (data: { x: number; y: number; socketId: string }) => {
          setCollaborators(prev => {
            const newMap = new Map(prev);
            const collaborator = newMap.get(data.socketId);
            if (collaborator) {
              newMap.set(data.socketId, { ...collaborator, cursor: { x: data.x, y: data.y } });
            }
            return newMap;
          });
        });

      } catch (error) {
        console.warn('WebSocket initialization failed:', error);
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [canvasId, shareToken, onCollaboratorChange]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.backgroundColor = backgroundColor;
  }, [backgroundColor]);

  // Adjust brush size when tool changes
  useEffect(() => {
    if (currentTool === 'pen') {
      setBrushWidth(penSize);
    } else if (currentTool === 'brush') {
      setBrushWidth(brushSize);
    } else if (currentTool === 'eraser') {
      setBrushWidth(brushSize); // Eraser uses brush size
    }
  }, [currentTool, penSize, brushSize]);

  // Update tool-specific sizes when brushWidth changes
  const handleSizeChange = useCallback((newSize: number) => {
    setBrushWidth(newSize);
    if (currentTool === 'pen') {
      setPenSize(newSize);
    } else if (currentTool === 'brush' || currentTool === 'eraser') {
      setBrushSize(newSize);
    }
  }, [currentTool]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }, []);

  const drawLine = useCallback((from: Point, to: Point, color: string, width: number, tool: string, erase = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Different styling for pen vs brush
    if (tool === 'pen') {
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.lineWidth = Math.max(1, width * 0.7); // Pen is thinner
    } else if (tool === 'brush') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
      ctx.globalAlpha = 0.8; // Brush has slight transparency for blending
    } else {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
    }
    
    if (erase) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    // Reset alpha for other operations
    if (tool === 'brush') {
      ctx.globalAlpha = 1.0;
    }
  }, []);

  const saveStroke = useCallback((event: DrawingEvent) => {
    setStrokes(prev => {
      const newStrokes = [...prev, event];
      return newStrokes;
    });
    
    // Emit to collaborators if socket is connected
    if (socket && socket.connected) {
      socket.emit('canvas-update', {
        canvasData: event,
        operation: event.type,
        timestamp: event.timestamp
      });
    }
  }, [socket, canvasId]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageData = canvas.toDataURL();
    setDrawingHistory(prev => {
      const newHistory = [...prev.slice(Math.max(0, prev.length - 19)), imageData]; // Keep last 20 states
      return newHistory;
    });
    setHistoryStep(prev => prev + 1);
  }, []);

  const undo = useCallback(() => {
    if (historyStep > 0 && drawingHistory.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      
      setHistoryStep(prev => prev - 1);
      
      if (historyStep > 1) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = drawingHistory[historyStep - 2];
      } else {
        // First undo - clear canvas and set background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Remove last stroke from strokes array
      setStrokes(prev => prev.slice(0, -1));
    }
  }, [historyStep, drawingHistory, backgroundColor]);

  const redo = useCallback(() => {
    if (historyStep < drawingHistory.length) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = drawingHistory[historyStep];
      setHistoryStep(prev => prev + 1);
    }
  }, [historyStep, drawingHistory]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all strokes
    strokes.forEach(stroke => {
      if (stroke.type === 'draw' || stroke.type === 'erase') {
        if (stroke.points && stroke.points.length >= 2) {
          for (let i = 1; i < stroke.points.length; i++) {
            drawLine(
              stroke.points[i - 1],
              stroke.points[i],
              stroke.color || '#000000',
              stroke.width || 3,
              stroke.tool || 'brush',
              stroke.type === 'erase'
            );
          }
        }
      } else if (stroke.type === 'text') {
        if (stroke.position && stroke.text) {
          ctx.fillStyle = stroke.color || '#000000';
          ctx.font = '16px Arial';
          ctx.fillText(stroke.text, stroke.position.x, stroke.position.y);
        }
      } else if (stroke.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  }, [strokes, drawLine, backgroundColor]);

  // Mouse event handlers with collaboration support
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    
    if (currentTool === 'text') {
      setTextInput({ x: point.x, y: point.y, text: '', active: true });
      return;
    }
    
    setIsDrawing(true);
    setLastPoint(point);
    saveToHistory(); // Save state before drawing
  }, [getCanvasPoint, currentTool, saveToHistory]);

  const handleTextSubmit = useCallback((text: string) => {
    if (!text.trim()) {
      setTextInput({ x: 0, y: 0, text: '', active: false });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Draw text immediately
    ctx.fillStyle = brushColor;
    ctx.font = '16px Arial';
    ctx.fillText(text, textInput.x, textInput.y);

    // Save text event
    const textEvent: DrawingEvent = {
      type: 'text',
      position: { x: textInput.x, y: textInput.y },
      text: text,
      color: brushColor,
      timestamp: Date.now()
    };

    saveStroke(textEvent);
    setTextInput({ x: 0, y: 0, text: '', active: false });
  }, [textInput, brushColor, saveStroke]);

  // Share functionality
  const generateShareLink = useCallback(async () => {
    try {
      // Use the actual canvasId as the share token for simplicity
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const shareToken = canvasId; // Use the canvas ID directly
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      const shareUrl = `${window.location.origin}/canvas/shared/${shareToken}`;
      
      setShareData({
        shareUrl,
        shareToken,
        expiresAt
      });
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
  }, [canvasId]);

  // Calendar functionality
  const scheduleSession = useCallback(async () => {
    try {
      const session: CanvasSession = {
        id: Math.random().toString(36).substring(2, 15),
        title: sessionForm.title,
        description: sessionForm.description,
        scheduledDate: `${sessionForm.scheduledDate}T${sessionForm.scheduledTime}`,
        duration: sessionForm.duration,
        collaborators: sessionForm.collaborators.split(',').map(email => email.trim()),
        canvasId,
        createdAt: new Date().toISOString()
      };
      
      setScheduledSessions(prev => [...prev, session]);
      setShowCalendarModal(false);
      setSessionForm({
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        collaborators: ''
      });
    } catch (error) {
      console.error('Failed to schedule session:', error);
    }
  }, [sessionForm, canvasId]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    
    // Emit cursor position to collaborators
    if (socket && socket.connected) {
      socket.emit('cursor-move', { x: point.x, y: point.y, canvasId });
    }
    
    if (!isDrawing || !lastPoint) return;
    
    // Draw immediately for visual feedback
    drawLine(lastPoint, point, brushColor, brushWidth, currentTool, currentTool === 'eraser');
    
    // Save stroke data
    const strokeEvent: DrawingEvent = {
      type: currentTool === 'eraser' ? 'erase' : 'draw',
      points: [lastPoint, point],
      color: brushColor,
      width: brushWidth,
      tool: currentTool,
      timestamp: Date.now()
    };
    
    saveStroke(strokeEvent);
    setLastPoint(point);
  }, [isDrawing, lastPoint, getCanvasPoint, drawLine, brushColor, brushWidth, currentTool, saveStroke, socket]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    
    const clearEvent: DrawingEvent = {
      type: 'clear',
      timestamp: Date.now()
    };
    saveStroke(clearEvent);
  }, [saveStroke]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700">
        {/* Top Row - Connection Status and Actions */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
              {collaborators.size > 0 && (
                <span className="text-xs text-gray-400">
                  ({collaborators.size} collaborator{collaborators.size !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>

          {/* Share and Calendar Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded flex items-center space-x-1"
              title="Share Canvas"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              <span className="text-sm hidden md:inline">Share</span>
            </button>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded flex items-center space-x-1"
              title="Schedule Session"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm hidden md:inline">Schedule</span>
            </button>
          </div>
        </div>

        {/* Bottom Row - Tools and Controls */}
        <div className="flex flex-wrap items-center p-2 gap-2">
          {/* Tools */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentTool('pen')}
              className={`p-2 rounded ${currentTool === 'pen' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Pen"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('brush')}
              className={`p-2 rounded ${currentTool === 'brush' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Brush"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 4a4 4 0 11-8 0 4 4 0 018 0zM16 14a2 2 0 11-4 0 2 2 0 014 0z"/>
                <path d="M8.5 8.5L11 6 16 11l-2.5 2.5L8.5 8.5z"/>
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('eraser')}
              className={`p-2 rounded ${currentTool === 'eraser' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Eraser"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.707 3.293a1 1 0 010 1.414L5.414 8l3.293 3.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0zM11.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 8l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentTool('text')}
              className={`p-2 rounded ${currentTool === 'text' ? 'bg-blue-600' : 'bg-gray-700'}`}
              title="Text"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v2H7V5zm6 4H7v2h6V9zm-6 4h6v2H7v-2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Color picker */}
          <div className="flex items-center space-x-2">
            <span className="text-xs">Color:</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer"
              title="Brush Color"
            />
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              title="Color Presets"
            >
              ▼
            </button>
          </div>

          {/* Background Color */}
          <div className="flex items-center space-x-2">
            <span className="text-xs">BG:</span>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => {
                setBackgroundColor(e.target.value);
                redrawCanvas();
              }}
              className="w-6 h-6 rounded cursor-pointer"
              title="Background Color"
            />
            <button
              onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
              className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              title="Background Presets"
            >
              ▼
            </button>
          </div>

          {/* Size controls */}
          <div className="flex items-center space-x-2">
            <span className="text-xs">Size:</span>
            <input
              type="range"
              min={currentTool === 'pen' ? '1' : '3'}
              max={currentTool === 'pen' ? '10' : '30'}
              value={brushWidth}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-xs w-6">{brushWidth}</span>
          </div>

          {/* Clear button */}
          <button
            onClick={clearCanvas}
            className="p-2 bg-red-600 hover:bg-red-700 rounded"
            title="Clear Canvas"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Undo/Redo buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 rounded"
              title="Undo"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= drawingHistory.length}
              className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 rounded"
              title="Redo"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-4 z-20 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg color-picker-modal"
          >
            <h3 className="text-sm font-semibold mb-3">Brush Color Presets</h3>
            <div className="grid grid-cols-6 gap-2">
              {BRUSH_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setBrushColor(color);
                    setShowColorPicker(false);
                  }}
                  className={`w-8 h-8 rounded border-2 ${
                    brushColor === color ? 'border-white' : 'border-gray-500'
                  } hover:border-white transition-colors`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Color Picker Modal */}
      <AnimatePresence>
        {showBackgroundPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-64 z-20 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg color-picker-modal"
          >
            <h3 className="text-sm font-semibold mb-3">Background Color Presets</h3>
            <div className="grid grid-cols-4 gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setBackgroundColor(color);
                    setShowBackgroundPicker(false);
                    redrawCanvas();
                  }}
                  className={`w-8 h-8 rounded border-2 ${
                    backgroundColor === color ? 'border-white' : 'border-gray-500'
                  } hover:border-white transition-colors`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Input Modal */}
      <AnimatePresence>
        {textInput.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          >
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Add Text</h3>
              <input
                type="text"
                value={textInput.text}
                onChange={(e) => setTextInput(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter text to add to canvas..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit(textInput.text);
                  } else if (e.key === 'Escape') {
                    setTextInput({ x: 0, y: 0, text: '', active: false });
                  }
                }}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setTextInput({ x: 0, y: 0, text: '', active: false })}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTextSubmit(textInput.text)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
                >
                  Add Text
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          >
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Share Canvas</h3>
              
              {shareData.shareUrl ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Share URL:</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={shareData.shareUrl}
                        readOnly
                        className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-l text-white text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(shareData.shareUrl)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-r"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Link expires: {new Date(shareData.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Generate a shareable link for this canvas</p>
                  <button
                    onClick={generateShareLink}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded"
                  >
                    Generate Share Link
                  </button>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30"
          >
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Schedule Canvas Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Session Title</label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Team Brainstorming Session"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the session..."
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-20"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={sessionForm.scheduledDate}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={sessionForm.scheduledTime}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    min="15"
                    max="480"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Collaborators (emails, comma-separated)</label>
                  <input
                    type="text"
                    value={sessionForm.collaborators}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, collaborators: e.target.value }))}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={scheduleSession}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded"
                  disabled={!sessionForm.title || !sessionForm.scheduledDate || !sessionForm.scheduledTime}
                >
                  Schedule Session
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-900">
        <div className="relative border border-gray-600 rounded-lg overflow-hidden shadow-lg">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
            style={{ display: 'block' }}
          />
          
          {/* Collaborative Cursors */}
          {Array.from(collaborators.entries()).map(([id, collaborator]) => (
            <div
              key={id}
              className="absolute pointer-events-none z-10"
              style={{
                left: collaborator.cursor.x,
                top: collaborator.cursor.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                <div className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded shadow-lg whitespace-nowrap">
                  {collaborator.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeCanvas;