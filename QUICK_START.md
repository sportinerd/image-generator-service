# Image Generation Service - Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

## 📝 Environment Variables

```env
# Required
PORT=3000
MONGODB_URI=mongodb://localhost:27017/image-service
AUTH_KEY=your-secret-key

# Optional (for DigitalOcean Spaces)
DO_SPACES_BUCKET=your-bucket
DO_SPACES_ACCESS_KEY=your-key
DO_SPACES_SECRET_KEY=your-secret
```

## 🔑 API Endpoints

### Test Endpoint (No Auth)
```bash
# Generate image locally
curl -X POST http://localhost:3000/api/test/test-generate \
  -H "Content-Type: application/json" \
  -d @data.json
```

### Production Endpoints (Requires Auth)
```bash
# Generate and upload to Spaces
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -H "auth_key: your-secret-key" \
  -d @data.json

# Delete image
curl -X DELETE http://localhost:3000/api/images/images/filename.png \
  -H "auth_key: your-secret-key"

# List images
curl http://localhost:3000/api/images \
  -H "auth_key: your-secret-key"
```

## 📊 Data Format

```json
{
  "id": 4,
  "type": "goal_mancity",
  "title": "GOAL! Man City Vs ARS",
  "gw": "7",
  "data": {
    "home_team": {
      "name": "Manchester City",
      "logo": "https://...",
      "short_name": "MCI"
    },
    "away_team": {
      "name": "Arsenal",
      "logo": "https://...",
      "short_name": "ARS"
    },
    "team_win": "Manchester City",
    "club_name": "Premier League",
    "club_logo": "https://...",
    "goals": 1,
    "scorers": [...]
  }
}
```

## 🧪 Testing

```bash
# Run concurrent test
./test-concurrent.sh

# Check generated images
ls -lh output/
```

## 🔧 Configuration

- **Browser Pool Size:** Set `BROWSER_POOL_SIZE` (default: 3)
- **Image Dimensions:** Set `IMAGE_WIDTH` and `IMAGE_HEIGHT` (default: 1200x630)
- **MongoDB:** Update `MONGODB_URI` for your database
- **Auth Key:** Change `AUTH_KEY` to a secure random string

## 📁 Output

- **Local Testing:** Images saved to `output/` directory
- **Production:** Images uploaded to DigitalOcean Spaces

## 🛠️ Troubleshooting

### Server won't start
- Check MongoDB is running
- Verify .env file exists and is configured

### Image generation fails
- Check browser pool initialization in logs
- Verify template exists in `src/templates/`

### Upload fails
- Verify DigitalOcean Spaces credentials
- Check bucket permissions (public-read)

## 📚 Documentation

- Full documentation: [README.md](file:///Users/mdtaijulislam/Projects/test/image-generate-service/README.md)
- Implementation walkthrough: See walkthrough.md artifact
