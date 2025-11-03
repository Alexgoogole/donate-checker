# Donation Checker

Automated tool to check if a donation link is closed.

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

Send a POST request to check donation status:

```bash
curl -X POST http://localhost:3000/check-donation \
  -H "Content-Type: application/json" \
  -d '{"url": "https://send.monobank.ua/jar/5sPWZLbubU"}'
```

## Response

```json
{
  "donationClosed": true,
  "url": "https://send.monobank.ua/jar/5sPWZLbubU"
}
```

- `donationClosed: true` - The donation is closed (paid-rolling image found)
- `donationClosed: false` - The donation is still open

## API Endpoints

- `POST /check-donation` - Check donation status
- `GET /health` - Health check

