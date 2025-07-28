import './styles/tailwind.css';

document.addEventListener('click', () => {
  alert('Quiet on the set!');
});

// Export all your our types from one place
export * from './auth';
// Add more type exports as your app grows
// export * from './streaming';
// export * from './api';