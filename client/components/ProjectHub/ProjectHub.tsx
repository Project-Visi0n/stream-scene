
import React, { useState } from "react";
import ProjectHubCanvas from "./ProjectHubCanvas";


const ProjectHub: React.FC = () => {

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>Draw and Type Your Ideas</h2>
      <ProjectHubCanvas />
      {/* Canvas only, text boxes removed as requested */}
    </div>
  );
};

export default ProjectHub;
