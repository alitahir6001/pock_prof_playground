# config.py

# This file contains the configuration settings for the Pocket Professor application.
# By centralizing them here, we can easily change settings without editing the core logic.

# Configuration for the Ollama connection
OLLAMA_URL = "http://localhost:11434/api/generate"

# Configuration for the Language Model
LLM_MODEL = "gemma3:latest" # You can swap this with any other model you have, like "mistral:latest"