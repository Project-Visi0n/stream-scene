
import React, { useState } from "react";
import ProjectHubCanvas from "./ProjectHubCanvas";


const ProjectHub: React.FC = () => {
  const [texts, setTexts] = useState<string[]>([""]);
  const handleTextChange = (index: number, value: string) => {
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };
  const addTextbox = () => {
    setTexts([...texts, ""]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2>Draw and Type Your Ideas</h2>
      <ProjectHubCanvas />
      <div style={{ width: "600px" }}>
        {texts.map((text, idx) => (
          <textarea
            key={idx}
            value={text}
            onChange={e => handleTextChange(idx, e.target.value)}
            placeholder={`Idea ${idx + 1}`}
            style={{ width: "100%", marginBottom: "10px", minHeight: "40px" }}
          />
        ))}
        <button onClick={addTextbox}>Add Textbox</button>
      </div>
    </div>
  );
};

export default ProjectHub;
