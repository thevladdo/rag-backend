const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
const CONFIG = require('./config');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

// ---------------------------- 
//  Parsing functions
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
//  Choose the right parser based on file extension
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
        console.log(`Processing document: ${filePath}`);
        const text = await parseDocument(filePath);
        const chunks = chunkText(text);
        const fileId = path.basename(filePath, path.extname(filePath));
        await embedAndUploadChunks(fileId, chunks);
        console.log(`✅ Document "${filePath}" uploaded successfully.`);
    } catch (err) {
        console.error(`❌ Error processing document: ${err.message}`);
    }
}

async function uploadMultipleDocuments(filePaths) {
    await Promise.all(filePaths.map(uploadDocument));
    console.log(`✅ All documents processed.`);
}

module.exports = { uploadDocument, uploadMultipleDocuments };
