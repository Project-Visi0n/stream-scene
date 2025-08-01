import React, { useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const canvasStyles = {
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginBottom: "20px",
};


const ProjectHubCanvas: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [eraserMode, setEraserMode] = useState<boolean>(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          Color:
          <input
            type="color"
            value={strokeColor}
            onChange={e => setStrokeColor(e.target.value)}
            disabled={eraserMode}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          Size:
          <input
            type="range"
            min={1}
            max={20}
            value={strokeWidth}
            onChange={e => setStrokeWidth(Number(e.target.value))}
          />
          <span>{strokeWidth}px</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="checkbox"
            checked={eraserMode}
            onChange={e => setEraserMode(e.target.checked)}
          />
          Eraser
        </label>
      </div>
      <ReactSketchCanvas
        style={canvasStyles}
        width="600px"
        height="400px"
        strokeWidth={strokeWidth}
        strokeColor={eraserMode ? "#fff" : strokeColor}
      />
    </div>
  );
};

export default ProjectHubCanvas;
