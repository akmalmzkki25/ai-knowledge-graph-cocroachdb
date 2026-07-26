import io
from typing import Dict, Any, List
from pypdf import PdfReader

class PDFParsingService:
    @staticmethod
    def clean_null_bytes(text: str) -> str:
        if not text:
            return ""
        return text.replace("\x00", "").strip()

    @classmethod
    def parse_pdf_bytes(cls, pdf_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text:
                    cleaned = cls.clean_null_bytes(text)
                    if cleaned:
                        extracted_pages.append(cleaned)
            except Exception:
                continue
                
        full_text = "\n\n".join(extracted_pages)
        
        title = filename.replace(".pdf", "").replace("_", " ").replace("-", " ").title() if filename else "Untitled Document"
        if extracted_pages:
            first_lines = [line.strip() for line in extracted_pages[0].split("\n") if len(line.strip()) > 5]
            if first_lines:
                title = cls.clean_null_bytes(first_lines[0][:150])
                
        return {
            "title": title,
            "total_pages": len(reader.pages),
            "full_text": full_text,
            "raw_pages": extracted_pages
        }

    @classmethod
    def extract_text_from_pdf(cls, pdf_bytes: bytes) -> str:
        res = cls.parse_pdf_bytes(pdf_bytes)
        return res.get("full_text", "")

    @classmethod
    def create_sliding_window_chunks(cls, full_text: str, chunk_size: int = 4000, overlap: int = 500) -> List[str]:
        cleaned = cls.clean_null_bytes(full_text)
        if len(cleaned) <= chunk_size:
            return [cleaned] if cleaned else []

        chunks = []
        start = 0
        while start < len(cleaned):
            end = start + chunk_size
            chunk = cleaned[start:end]
            chunks.append(chunk)
            start += (chunk_size - overlap)
        return chunks

    @classmethod
    def chunk_text(cls, full_text: str, chunk_size: int = 4000, overlap: int = 500) -> List[str]:
        return cls.create_sliding_window_chunks(full_text, chunk_size=chunk_size, overlap=overlap)

pdf_service = PDFParsingService()
