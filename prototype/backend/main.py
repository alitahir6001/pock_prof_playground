# main.py - v1.3.1 - Corrected to use latest Gemini 2.5 models

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError, Field
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv
from typing import List, Optional

# --- Configuration & Setup ---
load_dotenv()
app = FastAPI(
    title="Pocket Professor API",
    description="Generates structured, project-based learning curricula.",
    version="1.3.1"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pakfro.dev", "https://*.pakfro.dev", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
try:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY environment variable not set.")
    genai.configure(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Error configuring Gemini API: {e}")


# --- Pydantic Models ---

class TopicDetail(BaseModel):
    topic_name: str = Field(..., description="A specific concept or skill to be learned.")
    description: str = Field(..., description="A brief, 1-2 sentence explanation of the topic's importance.")
    resources: List[str] = Field(..., description="List of 1-3 specific, high-quality learning resources (articles, docs, videos).")

class WeeklyAssignment(BaseModel):
    title: str = Field(..., description="A clear, actionable title for the weekly assignment.")
    description: str = Field(..., description="A detailed description of the task, what to build, and what success looks like.")
    estimated_hours: float = Field(..., description="Estimated hours to complete the assignment.")

class WeeklyModule(BaseModel):
    week: int
    title: str = Field(..., description="A compelling theme or title for the week's learning.")
    topics: List[TopicDetail] = Field(..., description="A list of detailed topics to cover this week.")
    weekly_project: WeeklyAssignment = Field(..., description="A practical, hands-on project to apply the week's learning.")

class CapstoneProject(BaseModel):
    title: str = Field(..., description="The title of a final, cumulative project that uses all learned skills.")
    description: str = Field(..., description="A comprehensive description of the capstone project.")

class CurriculumResponse(BaseModel):
    subject: str
    total_weeks: int
    prerequisites: List[str]
    introduction: str = Field(..., description="A motivational intro explaining the learning journey and the final outcome.")
    modules: List[WeeklyModule]
    capstone_project: CapstoneProject

class CurriculumRequest(BaseModel):
    subject: str
    skill_level: str
    learning_goal: str
    time_commitment: str


# --- API Endpoints ---

@app.get("/", tags=["Status"])
async def root():
    return {"message": "Pocket Professor API is running!", "status": "healthy"}

@app.post("/generate-curriculum", response_model=CurriculumResponse, tags=["Curriculum"])
async def generate_curriculum(request: CurriculumRequest):
    
    # --- Model Selection Logic ---

    model_choice = os.getenv("GEMINI_MODEL", "flash").lower()
    if model_choice == "pro":
        model_name = 'gemini-2.5-pro'
        print("Using Gemini 2.5 Pro model.")
    else:
        model_name = 'gemini-2.5-flash'
        print("Using Gemini 2.5 Flash model.")

    prompt = f"""
    You are an expert instructional designer and curriculum developer for a world-class academic institution and workforce development center. Your target student is a motivated autodidact and self-learner who is time-poor and needs a clear, actionable, and project-heavy learning path to build confidence and tangible skills in the subject they wish to learn.

    Generate a comprehensive, project-based learning curriculum based on the following request.

    **User Request:**
    - **Subject:** {request.subject}
    - **Current Skill Level:** {request.skill_level}
    - **Learning Goal:** {request.learning_goal}
    - **Time Commitment:** {request.time_commitment} per week

    **Your Task:**
    Fill out the following JSON structure with a detailed, practical, and engaging curriculum.

    **CRITICAL INSTRUCTIONS:**
    1.  **Project-Centric:** Each week MUST culminate in a practical `weekly_project`. The learning should always be in service of the building.
    2.  **Extreme Detail:** `topics` should not be a simple list. Each topic needs a `topic_name`, a `description` of why it's important, and a list of specific, current, and relevant `resources`.
    3.  **Motivational Tone:** The `introduction` should be inspiring and set the stage for the journey, explaining what the student will be able to achieve by the end.
    4.  **Capstone Project:** The curriculum must conclude with a significant, subject-relevant `capstone_project` that integrates all the skills learned.
    5.  **JSON ONLY:** Your entire response MUST be a single, valid JSON object that adheres to the structure defined below. Do not include any commentary, markdown, or extra text.
    6.  **Resources guidelines:** To avoid broken tutorial links, when suggesting `resources`, avoid any Youtube or other video platform links, and instead suggest search queries the user can search on Youtube themselves.

    **JSON STRUCTURE TO FILL:**
    {{
      "subject": "{request.subject}",
      "total_weeks": <integer, typically 8-12>,
      "prerequisites": ["<list of essential prerequisite skills>"],
      "introduction": "<string, a motivational paragraph>",
      "modules": [
        {{
          "week": <integer>,
          "title": "<string, a compelling theme for the week>",
          "topics": [
            {{
              "topic_name": "<string>",
              "description": "<string, 1-2 sentences on why this matters>",
              "resources": ["<string, link to specific docs page, or tutorial>"]
            }}
          ],
          "weekly_project": {{
            "title": "<string, e.g., 'Build a Mini-Component Library'>",
            "description": "<string, detailed steps for the project>",
            "estimated_hours": <float>
          }}
        }}
      ],
      "capstone_project": {{
        "title": "<string, e.g., 'Full-Stack E-Commerce Dashboard'>",
        "description": "<string, a detailed description of the final project>"
      }}
    }}
    """

    try:
        model = genai.GenerativeModel(model_name) # Use the selected model
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.75
            )
        )
        
        curriculum_data = json.loads(response.text)
        validated_response = CurriculumResponse(**curriculum_data)
        return validated_response

    except (json.JSONDecodeError, ValidationError) as e:
        print(f"Data parsing/validation error: {e}")
        print(f"Raw AI Response that failed: {response.text}")
        raise HTTPException(status_code=500, detail="Failed to process the structured response from the AI.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
