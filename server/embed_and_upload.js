const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);


// ---------------------------- 
//  Parsing funtions
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
        case '.pdf':
            return await parsePDF(filePath);
        case '.docx':
            return await parseDocx(filePath);
        case '.html':
        case '.htm':
            return parseHTML(filePath);
        case '.txt':
            return parseTxt(filePath);
        default:
            throw new Error(`Unsupported format: ${ext}`);
    }
}


// ---------------------------- 
//  Chunking to avoid exceeding the maximum input size of OpenAI
// ----------------------------  
function chunkText(text, chunkSize = 500, overlap = 50) {
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
//  Embedding and upload
//  Each chunk maintains the original fileId as metadata in source field
// ----------------------------  
async function embedAndUploadChunks(fileId, chunks) {
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingRes = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: chunk,
        });

        const embedding = embeddingRes.data[0].embedding;

        await index.upsert([
            {
                id: `${fileId}_chunk_${i}`,
                values: embedding,
                metadata: { text: chunk, source: fileId }
            }
        ]);

        console.log(`✅ Chunk ${i + 1}/${chunks.length} correctly uploaded.`);
    }
}

// ---------------------------- 
//  Main function to upload a document
// ----------------------------  
async function uploadDocument(filePath) {
    try {
        console.log(`Processing document: ${filePath}`);
        const text = await parseDocument(filePath);
        const chunks = chunkText(text);
        const fileId = path.basename(filePath, path.extname(filePath));
        await embedAndUploadChunks(fileId, chunks);
        console.log(`Document "${filePath}" correctly uploaded.`);
    } catch (err) {
        console.error(`❌ Document processing error: ${err.message}`);
    }
}

module.exports = { uploadDocument };
