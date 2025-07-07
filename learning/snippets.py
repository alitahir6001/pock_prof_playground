# **** THESE ARE LEFTOVER AND OLD CODE BLOCKS FROM V.0.01 OF THE APP - THE CLI QUESTION AND ANSWER APP

# Creating a function that takes in a question and fetches the answer
    
# method to handle question/answer interaction ONLY
def response(user_question):
    """ match user question with key in dict."""
    try:
        user_question_lower = user_question.lower()           # make user input lowercase
        for key in knowledge_base.keys():                     # Iterate through dict. Implicit bool to check if user key exists in dict.
            if user_question_lower == key.lower():            # if user input matches the lowercased key...
                return knowledge_base[key]                    # return that question key from the dict.
        else:
            return "\nI didn't recognize the question, can you please try again?\n"
    except Exception as errors:                                # catch any exceptions as "errors"
        return f"\nAn error occurred while processing the response: {errors}\n"   
    

# method to list all keys of the knowledge_base dict.               
def list_available_questions(knowledge_base):
    """ List all available questions in dictionary """
    try:
        if not knowledge_base:                               # Check if dict. is empty with "not" operator.
            print("\nThe knowledge base is empty.\n")
            return                                           # Exit w/ empty return if dictonary is empty.

        print("Available questions:")
        for question in knowledge_base.keys():
            print(f"- {question}")                           # adds hyphen when printing each question.
    except Exception as errors:
        print(f"\nAn error occurred while listing questions: {errors}\n")


# "Main Loop" - infinite loop to repeat prompt for user question. Handles ongoing interaction with user
while True:
    try:
        print("Welcome to Pocket Professor.\n")
        user_question = input("Ask a Python question (or type 'exit' or 'quit' to stop): ")
        user_question_lower = user_question.lower()
        
        if user_question.lower() == "exit" or user_question.lower() == "quit":
            print("Bye bye!")
            break
        elif user_question.lower() == "list" or user_question.lower() == "show all":
            list_available_questions(knowledge_base)
        elif user_question.lower() == "help":
        # Help message for user instructions
            help_message = "Instructions: \n (1) Type 'list' or 'show all' to see a list of available questions \n (2) Type in the question you want answered \n (3) type 'quit' to leave the program."
            print(help_message)
        else:
            answer = response(user_question)
            print(answer)
    except(KeyboardInterrupt):
        print("\nOK! See you later!\n")
        break
    except (EOFError):
        print("\nEnd of input detected, so I will exit. See you later!\n")

# LLM Proompting (yes i said proompt)

llm_prompt = """

You are Pocket Professor, a graduate-level college professor and helpful AI assistant designed to teach users various subjects. I am your creator, my name is Dr. Pakfro. Your goal is to provide clear, concise, and accurate answers to user questions who are learning various subjects. You have access to a Python knowledge base, which you can use as a reference for Python-related questions.

Python Knowledge Base:
{knowledge_base_string}

User Question: {user_question}

Answer:"

""" 

knowledge_base_string = ""                                                  # hold formatted knowledge_base content
try:
    for key, value in knowledge_base.items():                               # iterate through k:v pairs
        knowledge_base_string += f"Question: {key}\n Answer: {value}\n\n"   # format string for LLM use

    # create the full prompt
    full_prompt = llm_prompt.format(user_question = user_question, knowledge_base_string = knowledge_base_string)

    # create the request body JSON
    request_data = {"model": "mistral:latest", "prompt":full_prompt}

    # send that shit to ollama and hold the response
    response = requests.post("http://localhost:11434/api/generate", json=request_data)
    response.raise_for_status()     

except requests.exceptions.RequestException as reqErr:
    print(f"Error sending request to Ollama API: {reqErr}")
except ValueError as valErr:
    print(f"Unexpected value error has occured: {valErr}")
except Exception as excepErr:
    print(f"Unexpected exception occured: {excepErr}")
except Exception as e:
    print(f"An unexpected error occured: {e}")




# Debugging the LLM response 
# This block below helped me understand why i was getting errors sending my user input to the LLM
# Helpful print messages outputted the raw response from the LLM
    # I originally had a var called "response" which was likely confusing the LLM because i also have a
    # function called "response", which does not have a '.text' attribute.
print("DEBUG: Sending request to LLM...")
ollama_response = requests.post("http://localhost:11434/api/generate", json=request_data)
print("DEBUG: Received response from LLM.")
ollama_response.raise_for_status() 

print("--- BEGIN RAW LLM RESPONSE TEXT ---")
# prints the raw message from LLM
print(ollama_response.text) # ----> This used to be response.text and it broke the llm response!

print("--- END RAW LLM RESPONSE TEXT ---")



# JACCARD SIMILARITY ALGO - AKA TYPO CHECKER

# Similarity algorithm
def typo_checker(user_question, know_base_keys, threshold=0.8):
    """
    Goal: find key in dict. most similar to user input. Must be above a certain threshold:
        1. Init placeholder values for best match and a score for that similarity (Before the loop).
        2. Iterate through keys of dictionary. 
        3. Calculate similarity for current key being examined. Use vars to hold values (Inside the loop).
            3a. Create set() 's for each string to compare (ex: user input string vs key string)
            3b. find my_intersection = set1.intersection(set2) -- of the two sets
            3c. find my_union = set1.union(set2) -- of the two sets
            3d. calculate current ratio by dividing: my_current_ratio = length of my_intersection / my_union
        4. Use if conditional to check best match by comparing current_ratio with similarity score and the threshold it should go above.
            4a. if current_ratio > similarity_score AND current_ratio > threshold, update vars to new assignments:
                4b. similarity_score = current_ratio
                4b. best_match = potential_match
            4c. This will only execute if the check above is True. If not, nothing variable assignments will be updated.
        5. Return the best_match (Outside the loop)

    """
    try:
        best_match = None                               # init best match so far
        similarity_score = 0.0                          # init a score for this similarity.
        for potential_match in know_base_keys:          # main loop of typo_checker. Iterate thru list of keys.
            userInputSet = set(user_question)                            # create a set for each string (user, and dict. key)
            potentialSet = set(potential_match)
            matching_vals = userInputSet.intersection(potentialSet)      # collect all unique chars within both sets
            union_set = userInputSet.union(potentialSet)                 # combine all unique chars into new set
            if len(union_set) > 0:                                       # if set is not empty...

                # calculate current_ratio: length of all matching chars in user question with all matching chars of the ditionary key
                current_ratio = len(matching_vals) / len(union_set) 
            else:
                current_ratio = 0.0                     # if both strings were empty, they have no similarity to each other
                
            # ensure the current match is strictly better than the best one you found before
            if current_ratio > similarity_score and current_ratio >= threshold:     # if it is...
                similarity_score = current_ratio                                    # update the best score and, 
                best_match = potential_match                                        # update the best match
        
        # tell the function to return latest greatest best match
        return best_match

    except Exception as errors:
        return f"\nThere was an error with checking the question: {errors}\n"