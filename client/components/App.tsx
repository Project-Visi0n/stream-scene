import React, { useState } from 'react';
import GoogleLoginButton from './GoogleLoginButton';
import StreamSceneTodoList from './StreamSceneTodoList';

const App: React.FC = () => {
  const [showTasks, setShowTasks] = useState(false);

  return (
    <div className="App text-white bg-black min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-2">Stream Scene</h1>
      <p className="text-lg">Lights Camera Action!!</p>
      <p className="mb-4">By: Jasmine and Bradley</p>

      <button
        onClick={() => setShowTasks(!showTasks)}
        className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded mb-6"
      >
        {showTasks ? 'Back to Login' : 'Show Task Form'}
      </button>

      {showTasks ? <StreamSceneTodoList /> : <GoogleLoginButton />}
    </div>
  );
};

export default App;
