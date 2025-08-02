import React, { useState } from "react";
// import ProjectHubCanvas from "./ProjectHubCanvas";

const ProjectHub: React.FC = () => {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      minHeight: "100vh",
      width: "100%",
      padding: "20px 0"
    }}>
      <h2 style={{ 
        marginBottom: "20px", 
        fontSize: "clamp(1.5rem, 4vw, 2rem)",
        textAlign: "center",
        color: "#fff"
      }}>Draw and Type Your Ideas</h2>
      {/* <ProjectHubCanvas /> */}
      <p style={{ color: "#fff", textAlign: "center" }}>
        Canvas component will be added when ProjectHubCanvas.tsx is available
      </p>
    </div>
  );
};

export default ProjectHub;
