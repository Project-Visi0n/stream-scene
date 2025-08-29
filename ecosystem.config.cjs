module.exports = {
  apps: [{
    name: 'stream-scene',
    script: 'dist/server/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '.env', // Use .env file for all environments
    env: {
      NODE_ENV: 'production', // Changed to production by default
      PORT: 8000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
