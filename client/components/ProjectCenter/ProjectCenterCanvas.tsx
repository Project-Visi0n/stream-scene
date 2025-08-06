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


const ProjectCenterCanvas: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState<string>("#8b5cf6"); // Default to purple
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [eraserMode, setEraserMode] = useState<boolean>(false);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

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
    </motion.div>
  );
};

export default ProjectCenterCanvas;
