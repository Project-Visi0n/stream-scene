module.exports = {
  apps: [{
    name: 'stream-scene',
    script: 'dist/server/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env.production', // Use production env file
    env: {
      NODE_ENV: 'production', // Changed to production by default
      PORT: 8000,
      HOST: '0.0.0.0',
      ALLOW_DEMO_LOGIN: 'true' // Explicitly enable demo login for presentations
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000,
      HOST: '0.0.0.0',
      ALLOW_DEMO_LOGIN: 'true' // Explicitly enable demo login for presentations
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
