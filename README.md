# Retrieval-Augmented Generation server with Pinecone and OpenAI 

This project implements a custom **Retrieval-Augmented Generation (RAG)** server, integrating **Express.js**, **OpenAI**, and **Pinecone**.

---

## 🚀 Project Overview

### What is RAG?

A **RAG** system answers questions using uploaded documents, automatically retrieving the most relevant content to generate accurate and context-aware responses via AI models.

### 📌 Implemented Workflow:

**① Preparation Phase:**
- Upload documents (`PDF`, `DOCX`, `HTML`, `TXT`) via the `/api/upload` endpoint.
- Automatically split text into chunks.
- Generate numerical embeddings using OpenAI (`text-embedding-ada-002`).
- Store embeddings in Pinecone for fast retrieval.

**② Usage Phase:**
- Receive text-based questions via the `/api/rag` endpoint.
- Convert the query into embeddings using OpenAI.
- Search for similar embeddings in Pinecone.
- Generate a response via OpenAI, using retrieved chunks as context.
- Send the response to the frontend.

---

## 🛠 Technologies

- **Node.js & Express.js** for the server
- **OpenAI** API for embeddings and text generation
- **Pinecone** for the vector database
- **Multer** for file uploads

---

## 📂 Project Structure

```
📦 rag-backend
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
└─ 📂 uploads
```

---

## ⚙️ How to Start the Project

### 🔑 Environment Variables Configuration
Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
```

### 📦 Install Dependencies

```bash
npm install
```

### ▶️ Start the Server

```bash
npm run start
```

---

## 📌 Available Endpoints

- `GET /`: HTML form for quick uploads (local testing)
- `POST /api/upload`: Upload and index documents in Pinecone
- `POST /api/rag`: Send queries and receive context-based responses

---

## 🔧 API Call Examples (JavaScript)

### 📂 File Upload 

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

## ✅ Advantages 

- **Full Customization**: Complete control over the process.
- **Higher Performance**: Lightweight solution with no overhead.
- **Easily Scalable**: Agile and modular code.
- **Cost Control**: Optimal management of used resources.

---

## 🚩 Final Recommendations
- Upload various document types to test robustness and accuracy.
- Performance and response quality may depend on the number of indexed documents, query complexity, and model accuracy.

