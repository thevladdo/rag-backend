const CONFIG = {
    chunk: {
        topK: 3, // Number of chunks to retrieve 
    },
    openAi: {
        retrivalPrompt: 'Rispondi alla richiesta "{query}" considerando il seguente contesto:\n\n{contexts} ',
        model: 'gpt-4o-mini-2024-07-18',
    },
    port: 5001,
};

module.exports = CONFIG;