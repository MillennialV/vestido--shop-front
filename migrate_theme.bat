@echo off
cd /d e:\Repos\microservicios_vestidos\api-theme-service
node -e "require('./src/database/migrations').runMigrations().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })"
