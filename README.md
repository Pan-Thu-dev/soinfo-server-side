# Discord Profile Fetcher API

This is the server-side of a web application that allows users to retrieve publicly available information about a Discord user from their profile URL.

## Features

- Fetch Discord user profiles by URL
- Extract and display publicly available information
- RESTful API design
- Error handling and validation

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Discord.js

## Setup

1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Create a `.env` file based on `.env.example`
4. Run the development server
```bash
npm run dev
```

## API Endpoints

### Fetch Discord Profile
- **URL**: `/api/profile/discord`
- **Method**: `GET`
- **Query Parameters**: `url` - Discord profile URL
- **Success Response**:
  - Code: 200
  - Content: `{ status: "success", data: { username, avatarUrl, aboutMe, status, activity } }`
- **Error Response**:
  - Code: 400
  - Content: `{ status: "error", message: "Discord profile URL is required" }`

## Development

- Run in development mode:
```bash
npm run dev
```

- Build for production:
```bash
npm run build
```

- Start production server:
```bash
npm start
``` 