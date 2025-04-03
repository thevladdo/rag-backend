# Modular RAG Server with OpenAI, Pinecone, and Docling

<p align="center">
  <img src="https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=fff&style=flat" alt="Express.js" />
  <img src="https://img.shields.io/badge/node.js-339933?style=flat&logo=Node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python" />
  <a href="https://github.com/unclecode/crawl4ai"> <img src="https://raw.githubusercontent.com/unclecode/crawl4ai/main/docs/assets/powered-by-night.svg" alt="Powered by Crawl4AI" width="70"/> </a>
</p>

This repository implements a custom **Retrieval-Augmented Generation (RAG)** server using **Express.js**, **OpenAI**, **Pinecone**, and a dedicated **Docling** microservice for document preprocessing. Its modular architecture gives you complete control over the LLM APIs, allowing you to choose and switch between different models for embedding and generation while using a single vector database for retrieval.

---

## 🚀 Project Overview

### What is RAG?

A **RAG** system answers questions by retrieving the most relevant documents and then using a language model to generate accurate, context-aware responses. The process is divided into two main phases:

1. **Preparation Phase:**
   - **Document Upload & Preprocessing:**  
     Users can upload various document types (PDF, DOCX, HTML, TXT) via the `/api/upload` endpoint. Documents are then sent to the **Docling** microservice, which extracts and structures the text into a JSON format that preserves sections, titles, and paragraphs.
   - **Embedding & Indexing:**  
     The structured text is divided into chunks and converted into numerical embeddings using OpenAI’s `text-embedding-3-small` model. These embeddings are stored in Pinecone for fast retrieval.

2. **Usage Phase:**
   - **Query Processing:**  
     The user’s query is embedded and compared against the indexed document chunks.
   - **Response Generation:**  
     Retrieved contexts are used to create a prompt for an LLM (such as GPT-4 or a specialized model) that generates the final response.

---

## 🛠 Technologies and Modular Architecture

### Core Components

- **Express.js & Node.js:**  
  Handles the API endpoints and orchestrates the processing workflow.
- **OpenAI API:**  
  Provides embedding (using models like `text-embedding-3-small`) and text generation capabilities. The modular design allows you to switch models easily—for example, using GPT-4 for generation or specialized models for other tasks.
- **Pinecone:**  
  A vector database that stores and retrieves embeddings efficiently.
- **Docling Microservice:**  
  Preprocesses uploaded documents and extracts structured text.
- **Crawl4AI:** 
  Handles advanced web scraping from public URLs. Converts webpages into Markdown, then sanitizes and filters the resulting content to ensure only meaningful chunks are embedded into Pinecone.
- **Multer:**  
  Manages file uploads on the server.

### Advantages of Modularity

- **API Flexibility:**  
  You can independently manage the embedding and generation endpoints. This means you can select different OpenAI models based on task requirements (e.g., using a lightweight model for embeddings and a high-capacity model for response generation).
- **Separation of Concerns:**  
  The document processing (handled by Docling), embedding, and vector storage are decoupled from the text generation module. This separation allows you to update or swap out components without overhauling the entire system.
- **Scalability:**  
  The modular architecture makes it easy to add new features or integrate additional services (like real-time TTS or other specialized agents) without disrupting existing workflows.
- **Cost and Resource Optimization:**  
  By tailoring models to specific tasks (e.g., smaller models for embeddings and more advanced ones for generating responses), you can optimize both performance and cost.
- **Specialized Agents:**  
  The system supports the implementation of mini agents or specialized modules that operate on different indices within the DB, enabling highly targeted retrieval and processing (for instance, real-time TTS agents for voice-based applications).

---

## 📂 Project Structure

```
📦 rag-backend
├─📂 docling-microservice
│  ├─ 📄 app.py
│  ├─ 📄 Dockerfile
│  └─ 📄 requirements.txt
├─ 📄 LICENSE
├─ 📄 package-lock.json
├─ 📄 package.json
├─ 📄 README.md
├─ 📂 server
│  ├─ 📄 config.js
│  ├─ 📄 embed_and_upload.js
│  ├─ 📄 index.js
│  └─ 📂 site
│     ├─ 📄 completeUpload.html
│     └─ 📄 upload.html
├─ 📂 uploads
└─ 📂 scripts
    └─📄 htmlToFolder.py
```

---

## ⚙️ How to Start the Project

### 🔑 1. Environment Variables
Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
```

### 📦 2. Install Dependencies

```bash
npm install
```

### ▶️ 3. Start the Server

```bash
npm run start
```
This command will: 
- build and run the Docling microservice (using Docker)
- start the Express server with the upload and RAG endpoints

---

## 📌 Available Endpoints

- `GET /`: provides an HTML form for quick document uploads (local testing).
- `POST /api/upload`: uploads and processes documents using the Docling microservice. The processed, structured text is then embedded using OpenAI’s API and stored in Pinecone.
- `POST /api/rag`: accepts text queries, retrieves relevant document chunks from Pinecone, and generates context-based responses using an OpenAI model.

---

## 🔧 API Call Examples (JavaScript)

### 📂 Document Upload

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/upload', {
    method: 'POST',
    body: formData
})
.then(res => res.json())
.then(data => console.log(data));
```

### 📌 RAG Query Request

```javascript
fetch('/api/rag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: "Your question?" })
})
.then(res => res.json())
.then(data => console.log(data.answer));
```

---

## ✅ Advantages of the Modular Approach

- **Freedom to Choose Different Models**: Manage and switch between different OpenAI models for embedding and generation independently. For example, you can use a lightweight model for embeddings and a more powerful one for generating responses.
- **Separation of Indexing and Generation Processes**: Documents are processed and converted to vectors separately from the generative module, allowing you to update or replace components without rebuilding the entire index.
- **Scalability and Flexibility**: The modular design makes it easy to add new functionalities or integrate additional services (such as real-time TTS agents or specialized mini agents for different DB indices) without disrupting existing workflows.
- **Cost and Resource Optimization**: Tailor models to specific tasks (e.g., smaller models for embeddings and more advanced models for generation) to optimize performance and manage costs effectively.
- **Specialized Agents**: Enables the creation of mini agents, each focused on a specific index within the DB, providing highly targeted retrieval and processing. This can be particularly useful for applications such as real-time TTS or domain-specific query handling.

---

## 📚 About Docling

**Docling** is a microservice dedicated to converting complex documents into a structured JSON format.  
- **Key Features:**
  - **Text Extraction:**  
    It automatically extracts text from documents while preserving the original structure.
  - **Structured Output:**  
    The output JSON includes detailed metadata such as section headers, paragraphs, and other text elements.
- **Benefits:**
  - **Context Preservation:**  
    Keeping the document structure intact allows the RAG system to perform more intelligent chunking and weighting during retrieval.
  - **Modularity:**  
    By isolating document preprocessing, you can update or tweak this component without affecting the rest of the system.

---

## 🕸️ About Crawl4AI
**Crawl4AI** is an advanced asynchronous web scraping library built on Playwright. In this project, it is used as a dedicated microservice to extract clean, structured markdown content from web pages.

- **Key Features:**
  - Asynchronous scraping with full support for dynamic JavaScript-rendered websites.

  - Outputs well-structured Markdown for consistent processing.

  - Integrated via a FastAPI endpoint (/crawl/), enabling direct crawling from a user-provided URL.

  - Seamlessly fits into the document ingestion pipeline, alongside PDF, DOCX, and HTML uploads.

- **Smart Content Sanitization:**
To ensure high-quality indexing and retrieval, all crawled content undergoes text cleaning and normalization, including:

  - Removal of excessive line breaks and spacing.

  - Trimming of empty lines and HTML artifacts.

  - Whitespace collapsing to avoid bloated or meaningless text.

- **Chunk Filtering Logic:**
Before embeddings are generated, every chunk is evaluated. We discard chunks that:

  - Are too short or contain only whitespace, newlines, or special characters.

  - **Clean input = smart output**. Lack meaningful semantic content.

  - Duplicate empty or template-based blocks.

This helps keep your vector store clean and relevant, reducing noise and improving query performance.

**License & Attribution**
This project uses Crawl4AI for web data extraction.
It is distributed under the Apache License 2.0, with an attribution clause.

<a href="https://github.com/unclecode/crawl4ai"> <img src="https://img.shields.io/badge/Powered%20by-Crawl4AI-blue?style=flat-square" alt="Powered by Crawl4AI"/> </a>

Please refer to the LICENSE file for full license details and obligations.

---

## 🚩 Final Recommendations
This repository offers a highly flexible and modular solution for building RAG systems, allowing you to:
- Freely manage and switch between different OpenAI models for embedding and generation.
- Maintain a separation between vector storage (Pinecone) and LLM components.
- Easily integrate additional functionalities like real-time TTS or specialized agents for different database indices.
 
By preserving the structured output from Docling, you gain the flexibility to implement advanced retrieval strategies that leverage the document’s inherent hierarchy—leading to more accurate and context-aware responses.
