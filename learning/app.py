from modules.llm_interaction import query_llm
from modules.generate_syllabus import generate_syllabus
import sys
    
if __name__ == "__main__":     # guard
    try:
        def get_input_with_exit_check(prompt):
            """ Prompts the user for input and checks for exit commands ('quit' or 'exit').
                Args:
                    prompt (str): The text to display to the user.
                Returns:
                    str: The user's input if it's not an exit command. """
            
        # Get user prompts for generating syllabus
        advisor_prompt = "\nWelcome to Pocket Professor! I'm your personal academic advisor, designed to help you create a specialized learning path that aligns with your needs. To get started, what subject matter are you looking to learn about? "
        
        subject = input(advisor_prompt).lower()

        difficulty_level = input(f"\nWonderful! I'm excited to help you on your {subject} learning journey! I want to make this guide unique to you, so please tell me your current level of understanding of the material. Are you a beginner in learning about {subject}? Or do you have some background and want an intermediary approach? Or are you looking for a more advanced understanding of {subject}? ").lower()

        learning_goal = input(f"\nJust curious, is there a goal you have in mind to learn about {subject}? It's ok if you don't have one right now: ").lower()
        
        time = input(f"\nHow many hours per week do you think you'll be willing to spend on learning {subject}? Don't worry if you're not sure: ").lower()

        # ToDo: try an exit condition for this portion
        # if subject or difficulty_level or learning_goal or time == "exit" or input.lower() == "quit":
        #         print("\nBye bye!\n")
        #         sys.exit()

        # LLM prompt to generate syllabus using user info
        syllabus_output = generate_syllabus(subject, difficulty_level, learning_goal, time)
        if syllabus_output is not None:
            print(syllabus_output)

    except KeyboardInterrupt:
        print("\nOK! See you later!\n")
    except EOFError:
        print("\nEnd of input detected, so I will exit. See you later!\n")
    except ValueError as valErr:
        print(f"Unexpected value error has occurred: {valErr}")
    except AttributeError as attErr:
        print(f"An Unexpected Attribute error occured: {attErr}")
    except Exception as excepErr:
        print(f"Unexpected exception occurred: {excepErr}")


        # future feature idea:
        # Once the user is a few weeks into their learning, maybe offer a "check-in" of sorts to see if they want to increase
        # or decrease their hours per week commitment, or refine their subject, or something like that.
        