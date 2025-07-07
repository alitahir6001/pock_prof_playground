# modules/llm_interaction.py

import requests
import config # Import our new configuration file

def query_llm(prompt_text):
    """
    Sends a prompt to the LLM specified in the config file and returns the response.

    Args:
        prompt_text (str): The full prompt to be sent to the LLM.

    Returns:
        str: The text response from the LLM, or None if an error occurs.
    """
    print("\nSending request to LLM...\n")
    
    try:
        request_data = {
            "model": config.LLM_MODEL, # Use the model from the config file
            "prompt": prompt_text,
            "stream": False
        }
        
        # Use the URL from the config file
        ollama_response = requests.post(config.OLLAMA_URL, json=request_data)
        
        # Check for HTTP errors (e.g., 404, 500)
        ollama_response.raise_for_status()
        
        response_data = ollama_response.json()
        llm_text_response = response_data.get("response")

        if llm_text_response is None:
            print("ERROR: The 'response' key was not found in the LLM JSON output.")
            print(f"Full JSON response: {response_data}")
            return None
        
        return llm_text_response

    except requests.exceptions.RequestException as req_err:
        print(f"\nError communicating with Ollama API: {req_err}")
        print("Please ensure the Ollama server is running and accessible.")
        return None
    
    except Exception as e:
        print(f"\nAn unexpected error occurred when querying the LLM: {e}")
        return None