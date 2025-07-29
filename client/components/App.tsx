import React from 'react';
import GoogleLoginButton from './GoogleLoginButton'; 

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Stream Scene</h1>
      <p>Lights Camera Action!!</p>
      <p>By: Jasmine and Bradley </p>
      <GoogleLoginButton />
    </div>
  );
};

export default App;