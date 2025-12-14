---
title: Object Recognition and Grasping Commands
sidebar_position: 6
---

# Object Recognition and Grasping Commands

## Introduction

Object recognition and grasping are fundamental capabilities in Vision-Language-Action (VLA) systems. This module covers the integration of computer vision, natural language processing, and robotic manipulation to enable robots to recognize, locate, and grasp objects based on natural language commands.

## Object Recognition Pipeline

### Vision Processing Integration

The first step in object grasping is recognizing and localizing objects in the robot's field of view:

```python
import numpy as np
import cv2
from typing import List, Dict, Tuple, Optional
import torch

class ObjectRecognitionPipeline:
    def __init__(self, node):
        self.node = node
        self.object_detector = self.initialize_object_detector()
        self.segmentation_model = self.initialize_segmentation_model()
        self.grasp_planner = GraspPlanner()

    def initialize_object_detector(self):
        """
        Initialize object detection model (could be YOLO, Detectron2, etc.)
        """
        class MockObjectDetector:
            def detect_objects(self, image: np.ndarray) -> List[Dict]:
                # Simulate object detection results
                # In practice, this would use a real detection model
                height, width = image.shape[:2]

                return [
                    {
                        'name': 'red cup',
                        'bbox': [int(width*0.3), int(height*0.4), int(width*0.4), int(height*0.6)],
                        'confidence': 0.92,
                        'class_id': 0
                    },
                    {
                        'name': 'blue book',
                        'bbox': [int(width*0.6), int(height*0.3), int(width*0.8), int(height*0.5)],
                        'confidence': 0.88,
                        'class_id': 1
                    },
                    {
                        'name': 'green bottle',
                        'bbox': [int(width*0.2), int(height*0.6), int(width*0.35), int(height*0.8)],
                        'confidence': 0.85,
                        'class_id': 2
                    }
                ]

        return MockObjectDetector()

    def initialize_segmentation_model(self):
        """
        Initialize semantic/instance segmentation model
        """
        class MockSegmentationModel:
            def segment_objects(self, image: np.ndarray) -> np.ndarray:
                # Simulate segmentation mask
                height, width = image.shape[:2]
                mask = np.zeros((height, width), dtype=np.uint8)

                # Create mock segmentation masks
                cv2.rectangle(mask, (int(width*0.3), int(height*0.4)), (int(width*0.4), int(height*0.6)), 1, -1)
                cv2.rectangle(mask, (int(width*0.6), int(height*0.3)), (int(width*0.8), int(height*0.5)), 2, -1)
                cv2.rectangle(mask, (int(width*0.2), int(height*0.6)), (int(width*0.35), int(height*0.8)), 3, -1)

                return mask

        return MockSegmentationModel()

    def process_visual_input(self, image: np.ndarray, language_query: str) -> Dict[str, any]:
        """
        Process visual input with language guidance to find specific objects
        """
        # Detect all objects
        detections = self.object_detector.detect_objects(image)

        # Filter based on language query
        relevant_objects = self.filter_objects_by_language(detections, language_query)

        # Segment the relevant objects
        segmentation_mask = self.segmentation_model.segment_objects(image)

        # Combine detection and segmentation results
        results = []
        for obj in relevant_objects:
            obj_mask = (segmentation_mask == obj['class_id']).astype(np.uint8)
            obj['mask'] = obj_mask

            # Calculate object properties
            obj['centroid'] = self.calculate_centroid(obj['bbox'])
            obj['area'] = self.calculate_area(obj['bbox'])

            results.append(obj)

        return {
            'objects': results,
            'image': image,
            'language_query': language_query,
            'detection_time': 0.1,  # Simulated
            'confidence_threshold': 0.8
        }

    def filter_objects_by_language(self, detections: List[Dict], language_query: str) -> List[Dict]:
        """
        Filter detected objects based on natural language query
        """
        query_lower = language_query.lower()
        filtered_objects = []

        for detection in detections:
            obj_name = detection['name'].lower()

            # Check if object name matches query
            if self.object_matches_query(obj_name, query_lower):
                filtered_objects.append(detection)
            else:
                # Check for color descriptors
                if self.color_matches_query(detection, query_lower):
                    filtered_objects.append(detection)

        return filtered_objects

    def object_matches_query(self, obj_name: str, query: str) -> bool:
        """
        Check if object name matches the query
        """
        # Direct name match
        if obj_name in query:
            return True

        # Check for variations and synonyms
        obj_synonyms = {
            'cup': ['cup', 'mug', 'glass', 'drink'],
            'book': ['book', 'novel', 'textbook', 'magazine', 'journal'],
            'bottle': ['bottle', 'container', 'jug', 'vessel'],
            'phone': ['phone', 'cellphone', 'mobile', 'smartphone'],
            'keys': ['keys', 'keychain', 'key ring'],
            'laptop': ['laptop', 'computer', 'pc', 'notebook'],
            'pen': ['pen', 'pencil', 'marker', 'stylus']
        }

        for base_obj, variants in obj_synonyms.items():
            if base_obj in query:
                if any(variant in obj_name for variant in variants):
                    return True

        return False

    def color_matches_query(self, detection: Dict, query: str) -> bool:
        """
        Check if object color matches the query
        """
        # Simple color matching based on object name prefixes
        color_keywords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray']

        obj_name = detection['name'].lower()

        for color in color_keywords:
            if color in query and color in obj_name:
                return True

        return False

    def calculate_centroid(self, bbox: List[int]) -> Tuple[float, float]:
        """
        Calculate the centroid of a bounding box
        """
        x1, y1, x2, y2 = bbox
        return ((x1 + x2) / 2, (y1 + y2) / 2)

    def calculate_area(self, bbox: List[int]) -> float:
        """
        Calculate the area of a bounding box
        """
        x1, y1, x2, y2 = bbox
        return (x2 - x1) * (y2 - y1)
```

## Grasp Planning System

### Grasp Pose Estimation

```python
class GraspPlanner:
    def __init__(self):
        self.approach_distance = 0.1  # meters
        self.grasp_height_offset = 0.05  # meters
        self.max_retries = 3

    def plan_grasp_poses(self, object_info: Dict, camera_pose: Dict) -> List[Dict]:
        """
        Plan multiple grasp poses for an object
        """
        grasp_poses = []

        # Calculate multiple grasp options
        centroid = object_info['centroid']
        bbox = object_info['bbox']

        # Option 1: Top-down grasp
        top_down_pose = self.calculate_top_down_grasp(centroid, object_info)
        if top_down_pose:
            grasp_poses.append({
                'pose': top_down_pose,
                'type': 'top_down',
                'confidence': 0.9,
                'approach_vector': [0, 0, -1]  # Approaching from above
            })

        # Option 2: Side grasp
        side_grasp_pose = self.calculate_side_grasp(bbox, object_info)
        if side_grasp_pose:
            grasp_poses.append({
                'pose': side_grasp_pose,
                'type': 'side_grasp',
                'confidence': 0.8,
                'approach_vector': [1, 0, 0]  # Approaching from side
            })

        # Option 3: Diagonal approach
        diagonal_pose = self.calculate_diagonal_grasp(centroid, object_info)
        if diagonal_pose:
            grasp_poses.append({
                'pose': diagonal_pose,
                'type': 'diagonal',
                'confidence': 0.7,
                'approach_vector': [0.7, 0.7, 0]  # Diagonal approach
            })

        # Sort by confidence
        grasp_poses.sort(key=lambda x: x['confidence'], reverse=True)

        return grasp_poses

    def calculate_top_down_grasp(self, centroid: Tuple[float, float], object_info: Dict) -> Optional[Dict]:
        """
        Calculate top-down grasp pose
        """
        x, y = centroid
        # For top-down, we approach from above the object
        return {
            'position': {'x': x, 'y': y, 'z': object_info.get('height', 0.1) + self.grasp_height_offset},
            'orientation': {'x': 0, 'y': 0, 'z': 0, 'w': 1}  # Looking down
        }

    def calculate_side_grasp(self, bbox: List[int], object_info: Dict) -> Optional[Dict]:
        """
        Calculate side grasp pose
        """
        x1, y1, x2, y2 = bbox
        width = x2 - x1
        height = y2 - y1

        # For side grasp, approach from the side
        if width > height:
            # Wide object - approach from shorter side
            approach_x = x1 - self.approach_distance
            approach_y = (y1 + y2) / 2
        else:
            # Tall object - approach from side
            approach_x = (x1 + x2) / 2
            approach_y = y1 - self.approach_distance

        return {
            'position': {'x': approach_x, 'y': approach_y, 'z': (y2 + y1) / 2},
            'orientation': {'x': 0, 'y': 0, 'z': 1, 'w': 0}  # Sideways orientation
        }

    def calculate_diagonal_grasp(self, centroid: Tuple[float, float], object_info: Dict) -> Optional[Dict]:
        """
        Calculate diagonal approach grasp
        """
        x, y = centroid
        return {
            'position': {'x': x - 0.05, 'y': y - 0.05, 'z': object_info.get('height', 0.1)},
            'orientation': {'x': 0, 'y': 0, 'z': 0.707, 'w': 0.707}  # 45-degree angle
        }

    def evaluate_grasp_feasibility(self, grasp_pose: Dict, object_info: Dict, robot_state: Dict) -> Dict:
        """
        Evaluate if a grasp pose is feasible
        """
        # Check if robot can reach the position
        robot_position = robot_state.get('position', {'x': 0, 'y': 0, 'z': 0})

        grasp_pos = grasp_pose['pose']['position']
        distance = self.calculate_distance(robot_position, grasp_pos)

        # Check if within reach
        max_reach = robot_state.get('max_reach', 1.0)  # meters
        reachable = distance <= max_reach

        # Check for collisions in approach path
        collision_free = self.check_approach_path(grasp_pose, object_info)

        return {
            'reachable': reachable,
            'collision_free': collision_free,
            'feasibility_score': 0.8 if reachable and collision_free else 0.2,
            'estimated_success_rate': 0.7 if reachable and collision_free else 0.1
        }

    def calculate_distance(self, pos1: Dict, pos2: Dict) -> float:
        """
        Calculate 3D distance between two positions
        """
        dx = pos2['x'] - pos1['x']
        dy = pos2['y'] - pos1['y']
        dz = pos2['z'] - pos1['z']
        return (dx*dx + dy*dy + dz*dz)**0.5

    def check_approach_path(self, grasp_pose: Dict, object_info: Dict) -> bool:
        """
        Check if approach path is collision-free
        """
        # In simulation, assume path is clear
        # In real robot, this would check point cloud or map
        return True
```

## Language-Guided Object Selection

### Natural Language Understanding for Grasping

```python
class LanguageGuidedGrasping:
    def __init__(self, node):
        self.node = node
        self.recognition_pipeline = ObjectRecognitionPipeline(node)
        self.grasp_planner = GraspPlanner()

    def process_grasping_command(self, image: np.ndarray, command: str) -> Dict[str, any]:
        """
        Process a grasping command with natural language guidance
        """
        self.node.get_logger().info(f'Processing grasping command: {command}')

        # Step 1: Process visual input guided by language
        vision_results = self.recognition_pipeline.process_visual_input(image, command)

        if not vision_results['objects']:
            self.node.get_logger().warn(f'No objects detected for command: {command}')
            return {
                'success': False,
                'error': 'No matching objects found',
                'command': command,
                'vision_results': vision_results
            }

        # Step 2: Select the most relevant object based on command
        selected_object = self.select_target_object(vision_results['objects'], command)

        if not selected_object:
            self.node.get_logger().warn(f'No suitable object selected for command: {command}')
            return {
                'success': False,
                'error': 'No suitable object found',
                'command': command,
                'vision_results': vision_results
            }

        # Step 3: Plan grasp poses for the selected object
        grasp_poses = self.grasp_planner.plan_grasp_poses(selected_object, {})

        # Step 4: Evaluate feasibility of grasp poses
        robot_state = self.get_robot_state()
        feasible_poses = []

        for pose in grasp_poses:
            feasibility = self.grasp_planner.evaluate_grasp_feasibility(pose, selected_object, robot_state)
            if feasibility['feasibility_score'] > 0.5:
                pose['feasibility'] = feasibility
                feasible_poses.append(pose)

        if not feasible_poses:
            self.node.get_logger().warn(f'No feasible grasp poses found for {selected_object["name"]}')
            return {
                'success': False,
                'error': 'No feasible grasp poses available',
                'command': command,
                'selected_object': selected_object,
                'grasp_attempts': grasp_poses
            }

        # Step 5: Return the best grasp plan
        best_pose = feasible_poses[0]  # Take the highest confidence feasible pose

        result = {
            'success': True,
            'command': command,
            'selected_object': selected_object,
            'grasp_plan': best_pose,
            'alternative_poses': feasible_poses[1:],
            'vision_results': vision_results,
            'robot_state': robot_state
        }

        self.node.get_logger().info(f'Grasp plan generated for {selected_object["name"]}')
        return result

    def select_target_object(self, objects: List[Dict], command: str) -> Optional[Dict]:
        """
        Select the most appropriate object based on the command
        """
        command_lower = command.lower()

        # Prioritize objects based on relevance to command
        scored_objects = []

        for obj in objects:
            score = 0
            obj_name = obj['name'].lower()

            # Exact name match gets high score
            if obj_name in command_lower:
                score += 10

            # Color match
            color_keywords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray']
            for color in color_keywords:
                if color in command_lower and color in obj_name:
                    score += 5
                    break

            # Size-based selection (if command mentions size)
            size_keywords = {
                'big': ['large', 'big', 'huge'],
                'small': ['small', 'tiny', 'little'],
                'large': ['large', 'big', 'huge'],
                'tiny': ['small', 'tiny', 'little']
            }

            for size_keyword, size_variants in size_keywords.items():
                if size_keyword in command_lower:
                    # This would require size estimation from bounding box
                    # For now, give bonus based on area
                    area = obj.get('area', 0)
                    if size_keyword in ['big', 'large'] and area > 5000:  # arbitrary threshold
                        score += 3
                    elif size_keyword in ['small', 'tiny'] and area < 2000:  # arbitrary threshold
                        score += 3

            # Confidence bonus
            score += obj['confidence'] * 2

            scored_objects.append((obj, score))

        # Sort by score and return the best one
        if scored_objects:
            best_obj, best_score = max(scored_objects, key=lambda x: x[1])
            return best_obj

        return None

    def get_robot_state(self) -> Dict:
        """
        Get current robot state (position, capabilities, etc.)
        """
        # In real implementation, this would query robot state
        return {
            'position': {'x': 0, 'y': 0, 'z': 0},
            'max_reach': 1.0,  # meters
            'end_effector': 'gripper',
            'gripper_width': 0.1,  # meters
            'gripper_force': 50,  # Newtons
            'capabilities': ['navigation', 'manipulation', 'grasping']
        }
```

## Grasp Execution System

### ROS 2 Action Integration

```python
from rclpy.action import ActionClient
from control_msgs.action import FollowJointTrajectory
from geometry_msgs.msg import PoseStamped
from moveit_msgs.action import MoveGroup

class GraspExecutionSystem:
    def __init__(self, node):
        self.node = node
        self.language_grasper = LanguageGuidedGrasping(node)

        # Initialize action clients
        self.trajectory_client = ActionClient(node, FollowJointTrajectory, 'joint_trajectory_controller/follow_joint_trajectory')
        self.move_group_client = ActionClient(node, MoveGroup, 'move_group')

        # Initialize publishers for gripper control
        self.gripper_pub = node.create_publisher(PoseStamped, 'gripper/command', 10)

    def execute_grasp_command(self, image: np.ndarray, command: str) -> Dict[str, any]:
        """
        Execute a complete grasp command from perception to execution
        """
        # Step 1: Plan the grasp
        plan_result = self.language_grasper.process_grasping_command(image, command)

        if not plan_result['success']:
            return plan_result

        # Step 2: Execute the grasp
        execution_result = self.execute_grasp_plan(plan_result)

        # Combine planning and execution results
        final_result = {
            **plan_result,
            'execution_result': execution_result,
            'overall_success': execution_result['success']
        }

        return final_result

    def execute_grasp_plan(self, plan_result: Dict) -> Dict[str, any]:
        """
        Execute the planned grasp
        """
        grasp_plan = plan_result['grasp_plan']
        target_object = plan_result['selected_object']

        try:
            # Step 1: Navigate to object if needed
            nav_success = self.navigate_to_object(target_object)

            if not nav_success:
                return {
                    'success': False,
                    'error': 'Navigation to object failed',
                    'phase': 'navigation'
                }

            # Step 2: Move to pre-grasp position
            pre_grasp_success = self.move_to_pre_grasp(grasp_plan)

            if not pre_grasp_success:
                return {
                    'success': False,
                    'error': 'Pre-grasp positioning failed',
                    'phase': 'pre_grasp'
                }

            # Step 3: Execute grasp approach
            approach_success = self.execute_grasp_approach(grasp_plan)

            if not approach_success:
                return {
                    'success': False,
                    'error': 'Grasp approach failed',
                    'phase': 'approach'
                }

            # Step 4: Close gripper
            grip_success = self.close_gripper()

            if not grip_success:
                return {
                    'success': False,
                    'error': 'Gripper closure failed',
                    'phase': 'grip'
                }

            # Step 5: Lift object
            lift_success = self.lift_object()

            if not lift_success:
                return {
                    'success': False,
                    'error': 'Object lifting failed',
                    'phase': 'lift'
                }

            # All steps successful
            return {
                'success': True,
                'phase': 'complete',
                'object_grasped': target_object['name'],
                'execution_time': 5.0  # Simulated
            }

        except Exception as e:
            self.node.get_logger().error(f'Grasp execution failed: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'phase': 'exception'
            }

    def navigate_to_object(self, target_object: Dict) -> bool:
        """
        Navigate robot to a position where the object is accessible
        """
        self.node.get_logger().info(f'Navigating to object: {target_object["name"]}')

        # Calculate navigation target (position near the object)
        centroid = target_object['centroid']
        # In practice, this would convert pixel coordinates to world coordinates
        # and use navigation stack to move robot

        # Simulate navigation success
        return True

    def move_to_pre_grasp(self, grasp_plan: Dict) -> bool:
        """
        Move robot arm to pre-grasp position
        """
        self.node.get_logger().info('Moving to pre-grasp position')

        # Use MoveIt! or similar to plan and execute arm movement
        # This would send a MoveGroup action goal

        # Simulate pre-grasp movement
        return True

    def execute_grasp_approach(self, grasp_plan: Dict) -> bool:
        """
        Execute the approach to grasp the object
        """
        self.node.get_logger().info('Executing grasp approach')

        # Move to the grasp pose calculated by the planner
        # This involves fine control of the end effector

        # Simulate approach
        return True

    def close_gripper(self) -> bool:
        """
        Close the robot gripper to grasp the object
        """
        self.node.get_logger().info('Closing gripper')

        # Send gripper control command
        # In practice, this would publish to gripper controller

        # Simulate gripper closure
        return True

    def lift_object(self) -> bool:
        """
        Lift the grasped object to a safe height
        """
        self.node.get_logger().info('Lifting object')

        # Move the arm to lift the object
        # This prevents dragging the object on surface

        # Simulate lift
        return True

    def open_gripper(self) -> bool:
        """
        Open the gripper to release an object
        """
        self.node.get_logger().info('Opening gripper')

        # Send gripper open command
        return True
```

## Error Handling and Recovery

### Grasp Failure Detection and Recovery

```python
class GraspErrorHandling:
    def __init__(self, node, execution_system):
        self.node = node
        self.execution_system = execution_system
        self.failure_history = []
        self.recovery_strategies = [
            'try_different_grasp_pose',
            'adjust_approach_angle',
            'use_visual_servoing',
            'request_human_assistance'
        ]

    def handle_grasp_failure(self, failure_info: Dict) -> Dict[str, any]:
        """
        Handle grasp failure and attempt recovery
        """
        self.node.get_logger().error(f'Grasp failure: {failure_info}')

        # Record failure
        failure_record = {
            'timestamp': self.node.get_clock().now(),
            'failure_phase': failure_info.get('phase', 'unknown'),
            'error_message': failure_info.get('error', 'unknown'),
            'attempted_object': failure_info.get('object', 'unknown'),
            'environment_state': self.get_environment_state()
        }
        self.failure_history.append(failure_record)

        # Determine appropriate recovery strategy
        recovery_strategy = self.select_recovery_strategy(failure_info)

        if recovery_strategy == 'try_different_grasp_pose':
            return self.attempt_different_grasp_pose(failure_info)
        elif recovery_strategy == 'adjust_approach_angle':
            return self.adjust_approach_angle(failure_info)
        elif recovery_strategy == 'use_visual_servoing':
            return self.use_visual_servoing_recovery(failure_info)
        elif recovery_strategy == 'request_human_assistance':
            return self.request_human_assistance(failure_info)
        else:
            return {
                'success': False,
                'error': 'No viable recovery strategy',
                'failure_info': failure_info
            }

    def select_recovery_strategy(self, failure_info: Dict) -> str:
        """
        Select the most appropriate recovery strategy based on failure type
        """
        phase = failure_info.get('phase', 'unknown')
        error = failure_info.get('error', '').lower()

        # Different strategies for different failure types
        if phase == 'navigation':
            return 'try_different_grasp_pose'  # Try to reach from a different angle
        elif phase == 'pre_grasp' or 'collision' in error:
            return 'adjust_approach_angle'
        elif phase == 'approach' or 'grasp' in error:
            return 'try_different_grasp_pose'
        elif phase == 'grip' and 'slipped' in error:
            return 'adjust_approach_angle'  # Try with different grasp force
        else:
            # Analyze historical data to select strategy
            return self.select_strategy_from_history(failure_info)

    def select_strategy_from_history(self, failure_info: Dict) -> str:
        """
        Select recovery strategy based on historical success rates
        """
        # Simple heuristic: try different grasp pose for most failures
        return 'try_different_grasp_pose'

    def attempt_different_grasp_pose(self, failure_info: Dict) -> Dict[str, any]:
        """
        Attempt to grasp using a different pose
        """
        self.node.get_logger().info('Attempting recovery with different grasp pose')

        # Get the original command and object
        original_command = failure_info.get('command', '')
        original_object = failure_info.get('object', {})

        if not original_command or not original_object:
            return {
                'success': False,
                'error': 'Cannot recover - missing original command/object info'
            }

        # Re-process with same command to get alternative poses
        # In practice, this would use the same image that was originally processed
        # For simulation, we'll fabricate a result with alternative poses

        # Simulate getting alternative grasp poses
        alternative_poses = [
            {'pose': {'position': {'x': 0.1, 'y': 0.1, 'z': 0.1}}, 'type': 'side_approach', 'confidence': 0.85},
            {'pose': {'position': {'x': 0.05, 'y': 0.15, 'z': 0.1}}, 'type': 'diagonal', 'confidence': 0.75}
        ]

        for alternative_pose in alternative_poses:
            # Try to execute with alternative pose
            try:
                # This is a simplified simulation
                # In real implementation, we'd need to execute the actual grasp
                self.node.get_logger().info(f'Trying alternative grasp: {alternative_pose["type"]}')

                # Simulate success with second alternative
                if alternative_pose['type'] == 'diagonal':
                    return {
                        'success': True,
                        'recovery_strategy': 'try_different_grasp_pose',
                        'successful_pose': alternative_pose,
                        'message': 'Successfully recovered with alternative grasp pose'
                    }

            except Exception as e:
                self.node.get_logger().error(f'Recovery attempt failed: {str(e)}')
                continue

        return {
            'success': False,
            'error': 'All recovery attempts failed',
            'recovery_strategy': 'try_different_grasp_pose',
            'attempts_made': len(alternative_poses)
        }

    def adjust_approach_angle(self, failure_info: Dict) -> Dict[str, any]:
        """
        Adjust the approach angle and try again
        """
        self.node.get_logger().info('Attempting recovery by adjusting approach angle')

        # Modify approach parameters and retry
        # This would involve recalculating grasp poses with different approach vectors

        # Simulate adjusted approach
        return {
            'success': True,
            'recovery_strategy': 'adjust_approach_angle',
            'message': 'Successfully recovered by adjusting approach angle'
        }

    def get_environment_state(self) -> Dict:
        """
        Get current environment state for failure analysis
        """
        return {
            'lighting_conditions': 'normal',
            'object_properties': 'standard',
            'obstacles': 'few',
            'workspace_clearance': 'adequate'
        }
```

## Practical Implementation Examples

### Example 1: "Grasp the red cup"

```python
def grasp_red_cup_example():
    """
    Complete example of grasping a red cup
    """
    # Simulate an image with objects
    import numpy as np

    # Create a mock image
    mock_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

    # Simulate the complete grasping process
    class MockNode:
        def get_logger(self):
            return MockLogger()

        def get_clock(self):
            import time
            class MockClock:
                def now(self):
                    return time.time()
            return MockClock()

    class MockLogger:
        def info(self, msg):
            print(f"INFO: {msg}")

        def warn(self, msg):
            print(f"WARN: {msg}")

        def error(self, msg):
            print(f"ERROR: {msg}")

    # Initialize the system
    node = MockNode()
    execution_system = GraspExecutionSystem(node)

    # Execute the command
    command = "Grasp the red cup"
    result = execution_system.execute_grasp_command(mock_image, command)

    print("\nGrasp Execution Result:")
    print(f"Success: {result['overall_success']}")
    print(f"Selected Object: {result['selected_object']['name']}")
    print(f"Grasp Pose: {result['grasp_plan']['type']}")

    return result
```

### Example 2: "Pick up the book near the laptop"

```python
def pick_up_book_near_laptop_example():
    """
    Example of picking up a book near another object
    """
    import numpy as np

    # Create a mock image
    mock_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

    class MockNode:
        def get_logger(self):
            return MockLogger()

        def get_clock(self):
            import time
            class MockClock:
                def now(self):
                    return time.time()
            return MockClock()

    class MockLogger:
        def info(self, msg):
            print(f"INFO: {msg}")

        def warn(self, msg):
            print(f"WARN: {msg}")

        def error(self, msg):
            print(f"ERROR: {msg}")

    # Initialize the system
    node = MockNode()
    execution_system = GraspExecutionSystem(node)

    # Execute the command
    command = "Pick up the book near the laptop"
    result = execution_system.execute_grasp_command(mock_image, command)

    print("\nGrasp Execution Result:")
    print(f"Success: {result['overall_success']}")
    if result['overall_success']:
        print(f"Selected Object: {result['selected_object']['name']}")
        print(f"Context: Book near laptop identified")
        print(f"Grasp Pose: {result['grasp_plan']['type']}")

    return result
```

## Performance Considerations

### Real-Time Processing Requirements

```python
import time
from functools import wraps

def timing_decorator(func):
    """
    Decorator to measure execution time of functions
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time

        # Log if execution time exceeds threshold
        if execution_time > 0.1:  # 100ms threshold
            args[0].node.get_logger().warn(
                f'{func.__name__} took {execution_time:.3f}s (exceeds 100ms threshold)'
            )

        return result
    return wrapper

class OptimizedObjectRecognitionPipeline(ObjectRecognitionPipeline):
    """
    Optimized version with performance considerations
    """

    @timing_decorator
    def process_visual_input(self, image: np.ndarray, language_query: str) -> Dict[str, any]:
        """
        Optimized visual input processing with timing
        """
        # Resize image if too large for faster processing
        h, w = image.shape[:2]
        if h > 640 or w > 640:
            scale_factor = min(640/h, 640/w)
            new_h, new_w = int(h * scale_factor), int(w * scale_factor)
            image = cv2.resize(image, (new_w, new_h))

        return super().process_visual_input(image, language_query)

    def set_performance_mode(self, mode: str):
        """
        Set performance mode (fast, balanced, accurate)
        """
        if mode == 'fast':
            # Use faster but less accurate models
            self.confidence_threshold = 0.7
            self.max_objects_to_process = 5
        elif mode == 'balanced':
            self.confidence_threshold = 0.8
            self.max_objects_to_process = 10
        elif mode == 'accurate':
            self.confidence_threshold = 0.9
            self.max_objects_to_process = 20
```

## Integration with VLA Pipeline

The object grasping system integrates with the broader VLA pipeline:

1. **Input**: Natural language command + visual input
2. **Processing**: Language understanding → Object recognition → Grasp planning → Execution
3. **Output**: Successful grasp execution or error with recovery
4. **Feedback**: Object state updates and success metrics

## Hands-on Lab: Implement Object Grasping

### Lab Objective

Students will implement a complete object grasping pipeline that can handle commands like "grasp the red cup" or "pick up the book".

### Implementation Steps

1. Create an object recognition system that detects objects in images
2. Implement language-guided object selection
3. Plan grasp poses for detected objects
4. Execute grasping commands with error handling

### Expected Outcomes

After completing this lab, students should be able to:
- Integrate vision and language processing for object selection
- Plan appropriate grasp poses based on object properties
- Execute grasping commands with proper error handling
- Implement recovery strategies for failed grasps

## Summary

Object recognition and grasping represent a complex integration of multiple AI and robotics components. The system must:

1. **Perceive** the environment using computer vision
2. **Understand** natural language commands
3. **Plan** appropriate manipulation strategies
4. **Execute** grasping actions with precision
5. **Handle** errors and recover from failures

This module provides the foundation for building robust object manipulation capabilities in VLA systems, enabling robots to interact naturally with their environment based on human commands.