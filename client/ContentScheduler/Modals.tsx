// client/ContentScheduler/Modals.tsx
import React from 'react';

// Simple placeholder modals for now
export const CreateProjectModal: React.FC<any> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <div>Create Project Modal - Coming Soon</div>;
};

export const AddContentModal: React.FC<any> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <div>Add Content Modal - Coming Soon</div>;
};

export const AssetPickerModal: React.FC<any> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <div>Asset Picker Modal - Coming Soon</div>;
};