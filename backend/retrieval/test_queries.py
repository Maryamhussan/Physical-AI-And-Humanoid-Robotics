"""
Predefined test queries for validation
"""
from typing import List, Dict, Any


def get_predefined_test_queries() -> List[Dict[str, Any]]:
    """
    Create predefined test queries for validation in backend/retrieval/test_queries.py
    """
    return [
        {
            "query": "What is Physical AI and Humanoid Robotics?",
            "expected_urls": [
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/introduction",
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/core-concepts"
            ]
        },
        {
            "query": "How does machine learning apply to robotics?",
            "expected_urls": [
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/ml-applications",
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/ai-integration"
            ]
        },
        {
            "query": "What are the main components of a humanoid robot?",
            "expected_urls": [
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/components",
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/design"
            ]
        },
        {
            "query": "Explain the design principles of physical AI systems",
            "expected_urls": [
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/design-principles",
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/systems-design"
            ]
        },
        {
            "query": "How do neural networks contribute to robotic control?",
            "expected_urls": [
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/neural-networks",
                "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/control-systems"
            ]
        }
    ]


# Default test queries
PREDEFINED_TEST_QUERIES = get_predefined_test_queries()