from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import List, Dict
import json

app = FastAPI(title="Pocket Professor API", version="1.0.0")

# CORS middleware to allow your GitHub Pages frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://*pakfro.dev", "http://localhost:3000", "http://127.0.0.1:3000",],  # Add your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - easily switch between Ollama and OpenAI
USE_OLLAMA = True  # Set to False to use OpenAI instead
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "gemma3:12b-it-q4_K_M"  # Change to your preferred model
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class CurriculumRequest(BaseModel):
    subject: str
    skill_level: str  # beginner, intermediate, advanced
    learning_goal: str  # job, certification, personal, etc.
    time_commitment: str  # hours per week

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

@app.get("/")
async def root():
    return {"message": "Pocket Professor API is running!", "status": "healthy"}

async def call_ollama(prompt: str, system_prompt: str) -> str:
    """Call Ollama API"""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": f"System: {system_prompt}\n\nUser: {prompt}",
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 2000
                }
            },
            timeout=180
        )
        response.raise_for_status()
        return response.json()["response"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama API error: {str(e)}")

async def call_openai(prompt: str, system_prompt: str) -> str:
    """Call OpenAI API"""
    import openai
    openai.api_key = OPENAI_API_KEY
    
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.7
    )
    return response.choices[0].message.content

@app.post("/generate-curriculum", response_model=CurriculumResponse)
async def generate_curriculum(request: CurriculumRequest):
    try:
        # Construct the prompt
        prompt = f"""
        Create a detailed learning curriculum for the following requirements:
        
        Subject: {request.subject}
        Current Skill Level: {request.skill_level}
        Learning Goal: {request.learning_goal}
        Time Commitment: {request.time_commitment} hours per week
        
        Please provide a structured curriculum with:
        1. Weekly modules (aim for 8-16 weeks depending on complexity)
        2. Each week should have specific topics to cover
        3. Estimated hours for each week
        4. Recommended resources (books, courses, tutorials, practice projects)
        5. Prerequisites if any
        
        Format the response as JSON with this structure:
        {{
            "subject": "{request.subject}",
            "total_weeks": <number>,
            "modules": [
                {{
                    "week": <number>,
                    "title": "<descriptive title>",
                    "topics": ["<topic1>", "<topic2>"],
                    "estimated_hours": <hours as decimal>,
                    "resources": ["<resource1>", "<resource2>"]
                }}
            ],
            "prerequisites": ["<prerequisite1>", "<prerequisite2>"],
            "recommended_resources": ["<general resource1>", "<general resource2>"]
        }}
        
        Make it practical and actionable for someone with {request.skill_level} level experience.
        IMPORTANT: Return ONLY the JSON, no additional text or formatting.
        """
        
        system_prompt = "You are an expert curriculum designer and educational consultant. Create structured, practical learning paths for any subject. Always respond with valid JSON only."
        
        # Call the appropriate API based on configuration
        if USE_OLLAMA:
            ai_response = await call_ollama(prompt, system_prompt)
        else:
            ai_response = await call_openai(prompt, system_prompt)
        
        # Clean up the response (remove any markdown formatting)
        curriculum_json = ai_response.strip()
        if curriculum_json.startswith("```json"):
            curriculum_json = curriculum_json[7:]
        if curriculum_json.endswith("```"):
            curriculum_json = curriculum_json[:-3]
        curriculum_json = curriculum_json.strip()
        
        curriculum_data = json.loads(curriculum_json)
        
        # Validate and return structured response
        return CurriculumResponse(**curriculum_data)
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating curriculum: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Pocket Professor API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)