# main.py - Refactored for Gemini API and Railway Deployment

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from typing import List

# --- Configuration & Setup ---

# Load environment variables from .env file for local development
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Pocket Professor API",
    description="Generates structured learning curricula using the Google Gemini API.",
    version="1.1.0"
)

# Configure CORS to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pakfro.dev", "https://*.pakfro.dev", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure the Gemini API client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable not set.")
genai.configure(api_key=GEMINI_API_KEY)


# --- Pydantic Models (Our Structured Data Contract) ---

class CurriculumRequest(BaseModel):
    subject: str
    skill_level: str
    learning_goal: str
    time_commitment: str

class WeeklyModule(BaseModel):
    week: int
    title: str
    topics: List[str]
    estimated_hours: float
    resources: List[str]

class CurriculumResponse(BaseModel):
    subject: str
    total_weeks: int
    modules: List[WeeklyModule]
    prerequisites: List[str]
    recommended_resources: List[str]


# --- API Endpoints ---

@app.get("/", tags=["Status"])
async def root():
    """Health check endpoint to confirm the API is running."""
    return {"message": "Pocket Professor API is running!", "status": "healthy"}

async def call_gemini_api(prompt: str) -> str:
    """
    Calls the Gemini API to generate content.
    Uses JSON mode for reliable, structured output.
    """
    try:
        # Using a model that supports JSON mode and is efficient.
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.7
            )
        )
        return response.text
    except Exception as e:
        # Broad exception to catch potential API errors
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=502, detail=f"Error communicating with Gemini API: {str(e)}")


@app.post("/generate-curriculum", response_model=CurriculumResponse, tags=["Curriculum"])
async def generate_curriculum(request: CurriculumRequest):
    """
    The core endpoint that generates a learning curriculum based on user input.
    """
    prompt = f"""
    You are an expert curriculum designer. Your task is to create a structured, practical, and actionable learning path based on the user's request.

    User Request:
    - Subject: {request.subject}
    - Current Skill Level: {request.skill_level}
    - Learning Goal: {request.learning_goal}
    - Time Commitment: {request.time_commitment} per week

    Your response MUST be a valid JSON object that adheres to the following structure. Do not add any extra text, commentary, or markdown formatting like ```json. Return ONLY the raw JSON.

    JSON Structure:
    {{
      "subject": "{request.subject}",
      "total_weeks": <integer, typically between 8 and 16>,
      "modules": [
        {{
          "week": <integer>,
          "title": "<string, descriptive title for the week's module>",
          "topics": ["<string, specific topic>", "<string, another topic>"],
          "estimated_hours": <float, estimated hours for the week>,
          "resources": ["<string, a book, course, or tutorial>", "<string, another resource>"]
        }}
      ],
      "prerequisites": ["<string, prerequisite skill or knowledge>", "<string, another prerequisite>"],
      "recommended_resources": ["<string, general resource for the whole course>", "<string, another general resource>"]
    }}
    """

    try:
        ai_response_text = await call_gemini_api(prompt)
        curriculum_data = json.loads(ai_response_text)
        validated_response = CurriculumResponse(**curriculum_data)
        return validated_response

    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        print(f"Raw AI Response that failed parsing: {ai_response_text}")
        raise HTTPException(status_code=500, detail="Failed to parse the structured response from the AI.")
    except ValidationError as e:
        print(f"Pydantic Validation Error: {e}")
        print(f"Data that failed validation: {curriculum_data}")
        raise HTTPException(status_code=500, detail="AI response did not match the required data structure.")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)