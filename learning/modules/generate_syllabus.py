from modules.llm_interaction import query_llm

def generate_syllabus(subject, difficulty, time, goal):
    """
    This function handles the syllabus generation using input taken from the user in app.py:
        1. get inputs --> (1) subject (2) difficulty (3) time committment (4) goal if they have one
        2. create prompt --> comprehensive system prompt to generate learning path/syllabus.
        3. LLM -->   call via Ollama to display the generated learning path, error out if not.
    """

    syllabus_prompt = f"""

    You are an expert Ivy League curriculum designer and highly experienced academic advisor specializing in the field of {subject}.
    Your primary task is to generate a detailed, structured, week-by-week syllabus to help a student learn {subject}. Assume a standard 15-week semester structure, but tailor the weekly workload based on the student's available time.

    Student Information Provided:
    - Subject of Interest: {subject}
    - Stated Current Level: {difficulty}
    - Stated Learning Goal: {goal}
    - Estimated Weekly Time Commitment: {time} hours

    Syllabus Generation Requirements:
    - Structure the output clearly week-by-week (e.g., "Week 1:", "Week 2:", ..., "Week 15:").
    - For each week, include the following sections with clear headings:
        - **Key Topics:** List the specific concepts, theories, or skills to be covered that week.
        - **Learning Resources:** Suggest concrete resources like specific online documentation pages, relevant articles, tutorials, specific book chapters (if widely applicable), or key videos. Avoid vague suggestions.
        - **Practical Exercises/Milestones:** Define actionable tasks, coding exercises, problem sets, or mini-project steps for the student to complete. These exercises MUST directly relate to the week's topics and progressively build practical skills towards the student's overall Learning Goal ('{goal}').
    - Ensure the content depth, topic progression, and complexity of exercises are appropriate for the student's Stated Current Level ('{difficulty}').
    - Adjust the *amount* of material and the *scope* of weekly exercises based on the Estimated Weekly Time Commitment ('{time}' hours) - be realistic.
    - The final weeks of the syllabus should consolidate learning and focus explicitly on activities that help achieve the student's Stated Learning Goal ('{goal}').
    - Maintain an encouraging, supportive, but academically rigorous tone throughout.

    Generate the syllabus now based precisely on these requirements and the provided student information.

    """ 

    # Prompt the LLM to create a syllabus and return the value
    syllabus_response = query_llm(syllabus_prompt)
    return syllabus_response