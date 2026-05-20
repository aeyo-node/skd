import os
import sys

def extract_pdf_text(pdf_path, txt_path):
    print(f"Extracting {pdf_path}...")
    try:
        # Try importing pypdf
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- PAGE {i+1} ---\n" + page_text
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Successfully extracted {len(reader.pages)} pages to {txt_path}")
        return True
    except ImportError:
        try:
            # Try PyPDF2 as fallback
            import PyPDF2
            reader = PyPDF2.PdfReader(pdf_path)
            text = ""
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- PAGE {i+1} ---\n" + page_text
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(text)
            print(f"Successfully extracted {len(reader.pages)} pages to {txt_path} using PyPDF2")
            return True
        except ImportError:
            print("Error: Neither 'pypdf' nor 'PyPDF2' is installed. Please run: pip install pypdf")
            return False
    except Exception as e:
        print(f"Failed to extract {pdf_path}: {e}")
        return False

# Run extraction on both files
data_dir = r"c:\Users\chris\Documents\public acc platform\data"
pdf1 = os.path.join(data_dir, "cabinet secretariat.pdf")
txt1 = os.path.join(data_dir, "cabinet_secretariat.txt")
pdf2 = os.path.join(data_dir, "cabinet union ministers.pdf")
txt2 = os.path.join(data_dir, "cabinet_union_ministers.txt")

extracted1 = extract_pdf_text(pdf1, txt1)
extracted2 = extract_pdf_text(pdf2, txt2)

if not extracted1 or not extracted2:
    sys.exit(1)
else:
    print("All extractions complete!")
