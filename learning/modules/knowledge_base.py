# Creating a knowledge base for the agent to refer to
# start with an empty dict that we can add k:v pairs to later.

knowledge_base = {}

# Populate the dictonary with key value pair with the following syntax.
# We will add three question and answer pairs to the empty dict.
knowledge_base["What is a Variable in Python?"] = """In Python, a variable is a named storage location that holds a value. You can think of it as a container for data. For example, x = 10 creates a variable named x and assigns the value 10 to it."""

knowledge_base["How do I use a for loop?"] = "A for loop is used to iterate over a sequence (such as a list, tuple, or string) or other iterable objects. Here's an example: for item in [1, 2, 3]: print(item) This loop will print each item in the list."

knowledge_base["What are the different data types in Python?"] = "Python has several built-in data types, including: int: Integers (e.g., 10, -5), float: Floating-point numbers (e.g., 3.14, 2.5), str: Strings (e.g., 'Hello', 'World'), bool: Booleans (e.g., True, False), list: Ordered collections of items (e.g., [1, 2, 3]), dict: Key-value pairs (e.g., {'name': 'John', 'age': 30})"

knowledge_base["What is Object Orientated Programming in Python?"] = "Object Orientated Programming, or OOP for short, is a programming paradigm that uses classes, and their instantiated objects to structure code."

knowledge_base["What's a module?"] = "A module is just Python file with a .py extension. It is used to help break down large and complex programs into smaller, more manageable files. For example you can create a python module with many different functions, classes, etc., and then import that module into other python files to re-use those blocks of code. A collection of modules usually becomes a library."

knowledge_base["What are decorators in Python?"] = """

Decorators are a way to modify or extend the behavior of a function or classes without changing the source code of that function or class. You can create a function that takes another function as its argument, and within that method, you define another nested method that does the magic. You then do a return of that nested method, and then add that decorator wherever you want to use it, like before a class, or a separate method. Example:
    ```python

    def my_decorator(func):
        def(wrapper):
            print("Before the function() call!")
            func()
            print("After the function() call!")
        return wrapper 

"""

knowledge_base["What is asynchronous programming in Python"] = """

Asynchronous programming allows you to perform multiple tasks concurrently without blocking the main thread. It's like async/await in Node.js. The standard practice is to use the 'asyncio' library that is imported into the python file you are working on. Note that you *must* import one of the async libraries to do async/await programming in Python, because python does not have a built-in event loop like Node.js does.  Example:
    ```python

    import asyncio # or Tornado, Twisted, curio, turio libraries. 
    async def banana():
        print("Hello I am...!")
        await asyncio.sleep(5)
        print("...a banana!")
    
    asyncio.run( main() )

"""

knowledge_base["What are metaclasses in Python?"] = """

Metaclasses are the 'classes of classes'. They control the creation and behavior of classes themselves. They allow you to customize class creation, add or modify attributes and methods, and enforce coding standards. They are a powerful but advanced feature, often used for frameworks and libraries. Example:
```python

class Meta(type):
def __new__(meta, name, bases, dct):
    x = super().__new__(meta, name, bases, dct)
    x.attribute = 100
    return x

class MyClass(metaclass=Meta):
    pass

obj = MyClass()
print(obj.attribute)

"""

knowledge_base["What is the difference between multiprocessing and multithreading in Python?"] = """

Multithreading uses multiple threads within a single process to achieve concurrency (aka doing a bunch of stuff at the same time). Multiprocessing, as the name suggests, uses multiple processes each with its own Python interpreter. Multithreading is bound by I/O, thanks to the 'Global Interpreter Lock (GIL), whereas multithreading is bound by the CPU (running multiple python interpreters is expensive!) Example:
```python

Ex. of multithreading:

import threading
def print_numbers():
    for banana in range(5):
        print(threading.current_thread().name banana)
thread1 = threading.Thread(target=print_numbers)
thread1.start()

Ex. of multiprocessing:

import multiprocessing

def print_numbers():
    for banana in range(5):
        print(multiprocessing.current_process().name, banana)
process1 = multiprocesing.Process(target=print_numbers)
process1.start()

"""