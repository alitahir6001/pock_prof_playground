import unittest                                 # Imports from your project
from app import response                        # Importing the function we want to test
from modules.knowledge_base import knowledge_base       # Importing the data it uses

class PocketProfessorTests(unittest.TestCase):
    def test_response_exactMatch_and_ignore_case(self):
        """ Test the response function's exact-matching capability and ignoring case """

        # -- Arrange: Setup what the test needs
        # -- Act: Execute the actual function call I am testing
        # -- Assert: Use self.assertEqual() to compare results
        
        # Arrange
        
        actual_key_in_db = "What is a Variable in Python?"          # Define the actual key (question) from dict
        input_question = "whAT iS A vaRiABlE in pYthon?"            # Define the input i will pass to test
        try:
            expected_answer = knowledge_base[actual_key_in_db]      # Define expected answer     
        except KeyError as keyErr:
            # Use self.fail() instead of print for test except blocks.
            # If key not found:
            self.fail(f"Test setup error: Key: {actual_key_in_db} not found in knowledge base dictionary - {keyErr}")

        actual_answer = response(input_question)            # Act
        self.assertEqual(expected_answer, actual_answer)    # Assert

    def test_response_missing_punctuation(self):
        """ Test the response function's ability to catch missing punctuation. Currently the response function is limited, so this test will fail. """

        actual_key_in_db = "What's a module?"
        input_question = "wHAts a moDUle"
        try:
            expected_answer = knowledge_base[actual_key_in_db]
        except KeyError as keyErr:
            self.fail(f"Test setup error: Key: {actual_key_in_db} not found in knowledge base dictionary - {keyErr}")

        actual_answer = response(input_question)
        self.assertEqual(expected_answer, actual_answer)


# runner
if __name__ == '__main__':
    unittest.main()
