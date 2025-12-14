---
title: LLM Reasoning and Action Planning
sidebar_position: 3
description: Using Large Language Models for reasoning and action planning in VLA systems
---

# LLM Reasoning and Action Planning

## Introduction

Large Language Models (LLMs) play a crucial role in Vision-Language-Action (VLA) systems by bridging the gap between natural language understanding and action execution. In this module, we'll explore how to use LLMs for reasoning and generating action plans from natural language commands.

## Selecting Appropriate Models

### Educational-Friendly Models

Based on our requirements, we should use accessible models appropriate for educational use:

1. **OpenAI GPT Models**: GPT-3.5, GPT-4 for advanced capabilities
2. **Open-Source Alternatives**: Models like Llama, Mistral, or Phi-2 for local processing
3. **Domain-Specific Models**: Specialized robotics language models where available

### Model Selection Criteria

When selecting LLMs for educational purposes, consider:

- **Cost-effectiveness**: Balance between capabilities and budget
- **Accessibility**: Availability and ease of use for students
- **Performance**: Reasoning capabilities and response quality
- **Privacy**: Data handling and security considerations

## Integration with VLA Pipeline

### Action Planning Framework

LLMs in VLA systems need to convert natural language commands into executable action plans:

```python
import openai
import json
from typing import List, Dict, Any

class LLMActionPlanner:
    def __init__(self, model_name="gpt-3.5-turbo"):
        self.model_name = model_name

    def plan_actions(self, command: str, robot_capabilities: List[str]) -> Dict[str, Any]:
        """
        Convert natural language command to action plan

        Args:
            command: Natural language command from user
            robot_capabilities: List of robot's available actions

        Returns:
            Dictionary containing action plan
        """
        system_prompt = f"""
        You are a robot action planner. Your task is to convert natural language commands
        into a sequence of actions that the robot can execute.

        Robot capabilities: {', '.join(robot_capabilities)}

        Respond with a JSON object containing:
        {{
            "actions": [
                {{
                    "action_type": "move_to | grasp | detect | navigate",
                    "parameters": {{"target": "...", "object": "..."}},
                    "description": "Human-readable description"
                }}
            ],
            "reasoning": "Step-by-step reasoning for the plan"
        }}
        """

        try:
            response = openai.ChatCompletion.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": command}
                ],
                temperature=0.1  # Lower temperature for more consistent responses
            )

            # Parse the response
            plan_str = response.choices[0].message.content.strip()

            # Find and extract JSON
            start_idx = plan_str.find('{')
            end_idx = plan_str.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                plan_json = plan_str[start_idx:end_idx]
                return json.loads(plan_json)
            else:
                raise ValueError(f"Could not extract JSON from response: {plan_str}")

        except json.JSONDecodeError as e:
            print(f"Error parsing LLM response as JSON: {e}")
            return {"actions": [], "reasoning": "Failed to parse LLM response"}
        except Exception as e:
            print(f"Error calling LLM: {e}")
            return {"actions": [], "reasoning": f"LLM call failed: {str(e)}"}
```

### Example: "Clean the Room" Command

Let's see how this would work for a complex command:

```python
# Example usage
planner = LLMActionPlanner()
robot_caps = [
    "move_to_location",
    "detect_objects",
    "grasp_object",
    "place_object",
    "navigate_room"
]

command = "Clean the room by putting the books on the shelf and throwing away the trash"

plan = planner.plan_actions(command, robot_caps)
print(json.dumps(plan, indent=2))
```

Expected output might be:
```json
{
  "actions": [
    {
      "action_type": "detect_objects",
      "parameters": {"room_area": "living room"},
      "description": "Scan the room to identify objects that need cleaning"
    },
    {
      "action_type": "navigate_room",
      "parameters": {"target_object": "book"},
      "description": "Move to the location of the first book"
    },
    {
      "action_type": "grasp_object",
      "parameters": {"object": "book", "location": "table"},
      "description": "Pick up the book"
    },
    {
      "action_type": "move_to_location",
      "parameters": {"location": "bookshelf"},
      "description": "Navigate to the bookshelf"
    },
    {
      "action_type": "place_object",
      "parameters": {"object": "book", "location": "bookshelf"},
      "description": "Place the book on the shelf"
    }
  ],
  "reasoning": "The command requires cleaning the room by organizing books and removing trash. First, I'll scan the room to identify all objects. Then I'll pick up books one by one and place them on the shelf. Finally, I'll identify and dispose of trash items."
}
```

## Performance Optimization

### Latency Considerations

To meet our <5 second response target for LLM processing:

```python
import time
from functools import wraps

def measure_latency(func):
    """Decorator to measure function execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        latency = end_time - start_time
        print(f"{func.__name__} took {latency:.2f} seconds")
        return result
    return wrapper

class OptimizedLLMPlanner(LLMActionPlanner):
    @measure_latency
    def plan_actions(self, command: str, robot_capabilities: List[str]) -> Dict[str, Any]:
        # Use a faster but slightly less capable model for quicker responses
        # Or implement caching for common commands
        return super().plan_actions(command, robot_capabilities)

    def cache_common_commands(self):
        """Cache responses for common commands to reduce latency"""
        self.command_cache = {
            "pick up the red ball": {
                "actions": [{"action_type": "navigate_to", "parameters": {"target": "red_ball"}}],
                "reasoning": "Navigate to red ball"
            },
            "go to the kitchen": {
                "actions": [{"action_type": "navigate_to", "parameters": {"target": "kitchen"}}],
                "reasoning": "Navigate to kitchen"
            }
        }
```

### Caching Strategies

For frequently used commands, implement caching:

```python
import hashlib
from typing import Optional

class CachedLLMPlanner(OptimizedLLMPlanner):
    def __init__(self, cache_ttl=3600):  # 1 hour TTL
        super().__init__()
        self.cache = {}
        self.cache_ttl = cache_ttl

    def get_cached_result(self, command: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached result if available and not expired"""
        command_hash = hashlib.md5(command.encode()).hexdigest()

        if command_hash in self.cache:
            cached_at, result = self.cache[command_hash]
            if time.time() - cached_at < self.cache_ttl:
                print("Using cached result for command")
                return result
            else:
                # Remove expired cache entry
                del self.cache[command_hash]

        return None

    def cache_result(self, command: str, result: Dict[str, Any]):
        """Cache the result of a command"""
        command_hash = hashlib.md5(command.encode()).hexdigest()
        self.cache[command_hash] = (time.time(), result)

    @measure_latency
    def plan_actions(self, command: str, robot_capabilities: List[str]) -> Dict[str, Any]:
        # Check cache first
        cached_result = self.get_cached_result(command)
        if cached_result:
            return cached_result

        # Call LLM if not in cache
        result = super().plan_actions(command, robot_capabilities)

        # Cache the result
        self.cache_result(command, result)

        return result
```

## Error Handling and Fallbacks

### Graceful Degradation

Implement fallback strategies when LLM calls fail:

```python
import random
from enum import Enum

class FallbackStrategy(Enum):
    SIMPLE_MOVEMENT = "simple_movement"
    DEFAULT_SEQUENCE = "default_sequence"
    REQUEST_CLARIFICATION = "request_clarification"

class RobustLLMPlanner(CachedLLMPlanner):
    def plan_actions_with_fallback(self, command: str, robot_capabilities: List[str]) -> Dict[str, Any]:
        """Plan actions with fallback strategies"""
        try:
            # Primary: LLM-based planning
            result = self.plan_actions(command, robot_capabilities)

            # Validate the result
            if self.validate_action_plan(result, robot_capabilities):
                return result
            else:
                print("Invalid action plan from LLM, using fallback")
        except Exception as e:
            print(f"LLM planning failed: {e}, using fallback strategy")

        # Fallback strategies
        fallback_strategy = self.select_fallback_strategy(command)

        if fallback_strategy == FallbackStrategy.SIMPLE_MOVEMENT:
            return self.simple_movement_fallback(command)
        elif fallback_strategy == FallbackStrategy.DEFAULT_SEQUENCE:
            return self.default_sequence_fallback()
        elif fallback_strategy == FallbackStrategy.REQUEST_CLARIFICATION:
            return self.request_clarification_fallback(command)
        else:
            return self.generic_fallback()

    def validate_action_plan(self, plan: Dict[str, Any], capabilities: List[str]) -> bool:
        """Validate that the plan is executable with available capabilities"""
        if "actions" not in plan:
            return False

        for action in plan["actions"]:
            if "action_type" not in action:
                return False
            # Check if action type is in robot capabilities
            # Simplified check - in reality this would be more complex
            if not any(action["action_type"] in cap for cap in capabilities):
                print(f"Action {action['action_type']} not available in capabilities")

        return True

    def select_fallback_strategy(self, command: str) -> FallbackStrategy:
        """Select appropriate fallback based on command content"""
        command_lower = command.lower()

        if any(word in command_lower for word in ["move", "go", "navigate", "walk"]):
            return FallbackStrategy.SIMPLE_MOVEMENT
        elif any(word in command_lower for word in ["help", "repeat", "again"]):
            return FallbackStrategy.REQUEST_CLARIFICATION
        else:
            return FallbackStrategy.DEFAULT_SEQUENCE

    def simple_movement_fallback(self, command: str) -> Dict[str, Any]:
        """Fallback for movement-related commands"""
        return {
            "actions": [
                {
                    "action_type": "navigate_to",
                    "parameters": {"target": "center_of_room"},
                    "description": "Move to center of room as default action"
                }
            ],
            "reasoning": "Simple movement fallback - navigating to center of room"
        }

    def default_sequence_fallback(self) -> Dict[str, Any]:
        """Default sequence when LLM fails"""
        return {
            "actions": [
                {"action_type": "detect_objects", "parameters": {}, "description": "Detect objects in environment"},
                {"action_type": "report_status", "parameters": {}, "description": "Report current status to user"}
            ],
            "reasoning": "Default fallback sequence - detect objects and report status"
        }

    def request_clarification_fallback(self, command: str) -> Dict[str, Any]:
        """Request clarification when command is ambiguous"""
        return {
            "actions": [
                {
                    "action_type": "request_clarification",
                    "parameters": {"message": f"I'm not sure what you mean by '{command}'. Could you please rephrase or be more specific?"},
                    "description": "Request clarification from user"
                }
            ],
            "reasoning": "Command is ambiguous, requesting clarification"
        }

    def generic_fallback(self) -> Dict[str, Any]:
        """Generic fallback when all else fails"""
        return {
            "actions": [],
            "reasoning": "Unable to generate action plan, no fallback available"
        }
```

## API Cost Management

### Usage Monitoring

Track and manage API costs for educational use:

```python
import csv
from datetime import datetime
from dataclasses import dataclass

@dataclass
class APIUsageRecord:
    timestamp: datetime
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    command: str

class CostAwareLLMPlanner(RobustLLMPlanner):
    def __init__(self):
        super().__init__()
        self.usage_records = []
        self.daily_cost_limit = 5.0  # $5 per day for educational use
        self.daily_cost = 0.0

    def estimate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Estimate cost based on token usage and model"""
        # Pricing per 1K tokens (approximate values)
        pricing = {
            "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},  # $0.50/$1.50 per 1M tokens
            "gpt-4": {"input": 0.03, "output": 0.06},  # $30/$60 per 1M tokens
        }

        if model in pricing:
            cost = (input_tokens * pricing[model]["input"] +
                   output_tokens * pricing[model]["output"]) / 1000
            return round(cost, 4)
        else:
            # Default conservative estimate
            return round((input_tokens + output_tokens) * 0.00001, 4)  # Rough estimate

    def check_daily_limit(self, estimated_cost: float) -> bool:
        """Check if adding this cost would exceed daily limit"""
        return (self.daily_cost + estimated_cost) <= self.daily_cost_limit

    def plan_actions_with_cost_check(self, command: str, robot_capabilities: List[str]) -> Dict[str, Any]:
        """Plan actions with cost checking"""
        # For now, we'll just call the parent method
        # In a real implementation, we would estimate tokens and cost before calling the API
        return self.plan_actions_with_fallback(command, robot_capabilities)

    def log_usage(self, record: APIUsageRecord):
        """Log API usage for cost tracking"""
        self.usage_records.append(record)
        self.daily_cost += record.cost_usd

        # Save to CSV for tracking
        with open('api_usage_log.csv', 'a', newline='') as csvfile:
            fieldnames = ['timestamp', 'model', 'input_tokens', 'output_tokens', 'cost_usd', 'command']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            # Write header if file is empty
            if csvfile.tell() == 0:
                writer.writeheader()

            writer.writerow({
                'timestamp': record.timestamp.isoformat(),
                'model': record.model,
                'input_tokens': record.input_tokens,
                'output_tokens': record.output_tokens,
                'cost_usd': record.cost_usd,
                'command': record.command
            })
```

## Testing and Validation

### Unit Tests

Create tests to ensure LLM planning works correctly:

```python
import unittest
from unittest.mock import patch, MagicMock

class TestLLMActionPlanner(unittest.TestCase):

    def setUp(self):
        self.planner = LLMActionPlanner()
        self.robot_caps = ["move_to_location", "grasp_object", "detect_objects"]

    @patch('openai.ChatCompletion.create')
    def test_simple_command(self, mock_create):
        # Mock successful response
        mock_response = MagicMock()
        mock_response.choices[0].message.content = '''
        {
            "actions": [
                {
                    "action_type": "detect_objects",
                    "parameters": {"room_area": "living room"},
                    "description": "Scan the room to identify objects"
                }
            ],
            "reasoning": "Simple detection task"
        }
        '''
        mock_create.return_value = mock_response

        result = self.planner.plan_actions("Look around the room", self.robot_caps)

        self.assertIn("actions", result)
        self.assertEqual(len(result["actions"]), 1)
        self.assertEqual(result["actions"][0]["action_type"], "detect_objects")

    def test_validate_action_plan(self):
        # Test valid plan
        valid_plan = {
            "actions": [
                {"action_type": "move_to_location", "parameters": {"target": "kitchen"}}
            ]
        }
        self.assertTrue(
            self.planner.validate_action_plan(valid_plan, self.robot_caps)
        )

        # Test invalid plan
        invalid_plan = {
            "actions": [
                {"invalid_field": "some_value"}
            ]
        }
        self.assertFalse(
            self.planner.validate_action_plan(invalid_plan, self.robot_caps)
        )

if __name__ == '__main__':
    unittest.main()
```

## Conclusion

LLM integration in VLA systems enables sophisticated natural language understanding and action planning. Key considerations include:

1. **Model Selection**: Choose appropriate models for educational use (GPT-3.5, open-source alternatives)
2. **Performance**: Optimize for the target <5 second response time
3. **Reliability**: Implement robust error handling and fallback strategies
4. **Cost Management**: Monitor and control API usage for educational budgets
5. **Privacy**: Ensure compliance with data handling requirements

The LLM serves as the reasoning engine that bridges natural language commands with executable robot actions, making VLA systems truly conversational and intuitive.