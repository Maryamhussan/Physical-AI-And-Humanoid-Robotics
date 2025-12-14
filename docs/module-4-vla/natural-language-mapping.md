---
title: Natural Language to Action Mapping
sidebar_position: 4
---

# Natural Language to Action Mapping

## Introduction

Natural Language to Action Mapping is a critical component of Vision-Language-Action (VLA) systems that enables robots to understand human commands and translate them into executable robotic actions. This module covers the techniques and methodologies for converting natural language instructions into structured action plans that can be executed by robotic systems.

## Understanding Natural Language Commands

### Command Parsing and Interpretation

Natural language commands can vary significantly in complexity and structure. The VLA system must be able to parse and interpret these commands effectively:

```python
# Example of command parsing
class NaturalLanguageParser:
    def __init__(self):
        self.action_keywords = {
            'navigation': ['go to', 'move to', 'navigate to', 'travel to'],
            'grasping': ['grasp', 'pick up', 'grab', 'take'],
            'manipulation': ['move', 'place', 'put', 'set'],
            'detection': ['find', 'locate', 'detect', 'search for']
        }

    def parse_command(self, command: str) -> dict:
        """
        Parse a natural language command into structured action
        """
        command_lower = command.lower()

        # Identify action type
        action_type = self.identify_action_type(command_lower)

        # Extract objects and locations
        objects = self.extract_objects(command_lower)
        locations = self.extract_locations(command_lower)

        return {
            'action_type': action_type,
            'objects': objects,
            'locations': locations,
            'original_command': command
        }

    def identify_action_type(self, command: str) -> str:
        """Identify the primary action type from the command"""
        for action_type, keywords in self.action_keywords.items():
            for keyword in keywords:
                if keyword in command:
                    return action_type
        return 'unknown'

    def extract_objects(self, command: str) -> list:
        """Extract object names from the command"""
        # Simple object extraction - in practice, this would use NLP models
        common_objects = [
            'cup', 'bottle', 'book', 'phone', 'keys', 'laptop',
            'pen', 'paper', 'chair', 'table', 'box', 'ball'
        ]

        found_objects = []
        for obj in common_objects:
            if obj in command:
                found_objects.append(obj)

        return found_objects

    def extract_locations(self, command: str) -> list:
        """Extract location names from the command"""
        common_locations = [
            'kitchen', 'living room', 'bedroom', 'office', 'bathroom',
            'dining room', 'hallway', 'garage', 'garden', 'desk', 'shelf'
        ]

        found_locations = []
        for loc in common_locations:
            if loc in command:
                found_locations.append(loc)

        return found_locations
```

## Command-to-Action Translation Pipeline

### 1. Language Understanding

The first step in the translation pipeline is to understand the semantic meaning of the command:

- **Intent Recognition**: Identify the primary action the user wants to perform
- **Entity Extraction**: Extract objects, locations, and other relevant entities
- **Context Understanding**: Consider environmental and situational context

### 2. Action Planning

Once the command is understood, the system plans a sequence of actions:

```python
class ActionPlanner:
    def __init__(self):
        self.robot_capabilities = [
            'navigation',
            'object_detection',
            'grasping',
            'manipulation',
            'speech_output'
        ]

    def plan_actions(self, parsed_command: dict) -> list:
        """
        Generate a sequence of actions based on parsed command
        """
        action_sequence = []

        if parsed_command['action_type'] == 'navigation':
            # Plan navigation to specified location
            for location in parsed_command['locations']:
                action_sequence.append({
                    'action': 'navigate_to',
                    'target': location,
                    'description': f'Navigate to {location}'
                })

        elif parsed_command['action_type'] == 'grasping':
            # Plan object detection and grasping
            for obj in parsed_command['objects']:
                action_sequence.append({
                    'action': 'detect_object',
                    'target': obj,
                    'description': f'Detect {obj}'
                })
                action_sequence.append({
                    'action': 'grasp_object',
                    'target': obj,
                    'description': f'Grasp {obj}'
                })

        elif parsed_command['action_type'] == 'manipulation':
            # Plan manipulation actions
            for obj in parsed_command['objects']:
                action_sequence.append({
                    'action': 'manipulate_object',
                    'target': obj,
                    'description': f'Manipulate {obj}'
                })

        return action_sequence
```

### 3. Execution Planning

The final step converts the action sequence into ROS 2 action calls:

```python
class ExecutionPlanner:
    def __init__(self, node):
        self.node = node
        # Initialize ROS 2 action clients
        self.navigation_client = ActionClient(node, NavigateToPose, '/navigate_to_pose')
        self.manipulation_client = ActionClient(node, ManipulateObject, '/manipulate_object')

    def execute_action_sequence(self, action_sequence: list) -> bool:
        """
        Execute the planned action sequence
        """
        for action in action_sequence:
            success = self.execute_single_action(action)
            if not success:
                self.node.get_logger().error(f'Action failed: {action}')
                return False

        return True

    def execute_single_action(self, action: dict) -> bool:
        """
        Execute a single action based on its type
        """
        action_type = action['action']

        if action_type == 'navigate_to':
            return self.execute_navigation(action)
        elif action_type == 'detect_object':
            return self.execute_detection(action)
        elif action_type == 'grasp_object':
            return self.execute_grasping(action)
        elif action_type == 'manipulate_object':
            return self.execute_manipulation(action)
        else:
            self.node.get_logger().error(f'Unknown action type: {action_type}')
            return False
```

## Practical Examples

### Example 1: "Clean the room"

Let's break down how the command "Clean the room" would be processed:

1. **Parsing**: The system identifies this as a manipulation task with "room" as the location
2. **Planning**: The system plans to detect objects, navigate to them, and move them appropriately
3. **Execution**: The robot executes the planned sequence

```python
# Complete example for "Clean the room" command
def clean_room_example():
    parser = NaturalLanguageParser()
    planner = ActionPlanner()

    # Parse the command
    command = "Clean the room"
    parsed = parser.parse_command(command)

    # Plan actions
    actions = planner.plan_actions(parsed)

    # The system would generate actions like:
    # 1. Detect objects in the room
    # 2. Navigate to each object
    # 3. Grasp and move objects to appropriate locations
    # 4. Return to home position

    print(f"Command: {command}")
    print(f"Parsed: {parsed}")
    print(f"Action sequence: {actions}")
```

### Example 2: "Bring me the red cup from the kitchen"

This command involves multiple action types:

1. **Navigation**: Go to the kitchen
2. **Detection**: Find the red cup
3. **Grasping**: Pick up the cup
4. **Navigation**: Return to the user
5. **Manipulation**: Hand over the cup

## Error Handling and Validation

### Ambiguous Commands

The system must handle ambiguous commands gracefully:

```python
class AmbiguityHandler:
    def __init__(self, node):
        self.node = node

    def handle_ambiguous_command(self, command: str, parsed_command: dict) -> str:
        """
        Handle commands that have ambiguous interpretations
        """
        if not parsed_command['objects'] and not parsed_command['locations']:
            # Ask for clarification
            return self.request_clarification(command)

        if len(parsed_command['objects']) > 1:
            # Ask which object to use
            return self.request_object_selection(parsed_command['objects'])

        if len(parsed_command['locations']) > 1:
            # Ask which location to use
            return self.request_location_selection(parsed_command['locations'])

        return command  # Command is clear enough

    def request_clarification(self, command: str) -> str:
        """Request clarification from the user"""
        self.node.get_logger().info(f"Command '{command}' is ambiguous. Please provide more details.")
        # In practice, this would involve speech output or other interaction
        return command
```

## Performance Considerations

### Latency Requirements

For natural human-robot interaction, the system should respond to commands within 2-3 seconds:

- Command parsing: < 0.5 seconds
- Action planning: < 1 second
- Initial action execution: < 1.5 seconds

### Accuracy Requirements

- Command interpretation accuracy: > 90%
- Object detection accuracy: > 85%
- Action success rate: > 80%

## Integration with VLA Pipeline

The natural language to action mapping integrates with the broader VLA pipeline:

1. **Input**: Natural language command
2. **Processing**: Language understanding, action planning, execution planning
3. **Output**: Executable ROS 2 action sequence
4. **Feedback**: Results and status updates to the user

## Hands-on Lab: Implementing Natural Language Mapping

### Lab Objective

Students will implement a simple natural language to action mapping system that can handle basic commands like "go to kitchen" or "pick up the cup".

### Implementation Steps

1. Create a command parser that can identify basic action types
2. Implement an action planner that generates sequences of robot actions
3. Test with simple commands and verify correct action sequences

### Expected Outcomes

After completing this lab, students should be able to:
- Parse natural language commands into structured data
- Plan action sequences based on command interpretation
- Execute basic navigation and manipulation tasks based on natural language input

## Summary

Natural Language to Action Mapping is a complex but essential component of VLA systems. It requires understanding of natural language processing, action planning, and robot control. By implementing robust parsing and planning systems, robots can effectively respond to human commands in natural language, making them more accessible and useful for everyday tasks.