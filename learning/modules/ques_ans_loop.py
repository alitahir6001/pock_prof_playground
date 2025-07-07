# This is the original "main loop", I created. 
# Written for the initial question/answer loop with user based on knowledge base dict.

from app import *

if __name__ == "__main__":                    # "guarding" the main loop from unittests
    first_interaction = True                  # flag for initial welcome message
    while True:
        try:
            if first_interaction == True:
                user_question = input("\nWelcome to Pocket Professor! Ask a question (or type 'exit' or 'quit' to stop). Type 'help' for instructions: ")
            else: user_question = input("\nWhat's next? Submit a question or type 'help' for instructions, or 'quit' to leave: ")
            first_interaction = False                              # set flag to not display welcome msg again.
            user_question_lower = user_question.lower()

            if user_question_lower == "exit" or user_question_lower == "quit":
                print("\nBye bye!\n")
                break
            elif user_question_lower == "list" or user_question_lower == "show all":
                list_available_questions(knowledge_base)
            elif user_question_lower == "help":
                help_message = "\nInstructions: \n (1) Type 'list' or 'show all' to see a list of available questions \n (2) Type in the question you want answered \n (3) type 'quit' to leave the program."
                print(help_message)
            elif user_question_lower in [key.lower() for key in knowledge_base]:
                answer = response(user_question)
                print(answer)
            else:
                print("\nDEBUG: No exact match found. Checking for typos...\n") # Optional debug message

                # integrate typo_checker by calling it and passing args it needs to operate.
                best_match = typo_checker(user_question_lower, [key.lower() for key in knowledge_base.keys()])
                if best_match is not None:                  # if typo match is found
                    print(f"\nI think you mean... '{best_match}'\n")
                    answer = response(best_match)           # reuses response() and prints it.
                    print(answer)
                else:
                    ask_llm = input("\nThere was no match for submission, would you like to ask the LLM? (Yes/No) ") # request user input
                    if ask_llm.lower() == "yes":
                        llm_answer = query_llm(user_question, knowledge_base)
                        if llm_answer is not None:
                            print(llm_answer)
                        
                    else:
                        print("\nOK, I wont ask the LLM!\n")

        except KeyboardInterrupt:
            print("\nOK! See you later!\n")
            break
        except EOFError:
            print("\nEnd of input detected, so I will exit. See you later!\n")
            break
        # except requests.exceptions.RequestException as reqErr:
        #     print(f"Error sending request to Ollama API: {reqErr}")
        except ValueError as valErr:
            print(f"Unexpected value error has occurred: {valErr}")
        except AttributeError as attErr:
            print(f"An Unexpected Attribute error occured: {attErr}")
        except Exception as excepErr:
            print(f"Unexpected exception occurred: {excepErr}")