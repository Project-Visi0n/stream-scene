import React, { useState, useRef } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

const canvasStyles = {
  borderRadius: "8px", // Slightly smaller radius than container
  marginBottom: "0px", // Remove margin since it's inside container
  touchAction: "none", // Prevents scrolling while drawing on mobile
  border: "none", // Remove border since container has the border
  background: "rgba(30, 41, 59, 0.8)", // Solid background
};


const ProjectHubCanvas: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [eraserMode, setEraserMode] = useState<boolean>(false);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

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
    <div className="flex flex-col items-center w-full max-w-4xl px-4">
      {/* Controls Container */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm shadow-xl">
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
          {/* Color Picker */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-purple-300">Color:</span>
            <div className="relative">
              <input
                type="color"
                value={strokeColor}
                onChange={e => setStrokeColor(e.target.value)}
                disabled={eraserMode}
                className="w-10 h-10 rounded-lg border-2 border-purple-400/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-3">
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
          </div>

          {/* Eraser Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={eraserMode}
                onChange={e => handleEraserToggle(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-purple-300">Eraser</span>
            </label>
          </div>

          {/* Clear All Button */}
          <div className="flex items-center">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="w-full max-w-3xl">
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
              canvasColor="#1e293b"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHubCanvas;
