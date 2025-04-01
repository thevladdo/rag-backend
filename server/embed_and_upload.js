const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
const CONFIG = require('./config');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

// ---------------------------- 
//  Parsing functions ---- deprecated
//  Use Docling instead
// ----------------------------  
async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

async function parseDocx(filePath) {
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value;
}

function parseHTML(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(data);
    return $('body').text();
}

function parseTxt(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}


// ---------------------------- 
//  Choose the right parser based on file extension ---- deprecated
//  Use Docling instead
// ----------------------------  
async function parseDocument(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.pdf': return await parsePDF(filePath);
        case '.docx': return await parseDocx(filePath);
        case '.htm':
        case '.html': return parseHTML(filePath);
        case '.txt': return parseTxt(filePath);
        default: throw new Error(`Unsupported format: ${ext}`);
    }
}


// ----------------------------
//  Parsing document in Docling preprocessor
//  This function sends the document to the Docling microservice for parsing
// ---------------------------- 
async function parseDocumentDoclingMS(filePath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    try {
        const response = await axios.post('http://localhost:8000/preprocess/', formData, {
            headers: formData.getHeaders()
        });
        if (response.data.error) throw new Error(response.data.error);
        return extractTextFromDoclingOutput(response.data);
    } catch (error) {
        console.error("Error durting MS processing:", error);
        throw error;
    }
}


// ----------------------------
//  Function to convert JSON output from Docling to plain text
// ----------------------------  
function extractTextFromDoclingOutput(parsedJson) {
    if (parsedJson.texts && Array.isArray(parsedJson.texts)) {
        return parsedJson.texts.map(item => item.text).join(" ");
    }
    throw new Error("Docling output does not contain a 'texts' array");
}


// ---------------------------- 
//  Chunking Optimization
// ----------------------------  
function chunkText(text, chunkSize = CONFIG.chunk.size, overlap = CONFIG.chunk.overlap) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.substring(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}


// ----------------------------
//  Batch Embedding and Upload
//  Each chunk maintains the original fileId as metadata in source field
// ----------------------------
async function embedAndUploadChunks(fileId, chunks) {
    for (let i = 0; i < chunks.length; i += CONFIG.chunk.batchSize) {
        const batch = chunks.slice(i, i + CONFIG.chunk.batchSize);
        const embeddingsRes = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: batch,
        });

        const vectors = embeddingsRes.data.map((res, index) => ({
            id: `${fileId}_chunk_${i + index}`,
            values: res.embedding,
            metadata: { text: batch[index], source: fileId }
        }));

        await index.upsert(vectors);
        console.log(`✅ Uploaded batch ${i / CONFIG.chunk.batchSize + 1}/${Math.ceil(chunks.length / CONFIG.chunk.batchSize)}`);
    }
}


// ---------------------------- 
//  Upload Document
// ----------------------------  
async function uploadDocument(filePath) {
    try {
        console.log(`📑 Processing document via Docling Microservice: ${filePath}`);
        const text = await parseDocumentDoclingMS(filePath);
        const chunks = chunkText(text);
        const fileId = path.basename(filePath, path.extname(filePath));
        await embedAndUploadChunks(fileId, chunks);
        console.log(`✅ Document "${filePath}" processed and uploaded successfully.`);

    } catch (err) {
        console.error(`❌ Error processing document: ${err.message}`);
    }
}

async function uploadMultipleDocuments(filePaths) {
    await Promise.all(filePaths.map(uploadDocument));
    console.log(`✅ All documents processed.`);
}

module.exports = { uploadDocument, uploadMultipleDocuments };
