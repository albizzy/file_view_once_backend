const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

// Enable CORS for all routes
app.use(cors());

// ensure directory for uploads exists
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

// keep track of views in-memory
const viewOnceMetadata = {};

app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if(!file) {
        return res.status(400).send('No file uploaded');
    };

    viewOnceMetadata[file.filename] = {
        viewsRemaining: 1,
        originalName: file.filename,
        filepath: file.path,
    }

    res.status(200).send(file.filename)
});

app.get('/view:filename', (req, res) => {
    const { filename } = req.params;
    const metadata = viewOnceMetadata[filename];

    if(!metadata || metadata.viewsRemaining <= 0) {
        return res.status(404).send('No file found or already viewed');
    }

    metadata.viewsRemaining -= 1;

    if(metadata.viewsRemaining <= 0) {
        fs.unlink(metadata.filepath, err => {
            if (err) console.error(err);
            delete viewOnceMetadata[filename];
        })
    }

    res.sendFile(path.resolve(metadata.filepath), err => {
        if (err) {
            res.status(500).send('Error sending file');
        }
    });
});

app.listen(5001, () => {
    console.log('server running on port 5001');
})

