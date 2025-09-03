@echo off
echo Setting up Lotus backend...

echo.
echo 1. Generating Prisma client...
npx prisma generate

echo.
echo 2. Running database migrations...
npx prisma migrate dev --name init

echo.
echo 3. Building TypeScript...
npm run build

echo.
echo Setup complete! You can now start the server with:
echo npm run dev