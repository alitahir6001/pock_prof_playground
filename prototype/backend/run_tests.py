#!/usr/bin/env python3
"""Simple test runner for the Pocket Professor API"""

import subprocess
import sys

def run_tests():
    """Run pytest with coverage and verbose output"""
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "test_main.py", 
            "-v", 
            "--tb=short"
        ], check=True)
        print("✅ All tests passed!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Some tests failed!")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
