# Project Guide: Image Generation Service

This document provides a comprehensive guide to running, using, and understanding the Image Generation Service.

## 1. Prerequisites

Before running this project, ensure you have the following installed and configured:

### Software
*   **Node.js**: Version 18 or higher (LTS recommended).
*   **npm**: Comes with Node.js.
*   **MongoDB**: An active MongoDB instance (local or Atlas cluster).

### Credentials & Keys
*   **DigitalOcean Spaces (S3 Compatible)**:
    *   Endpoint (e.g., `sgp1.digitaloceanspaces.com`)
    *   Access Key
    *   Secret Key
    *   Bucket Name
*   **MongoDB Connection String**: (e.g., `mongodb+srv://user:pass@cluster...`)

---

## 2. How to Run

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration
Create a `.env` file in the root directory based on `.env.example`:

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

# Puppeteer
BROWSER_POOL_SIZE=3
```

### Running the Application

*   **Development Mode** (with hot-reload):
    ```bash
    npm run dev
    ```

*   **Production Build**:
    ```bash
    npm run build
    npm start
    ```

The server will start on port `3000` (or the port defined in `.env`).

---

## 3. Usage (API Endpoints)

### A. Generate Image
**Endpoint**: `POST /api/images/generate`
**Description**: Generates a social media image for a specific football event (GOAL or OWN_GOAL).

**Headers**:
*   `content-type`: `application/json`
*   `auth_key`: `<your-AUTH_KEY-from-env>`

**Body Parameters**:
*   `event_id` (number): The ID of the event in your database.
*   `fixture_id` (number): The ID of the match fixture.
*   `event_type` (string): Must be `"GOAL"` or `"OWN_GOAL"` (case-insensitive).

**Example Request (cURL)**:
```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -H "auth_key: your-secret-key" \
  -d '{
    "event_id": 12345,
    "fixture_id": 67890,
    "event_type": "GOAL"
  }'
```

**Success Response**:
```json
{
  "success": true,
  "imageUrl": "https://your-bucket.sgp1.digitaloceanspaces.com/social-post-images/goal-12345.png",
  "imageKey": "social-post-images/goal-12345.png",
  "caption": "GOAL! Team A scores!...",
  "message": "Image generated and uploaded successfully"
}
```

### B. Delete Image
**Endpoint**: `DELETE /api/images/:imageKey`
**Description**: Deletes a generated image from DigitalOcean Spaces.

**URL Parameter**:
*   `imageKey`: The relative path/key of the image (e.g., `social-post-images/image.png`).

---

## 4. Entrypoint

The main entry point of the application is **`src/server.ts`**.

When you run `npm run dev` or `npm start`, this file executes. It orchestrates the entire startup sequence:
1.  **Loads Environment Variables**: Uses `dotenv`.
2.  **Initializes Middleware**: Sets up CORS, JSON parsing, and Request Logging.
3.  **Initializes Routes**: Registers `/api/images` and Health Check routes.
4.  **Initializes Error Handling**: Sets up 404 and global 500 error handlers.
5.  **Connects to Database**: Establishes connection to MongoDB.
6.  **Initializes Browser Pool**: Pre-launches Puppeteer instances for speed.
7.  **Starts Server**: UI listens on the specified port.

---

## 5. Code Explanation

### Core Architecture
The project follows a **Controller-Service-Repository** pattern (though explicitly "Service-oriented" here).

### Key Files & Components

1.  **`src/server.ts`**
    *   **Role**: Application Bootstrap.
    *   **Function**: Delegates setup to `serverHelper.ts` and starts the Express server.

2.  **`src/utils/serverHelper.ts`**
    *   **Role**: Server Configuration.
    *   **Function**: Contains modular functions (`initializeMiddleware`, `initializeRoutes`, etc.) to keep `server.ts` clean.

3.  **`src/controllers/image.controller.ts`**
    *   **Role**: Request Handler.
    *   **Function**:
        *   Validates input using `validator.ts`.
        *   Calls `dataService` to get image data.
        *   Calls `captionHelper` to generate text.
        *   Calls `imageProcessingService` to generate & upload the image.
        *   Returns the final JSON response.

4.  **`src/services/data.service.ts`**
    *   **Role**: Data Layer.
    *   **Function**: Uses **raw MongoDB** commands to fetch data. It manually joins data from `fixtures`, `teams`, `leagues`, and `fixtureevents` collections to build a complete `ImageRequest` object.

5.  **`src/services/imageProcessing.service.ts`**
    *   **Role**: Workflow Orchestrator.
    *   **Function**: Combines `imageGenerator` (creation) and `storageService` (upload) into a single logical operation.

6.  **`src/services/imageGenerator.ts`**
    *   **Role**: Image Renderer.
    *   **Function**: Manages a pool of Puppeteer browsers. It takes the data, injects it into an HTML template (`goalTemplate.ts`), renders the page, takes a screenshot, and returns the binary buffer.

7.  **`src/services/storageService.ts`**
    *   **Role**: File Storage.
    *   **Function**: Wraps the AWS S3 SDK to upload/delete files on DigitalOcean Spaces.

8.  **`src/utils/validator.ts`**
    *   **Role**: Input Validation.
    *   **Function**: Ensures `event_id`, `fixture_id` are numbers and `event_type` is valid.

9.  **`src/utils/captionHelper.ts`**
    *   **Role**: Text Generation.
    *   **Function**: specific logic to convert event data into a social media caption string.
