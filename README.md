# Image Generation Service

A microservice for generating dynamic social media images for football events (Goals, Own Goals) using Puppeteer and retrieving data directly from MongoDB. Generated images are uploaded to DigitalOcean Spaces.

## Features

- **Dynamic Image Generation**: Creates images on-the-fly based on event data.
- **Data Fetching**: Connects directly to MongoDB to fetch Fixtures, Teams, Leagues, and Events.
- **Browser Pooling**: Uses a robust Puppeteer browser pool for efficient performance and auto-recovery.
- **S3 Upload**: Uploads generated images to DigitalOcean Spaces.
- **Stateless Operation**: Does not store image metadata in the local database; purely transactional.

## Prerequisites

- Node.js (v18+)
- MongoDB Instance
- DigitalOcean Spaces Config (Key, Secret, Endpoint)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://...
   
   # Security
   AUTH_KEY=your-secret-key
   
   # DigitalOcean Spaces
   DO_SPACES_ENDPOINT=sgp1.digitaloceanspaces.com
   DO_SPACES_KEY=your-key
   DO_SPACES_SECRET=your-secret
   DO_SPACES_BUCKET=your-bucket
   
   # Image Dimensions
   IMAGE_WIDTH=900
   IMAGE_HEIGHT=900
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## API Endpoints

### 1. Generate Image
**POST** `/api/images/generate`

Generates an image if the event type is `GOAL` or `OWN_GOAL`.

**Headers:**
- `Content-Type: application/json`
- `auth_key: <your-auth-key>`

**Body:**
```json
{
  "event_id": 12345,
  "event_type": "GOAL",
  "fixture_id": 67890
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://your-bucket.sgp1.digitaloceanspaces.com/social-post-images/...",
  "imageKey": "social-post-images/...",
  "caption": "GOAL! Team A vs Team B...",
  "message": "Image generated and uploaded successfully"
}
```

### 2. Delete Image
**DELETE** `/api/images/:imageKey`

Deletes an image from DigitalOcean Spaces.

**Headers:**
- `auth_key: <your-auth-key>`

**URL Parameter:**
- `imageKey`: The key returned during generation (e.g., `social-post-images/filename.png`).

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Architecture

- **Controller (`src/controllers`)**: Handles API requests and validation.
- **Data Service (`src/services/data.service.ts`)**: Performs raw MongoDB queries to fetch and aggregate data (Fixture -> Teams, League -> Event).
- **Image Generator (`src/services/imageGenerator.ts`)**: Manages Puppeteer browser pool and renders the HTML template.
- **Storage Service (`src/services/storageService.ts`)**: Handles S3/Spaces uploads and deletions.
- **Templates (`src/templates`)**: TypeScript-based HTML/Tailwind generator.

## Development

- **Run Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Start Production**: `npm start`
