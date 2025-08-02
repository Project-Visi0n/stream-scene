declare module 'react-sketch-canvas' {
  import { ComponentType, CSSProperties } from 'react';
  
  interface ReactSketchCanvasProps {
    style?: CSSProperties;
    strokeWidth?: number;
    strokeColor?: string;
    canvasColor?: string;
    allowOnlyPointerType?: string;
    width?: string | number;
    height?: string | number;
  }
  
  const ReactSketchCanvas: ComponentType<ReactSketchCanvasProps>;
  export default ReactSketchCanvas;
}