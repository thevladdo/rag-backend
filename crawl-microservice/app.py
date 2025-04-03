from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from crawl4ai import AsyncWebCrawler
from fastapi.middleware.cors import CORSMiddleware
import traceback

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CrawlRequest(BaseModel):
    urlToScrape: HttpUrl

last_markdown_content = ""

@app.post("/crawl/")
async def crawl_url(request: CrawlRequest):
    global last_markdown_content
    try:
        url = str(request.urlToScrape).strip()
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=url)
            last_markdown_content = str(result.markdown)
            print("Scraped Markdown:\n", last_markdown_content)

        return {
            "message": "Crawling completed successfully",
            "markdown": last_markdown_content
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/last-markdown/")
async def get_last_markdown():
    global last_markdown_content
    if last_markdown_content:
        return {"markdown": last_markdown_content}
    else:
        raise HTTPException(status_code=404, detail="No markdown generated yet")
