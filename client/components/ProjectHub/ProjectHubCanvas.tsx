import React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const canvasStyles = {
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginBottom: "20px",
};

const ProjectHubCanvas: React.FC = () => {
  return (
    <ReactSketchCanvas
      style={canvasStyles}
      width="600px"
      height="400px"
      strokeWidth={2}
      strokeColor="black"
    />
  );
};

export default ProjectHubCanvas;
