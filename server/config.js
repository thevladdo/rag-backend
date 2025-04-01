const CONFIG = {
    chunk: {
        topK: 5, // Number of chunks to retrieve from the index
        size: 1000, // Chunk size
        overlap: 100, // Overlap size
        batchSize: 5 // Number of chunks to process in parallel
    },
    openAi: {
        retrivalPrompt: 'Rispondi alla richiesta "{query}" considerando il seguente contesto:\n\n{contexts} ',
        model: 'gpt-4o-mini-2024-07-18',
    },
    upload: {
        maxFiles: 10, // max 10 files per upload
        maxSize: 50 * 1024 * 1024 // 50MB per file
    },
    server: {
        port: 5001,
        uploadDir: 'uploads/',
        cacheTTL: 3600 // time to live for cache
    },
    docling: {
        port: 8000,
        url: 'http://localhost:8000/preprocess/',
    }
};

module.exports = CONFIG;
