import React, { useState, useRef, useEffect } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { motion } from "framer-motion";

const canvasStyles = {
  borderRadius: "8px", // Slightly smaller radius than container
  marginBottom: "0px", // Remove margin since it's inside container
  touchAction: "none", // Prevents scrolling while drawing on mobile
  border: "none", // Remove border since container has the border
  background: "rgba(30, 41, 59, 0.8)", // Solid background
};

interface SavedDrawing {
  id: string;
  name: string;
  data: string;
  timestamp: number;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  icon: string;
}

const ProjectCenterCanvas: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState<string>("#8b5cf6"); // Default to purple
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [eraserMode, setEraserMode] = useState<boolean>(false);
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);
  const [currentDrawingName, setCurrentDrawingName] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [showLoadDialog, setShowLoadDialog] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  // Load saved drawings from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('canvas-drawings');
    if (saved) {
      try {
        setSavedDrawings(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load saved drawings:', error);
      }
    }
  }, []);

  // Notification system
  const showNotification = (type: 'success' | 'error' | 'info', message: string, icon: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      icon
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Initialize canvas settings
  useEffect(() => {
    if (canvasRef.current) {
      // Ensure the canvas is properly initialized
      try {
        canvasRef.current.eraseMode(false);
      } catch (error) {
        console.warn('Canvas initialization warning:', error);
      }
    }
  }, []);

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  };

  const handleEraserToggle = (checked: boolean) => {
    setEraserMode(checked);
    if (canvasRef.current) {
      if (checked) {
        canvasRef.current.eraseMode(true);
      } else {
        canvasRef.current.eraseMode(false);
      }
    }
  };

  const saveDrawing = async () => {
    if (!canvasRef.current || !currentDrawingName.trim()) return;
    
    try {
      const paths = await canvasRef.current.exportPaths();
      const newDrawing: SavedDrawing = {
        id: Date.now().toString(),
        name: currentDrawingName.trim(),
        data: JSON.stringify(paths),
        timestamp: Date.now()
      };
      
      const updatedDrawings = [...savedDrawings, newDrawing];
      setSavedDrawings(updatedDrawings);
      localStorage.setItem('canvas-drawings', JSON.stringify(updatedDrawings));
      
      setCurrentDrawingName("");
      setShowSaveDialog(false);
      
      // Show success notification
      showNotification('success', `"${newDrawing.name}" saved successfully!`, '');
    } catch (error) {
      console.error('Failed to save drawing:', error);
      showNotification('error', 'Failed to save drawing. Please try again.', '');
    }
  };

  const loadDrawing = async (drawing: SavedDrawing) => {
    if (!canvasRef.current) return;
    
    try {
      const paths = JSON.parse(drawing.data);
      await canvasRef.current.loadPaths(paths);
      setShowLoadDialog(false);
      
      // Show success notification
      showNotification('success', `"${drawing.name}" loaded successfully!`, '');
    } catch (error) {
      console.error('Failed to load drawing:', error);
      showNotification('error', 'Failed to load drawing. Please try again.', '');
    }
  };

  const deleteDrawing = (drawingId: string) => {
    const drawingToDelete = savedDrawings.find(d => d.id === drawingId);
    const updatedDrawings = savedDrawings.filter(d => d.id !== drawingId);
    setSavedDrawings(updatedDrawings);
    localStorage.setItem('canvas-drawings', JSON.stringify(updatedDrawings));
    
    if (drawingToDelete) {
      showNotification('info', `"${drawingToDelete.name}" deleted`, '');
    }
  };

  const exportAsImage = async () => {
    if (!canvasRef.current) return;
    
    try {
      const imageData = await canvasRef.current.exportImage("png");
      const link = document.createElement('a');
      link.download = `canvas-drawing-${Date.now()}.png`;
      link.href = imageData;
      link.click();
      
      // Show success notification
      showNotification('success', 'Image exported successfully!', '');
    } catch (error) {
      console.error('Failed to export image:', error);
      showNotification('error', 'Failed to export image. Please try again.', '');
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center w-full max-w-6xl mx-auto px-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* Controls Container */}
      <motion.div 
        className="mb-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm shadow-xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
          {/* Color Picker */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <span className="text-sm font-medium text-purple-300">Color:</span>
            <div className="relative">
              <motion.input
                type="color"
                value={strokeColor}
                onChange={e => setStrokeColor(e.target.value)}
                disabled={eraserMode}
                className="w-10 h-10 rounded-lg border-2 border-purple-400/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            </div>
          </motion.div>

          {/* Brush Size */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <span className="text-sm font-medium text-purple-300">Size:</span>
            <input
              type="range"
              min={1}
              max={20}
              value={strokeWidth}
              onChange={e => setStrokeWidth(Number(e.target.value))}
              className="w-20 sm:w-24 accent-purple-500"
            />
            <span className="text-sm text-gray-300 min-w-[35px] font-mono">{strokeWidth}px</span>
          </motion.div>

          {/* Eraser Toggle */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={eraserMode}
                onChange={e => handleEraserToggle(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-purple-300">Eraser</span>
            </label>
          </motion.div>

          {/* Clear All Button */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <motion.button
              onClick={clearCanvas}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All
            </motion.button>
          </motion.div>

          {/* Save Button */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            <motion.button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Save
            </motion.button>
          </motion.div>

          {/* Load Button */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            <motion.button
              onClick={() => setShowLoadDialog(true)}
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Load
            </motion.button>
          </motion.div>

          {/* Export Button */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            <motion.button
              onClick={exportAsImage}
              className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Export PNG
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Canvas Container */}
      <motion.div 
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div style={{ width: "100%", aspectRatio: "4/3" }}>
            <ReactSketchCanvas
              ref={canvasRef}
              style={{
                ...canvasStyles,
                width: "100%",
                height: "100%"
              }}
              strokeWidth={strokeWidth}
              strokeColor={strokeColor}
              canvasColor="transparent"
              backgroundImage=""
              preserveBackgroundImageAspectRatio="none"
              allowOnlyPointerType="all"
            />
          </div>
        </div>
      </motion.div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            className="bg-slate-800 border border-purple-500/20 rounded-xl p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-purple-300 mb-4">Save Drawing</h3>
            <input
              type="text"
              value={currentDrawingName}
              onChange={(e) => setCurrentDrawingName(e.target.value)}
              placeholder="Enter drawing name..."
              className="w-full px-4 py-2 bg-slate-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentDrawingName.trim()) {
                  saveDrawing();
                }
                if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                  setCurrentDrawingName("");
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setCurrentDrawingName("");
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDrawing}
                disabled={!currentDrawingName.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            className="bg-slate-800 border border-purple-500/20 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-purple-300 mb-4">Load Drawing</h3>
            
            {savedDrawings.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No saved drawings found.</p>
                <p className="text-sm mt-2">Save your first drawing to see it here!</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {savedDrawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-purple-500/20 hover:bg-slate-600/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{drawing.name}</h4>
                      <p className="text-sm text-gray-400">
                        Saved on {new Date(drawing.timestamp).toLocaleDateString()} at{' '}
                        {new Date(drawing.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => loadDrawing(drawing)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${drawing.name}"?`)) {
                            deleteDrawing(drawing.id);
                          }
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Creative Floating Notifications with Enhanced Glassmorphism */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              duration: 0.4 
            }}
            className={`
              relative overflow-hidden rounded-2xl p-5 max-w-sm
              backdrop-blur-xl bg-white/10 
              border border-white/20 
              shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
              ${notification.type === 'success' 
                ? 'shadow-emerald-500/20' 
                : notification.type === 'error'
                ? 'shadow-red-500/20'
                : 'shadow-blue-500/20'
              }
            `}
            style={{
              background: notification.type === 'success' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)'
                : notification.type === 'error'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)'
            }}
          >
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />
            
            {/* Animated shimmer overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: [-100, 400] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: "linear" 
              }}
            />
            
            {/* Content */}
            <div className="relative flex items-center gap-4">
              {/* Visual indicator instead of emoji */}
              <motion.div 
                className={`
                  flex items-center justify-center w-12 h-12 rounded-full
                  backdrop-blur-md border border-white/30
                  ${notification.type === 'success' 
                    ? 'bg-emerald-400/20' 
                    : notification.type === 'error'
                    ? 'bg-red-400/20'
                    : 'bg-blue-400/20'
                  }
                `}
                animate={{ 
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.8,
                  repeat: notification.type === 'success' ? 1 : 0
                }}
              >
                {/* SVG icons instead of emojis */}
                {notification.type === 'success' && (
                  <svg className="w-6 h-6 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="w-6 h-6 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </motion.div>
              
              {/* Message with glass styling */}
              <div className="flex-1">
                <p className="font-medium text-white/90 text-sm leading-relaxed drop-shadow-sm">
                  {notification.message}
                </p>
              </div>
              
              {/* Close button with glass effect */}
              <motion.button
                onClick={() => removeNotification(notification.id)}
                className="
                  flex items-center justify-center w-8 h-8 rounded-full
                  backdrop-blur-md bg-white/10 border border-white/20
                  text-white/70 hover:text-white hover:bg-white/20 
                  transition-all duration-200
                "
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
            
            {/* Glass progress bar for auto-dismiss */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 backdrop-blur-sm">
              <motion.div
                className={`
                  h-full backdrop-blur-sm
                  ${notification.type === 'success' 
                    ? 'bg-gradient-to-r from-emerald-400/80 to-emerald-300/60' 
                    : notification.type === 'error'
                    ? 'bg-gradient-to-r from-red-400/80 to-red-300/60'
                    : 'bg-gradient-to-r from-blue-400/80 to-blue-300/60'
                  }
                `}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProjectCenterCanvas;
