<!--# The Pocket Professor by DrPakfro

## A small, AI-powered tutor app designed to be your personal college level instructor

### Pocket Professor is both a way to learn emerging tech and also combine my passions for education and technology. I am an academic at heart and I wanted to make something for my fellow autodidacts.

### Since I was about 13, anything I was interested in I explored deeply and tried to emulate by learning how to do it. I have taught myself how to play drums, taught myself how to cook, and taught myself how to code before attending the now defunct Coding Dojo bootcamp. Just to name a few things I was curious about and wanted to explore further.

### The internet is vast and varied, and while there are a plethora of learning platforms, tools, videos and docs at ones disposal, creating a learning guide/syllabus catered to ones own learning style is difficult. We have to create a hodge-podge, castaway type raft of assembled tools to learn our own way and I love the idea of a college-style syllabus that can be made to appeal to that need. So I figured why not make it myself?


#### This repo is still under development, and made public to share with co-horts and friends. A full readme is on the way i promise!!!

As of June 16th 2025:

- cleaned up app.py to remove the now un-used question/answer loop code blocks from the very first version of this app
- I moved the unused blocks over to snippets.py as an in-project repository of sorts to reference the earlier version of this project.
- With these commits, the latest main branch will then become a template for the new MVP i want to work toward, with one main feature: take user prompts of subject, difficulty level, time commitments (in hours/week), and learning goal to create a dedicated learning guide for the user, and then exit. One primary function, one main feature, and then build from there.
Godspeed, me!


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

## 🎯 The Problem: "The Chasm"
For every person who wants to switch to a new, more rewarding career, there is a chasm. On one side is their current job; on the other is the new industry they want to enter. In between is a confusing jungle of YouTube tutorials, expensive institutions like bootcamps, college, trade-schools, and a paralyzing fear of not knowing where to start or if you're even learning the right things.

This project is for the person standing at the edge of that chasm. The motivated individual who is tired of their job and has the drive to change, but lacks a clear path and a way to build real, provable confidence.

This isn't a tool for casual learning. It's a bridge.

## 🌉 The Solution: A Structured Bridge
Pocket Professor aims to solve this by providing what self-guided learners lack most: structure and a feedback loop.

Instead of leaving you to assemble a rickety raft of random resources, this app is being built to provide an engineered bridge to get you to the other side. It's designed to bring the curriculum and accountability of a structured program to you, without the prohibitive cost.

## ✨ Core Features (The MVP Plan)
The entire system is being built around a simple, powerful, and evidence-based learning loop:

- Generate Your Path: It starts by creating a clear, structured, step-by-step syllabus for any topic, giving you a roadmap from A to B.

- Test for Understanding: After you engage with a topic, the app doesn't just move on. It tests you with Active Recall to ensure you can retrieve the information, not just recognize it.

- Get Adaptive Feedback: The core of the engine. Based on your answer and your self-rated confidence, the system provides hyper-targeted feedback. Its primary job is to destroy the "illusion of competence"—that dangerous feeling of understanding something when you actually don't.

## 🚀 Project Status & Roadmap
Current Version: `v0.04` (Pivoting & Rebuilding)

## As of June 30th, 2025:

- ✅ Strategic Pivot Complete: The project's focus has shifted from a general-purpose syllabus generator to a targeted, adaptive learning engine for career-switchers.

- ✅ Tech Stack Defined: The backend will be built with FastAPI for performance and the frontend will be a clean HTML/JS/CSS interface. Firestore will be used for data persistence.

- ✅ Syllabus generator is complete, and able to produce a clean JSON object as the foundation for the scaffolding.

## 🏗️ Backend Scaffolding in Progress: The initial FastAPI application structure is being built out, with Pydantic models defined for the core learning loop.

Next Steps: The MVP Build

[ ] Deploy Backend v1: Get the FastAPI backend live with the core /quiz/submit endpoint that handles the adaptive feedback logic.

[ ] Implement Core Loop UI: Build the frontend interface to guide the user through the Study -> Test -> Rate Confidence -> Get Feedback workflow.

[ ] Integrate Firestore: Connect the backend to a Firestore database to begin logging all quizInteractions. This data is the fuel for all future intelligence.

[ ] Find "Alex": Begin alpha testing with a small, focused group of career-switchers to get the first critical pieces of user feedback.

---

<p align="center">
  Happy Learning! 🧠
</p>
