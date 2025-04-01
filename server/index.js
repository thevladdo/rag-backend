const CONFIG = require('./config');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const { uploadDocument } = require('./embed_and_upload');
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'site')));


// ---------------------------- 
// Setup Pinecone e OpenAI
// ----------------------------  
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);


// ---------------------------- 
// Setup uploads folder
// ----------------------------  
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const clearUploadsFolder = () => {
    const directory = 'uploads/';
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
            });
        }
    });
};


// ---------------------------- 
// Form HTML Upload 
// ----------------------------  
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'site', 'upload.html'));
});


// ---------------------------- 
//  Upload Endpoint
// ----------------------------  
app.post('/api/upload', upload.array('files', CONFIG.upload.maxFiles), async (req, res) => {
    try {
        const filePaths = req.files.map(file => path.resolve(file.path));
        await Promise.all(filePaths.map(uploadDocument));
        clearUploadsFolder();
        res.json({ success: req.files.length, message: "Files uploaded successfully." });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Upload failed." });
    }
});



// ---------------------------- 
// RAG Endpoint 
// ----------------------------  
app.post('/api/rag', async (req, res) => {
    const { query } = req.body;

    try {
        const queryEmbeddingRes = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });

        const queryEmbedding = queryEmbeddingRes.data[0].embedding;

        const retrieved = await index.query({
            vector: queryEmbedding,
            topK: CONFIG.chunk.topK,
            includeMetadata: true,
        });

        const contexts = retrieved.matches.map(m => m.metadata.text).join("\n---\n");

        const prompt = CONFIG.openAi.retrivalPrompt
            .replace('{query}', query)
            .replace('{contexts}', contexts);

        const completion = await openai.chat.completions.create({
            model: CONFIG.openAi.model,
            messages: [{ role: 'user', content: prompt }]
        });

        const answer = completion.choices[0].message.content;
        res.json({ answer });

    } catch (error) {
        console.error("Error during RAG process:", error);
        res.status(500).json({ error: "An error occurred in the RAG process." });
    }
});

const PORT = CONFIG.port || 5000;
app.listen(PORT, () => {
    console.log(`RAG server started on port ${PORT} 🚀`);
    const logStyle = "background: #222; color:rgb(0, 255, 255);";
    console.log(`%chttp://localhost:${PORT}`, logStyle, 'to open the browser.');
});
