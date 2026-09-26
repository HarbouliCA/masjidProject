// PM2 process config for the Next.js standalone server (Hostinger VPS).
// Usage:
//   npm run build
//   npm run deploy:copy     (copies public + .next/static into .next/standalone)
//   pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "masjid-nour",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
