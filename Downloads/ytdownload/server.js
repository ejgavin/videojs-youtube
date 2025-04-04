// server.js
const express = require("express");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to get the video URL from yt-dlp
app.get("/get-video-url", (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: "No URL provided" });
    }

    // Execute yt-dlp to fetch the video URL
    exec(`yt-dlp --get-url "${videoUrl}"`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ videoUrl: stdout.trim() });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
