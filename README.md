# envwatch

> Lightweight utility that monitors `.env` file changes and auto-restarts Node.js dev servers without manual intervention.

---

## Installation

```bash
npm install --save-dev envwatch
```

Or install globally:

```bash
npm install -g envwatch
```

---

## Usage

Replace your usual `node` start command with `envwatch`:

```bash
envwatch node server.js
```

Or add it to your `package.json` scripts:

```json
"scripts": {
  "dev": "envwatch node server.js"
}
```

Then run:

```bash
npm run dev
```

envwatch will watch your `.env` file in the project root. Any time a change is detected, it automatically restarts your server so the updated environment variables are picked up — no manual restarts needed.

### Options

| Flag | Description |
|------|-------------|
| `--file` | Path to a custom env file (default: `.env`) |
| `--delay` | Restart delay in ms (default: `500`) |

```bash
envwatch --file .env.local --delay 300 node server.js
```

---

## Requirements

- Node.js `>=14.0.0`

---

## License

[MIT](LICENSE)