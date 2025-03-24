import cv2
import pytesseract
from pydantic import BaseModel
import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
load_dotenv()



class MCQ(BaseModel):
    question: str
    options: list[str]

class MCQResponse(BaseModel):
    mcqs: list[MCQ]

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("Google API Key not found! Set GOOGLE_API_KEY as an environment variable.")

def preprocess_image(image_path):
    """Preprocess the image for better OCR results."""
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    return image



def extract_text_from_image(image_path):
    """Extract text using Tesseract OCR."""
    image = preprocess_image(image_path)
    # text = pytesseract.image_to_string(image, config='--psm 6')
    text = pytesseract.image_to_string(image, config='--psm 6')
    
    return text

def structure_mcqs(text):
    """Use Gemini Chat model to extract structured MCQs from messy OCR text."""
    # print("🔹 OCR Extracted Text:\n", text)  # Debugging: Print raw OCR text

    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", api_key=GOOGLE_API_KEY)

    # ✅ Using PromptTemplate with escaped curly braces
    prompt_template = PromptTemplate(
    input_variables=["text"],
    template = """
        The following text is extracted from an image using OCR. It may contain errors, extra spaces, missing numbers, or inconsistent formatting.
        
        **Your task:**
        - Extract all multiple-choice questions (MCQs) from the text.
        - Each MCQ should have a **clear question** and exactly **four answer choices**.
        - If any answer options are missing, fill them with "NA".
        - Ensure proper formatting and fix minor OCR errors (broken words, missing spaces).
        - Any symbols from physics, math, or chemistry (such as Greek letters, operators, or special characters) should be represented using Unicode escape sequences.

        **IMPORTANT:**  
        - Only return the JSON object.
        - If no MCQs are found, return: {{ "mcqs": [] }}

        **OCR Extracted Text:**  
        ```
        {text}
        ```
    """
)

    structured_chain = llm.with_structured_output(MCQResponse)
    
    # Generate the final formatted prompt
    formatted_prompt = prompt_template.format(text=text)

    response = structured_chain.invoke(formatted_prompt)
    
    print(response.mcqs)
    try:
        return response.mcqs  # ✅ Directly returns a list of MCQs
    except Exception as e:
        print(f"❌ Error parsing structured output: {e}")
        return []


def refine_mcqs(mcqs):
    """Refines a list of MCQs using Gemini-1.5-Flash with structured output & PromptTemplate."""

    if not mcqs:
        return []  # Handle empty list case

    try:
        # Initialize Gemini with structured output
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", api_key=GOOGLE_API_KEY)
        structured_chain = llm.with_structured_output(MCQResponse)

        # Convert MCQ objects to dictionaries properly
        mcq_dicts = [mcq.model_dump() if isinstance(mcq, MCQ) else mcq for mcq in mcqs]

        # 📝 Define PromptTemplate
        prompt = PromptTemplate(
            input_variables=["mcqs"],
            template="""
            You are an expert at refining multiple-choice questions (MCQs). Given the following questions:
            
            {mcqs}

            **Your tasks:**
            - Correct **OCR errors** (fix broken words, spelling mistakes, missing spaces).
            - Improve **grammar, structure, and clarity** while keeping the meaning unchanged.
            - Ensure the question and options are **well-formatted and readable**.
            """
        )

        # Format MCQs using the template
        formatted_mcqs = "\n\n".join(
            f"**Question:** {mcq['question']}\n**Options:** {mcq['options']}"
            for mcq in mcq_dicts
        )

        final_prompt = prompt.format(mcqs=formatted_mcqs)

        # 🔥 Single API call for batch processing
        response = structured_chain.invoke(final_prompt)

        # Convert structured output to a clean JSON-serializable format
        return [mcq.model_dump() for mcq in response.mcqs]  # ✅ Ensures JSON compatibility

    except Exception as e:
        raise RuntimeError(f"Error refining MCQs: {str(e)}")

    
def pipeline(image_path):
    """Main function to process an image and refine extracted MCQs."""
    raw_text = extract_text_from_image(image_path)
    structured_mcqs = structure_mcqs(raw_text)

    if not isinstance(structured_mcqs, list):
        raise ValueError("structured_mcqs() should return a list of MCQs")

    refined_mcqs = refine_mcqs(structured_mcqs)

    result = {"questions": refined_mcqs}
    return result

if __name__ == "__main__":
    pipeline("C:\\Users\\Medkart\\Desktop\\Text Extraction\\image2.jpg")