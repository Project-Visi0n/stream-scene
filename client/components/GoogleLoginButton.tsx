import React from 'react';

const GoogleLoginButton: React.FC = () => {
  const handleGoogleLogin = (): void => {
    // Redirect to the backend Google OAuth route
    window.location.href = 'http://localhost:8000/auth/google';
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;