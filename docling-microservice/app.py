from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import shutil, os
from docling.document_converter import DocumentConverter

app = FastAPI()
converter = DocumentConverter()

"""
Recursively extract text from elements and their children.
Each element is expected to have a 'label' and 'text' attribute.
"""
def extract_texts(elements):
    texts = []
    for elem in elements: 
        label = getattr(elem, "label", None)
        if hasattr(elem, "text") and elem.text:
            texts.append({
                "label": str(label) if label else "text",
                "text": elem.text
            }) 
        if hasattr(elem, "children") and elem.children:
            texts.extend(extract_texts(elem.children))
    return texts


"""
Endpoint to preprocess a document.
This endpoint accepts a file upload, processes it using the DocumentConverter,
and returns a structured JSON response with the document name, origin, and extracted texts.
"""
@app.post("/preprocess/")
async def preprocess_document(file: UploadFile = File(...)):
    allowed_extensions = ['.pdf', '.docx', '.html', '.txt']
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed_extensions:
        return JSONResponse(content={"error": f"File format not allowed: {file.filename}"}, status_code=500)

    temp_path = f"./temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
 
        if ext == '.txt':
            with open(temp_path, 'r', encoding='utf-8') as txt_file:
                text_content = txt_file.read()

            structured_output = {
                "document_name": file.filename,
                "origin": file.filename,
                "texts": [{"label": "text", "text": text_content}]
            }
        else:
            result = converter.convert(temp_path)
            assembled_elements = []
            if hasattr(result, "assembled") and result.assembled is not None:
                assembled_elements = getattr(result.assembled, "elements", [])

            structured_output = {
                "document_name": getattr(result.document, "name", None) if hasattr(result, "document") else None,
                "origin": getattr(result.document.origin, "filename", None) if hasattr(result, "document") and hasattr(result.document, "origin") else None,
                "texts": extract_texts(assembled_elements)
            }

        return JSONResponse(content=structured_output)
    except Exception as e: 
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        os.remove(temp_path)

