import express from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const PORT = 3091;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const FILE_FORM_NAME = 'File';

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/\s/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
});

const upload = multer({ storage });

app.use('/files', express.static(UPLOAD_DIR));

app.post('/direct', upload.single(FILE_FORM_NAME), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file was uploaded.' });
    }

    const ip = getLocalIpAddress();
    const fileUrl = `http://${ip}:${PORT}/files/${req.file.filename}`;

    console.log(`File received: ${req.file.originalname} -> ${fileUrl}`);

    return res.status(200).json({ uri: fileUrl });
});

app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIpAddress();
    console.log(`
    -------------------------------------------
    Bigfileupload Vencord PLugin Selfhosted
    -------------------------------------------
    URL: http://${ip}:${PORT}

        Bigfileupload Settings:
        -----------------------
      - Request URL: http://${ip}:${PORT}/direct
      - File Form Name: ${FILE_FORM_NAME}
      - Response Type:  JSON
      - URL JSON Path:  uri
        -----------------------
    Watching for uploads...
    -------------------------------------------
    `);
});

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}