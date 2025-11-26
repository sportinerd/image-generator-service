# Image Generation Service

A Node.js service that generates images from HTML templates and JSON data, then uploads them to DigitalOcean Spaces. Built with TypeScript, Express, Puppeteer, and MongoDB.

## Features

- 🎨 Generate images from HTML templates with dynamic data
- 🚀 Concurrent request handling with browser pooling (no blocking)
- 🔒 Protected API routes with authentication
- ☁️ Automatic upload to DigitalOcean Spaces
- 📊 MongoDB tracking of generated images
- 🔄 Graceful shutdown and resource cleanup
- 📝 TypeScript for type safety

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- DigitalOcean Spaces account (or S3-compatible storage)

## Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your configuration:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/image-service
   
   # Authentication
   AUTH_KEY=your-secret-auth-key-here
   
   # DigitalOcean Spaces
   DO_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
   DO_SPACES_REGION=sgp1
   DO_SPACES_BUCKET=your-bucket-name
   DO_SPACES_ACCESS_KEY=your-access-key
   DO_SPACES_SECRET_KEY=your-secret-key
   DO_SPACES_CDN_ENDPOINT=https://your-bucket-name.sgp1.cdn.digitaloceanspaces.com
   
   # Image Generation
   IMAGE_WIDTH=1200
   IMAGE_HEIGHT=630
   BROWSER_POOL_SIZE=3
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

All endpoints require authentication via `auth_key` header or query parameter.

### 1. Generate Image

**POST** `/api/images/generate`

**Headers:**
```
Content-Type: application/json
auth_key: your-secret-auth-key-here
```

**Request Body:**
```json
{
  "id": 4,
  "type": "goal_mancity",
  "title": "GOAL! Man City Vs ARS",
  "gw": "7",
  "data": {
    "home_team": {
      "name": "Manchester City",
      "logo": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
      "short_name": "MCI"
    },
    "away_team": {
      "name": "Arsenal",
      "logo": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
      "short_name": "ARS"
    },
    "team_win": "Manchester City",
    "club_name": "Premier League",
    "club_logo": "https://brandlogos.net/wp-content/uploads/2021/10/Premier-League-logo-symbol.png",
    "goals": 1,
    "scorers": [
      {
        "name": "K. De Bruyne",
        "minute": 34,
        "type": "Left Foot"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://your-bucket.sgp1.cdn.digitaloceanspaces.com/images/1234567890-goal_mancity-4.png",
  "imageKey": "images/1234567890-goal_mancity-4.png",
  "message": "Image generated and uploaded successfully"
}
```

### 2. Delete Image

**DELETE** `/api/images/:imageKey`

**Headers:**
```
auth_key: your-secret-auth-key-here
```

**Example:**
```
DELETE /api/images/images/1234567890-goal_mancity-4.png
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### 3. List Images (Debug)

**GET** `/api/images`

**Headers:**
```
auth_key: your-secret-auth-key-here
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "images": [...]
}
```

### 4. Health Check

**GET** `/health`

No authentication required.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-26T15:24:26.000Z"
}
```

## Testing with cURL

### Generate Image
```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -H "auth_key: your-secret-auth-key-here" \
  -d @data.json
```

### Delete Image
```bash
curl -X DELETE "http://localhost:3000/api/images/images/1234567890-goal_mancity-4.png" \
  -H "auth_key: your-secret-auth-key-here"
```

## Architecture

### Browser Pooling
The service uses a pool of Puppeteer browser instances to handle concurrent requests without blocking. The pool size is configurable via `BROWSER_POOL_SIZE` environment variable.

### Template System
HTML templates are located in `src/templates/`. Data is injected into templates using placeholder replacement before rendering.

### Storage
Images are uploaded to DigitalOcean Spaces (S3-compatible) with public-read ACL. URLs can be served via CDN endpoint if configured.

### Database
MongoDB stores metadata about generated images including:
- Image key and URL
- Type and metadata
- Auto-deletion after 30 days (configurable)

## Project Structure

```
image-generate-service/
├── src/
│   ├── config/
│   │   ├── database.ts          # MongoDB connection
│   │   └── spaces.ts            # DigitalOcean Spaces client
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── models/
│   │   └── Image.ts             # Image tracking model
│   ├── services/
│   │   ├── imageGenerator.ts   # Puppeteer image generation
│   │   └── storageService.ts   # Storage operations
│   ├── routes/
│   │   └── image.routes.ts     # Image routes
│   ├── templates/
│   │   └── goal.html           # HTML template
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── utils/
│   │   └── logger.ts           # Logging utility
│   └── server.ts               # Express server
├── data.json                    # Example data
├── image.html                   # Original React template
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Performance

- **Concurrent Requests**: Handles multiple simultaneous requests using browser pooling
- **Template Caching**: Templates are cached in memory after first load
- **Resource Management**: Automatic cleanup of browser instances and database connections

## Security

- API key authentication on all routes
- Environment-based configuration
- No sensitive data in logs
- CORS enabled (configure as needed)

## Troubleshooting

### Puppeteer Issues
If Puppeteer fails to launch, ensure you have the required dependencies:

**Ubuntu/Debian:**
```bash
sudo apt-get install -y chromium-browser
```

**macOS:**
```bash
brew install chromium
```

### MongoDB Connection
Ensure MongoDB is running and the connection string is correct in `.env`.

### DigitalOcean Spaces
Verify your Spaces credentials and bucket name. Ensure the bucket has public-read permissions for uploaded objects.

## License

ISC
