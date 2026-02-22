<!--# 
TODO: create a polished "version 0.01" of the app that had the original question/answer loop, using the knowledge base dictionary, jaccard similarity algo to check for typos, and THEN calls the LLM if the user wanted to ask a question outside of the knowledge base dictionary. 

💡 Feature Idea: Consider adding a "just in time" learning feature, which only gives the syllabus/user the material they need to learn and understand for THAT lesson/week, etc. Most people try to learn too much, too early, which leads to information overload and poor retention.
  - Consider adding a section of the syllabus that applies the learning they are doing in a realistic and practical way, outside of just exercises. Real world examples would be best.
  - if there's nothing the user needs to learn urgently, only then consider broader universally acceptable concepts/ 

💡 Feature Idea: Something that helps the user take notes as they go.

💡 Feature Idea: Agent that adds "study time" to their Google Calendar for them once the syllabus and web scraping agent find the relevant material for them. 
  - Def of done: Syllabus created, agent scouts out relevant material based on that syllabus, and adds blocks of time to their calendar based on their weekly hour commitment.
  - All the user should do is wake up, get an alert on their phone it's time to start studying, and have my app show them the relevant material for the day.

💡 Feature Idea: Github API integration that creates repos with starter code (and readme) for the user if they're learning tech.

💡 Feature Idea - Market-driven gap analysis is brilliant - This is real-time competitive intelligence that no chatbot can provide. When you tell an investor "we scrape job listings and tell users what skills they're missing," that's a legitimate business model.

💡 Feature Idea: Address Motivation issue by tracking hours completed. Be like "20 hours completed = 1 college credit" or something like that. 
  - How should I address the "what should i do now?" outside of just "here is your weekly learning goal."
  - ** Motivation issues are usually tied to curricula issues. If the shit is boring, they wont want to continue. Make it not boring.

💡 Feature Idea - Add a "referesher" note that briefly explains where the user were when they left off

⭐💡 Feature Idea - Intelligent adaptation: Somehow, the app learns about the user as the user continues to learn. The more they use the app, the more it learns.
  - If user is away for multiple days, remind them of where they werre
  - Suggest easier or shorter tasks to rebuild momentum
  - "You are x% complete toward your certification/test/career goal
<!-->

# 📚 The Pocket Professor
## A structured learning engine for the motivated career-switcher.

<p align="center">
  <img src="https://cafans.b-cdn.net/images/Category_22057/subcat_38643/Hcolor3.jpg" style="width:400px;" alt="The Pocket Professor"/>
</p>

## 📋 Table of Contents
- [The Problem: "The Chasm"](#-the-problem-the-chasm)
- [The Solution: A Structured Bridge](#-the-solution-a-structured-bridge)
- [Core Features (The MVP Plan)](#-core-features-the-mvp-plan)
- [The Science: An Evidence-Based Engine](#-the-science-an-evidence-based-engine)
- [Tech Stack](#️-tech-stack)
- [Getting Started: Local Development](#-getting-started-local-development)
- [Project Status & Roadmap](#project-status--roadmap)

## 🎯 The Problem: "The Chasm"
Career-switchers often face a "chasm"— a meandering gap between their current work experience and a new career. This gap is filled with endless generic tutorials and platforms, with bootcamps and universities as alternative options that are high in both time and money. Pocket Professor is designed for motivated individuals who lack a clear path, acting as a structured bridge to cross this gap, not just another tool for casual learning.

I have stood before this chasm myself, and this project is for the person like me in 2020, standing at the edge of that chasm. The motivated individual who is tired of their job and has the drive to change, but lacks a clear path and a way to build real, provable confidence.

This isn't a tool for casual learning. It's a bridge.

## 🌉 The Solution: A Structured Bridge
Pocket Professor aims to address this time and opportnity cost by providing what self-guided career switchers need most: A structured path toward their education and career goals powered by a guided, personalized feedback loop.

Instead of leaving you to assemble a rickety raft of random resources, this app is being built to provide an engineered bridge to help get you going in your journey with confidence. It's designed to bring the curriculum and accountability of a structured program to you, without the gated restrictions of time and opportunity costs.

## ✨ Core Features (The MVP Plan)
The entire system is being built around a simple, powerful, and evidence-based learning loop:

- Generate Your Path: Instantly creates a clear, step-by-step syllabus for any topic.

- Get Adaptive Feedback via "The Professor": Provides targeted feedback powered by Agentic Reinforcement learning to identify true knowledge gaps and act as a career coach to keep you motivated.

## 🧠 The Science: An Evidence-Based Engine
The app's learning engine is built on proven cognitive science, rejecting neuromyths like "learning styles." Instead, it uses:

- Spaced Repetition: Intelligently schedules reviews to combat the ["forgetting curve,"](https://memorylab.nd.edu/assets/512320/2022_radvansky_doolen_pettijohn_ritchey_jep_lmc_.pdf) making study time more efficient.

- [Interleaving:](https://www.microsoft.com/en-us/research/wp-content/uploads/2025/04/AgenticReasoning.pdf) Instead of practicing one topic to death before moving on ("blocked practice"), the engine will learn to mix different but related concepts within a single study session. This forces your brain to work harder to differentiate between similar ideas, leading to deeper, more flexible knowledge that you can apply in the real world.

- Strength through Struggle: Acts as a "difficulty thermostat," introducing achievable challenges to ensure effortful learning and strong retention.

- Cognitive Load Management: Your [working memory](https://www.scribd.com/document/861512306/s41562-025-02152-2) is extremely limited. Minimizes distracting information so you can focus your mental energy on learning the material.

## 🛠️ Tech Stack
This project uses a modern, performant, and scalable stack:

- **Backend:** FastAPI (Python 3.10+)
- **Frontend:** Plain HTML, CSS, and JavaScript (No framework)
- **AI Integration:** Google Gemini API
- **Deployment:** Railway
- 🚧🚧 **Database:** Google Firestore (for the MVP feedback loop) 🚧🚧

## 🚀 Getting Started: Local Development

<details>
<summary><strong>Click here to expand the step-by-step guide</strong></summary>

### Local Development Setup
To get the backend running on your local machine, follow these steps:

1.  **Prerequisites:**
    * Python 3.10 or higher
    * Git

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/alitahir6001/pocket_professor.git
    cd pocket-professor
    ```
3. Create and Activate a Virtual Environment:

On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

On Windows:
```bash
python -m venv venv
.\venv\Scripts\activate
```

4. Install Dependencies:
```
pip install -r requirements.txt
```
5. Use an API key from your LLM of choice. Ex:
```
GEMINI_API_KEY="your_api_key_here"
```

6. Run the Development Server:
```
uvicorn main:app --reload
```

7. Access the API:

Your API will now be running at ```http://127.0.0.1:8000```.

You can access the interactive API documentation (provided by Swagger UI) ```at http://127.0.0.1:8000/docs```.
</details>


## Project Status & Roadmap

### As of October 2025:

Current Version: `v1.6.0`

- ✅ Security Hardening Complete: The backend API is protected with rate limiting, CORS, trusted host validation, and prompt injection defenses.

- ✅ Successful Production Deployment: The FastAPI backend is deployed and running on Railway.

- ✅ Syllabus Generator Live: The core feature is live and produces a structured JSON output.

## 🏗️ Backend Scaffolding in Progress
### The initial FastAPI application structure is being built out, with Pydantic models defined for the core learning loop.

Next Steps: The MVP Build

[ ] Gap Analysis Tool: Use an Agent-LLM loop to align curricula with real-world job requirements.

[ ] Implement Core Loop UI: Build the frontend for the Study -> Test -> Feedback workflow.

[ ] Alpha Testing: Begin testing with a small group of career-switchers to gather critical feedback.

---

<p align="center">
  Happy Learning! 🧠
</p>
