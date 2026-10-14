# Linkat

Organize your links using your Bluesky account.

<img src="./screenshot.png" width="600" />

## Development

To develop locally, ensure you have the following installed:

- Node.js
- Docker

Then, follow these steps to set up and run the project:

```
cp -f .env.example .env
corepack enable pnpm
pnpm install
pnpm dev
```

After running the commands, open [http://localhost:3000](http://localhost:3000) in your browser and log in as `alice.test` with password `password`. All data is removed when the command exits.

## Contributing

Issues and pull requests are welcome!
