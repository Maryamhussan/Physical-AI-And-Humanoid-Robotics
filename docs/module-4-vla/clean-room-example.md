---
title: Clean the Room Implementation Example
sidebar_position: 5
---

# "Clean the Room" Implementation Example

## Introduction

The "Clean the Room" command is a complex multi-step task that demonstrates the full capabilities of Vision-Language-Action (VLA) systems. This example shows how a simple natural language command can be decomposed into a sophisticated sequence of perception, planning, and action tasks.

## Command Analysis

When a user says "Clean the room", the VLA system must:

1. **Interpret** the command: Understand that "cleaning" involves organizing, removing, or relocating objects
2. **Perceive** the environment: Identify objects that need to be cleaned up
3. **Plan** actions: Determine the sequence of tasks to clean the room
4. **Execute** the plan: Perform the cleaning tasks using robotic capabilities

## Complete Implementation

### 1. Command Parser for Cleaning Tasks

```python
class CleaningCommandParser:
    def __init__(self):
        # Define cleaning-related actions and objects
        self.cleaning_actions = [
            'clean', 'tidy', 'organize', 'clear', 'pick up', 'put away', 'arrange'
        ]

        self.cleaning_objects = [
            'trash', 'garbage', 'clutter', 'mess', 'papers', 'cups', 'books',
            'clothes', 'toys', 'items', 'things', 'objects'
        ]

        self.room_types = [
            'room', 'desk', 'table', 'area', 'space', 'floor', 'surface'
        ]

    def parse_cleaning_command(self, command: str) -> dict:
        """
        Parse a cleaning-related command and extract relevant information
        """
        command_lower = command.lower()

        # Identify cleaning intent
        has_cleaning_intent = any(action in command_lower for action in self.cleaning_actions)

        # Extract room/location
        room_info = self.extract_room_info(command_lower)

        # Extract objects to clean
        objects_to_clean = self.extract_objects_to_clean(command_lower)

        return {
            'command': command,
            'has_cleaning_intent': has_cleaning_intent,
            'room_type': room_info.get('type', 'room'),
            'room_location': room_info.get('location', 'current'),
            'objects_to_clean': objects_to_clean,
            'action_sequence': self.generate_cleaning_sequence(room_info, objects_to_clean)
        }

    def extract_room_info(self, command: str) -> dict:
        """
        Extract room information from the command
        """
        for room_type in self.room_types:
            if room_type in command:
                # Look for specific room names
                room_names = ['kitchen', 'living room', 'bedroom', 'office', 'bathroom', 'dining room']
                for room_name in room_names:
                    if room_name in command:
                        return {
                            'type': room_type,
                            'location': room_name
                        }
                return {
                    'type': room_type,
                    'location': 'current'
                }

        return {
            'type': 'room',
            'location': 'current'
        }

    def extract_objects_to_clean(self, command: str) -> list:
        """
        Extract objects that need to be cleaned based on the command
        """
        found_objects = []

        # Look for specific objects mentioned
        common_objects = [
            'cup', 'bottle', 'book', 'paper', 'pen', 'phone', 'keys',
            'clothes', 'toys', 'box', 'bag', 'laptop', 'tablet', 'glasses'
        ]

        for obj in common_objects:
            if obj in command:
                found_objects.append(obj)

        # If no specific objects mentioned but "clean" is present,
        # assume general cleaning of common objects
        if not found_objects and any(action in command for action in self.cleaning_actions):
            found_objects = ['clutter', 'items', 'mess']

        return found_objects

    def generate_cleaning_sequence(self, room_info: dict, objects_to_clean: list) -> list:
        """
        Generate a sequence of actions to clean the specified area
        """
        sequence = []

        # 1. Navigate to the room if needed
        if room_info['location'] != 'current':
            sequence.append({
                'action': 'navigate_to',
                'target': room_info['location'],
                'description': f'Navigate to {room_info["location"]}'
            })

        # 2. Survey the area to identify actual objects
        sequence.append({
            'action': 'survey_area',
            'target': room_info['type'],
            'description': f'Survey the {room_info["type"]} to identify objects to clean'
        })

        # 3. For each object to clean, plan detection and manipulation
        for obj in objects_to_clean:
            sequence.extend([
                {
                    'action': 'detect_object',
                    'target': obj,
                    'description': f'Detect {obj} in the area'
                },
                {
                    'action': 'approach_object',
                    'target': obj,
                    'description': f'Approach the {obj}'
                },
                {
                    'action': 'grasp_object',
                    'target': obj,
                    'description': f'Grasp the {obj}'
                },
                {
                    'action': 'determine_destination',
                    'target': obj,
                    'description': f'Determine appropriate destination for {obj}'
                },
                {
                    'action': 'navigate_to_destination',
                    'target': 'appropriate_location',
                    'description': f'Navigate to appropriate location for {obj}'
                },
                {
                    'action': 'place_object',
                    'target': obj,
                    'description': f'Place the {obj} in appropriate location'
                }
            ])

        # 4. Final inspection
        sequence.append({
            'action': 'inspect_area',
            'target': room_info['type'],
            'description': f'Inspect the {room_info["type"]} to ensure cleaning is complete'
        })

        return sequence
```

### 2. Room Cleaning State Manager

```python
class RoomCleaningStateManager:
    def __init__(self):
        self.cleaned_objects = []
        self.failed_objects = []
        self.room_survey = {}
        self.current_state = 'idle'

    def update_state(self, action: str, result: bool, object_name: str = None):
        """
        Update the cleaning state based on action results
        """
        if result:
            if action == 'grasp_object' and object_name:
                self.cleaned_objects.append(object_name)
        else:
            if action == 'detect_object' and object_name:
                self.failed_objects.append(object_name)

        # Update current state based on action
        state_mapping = {
            'navigate_to': 'navigating',
            'survey_area': 'surveying',
            'detect_object': 'detecting',
            'grasp_object': 'grasping',
            'place_object': 'placing',
            'inspect_area': 'inspecting'
        }

        self.current_state = state_mapping.get(action, 'idle')

    def get_cleaning_progress(self) -> dict:
        """
        Get the current progress of the cleaning task
        """
        return {
            'cleaned_objects': self.cleaned_objects,
            'failed_objects': self.failed_objects,
            'total_objects_identified': len(self.cleaned_objects) + len(self.failed_objects),
            'current_state': self.current_state,
            'completion_percentage': len(self.cleaned_objects) * 100 / max(1, len(self.cleaned_objects) + len(self.failed_objects))
        }
```

### 3. Complete Room Cleaning Implementation

```python
import time
from typing import List, Dict, Any

class RoomCleaningSystem:
    def __init__(self, node):
        self.node = node
        self.command_parser = CleaningCommandParser()
        self.state_manager = RoomCleaningStateManager()
        self.perception_system = self.initialize_perception_system()
        self.action_executor = self.initialize_action_executor()

    def initialize_perception_system(self):
        """
        Initialize perception system for object detection and room surveying
        """
        # This would connect to Isaac Sim perception systems
        # or ROS 2 perception nodes
        class MockPerceptionSystem:
            def detect_objects_in_area(self, area_type: str) -> List[Dict[str, Any]]:
                # Simulate object detection
                return [
                    {'name': 'cup', 'position': [1.0, 2.0, 0.0], 'confidence': 0.9},
                    {'name': 'book', 'position': [0.5, 1.5, 0.0], 'confidence': 0.85},
                    {'name': 'papers', 'position': [-0.2, 0.8, 0.0], 'confidence': 0.78}
                ]

            def detect_object_by_name(self, obj_name: str, area_type: str) -> List[Dict[str, Any]]:
                # Simulate detection of specific object
                if obj_name in ['cup', 'book', 'papers']:
                    return [{'name': obj_name, 'position': [0.8, 1.2, 0.0], 'confidence': 0.92}]
                return []

        return MockPerceptionSystem()

    def initialize_action_executor(self):
        """
        Initialize action execution system
        """
        class MockActionExecutor:
            def execute_action(self, action: Dict[str, Any]) -> bool:
                # Simulate action execution
                action_type = action['action']
                target = action['target']

                self.node.get_logger().info(f'Executing {action_type} for {target}')

                # Simulate action time
                time.sleep(0.5)

                # Return success for most actions (simulate 90% success rate)
                import random
                return random.random() > 0.1  # 90% success rate

            def get_appropriate_destination(self, obj_name: str) -> str:
                # Determine appropriate destination based on object type
                destination_map = {
                    'cup': 'kitchen_counter',
                    'book': 'bookshelf',
                    'papers': 'desk',
                    'clothes': 'wardrobe',
                    'toys': 'toy_box'
                }
                return destination_map.get(obj_name, 'storage_area')

        return MockActionExecutor()

    def execute_clean_room_command(self, command: str) -> Dict[str, Any]:
        """
        Execute the complete "clean the room" command
        """
        self.node.get_logger().info(f'Processing cleaning command: {command}')

        # 1. Parse the command
        parsed_command = self.command_parser.parse_cleaning_command(command)
        self.node.get_logger().info(f'Parsed command: {parsed_command["action_sequence"]}')

        # 2. Execute the action sequence
        results = []
        for action in parsed_command['action_sequence']:
            result = self.execute_single_action(action)
            results.append({
                'action': action,
                'success': result,
                'timestamp': time.time()
            })

            # Update state
            self.state_manager.update_state(
                action['action'],
                result,
                action.get('target', 'unknown')
            )

            # Check if we should continue
            if not result and action['action'] in ['navigate_to', 'survey_area']:
                # Critical failure - stop cleaning
                self.node.get_logger().error(f'Critical failure in {action["action"]}, stopping cleaning')
                break

        # 3. Generate final report
        final_report = {
            'original_command': command,
            'action_sequence': parsed_command['action_sequence'],
            'execution_results': results,
            'final_state': self.state_manager.get_cleaning_progress(),
            'success': all(r['success'] for r in results)
        }

        return final_report

    def execute_single_action(self, action: Dict[str, Any]) -> bool:
        """
        Execute a single action in the cleaning sequence
        """
        action_type = action['action']
        target = action['target']

        try:
            if action_type == 'navigate_to':
                return self.execute_navigation(target)
            elif action_type == 'survey_area':
                return self.execute_survey(target)
            elif action_type == 'detect_object':
                return self.execute_detection(target)
            elif action_type == 'approach_object':
                return self.execute_approach(target)
            elif action_type == 'grasp_object':
                return self.execute_grasping(target)
            elif action_type == 'determine_destination':
                return self.execute_destination_determination(target)
            elif action_type == 'navigate_to_destination':
                return self.execute_navigation_to_destination(target)
            elif action_type == 'place_object':
                return self.execute_placement(target)
            elif action_type == 'inspect_area':
                return self.execute_inspection(target)
            else:
                self.node.get_logger().error(f'Unknown action type: {action_type}')
                return False
        except Exception as e:
            self.node.get_logger().error(f'Error executing {action_type}: {str(e)}')
            return False

    def execute_navigation(self, target: str) -> bool:
        """Execute navigation action"""
        self.node.get_logger().info(f'Navigating to {target}')
        # In real implementation, this would call ROS 2 navigation stack
        return self.action_executor.execute_action({'action': 'navigate_to', 'target': target})

    def execute_survey(self, area_type: str) -> bool:
        """Execute area survey to identify objects"""
        self.node.get_logger().info(f'Surveying {area_type}')
        # In real implementation, this would use perception systems
        objects = self.perception_system.detect_objects_in_area(area_type)
        self.node.get_logger().info(f'Found {len(objects)} objects in {area_type}')
        return True

    def execute_detection(self, obj_name: str) -> bool:
        """Execute object detection"""
        self.node.get_logger().info(f'Detecting {obj_name}')
        objects = self.perception_system.detect_object_by_name(obj_name, 'room')
        if objects:
            self.node.get_logger().info(f'Successfully detected {obj_name}')
            return True
        else:
            self.node.get_logger().info(f'Failed to detect {obj_name}')
            return False

    def execute_approach(self, obj_name: str) -> bool:
        """Execute approach to object"""
        self.node.get_logger().info(f'Approaching {obj_name}')
        return self.action_executor.execute_action({'action': 'approach_object', 'target': obj_name})

    def execute_grasping(self, obj_name: str) -> bool:
        """Execute object grasping"""
        self.node.get_logger().info(f'Grasping {obj_name}')
        return self.action_executor.execute_action({'action': 'grasp_object', 'target': obj_name})

    def execute_destination_determination(self, obj_name: str) -> bool:
        """Determine appropriate destination for object"""
        destination = self.action_executor.get_appropriate_destination(obj_name)
        self.node.get_logger().info(f'Determined destination for {obj_name}: {destination}')
        return True

    def execute_navigation_to_destination(self, destination: str) -> bool:
        """Execute navigation to destination"""
        self.node.get_logger().info(f'Navigating to destination: {destination}')
        return self.action_executor.execute_action({'action': 'navigate_to_destination', 'target': destination})

    def execute_placement(self, obj_name: str) -> bool:
        """Execute object placement"""
        self.node.get_logger().info(f'Placing {obj_name}')
        return self.action_executor.execute_action({'action': 'place_object', 'target': obj_name})

    def execute_inspection(self, area_type: str) -> bool:
        """Execute final inspection"""
        self.node.get_logger().info(f'Inspecting {area_type} after cleaning')
        return self.action_executor.execute_action({'action': 'inspect_area', 'target': area_type})
```

## Advanced Features

### 1. Adaptive Cleaning Strategy

```python
class AdaptiveCleaningStrategy:
    def __init__(self):
        self.object_priority = {
            'trash': 1,
            'clutter': 2,
            'papers': 3,
            'books': 4,
            'clothes': 5,
            'toys': 6
        }

        self.room_layout = {}  # Would contain actual room layout information

    def prioritize_cleaning_sequence(self, objects_to_clean: List[str]) -> List[str]:
        """
        Prioritize the cleaning sequence based on object type and importance
        """
        # Sort objects by priority (lower number = higher priority)
        return sorted(objects_to_clean,
                     key=lambda obj: self.object_priority.get(obj, 10))

    def adapt_to_environment(self, room_survey: Dict[str, Any]) -> List[str]:
        """
        Adapt cleaning strategy based on environmental factors
        """
        # Consider factors like room layout, object density, lighting, etc.
        objects = room_survey.get('detected_objects', [])

        # Prioritize based on location and accessibility
        priority_objects = []
        for obj in objects:
            if obj['confidence'] > 0.8:  # High confidence detections first
                priority_objects.append(obj['name'])

        return self.prioritize_cleaning_sequence(priority_objects)
```

### 2. Learning from Experience

```python
class CleaningExperienceLearner:
    def __init__(self):
        self.cleaning_history = []
        self.success_patterns = {}

    def record_cleaning_experience(self, command: str, sequence: List[Dict], success: bool):
        """
        Record the experience for future learning
        """
        experience = {
            'command': command,
            'sequence': sequence,
            'success': success,
            'timestamp': time.time()
        }
        self.cleaning_history.append(experience)

    def suggest_improvements(self, new_command: str) -> List[str]:
        """
        Suggest improvements based on past experiences
        """
        # Analyze similar past commands and their outcomes
        similar_experiences = [
            exp for exp in self.cleaning_history
            if new_command.lower() in exp['command'].lower()
        ]

        if not similar_experiences:
            return ["No past experience to suggest improvements"]

        # Find patterns in successful vs unsuccessful experiences
        successful_sequences = [
            exp['sequence'] for exp in similar_experiences if exp['success']
        ]

        if successful_sequences:
            return ["Based on past experience, this approach has been successful"]
        else:
            return ["Warning: Similar commands have failed in the past"]
```

## Performance Optimization

### 1. Parallel Object Processing

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class ParallelCleaningProcessor:
    def __init__(self, cleaning_system):
        self.cleaning_system = cleaning_system
        self.executor = ThreadPoolExecutor(max_workers=3)

    async def process_multiple_objects(self, objects: List[str]) -> List[Dict[str, Any]]:
        """
        Process multiple objects in parallel where possible
        """
        results = []

        # Process objects in batches to avoid overwhelming the robot
        for i in range(0, len(objects), 2):  # Process 2 objects at a time
            batch = objects[i:i+2]
            batch_results = await self.process_batch(batch)
            results.extend(batch_results)

        return results

    async def process_batch(self, batch: List[str]) -> List[Dict[str, Any]]:
        """
        Process a batch of objects
        """
        loop = asyncio.get_event_loop()

        tasks = []
        for obj in batch:
            task = loop.run_in_executor(
                self.executor,
                self.process_single_object,
                obj
            )
            tasks.append(task)

        return await asyncio.gather(*tasks)

    def process_single_object(self, obj_name: str) -> Dict[str, Any]:
        """
        Process a single object (runs in thread pool)
        """
        # Execute the sequence for this specific object
        action_sequence = [
            {'action': 'detect_object', 'target': obj_name, 'description': f'Detect {obj_name}'},
            {'action': 'approach_object', 'target': obj_name, 'description': f'Approach {obj_name}'},
            {'action': 'grasp_object', 'target': obj_name, 'description': f'Grasp {obj_name}'},
            {'action': 'place_object', 'target': obj_name, 'description': f'Place {obj_name}'}
        ]

        results = []
        for action in action_sequence:
            success = self.cleaning_system.execute_single_action(action)
            results.append({'action': action, 'success': success})

        return {'object': obj_name, 'results': results, 'success': all(r['success'] for r in results)}
```

## Testing the Implementation

### Unit Tests

```python
import unittest
from unittest.mock import Mock, MagicMock

class TestRoomCleaningSystem(unittest.TestCase):
    def setUp(self):
        # Create a mock node
        self.mock_node = Mock()
        self.mock_node.get_logger = Mock()

        self.cleaning_system = RoomCleaningSystem(self.mock_node)

    def test_clean_room_command_parsing(self):
        """Test that clean room commands are parsed correctly"""
        command = "Clean the room"
        result = self.cleaning_system.command_parser.parse_cleaning_command(command)

        self.assertTrue(result['has_cleaning_intent'])
        self.assertIn('survey_area', [action['action'] for action in result['action_sequence']])

    def test_specific_cleaning_command(self):
        """Test specific cleaning commands"""
        command = "Pick up the red cup from the table"
        result = self.cleaning_system.command_parser.parse_cleaning_command(command)

        self.assertIn('cup', result['objects_to_clean'])
        self.assertTrue(any('detect_object' in str(action) for action in result['action_sequence']))

    def test_cleaning_sequence_generation(self):
        """Test that appropriate sequences are generated"""
        command = "Clean the desk"
        result = self.cleaning_system.command_parser.parse_cleaning_command(command)

        actions = [action['action'] for action in result['action_sequence']]
        expected_actions = ['navigate_to', 'survey_area', 'detect_object', 'grasp_object', 'place_object']

        for expected in expected_actions:
            self.assertIn(expected, actions)

if __name__ == '__main__':
    unittest.main()
```

## Integration with Isaac Sim

```python
class IsaacSimCleaningIntegration:
    def __init__(self, node):
        self.node = node
        # Initialize Isaac Sim interfaces
        self.isaac_sim_interface = self.initialize_isaac_interface()

    def initialize_isaac_interface(self):
        """
        Initialize interface with Isaac Sim for simulation-based cleaning
        """
        class MockIsaacSimInterface:
            def get_environment_state(self):
                # Return simulated environment state
                return {
                    'objects': [
                        {'name': 'cup', 'position': [1.0, 2.0, 0.0], 'type': 'dishware'},
                        {'name': 'book', 'position': [0.5, 1.5, 0.0], 'type': 'stationery'},
                        {'name': 'papers', 'position': [-0.2, 0.8, 0.0], 'type': 'documents'}
                    ],
                    'robot_position': [0.0, 0.0, 0.0],
                    'navigation_map': 'simulated_map'
                }

            def execute_robot_action(self, action, parameters):
                # Simulate robot action in Isaac Sim
                self.node.get_logger().info(f'Simulating action in Isaac Sim: {action}')
                return True  # Simulate success

        return MockIsaacSimInterface()

    def simulate_cleaning_in_isaac(self, command: str) -> Dict[str, Any]:
        """
        Simulate the cleaning process in Isaac Sim
        """
        # Get current environment state
        env_state = self.isaac_sim_interface.get_environment_state()

        # Parse and execute cleaning command
        cleaning_system = RoomCleaningSystem(self.node)
        result = cleaning_system.execute_clean_room_command(command)

        # Update simulation based on results
        final_env_state = self.isaac_sim_interface.get_environment_state()

        return {
            'initial_state': env_state,
            'final_state': final_env_state,
            'cleaning_result': result,
            'simulation_successful': True
        }
```

## Conclusion

The "Clean the Room" example demonstrates the complexity and sophistication of VLA systems. It shows how a simple natural language command can trigger:

1. **Advanced language understanding** to decompose the command
2. **Perception systems** to identify objects and environments
3. **Planning algorithms** to sequence complex actions
4. **Execution systems** to carry out the tasks
5. **Adaptive behaviors** to handle real-world uncertainties

This example provides a comprehensive framework for students to understand and implement complex multi-step tasks in VLA systems. The modular design allows for easy extension and customization for different cleaning scenarios and environments.