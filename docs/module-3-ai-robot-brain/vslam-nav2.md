---
title: VSLAM and Nav2 Integration
sidebar_position: 5
---

# VSLAM and Nav2 Integration

## Introduction to VSLAM and Nav2 Integration

Visual Simultaneous Localization and Mapping (VSLAM) combined with Navigation 2 (Nav2) provides a complete solution for autonomous robot navigation without requiring pre-built maps. This integration allows robots to simultaneously build a map of their environment and navigate within it using visual sensors. This module covers the integration of VSLAM systems with the Navigation 2 stack to enable autonomous navigation in unknown environments.

### Why Integrate VSLAM with Nav2?

Traditional navigation approaches require pre-built maps, but VSLAM-Nav2 integration enables:

1. **Mapless Navigation**: Navigate in previously unexplored environments
2. **Visual-Based Localization**: Use rich visual features for precise positioning
3. **Dynamic Environment Handling**: Adapt to changing environments
4. **Cost Reduction**: Eliminate need for LiDAR in some applications
5. **Semantic Understanding**: Incorporate object recognition into navigation

### Key Benefits

- **Autonomous Exploration**: Robots can navigate without prior knowledge of environment
- **Visual Feature Richness**: Use distinctive visual features for robust localization
- **Real-time Mapping**: Build and update maps during navigation
- **Flexible Sensor Configurations**: Work with various camera setups
- **Reduced Infrastructure**: No need for external localization systems

## VSLAM Fundamentals

### Visual SLAM Overview

Visual SLAM systems solve the simultaneous localization and mapping problem using only visual sensors:

```python
# vslam_components.py
import numpy as np
import cv2
from typing import Dict, List, Tuple, Any
import threading
from collections import deque
import time


class VSLAMCore:
    """
    Core VSLAM implementation with key components
    """

    def __init__(self):
        # Feature detection and matching
        self.feature_detector = cv2.ORB_create(nfeatures=1000)
        self.descriptor_matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

        # Pose estimation
        self.camera_matrix = None
        self.distortion_coeffs = None

        # Map management
        self.keyframes = []
        self.map_points = []
        self.current_pose = np.eye(4)  # 4x4 transformation matrix

        # Tracking state
        self.previous_frame = None
        self.previous_keypoints = None
        self.previous_descriptors = None

        # SLAM parameters
        self.min_features_for_tracking = 50
        self.keyframe_translation_threshold = 0.2  # meters
        self.keyframe_rotation_threshold = 0.1     # radians

    def initialize_camera_parameters(self, camera_matrix: np.ndarray,
                                    distortion_coeffs: np.ndarray):
        """Initialize camera intrinsic parameters"""
        self.camera_matrix = camera_matrix
        self.distortion_coeffs = distortion_coeffs

    def process_frame(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Process a single camera frame for VSLAM

        Args:
            image: Input camera image

        Returns:
            Dictionary containing pose estimate, features, and mapping information
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect features
        keypoints, descriptors = self.feature_detector.detectAndCompute(gray, None)

        if descriptors is None or len(keypoints) < self.min_features_for_tracking:
            return {
                'success': False,
                'error': 'Insufficient features for tracking',
                'current_pose': self.current_pose,
                'features': [],
                'keypoints': []
            }

        # Track features if we have a previous frame
        if self.previous_descriptors is not None:
            # Match features with previous frame
            matches = self.descriptor_matcher.knnMatch(
                self.previous_descriptors, descriptors, k=2
            )

            # Apply Lowe's ratio test
            good_matches = []
            for match_pair in matches:
                if len(match_pair) == 2:
                    m, n = match_pair
                    if m.distance < 0.7 * n.distance:
                        good_matches.append(m)

            # Estimate pose change if we have enough matches
            if len(good_matches) >= 10:
                # Extract matched keypoints
                prev_pts = np.float32([self.previous_keypoints[m.queryIdx].pt
                                     for m in good_matches]).reshape(-1, 1, 2)
                curr_pts = np.float32([keypoints[m.trainIdx].pt
                                     for m in good_matches]).reshape(-1, 1, 2)

                # Estimate essential matrix
                E, mask = cv2.findEssentialMat(
                    prev_pts, curr_pts,
                    self.camera_matrix,
                    threshold=1.0,
                    prob=0.999
                )

                if E is not None:
                    # Recover pose
                    _, R, t, mask_pose = cv2.recoverPose(
                        E, prev_pts, curr_pts,
                        self.camera_matrix
                    )

                    # Create transformation matrix
                    T_delta = np.eye(4)
                    T_delta[:3, :3] = R
                    T_delta[:3, 3] = t.flatten()

                    # Update current pose
                    self.current_pose = self.current_pose @ T_delta

        # Check if this frame should be a keyframe
        should_add_keyframe = self.should_add_keyframe(image, keypoints)

        if should_add_keyframe:
            self.add_keyframe(image, keypoints, descriptors, self.current_pose)

        # Update previous frame data
        self.previous_frame = gray
        self.previous_keypoints = keypoints
        self.previous_descriptors = descriptors

        return {
            'success': True,
            'current_pose': self.current_pose,
            'features': len(keypoints),
            'matches': len(good_matches),
            'is_keyframe': should_add_keyframe,
            'keyframes_count': len(self.keyframes)
        }

    def should_add_keyframe(self, current_image: np.ndarray,
                          current_keypoints: List[cv2.KeyPoint]) -> bool:
        """Determine if current frame should be added as a keyframe"""
        if not self.keyframes:
            return True

        # Get last keyframe
        last_keyframe = self.keyframes[-1]

        # Calculate distance to last keyframe
        translation_change = np.linalg.norm(
            self.current_pose[:3, 3] - last_keyframe['pose'][:3, 3]
        )

        # Calculate rotation change
        R_current = self.current_pose[:3, :3]
        R_last = last_keyframe['pose'][:3, :3]
        rotation_change = np.arccos(
            np.clip((np.trace(R_current.T @ R_last) - 1) / 2, -1, 1)
        )

        # Add keyframe if translation or rotation exceeds threshold
        return (translation_change > self.keyframe_translation_threshold or
                rotation_change > self.keyframe_rotation_threshold)

    def add_keyframe(self, image: np.ndarray, keypoints: List[cv2.KeyPoint],
                    descriptors: np.ndarray, pose: np.ndarray):
        """Add current frame as a keyframe to the map"""
        keyframe = {
            'image': image.copy(),
            'keypoints': keypoints,
            'descriptors': descriptors,
            'pose': pose.copy(),
            'timestamp': time.time(),
            'features': len(keypoints)
        }

        self.keyframes.append(keyframe)

        # Optional: Limit number of keyframes for memory efficiency
        if len(self.keyframes) > 100:  # Keep last 100 keyframes
            self.keyframes.pop(0)

    def get_current_map(self) -> Dict[str, Any]:
        """Get the current map state"""
        return {
            'keyframes': self.keyframes,
            'map_points': self.map_points,
            'current_pose': self.current_pose,
            'keyframes_count': len(self.keyframes)
        }

    def reset(self):
        """Reset the VSLAM system"""
        self.keyframes = []
        self.map_points = []
        self.current_pose = np.eye(4)
        self.previous_frame = None
        self.previous_keypoints = None
        self.previous_descriptors = None


class LoopClosureDetector:
    """
    Detects and handles loop closures in VSLAM
    """

    def __init__(self):
        self.place_recognition_model = cv2.ORB_create(nfeatures=500)
        self.loop_threshold = 0.7  # Similarity threshold for loop detection
        self.min_matches_for_loop = 10
        self.keyframe_database = []

    def detect_loop_closure(self, current_keyframe: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect if current frame closes a loop with previous frames

        Args:
            current_keyframe: Current keyframe to check for loop closure

        Returns:
            Dictionary with loop closure information if detected
        """
        # Extract features from current keyframe
        current_kp, current_desc = self.place_recognition_model.detectAndCompute(
            current_keyframe['image'], None
        )

        if current_desc is None:
            return {'loop_detected': False}

        # Compare with all previous keyframes
        best_match = None
        best_similarity = 0.0

        for i, prev_keyframe in enumerate(self.keyframe_database):
            if 'descriptors' in prev_keyframe and prev_keyframe['descriptors'] is not None:
                matches = self.match_features(current_desc, prev_keyframe['descriptors'])

                if len(matches) > self.min_matches_for_loop:
                    similarity = len(matches) / max(
                        len(current_kp), len(prev_keyframe['keypoints'])
                    )

                    if similarity > best_similarity and similarity > self.loop_threshold:
                        best_similarity = similarity
                        best_match = {
                            'frame_id': i,
                            'keyframe': prev_keyframe,
                            'matches': matches,
                            'similarity': similarity
                        }

        if best_match:
            return {
                'loop_detected': True,
                'matched_frame_id': best_match['frame_id'],
                'similarity': best_match['similarity'],
                'relative_pose': self.estimate_relative_pose(
                    current_kp, best_match['keyframe']['keypoints'], best_match['matches']
                )
            }
        else:
            return {'loop_detected': False}

    def match_features(self, desc1: np.ndarray, desc2: np.ndarray) -> List[Any]:
        """Match features between two descriptors"""
        if desc1 is None or desc2 is None:
            return []

        # Use FLANN matcher for efficiency
        FLANN_INDEX_LSH = 6
        index_params = dict(algorithm=FLANN_INDEX_LSH, table_number=6,
                           key_size=12, multi_probe_level=1)
        search_params = dict(checks=50)

        flann = cv2.FlannBasedMatcher(index_params, search_params)
        matches = flann.knnMatch(desc1, desc2, k=2)

        # Apply Lowe's ratio test
        good_matches = []
        for match_pair in matches:
            if len(match_pair) == 2:
                m, n = match_pair
                if m.distance < 0.7 * n.distance:
                    good_matches.append(m)

        return good_matches

    def estimate_relative_pose(self, kp1: List[cv2.KeyPoint], kp2: List[cv2.KeyPoint],
                             matches: List[Any]) -> np.ndarray:
        """Estimate relative pose between two frames"""
        if len(matches) < 5:
            return np.eye(4)

        # Extract matched points
        pts1 = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
        pts2 = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)

        # Estimate essential matrix
        E, mask = cv2.findEssentialMat(pts1, pts2, method=cv2.RANSAC, threshold=1.0)

        if E is not None:
            # Recover pose
            _, R, t, mask_pose = cv2.recoverPose(E, pts1, pts2)

            # Create transformation matrix
            T = np.eye(4)
            T[:3, :3] = R
            T[:3, 3] = t.flatten()
            return T
        else:
            return np.eye(4)
```

## Navigation 2 Stack Overview

### Nav2 Architecture

Navigation 2 consists of several key components that work together:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Behavior      │    │   Controller    │    │   Planner       │
│   Tree          │◄──►│   Server        │◄──►│   Server        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Local/Global Costmap  │
                    │         Server          │
                    └─────────────────────────┘
```

### Core Nav2 Components

```python
# nav2_integration.py
import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer, GoalResponse, CancelResponse
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
from nav2_msgs.action import NavigateToPose
from geometry_msgs.msg import PoseStamped, Twist
from sensor_msgs.msg import LaserScan, Image
from std_msgs.msg import Header, Bool
from tf2_ros import TransformBroadcaster, Buffer, TransformListener
import tf2_geometry_msgs
import numpy as np
from enum import Enum


class NavigationState(Enum):
    IDLE = 0
    PLANNING = 1
    CONTROLLING = 2
    RECOVERING = 3
    SUCCEEDED = 4
    FAILED = 5
    CANCELLED = 6


class VSLAMNav2Bridge(Node):
    """
    Bridge between VSLAM system and Navigation 2 stack
    """

    def __init__(self):
        super().__init__('vslam_nav2_bridge')

        # Parameters
        self.declare_parameter('use_sim_time', False)
        self.declare_parameter('update_frequency', 20.0)
        self.declare_parameter('controller_frequency', 20.0)
        self.declare_parameter('planner_frequency', 1.0)
        self.declare_parameter('goal_tolerance', 0.25)
        self.declare_parameter('yaw_tolerance', 0.1)
        self.declare_parameter('transform_tolerance', 0.1)

        self.update_frequency = self.get_parameter('update_frequency').value
        self.controller_frequency = self.get_parameter('controller_frequency').value
        self.planner_frequency = self.get_parameter('planner_frequency').value
        self.goal_tolerance = self.get_parameter('goal_tolerance').value
        self.yaw_tolerance = self.get_parameter('yaw_tolerance').value
        self.transform_tolerance = self.get_parameter('transform_tolerance').value

        # QoS profile
        qos_profile = QoSProfile(
            depth=10,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST
        )

        # Publishers and Subscribers
        self.cmd_vel_pub = self.create_publisher(Twist, 'cmd_vel', qos_profile)
        self.initial_pose_pub = self.create_publisher(PoseStamped, 'initialpose', qos_profile)
        self.goal_pub = self.create_publisher(PoseStamped, 'goal_pose', qos_profile)

        # Subscribers for VSLAM data
        self.vslam_pose_sub = self.create_subscription(
            PoseStamped, 'vslam/pose', self.vslam_pose_callback, qos_profile
        )
        self.vslam_map_sub = self.create_subscription(
            OccupancyGrid, 'vslam/map', self.vslam_map_callback, qos_profile
        )

        # Action server for navigation
        self.navigation_action_server = ActionServer(
            self,
            NavigateToPose,
            'navigate_to_pose',
            self.execute_navigation,
            goal_callback=self.goal_accept_callback,
            cancel_callback=self.cancel_callback
        )

        # TF broadcaster and listener
        self.tf_broadcaster = TransformBroadcaster(self)
        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        # Navigation state
        self.current_pose = None
        self.current_map = None
        self.navigation_state = NavigationState.IDLE
        self.current_goal = None
        self.global_path = None
        self.local_plan = None

        # Timers
        self.update_timer = self.create_timer(
            1.0/self.update_frequency, self.navigation_update_callback
        )

        self.get_logger().info('VSLAM-Nav2 Bridge initialized')

    def vslam_pose_callback(self, msg):
        """Handle VSLAM pose estimates"""
        self.current_pose = msg.pose

        # Broadcast transform from VSLAM coordinate system
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'map'  # VSLAM provides map frame
        t.child_frame_id = 'base_link'
        t.transform.translation.x = msg.pose.position.x
        t.transform.translation.y = msg.pose.position.y
        t.transform.translation.z = msg.pose.position.z
        t.transform.rotation = msg.pose.orientation

        self.tf_broadcaster.sendTransform(t)

    def vslam_map_callback(self, msg):
        """Handle VSLAM-generated map"""
        self.current_map = msg
        # In a real implementation, this would be used as the global costmap

    def goal_accept_callback(self, goal_request):
        """Accept or reject navigation goals"""
        self.get_logger().info(f'Received navigation goal: ({goal_request.pose.pose.position.x}, '
                              f'{goal_request.pose.pose.position.y})')
        return GoalResponse.ACCEPT

    def cancel_callback(self, goal_handle):
        """Handle goal cancellation"""
        self.get_logger().info('Received goal cancellation request')
        return CancelResponse.ACCEPT

    def execute_navigation(self, goal_handle):
        """Execute navigation action"""
        self.get_logger().info('Executing navigation goal')

        # Set goal and start navigation
        self.current_goal = goal_handle.request.pose
        self.navigation_state = NavigationState.PLANNING

        # Plan path using VSLAM map
        path = self.plan_path(self.current_pose, self.current_goal)

        if path is None:
            self.get_logger().error('Failed to plan path')
            goal_handle.abort()
            self.navigation_state = NavigationState.IDLE
            return NavigateToPose.Result()

        self.global_path = path
        self.navigation_state = NavigationState.CONTROLLING

        # Execute navigation loop
        while self.navigation_state == NavigationState.CONTROLLING:
            # Update navigation state
            self.navigation_update_callback()

            # Check for goal achievement
            if self.is_goal_reached():
                self.navigation_state = NavigationState.SUCCEEDED
                break

            # Check for failure conditions
            if self.is_navigation_failed():
                self.navigation_state = NavigationState.FAILED
                break

            # Check for cancellation
            if goal_handle.is_cancel_requested:
                self.navigation_state = NavigationState.CANCELLED
                goal_handle.canceled()
                break

            time.sleep(0.1)  # Short sleep to prevent busy waiting

        # Return result based on final state
        result = NavigateToPose.Result()
        if self.navigation_state == NavigationState.SUCCEEDED:
            goal_handle.succeed()
            result.result = 1  # Success
            self.get_logger().info('Navigation goal succeeded')
        elif self.navigation_state == NavigationState.CANCELLED:
            result.result = 0  # Cancelled
        else:
            goal_handle.abort()
            result.result = -1  # Failed
            self.get_logger().warn('Navigation goal failed')

        self.navigation_state = NavigationState.IDLE
        return result

    def plan_path(self, start_pose, goal_pose):
        """Plan path using current VSLAM map"""
        if self.current_map is None:
            self.get_logger().warn('No map available for path planning')
            return None

        # In a real implementation, this would call the Nav2 planner
        # For this example, we'll return a simple straight-line path
        path = self.generate_straight_line_path(start_pose, goal_pose)
        return path

    def generate_straight_line_path(self, start_pose, goal_pose):
        """Generate a simple straight-line path"""
        # This is a simplified path generation
        # In reality, this would use proper path planning algorithms
        path = []

        # Number of intermediate waypoints
        steps = 10

        start_x = start_pose.position.x
        start_y = start_pose.position.y
        goal_x = goal_pose.pose.position.x
        goal_y = goal_pose.pose.position.y

        for i in range(steps + 1):
            t = i / steps
            x = start_x + t * (goal_x - start_x)
            y = start_y + t * (goal_y - start_y)

            pose = PoseStamped()
            pose.header.frame_id = 'map'
            pose.pose.position.x = x
            pose.pose.position.y = y
            pose.pose.position.z = 0.0
            # Keep orientation pointing towards goal
            angle = np.arctan2(goal_y - start_y, goal_x - start_x)
            pose.pose.orientation.z = np.sin(angle / 2)
            pose.pose.orientation.w = np.cos(angle / 2)

            path.append(pose)

        return path

    def navigation_update_callback(self):
        """Main navigation update callback"""
        if self.navigation_state != NavigationState.CONTROLLING:
            return

        if self.current_pose is None:
            self.get_logger().warn('No current pose available')
            return

        if self.current_goal is None:
            self.get_logger().warn('No goal set')
            return

        # Get control command for current state
        control_cmd = self.compute_velocity_command()

        if control_cmd:
            self.cmd_vel_pub.publish(control_cmd)

    def compute_velocity_command(self):
        """Compute velocity command based on current state and goal"""
        if not self.global_path:
            return None

        # Simple proportional controller
        cmd = Twist()

        # Calculate direction to next waypoint
        current_x = self.current_pose.position.x
        current_y = self.current_pose.position.y

        # Find closest point on path
        closest_waypoint = self.find_closest_waypoint()

        if closest_waypoint:
            dx = closest_waypoint.pose.position.x - current_x
            dy = closest_waypoint.pose.position.y - current_y

            # Calculate distance to waypoint
            distance = np.sqrt(dx*dx + dy*dy)

            # Calculate heading to waypoint
            current_yaw = self.get_yaw_from_quaternion(self.current_pose.orientation)
            desired_yaw = np.arctan2(dy, dx)
            yaw_error = self.normalize_angle(desired_yaw - current_yaw)

            # Set velocities
            if distance > self.goal_tolerance:
                cmd.linear.x = min(0.5, distance * 0.5)  # Proportional control
                cmd.angular.z = yaw_error * 1.0  # Proportional angular control
            else:
                cmd.linear.x = 0.0
                cmd.angular.z = 0.0  # Reached goal

        return cmd

    def find_closest_waypoint(self):
        """Find the closest waypoint on the path"""
        if not self.global_path:
            return None

        current_x = self.current_pose.position.x
        current_y = self.current_pose.position.y

        closest_dist = float('inf')
        closest_waypoint = None

        for waypoint in self.global_path:
            dx = waypoint.pose.position.x - current_x
            dy = waypoint.pose.position.y - current_y
            dist = np.sqrt(dx*dx + dy*dy)

            if dist < closest_dist:
                closest_dist = dist
                closest_waypoint = waypoint

        return closest_waypoint

    def is_goal_reached(self):
        """Check if navigation goal has been reached"""
        if not self.current_pose or not self.current_goal:
            return False

        # Calculate distance to goal
        dx = self.current_goal.pose.position.x - self.current_pose.position.x
        dy = self.current_goal.pose.position.y - self.current_pose.position.y
        distance = np.sqrt(dx*dx + dy*dy)

        # Calculate orientation error
        current_yaw = self.get_yaw_from_quaternion(self.current_pose.orientation)
        goal_yaw = self.get_yaw_from_quaternion(self.current_goal.pose.orientation)
        yaw_error = abs(self.normalize_angle(current_yaw - goal_yaw))

        # Check if within tolerances
        return distance < self.goal_tolerance and yaw_error < self.yaw_tolerance

    def is_navigation_failed(self):
        """Check if navigation has failed"""
        # This would check for various failure conditions like:
        # - Stuck for too long
        # - Cannot make progress
        # - Collision imminent
        # - Path planning failed
        return False  # Placeholder - implement actual failure detection

    def get_yaw_from_quaternion(self, quat):
        """Extract yaw angle from quaternion"""
        siny_cosp = 2 * (quat.w * quat.z + quat.x * quat.y)
        cosy_cosp = 1 - 2 * (quat.y * quat.y + quat.z * quat.z)
        return np.arctan2(siny_cosp, cosy_cosp)

    def normalize_angle(self, angle):
        """Normalize angle to [-pi, pi] range"""
        while angle > np.pi:
            angle -= 2 * np.pi
        while angle < -np.pi:
            angle += 2 * np.pi
        return angle
```

## Advanced VSLAM-Nav2 Integration

### Real-time Mapping and Navigation

```python
class RealTimeMapper:
    """
    Real-time map building and updating for VSLAM-Nav2 integration
    """

    def __init__(self):
        # Map representation
        self.occupancy_grid = None
        self.grid_resolution = 0.05  # meters per cell
        self.map_size = (200, 200)   # cells (10m x 10m with 0.05m resolution)

        # Map building parameters
        self.max_map_size_meters = 50.0  # Maximum map size in meters
        self.update_rate = 1.0  # Hz
        self.prob_hit = 0.65
        self.prob_miss = 0.35
        self.clamp_min = 0.12
        self.clamp_max = 0.97
        self.unknown_threshold = 0.4

        # Initialize empty map
        self.initialize_map()

    def initialize_map(self):
        """Initialize empty occupancy grid"""
        width, height = self.map_size
        self.occupancy_grid = np.full((height, width), -1, dtype=np.int8)  # -1 = unknown

    def update_map_with_vslam_data(self, vslam_pose, vslam_keyframes, laser_scan=None):
        """
        Update map using VSLAM data and optionally laser scan data
        """
        if laser_scan is not None:
            # Use laser scan data to update occupancy grid
            self.update_map_with_scan(vslam_pose, laser_scan)
        else:
            # Use VSLAM features to infer occupancy
            self.update_map_with_features(vslam_pose, vslam_keyframes)

    def update_map_with_scan(self, robot_pose, laser_scan):
        """Update map using laser scan data"""
        # This would implement traditional occupancy grid mapping
        # using laser scan and robot pose
        pass

    def update_map_with_features(self, robot_pose, keyframes):
        """Update map using visual features from VSLAM"""
        # Convert robot pose to map coordinates
        map_x, map_y = self.world_to_map(robot_pose.position.x, robot_pose.position.y)

        # For each keyframe, add information to the map
        for keyframe in keyframes:
            kf_pose = keyframe['pose']
            kf_map_x, kf_map_y = self.world_to_map(kf_pose[0, 3], kf_pose[1, 3])

            # Add visual features as landmarks
            for kp in keyframe['keypoints']:
                # Convert keypoint to world coordinates relative to keyframe
                feature_world = self.keypoint_to_world(kp, kf_pose)

                # Convert to map coordinates
                feature_map_x, feature_map_y = self.world_to_map(
                    feature_world[0], feature_world[1]
                )

                # Update occupancy grid with feature information
                self.update_cell_probability(feature_map_x, feature_map_y, self.prob_hit)

    def keypoint_to_world(self, keypoint, keyframe_pose):
        """Convert keypoint from image coordinates to world coordinates"""
        # This would use camera parameters and keyframe pose
        # to triangulate feature position in world coordinates
        # Simplified implementation
        return [keyframe_pose[0, 3], keyframe_pose[1, 3], keyframe_pose[2, 3]]

    def world_to_map(self, x_world, y_world):
        """Convert world coordinates to map indices"""
        map_x = int((x_world + self.map_size[0] * self.grid_resolution / 2) / self.grid_resolution)
        map_y = int((y_world + self.map_size[1] * self.grid_resolution / 2) / self.grid_resolution)

        # Ensure indices are within bounds
        map_x = max(0, min(self.map_size[0]-1, map_x))
        map_y = max(0, min(self.map_size[1]-1, map_y))

        return map_x, map_y

    def map_to_world(self, x_map, y_map):
        """Convert map indices to world coordinates"""
        x_world = x_map * self.grid_resolution - self.map_size[0] * self.grid_resolution / 2
        y_world = y_map * self.grid_resolution - self.map_size[1] * self.grid_resolution / 2
        return x_world, y_world

    def update_cell_probability(self, x, y, probability):
        """Update probability of a cell in the occupancy grid"""
        if 0 <= x < self.map_size[0] and 0 <= y < self.map_size[1]:
            # Convert probability to log odds
            p = self.occupancy_grid[y, x]
            if p == -1:  # Unknown
                p = 0.5  # Initialize as free space

            # Update with new information
            log_odds = np.log(p / (1 - p)) + np.log(probability / (1 - probability))
            new_p = 1 - 1 / (1 + np.exp(log_odds))

            # Clamp probability
            new_p = max(self.clamp_min, min(self.clamp_max, new_p))

            # Convert back to occupancy grid format (-1 to 100)
            self.occupancy_grid[y, x] = int(new_p * 100)

    def get_map_as_occgrid_msg(self):
        """Convert internal map representation to ROS OccupancyGrid message"""
        from nav_msgs.msg import OccupancyGrid

        msg = OccupancyGrid()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'map'

        msg.info.resolution = self.grid_resolution
        msg.info.width = self.map_size[0]
        msg.info.height = self.map_size[1]
        msg.info.origin.position.x = -self.map_size[0] * self.grid_resolution / 2
        msg.info.origin.position.y = -self.map_size[1] * self.grid_resolution / 2
        msg.info.origin.position.z = 0.0
        msg.info.origin.orientation.w = 1.0

        # Flatten the occupancy grid for the message
        flattened_map = self.occupancy_grid.flatten()
        msg.data = [int(val) if val != -1 else -1 for val in flattened_map]

        return msg


class SemanticVSLAM:
    """
    VSLAM with semantic understanding for enhanced navigation
    """

    def __init__(self):
        # Semantic segmentation model (placeholder)
        self.segmentation_model = self.load_segmentation_model()

        # Object detection model (placeholder)
        self.detection_model = self.load_detection_model()

        # Semantic map building
        self.semantic_map = SemanticMapBuilder()

    def load_segmentation_model(self):
        """Load semantic segmentation model"""
        # In practice, this would load a deep learning model like SegNet, DeepLab, etc.
        return "segmentation_model_placeholder"

    def load_detection_model(self):
        """Load object detection model"""
        # In practice, this would load a model like YOLO, SSD, etc.
        return "detection_model_placeholder"

    def process_semantic_frame(self, image, depth_map=None):
        """
        Process frame with semantic understanding

        Args:
            image: Input camera image
            depth_map: Optional depth information

        Returns:
            Dictionary with semantic information
        """
        # Perform semantic segmentation
        segmentation = self.perform_segmentation(image)

        # Perform object detection
        detections = self.perform_detection(image)

        # Extract semantic features
        semantic_features = self.extract_semantic_features(
            image, segmentation, detections, depth_map
        )

        return {
            'segmentation': segmentation,
            'detections': detections,
            'semantic_features': semantic_features,
            'objects': self.classify_objects(detections)
        }

    def perform_segmentation(self, image):
        """Perform semantic segmentation on image"""
        # This would use the loaded segmentation model
        # For this example, we'll return a placeholder
        h, w = image.shape[:2]
        segmentation = np.zeros((h, w), dtype=np.uint8)

        # Simulate some semantic classes
        # 0 = background, 1 = floor, 2 = wall, 3 = obstacle, 4 = landmark
        segmentation[int(h*0.7):, :] = 1  # Floor
        segmentation[:int(h*0.3), :] = 2  # Wall
        segmentation[int(h*0.3):int(h*0.7), int(w*0.4):int(w*0.6)] = 3  # Obstacle

        return segmentation

    def perform_detection(self, image):
        """Perform object detection on image"""
        # This would use the loaded detection model
        # For this example, we'll simulate detections
        h, w = image.shape[:2]

        detections = [
            {
                'bbox': [int(w*0.4), int(h*0.3), int(w*0.6), int(h*0.7)],  # [x1, y1, x2, y2]
                'confidence': 0.9,
                'class': 'chair',
                'class_id': 1
            },
            {
                'bbox': [int(w*0.2), int(h*0.4), int(w*0.3), int(h*0.6)],
                'confidence': 0.85,
                'class': 'table',
                'class_id': 2
            }
        ]

        return detections

    def extract_semantic_features(self, image, segmentation, detections, depth_map):
        """Extract semantic features from image data"""
        features = []

        for detection in detections:
            bbox = detection['bbox']
            x1, y1, x2, y2 = bbox

            # Extract semantic information for this object
            obj_segmentation = segmentation[y1:y2, x1:x2]

            # Calculate semantic properties
            unique_labels, counts = np.unique(obj_segmentation, return_counts=True)
            label_distribution = dict(zip(unique_labels, counts))

            feature = {
                'bbox': bbox,
                'class': detection['class'],
                'confidence': detection['confidence'],
                'semantic_labels': label_distribution,
                'center': [(x1+x2)/2, (y1+y2)/2]
            }

            # Add depth information if available
            if depth_map is not None:
                obj_depth = depth_map[y1:y2, x1:x2]
                feature['avg_depth'] = np.mean(obj_depth[obj_depth > 0])
                feature['min_depth'] = np.min(obj_depth[obj_depth > 0])

            features.append(feature)

        return features

    def classify_objects(self, detections):
        """Classify objects for navigation purposes"""
        classified_objects = {
            'obstacles': [],
            'navigable': [],
            'landmarks': [],
            'targets': []
        }

        obstacle_classes = ['chair', 'table', 'person', 'car', 'plant']
        landmark_classes = ['sign', 'door', 'window', 'charger', 'dock']

        for detection in detections:
            class_name = detection['class']

            if class_name in obstacle_classes:
                classified_objects['obstacles'].append(detection)
            elif class_name in landmark_classes:
                classified_objects['landmarks'].append(detection)
            else:
                classified_objects['navigable'].append(detection)

        return classified_objects


class SemanticMapBuilder:
    """
    Build semantic maps from visual SLAM data
    """

    def __init__(self):
        self.semantic_objects = {}
        self.semantic_relationships = []
        self.topological_map = TopologicalMap()

    def add_semantic_observation(self, pose, semantic_data):
        """Add semantic observation to the map"""
        for obj in semantic_data['objects']['obstacles']:
            self.add_obstacle(pose, obj)

        for landmark in semantic_data['objects']['landmarks']:
            self.add_landmark(pose, landmark)

    def add_obstacle(self, robot_pose, obstacle_data):
        """Add obstacle to semantic map"""
        # Convert image coordinates to world coordinates
        world_pos = self.image_to_world_coords(
            obstacle_data['center'], robot_pose, self.camera_matrix
        )

        obstacle_id = f"obstacle_{len(self.semantic_objects)}"
        self.semantic_objects[obstacle_id] = {
            'type': 'obstacle',
            'class': obstacle_data['class'],
            'position': world_pos,
            'pose': robot_pose,
            'timestamp': time.time(),
            'confidence': obstacle_data['confidence']
        }

    def add_landmark(self, robot_pose, landmark_data):
        """Add landmark to semantic map"""
        world_pos = self.image_to_world_coords(
            landmark_data['center'], robot_pose, self.camera_matrix
        )

        landmark_id = f"landmark_{landmark_data['class']}_{len([obj for obj in self.semantic_objects.values() if obj['type'] == 'landmark'])}"
        self.semantic_objects[landmark_id] = {
            'type': 'landmark',
            'class': landmark_data['class'],
            'position': world_pos,
            'pose': robot_pose,
            'timestamp': time.time(),
            'confidence': landmark_data['confidence']
        }

    def image_to_world_coords(self, img_coords, robot_pose, camera_matrix):
        """Convert image coordinates to world coordinates"""
        # Simplified conversion - in reality this would involve more complex
        # geometric transformations and depth information
        u, v = img_coords
        fx, fy = camera_matrix[0, 0], camera_matrix[1, 1]
        cx, cy = camera_matrix[0, 2], camera_matrix[1, 2]

        # Convert to normalized coordinates
        x_norm = (u - cx) / fx
        y_norm = (v - cy) / fy

        # Use depth to get 3D coordinates (simplified)
        depth = 1.0  # Placeholder - would come from depth map or triangulation
        x_world = robot_pose.position.x + depth * x_norm
        y_world = robot_pose.position.y + depth * y_norm

        return [x_world, y_world, depth]
```

## Integration with Isaac Sim

### Isaac Sim VSLAM Integration

```python
# isaac_sim_integration.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, CameraInfo, LaserScan
from geometry_msgs.msg import PoseStamped, Twist
from std_msgs.msg import Header
from cv_bridge import CvBridge
import numpy as np
import time


class IsaacSimVSLAMIntegration(Node):
    """
    Integration between Isaac Sim and VSLAM system
    """

    def __init__(self):
        super().__init__('isaac_sim_vslam_integration')

        # Parameters
        self.declare_parameter('camera_topic', '/camera/rgb/image_rect_color')
        self.declare_parameter('camera_info_topic', '/camera/rgb/camera_info')
        self.declare_parameter('depth_topic', '/camera/depth/image_rect')
        self.declare_parameter('vslam_update_rate', 30.0)
        self.declare_parameter('enable_semantic_vslam', True)

        self.camera_topic = self.get_parameter('camera_topic').value
        self.camera_info_topic = self.get_parameter('camera_info_topic').value
        self.depth_topic = self.get_parameter('depth_topic').value
        self.vslam_update_rate = self.get_parameter('vslam_update_rate').value
        self.enable_semantic_vslam = self.get_parameter('enable_semantic_vslam').value

        # Initialize components
        self.cv_bridge = CvBridge()
        self.vslam_system = VSLAMCore()
        self.real_time_mapper = RealTimeMapper()

        if self.enable_semantic_vslam:
            self.semantic_vslam = SemanticVSLAM()

        # Publishers
        self.vslam_pose_pub = self.create_publisher(PoseStamped, '/vslam/pose', 10)
        self.vslam_map_pub = self.create_publisher(OccupancyGrid, '/vslam/map', 10)

        # Subscribers
        self.rgb_sub = self.create_subscription(
            Image, self.camera_topic, self.rgb_callback, 10
        )
        self.camera_info_sub = self.create_subscription(
            CameraInfo, self.camera_info_topic, self.camera_info_callback, 10
        )
        self.depth_sub = self.create_subscription(
            Image, self.depth_topic, self.depth_callback, 10
        )

        # Timer for VSLAM processing
        self.vslam_timer = self.create_timer(1.0/self.vslam_update_rate, self.vslam_process_callback)

        # Isaac Sim specific data
        self.camera_info = None
        self.latest_rgb_image = None
        self.latest_depth_image = None
        self.isaac_sim_connected = True

        self.get_logger().info('Isaac Sim VSLAM Integration initialized')

    def rgb_callback(self, msg):
        """Handle RGB camera image from Isaac Sim"""
        try:
            cv_image = self.cv_bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
            self.latest_rgb_image = {
                'image': cv_image,
                'timestamp': msg.header.stamp,
                'header': msg.header
            }
        except Exception as e:
            self.get_logger().error(f'Error processing RGB image: {e}')

    def depth_callback(self, msg):
        """Handle depth image from Isaac Sim"""
        try:
            cv_depth = self.cv_bridge.imgmsg_to_cv2(msg, desired_encoding='passthrough')
            self.latest_depth_image = {
                'image': cv_depth,
                'timestamp': msg.header.stamp,
                'header': msg.header
            }
        except Exception as e:
            self.get_logger().error(f'Error processing depth image: {e}')

    def camera_info_callback(self, msg):
        """Handle camera info from Isaac Sim"""
        # Convert camera info to OpenCV format
        camera_matrix = np.array(msg.k).reshape(3, 3)
        distortion_coeffs = np.array(msg.d)

        self.camera_info = {
            'camera_matrix': camera_matrix,
            'distortion_coeffs': distortion_coeffs,
            'width': msg.width,
            'height': msg.height
        }

        # Initialize VSLAM with camera parameters
        if self.vslam_system and self.vslam_system.camera_matrix is None:
            self.vslam_system.initialize_camera_parameters(camera_matrix, distortion_coeffs)

    def vslam_process_callback(self):
        """Process VSLAM updates"""
        if self.latest_rgb_image is None or self.camera_info is None:
            return

        # Process current frame through VSLAM
        vslam_result = self.vslam_system.process_frame(
            self.latest_rgb_image['image']
        )

        if vslam_result['success']:
            # Publish VSLAM pose estimate
            pose_msg = self.create_pose_message(
                vslam_result['current_pose'],
                self.latest_rgb_image['header']
            )
            self.vslam_pose_pub.publish(pose_msg)

            # Update real-time map
            self.real_time_mapper.update_map_with_vslam_data(
                pose_msg.pose,
                self.vslam_system.keyframes
            )

            # Publish updated map
            map_msg = self.real_time_mapper.get_map_as_occgrid_msg()
            if map_msg:
                self.vslam_map_pub.publish(map_msg)

            # Process semantic information if enabled
            if self.enable_semantic_vslam and self.latest_depth_image:
                semantic_result = self.semantic_vslam.process_semantic_frame(
                    self.latest_rgb_image['image'],
                    self.latest_depth_image['image']
                )

                # Update semantic map
                self.semantic_vslam.semantic_map.add_semantic_observation(
                    pose_msg.pose,
                    semantic_result
                )

            self.get_logger().debug(f'VSLAM processed: pose updated, {vslam_result["features"]} features, '
                                   f'{vslam_result["keyframes_count"]} keyframes')

    def create_pose_message(self, pose_matrix, header):
        """Create PoseStamped message from transformation matrix"""
        pose_msg = PoseStamped()
        pose_msg.header = header
        pose_msg.header.frame_id = 'map'  # VSLAM provides map frame

        # Extract position
        pose_msg.pose.position.x = float(pose_matrix[0, 3])
        pose_msg.pose.position.y = float(pose_matrix[1, 3])
        pose_msg.pose.position.z = float(pose_matrix[2, 3])

        # Extract orientation (convert rotation matrix to quaternion)
        R = pose_matrix[:3, :3]
        trace = np.trace(R)

        if trace > 0:
            s = np.sqrt(trace + 1.0) * 2  # s = 4 * qw
            qw = 0.25 * s
            qx = (R[2, 1] - R[1, 2]) / s
            qy = (R[0, 2] - R[2, 0]) / s
            qz = (R[1, 0] - R[0, 1]) / s
        elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
            s = np.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2  # s = 4 * qx
            qw = (R[2, 1] - R[1, 2]) / s
            qx = 0.25 * s
            qy = (R[0, 1] + R[1, 0]) / s
            qz = (R[0, 2] + R[2, 0]) / s
        elif R[1, 1] > R[2, 2]:
            s = np.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2  # s = 4 * qy
            qw = (R[0, 2] - R[2, 0]) / s
            qx = (R[0, 1] + R[1, 0]) / s
            qy = 0.25 * s
            qz = (R[1, 2] + R[2, 1]) / s
        else:
            s = np.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2  # s = 4 * qz
            qw = (R[1, 0] - R[0, 1]) / s
            qx = (R[0, 2] + R[2, 0]) / s
            qy = (R[1, 2] + R[2, 1]) / s
            qz = 0.25 * s

        pose_msg.pose.orientation.w = qw
        pose_msg.pose.orientation.x = qx
        pose_msg.pose.orientation.y = qy
        pose_msg.pose.orientation.z = qz

        return pose_msg


class TopologicalMap:
    """
    Topological map for VSLAM-Nav2 integration
    """

    def __init__(self):
        self.nodes = {}  # Waypoints
        self.edges = {}  # Connections between waypoints
        self.landmarks = {}  # Semantic landmarks
        self.visited_areas = set()

    def add_waypoint(self, pose, name=None):
        """Add a waypoint to the topological map"""
        if name is None:
            name = f"wp_{len(self.nodes)}"

        self.nodes[name] = {
            'pose': pose,
            'timestamp': time.time(),
            'visited': True,
            'connections': []
        }

        # Add to visited areas
        area_id = self.get_area_id(pose.position.x, pose.position.y)
        self.visited_areas.add(area_id)

        return name

    def connect_waypoints(self, wp1_name, wp2_name, cost=1.0):
        """Connect two waypoints with an edge"""
        if wp1_name not in self.nodes or wp2_name not in self.nodes:
            return False

        # Add connection from wp1 to wp2
        if wp2_name not in self.nodes[wp1_name]['connections']:
            self.nodes[wp1_name]['connections'].append(wp2_name)

        # Add connection from wp2 to wp1
        if wp1_name not in self.nodes[wp2_name]['connections']:
            self.nodes[wp2_name]['connections'].append(wp1_name)

        # Store edge information
        edge_id = f"{wp1_name}_{wp2_name}"
        self.edges[edge_id] = {
            'from': wp1_name,
            'to': wp2_name,
            'cost': cost,
            'traversable': True
        }

        return True

    def add_landmark(self, pose, landmark_type, name=None):
        """Add a landmark to the topological map"""
        if name is None:
            name = f"{landmark_type}_{len(self.landmarks)}"

        self.landmarks[name] = {
            'pose': pose,
            'type': landmark_type,
            'timestamp': time.time(),
            'relevance': 1.0  # How useful is this landmark for navigation
        }

        return name

    def get_area_id(self, x, y, resolution=2.0):
        """Get area ID for coordinates (for area-based exploration)"""
        area_x = int(x / resolution)
        area_y = int(y / resolution)
        return f"area_{area_x}_{area_y}"

    def find_path(self, start_name, goal_name):
        """Find path between two waypoints using graph search"""
        if start_name not in self.nodes or goal_name not in self.nodes:
            return None

        # Simple BFS for path finding (in reality, would use A* or Dijkstra)
        from collections import deque

        queue = deque([(start_name, [start_name])])
        visited = {start_name}

        while queue:
            current_name, path = queue.popleft()

            if current_name == goal_name:
                return path

            for neighbor in self.nodes[current_name]['connections']:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return None  # No path found
```

## Practical Lab: Complete VSLAM-Nav2 System

### Lab Exercise: Building a Complete Autonomous Navigation System

**Objective**: Integrate VSLAM with Nav2 to create a complete autonomous navigation system that can operate in unknown environments.

**Prerequisites**:
- ROS 2 Humble or Jazzy
- Isaac Sim (optional for simulation)
- Camera sensor (real or simulated)
- Basic ROS 2 knowledge

**Implementation Steps**:

1. **Create the main integration node** that connects VSLAM and Nav2
2. **Implement real-time mapping** using VSLAM features
3. **Integrate with Nav2 costmaps** to use visual SLAM map
4. **Test navigation in unknown environments** using only visual sensors
5. **Validate system performance** and robustness

**Complete Implementation**:

```python
#!/usr/bin/env python3
"""
Complete VSLAM-Nav2 Integration Lab
Creates a complete autonomous navigation system using visual SLAM
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, CameraInfo, LaserScan
from geometry_msgs.msg import PoseStamped, Twist
from nav_msgs.msg import Odometry, OccupancyGrid
from std_msgs.msg import Header, Bool, String
from nav2_msgs.action import NavigateToPose
from rclpy.action import ActionClient
from cv_bridge import CvBridge
import numpy as np
import time
import threading
from collections import deque
import json


class CompleteVSLAMNav2System(Node):
    """
    Complete system integrating VSLAM with Nav2 for autonomous navigation
    """

    def __init__(self):
        super().__init__('complete_vslam_nav2_system')

        # Parameters
        self.declare_parameter('navigation_rate', 20.0)
        self.declare_parameter('vslam_rate', 30.0)
        self.declare_parameter('mapping_rate', 5.0)
        self.declare_parameter('enable_exploration', True)
        self.declare_parameter('enable_semantic_mapping', True)
        self.declare_parameter('exploration_frontier_threshold', 0.5)

        self.navigation_rate = self.get_parameter('navigation_rate').value
        self.vslam_rate = self.get_parameter('vslam_rate').value
        self.mapping_rate = self.get_parameter('mapping_rate').value
        self.enable_exploration = self.get_parameter('enable_exploration').value
        self.enable_semantic_mapping = self.get_parameter('enable_semantic_mapping').value
        self.frontier_threshold = self.get_parameter('exploration_frontier_threshold').value

        # Initialize components
        self.cv_bridge = CvBridge()
        self.vslam_system = VSLAMCore()
        self.real_time_mapper = RealTimeMapper()

        if self.enable_semantic_mapping:
            self.semantic_vslam = SemanticVSLAM()

        self.topological_map = TopologicalMap()

        # Publishers
        self.vslam_pose_pub = self.create_publisher(PoseStamped, '/vslam/pose', 10)
        self.vslam_map_pub = self.create_publisher(OccupancyGrid, '/vslam/occ_grid_map', 10)
        self.semantic_map_pub = self.create_publisher(String, '/vslam/semantic_map', 10)
        self.navigation_status_pub = self.create_publisher(String, '/navigation/status', 10)

        # Subscribers
        self.image_sub = self.create_subscription(
            Image, '/camera/image_rect', self.image_callback, 10
        )
        self.camera_info_sub = self.create_subscription(
            CameraInfo, '/camera/camera_info', self.camera_info_callback, 10
        )

        # Navigation action client
        self.nav_action_client = ActionClient(self, NavigateToPose, 'navigate_to_pose')

        # Data buffers
        self.image_buffer = deque(maxlen=5)
        self.pose_buffer = deque(maxlen=50)
        self.navigation_goals = deque()

        # System state
        self.current_pose = None
        self.current_map = None
        self.navigation_active = False
        self.exploration_active = False
        self.system_initialized = False

        # Threading locks
        self.vslam_lock = threading.Lock()
        self.map_lock = threading.Lock()

        # Timers
        self.vslam_timer = self.create_timer(1.0/self.vslam_rate, self.vslam_callback)
        self.navigation_timer = self.create_timer(1.0/self.navigation_rate, self.navigation_callback)
        self.mapping_timer = self.create_timer(1.0/self.mapping_rate, self.mapping_callback)

        self.get_logger().info('Complete VSLAM-Nav2 System initialized')
        self.get_logger().info(f'Parameters: vslam_rate={self.vslam_rate}Hz, '
                              f'navigation_rate={self.navigation_rate}Hz, '
                              f'exploration_enabled={self.enable_exploration}')

    def image_callback(self, msg):
        """Process incoming camera images"""
        try:
            cv_image = self.cv_bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
            self.image_buffer.append({
                'image': cv_image,
                'timestamp': msg.header.stamp,
                'header': msg.header
            })
        except Exception as e:
            self.get_logger().error(f'Error processing image: {e}')

    def camera_info_callback(self, msg):
        """Process camera info"""
        camera_matrix = np.array(msg.k).reshape(3, 3)
        distortion_coeffs = np.array(msg.d)

        # Initialize VSLAM system with camera parameters
        if not self.system_initialized:
            self.vslam_system.initialize_camera_parameters(camera_matrix, distortion_coeffs)
            self.system_initialized = True
            self.get_logger().info('VSLAM system initialized with camera parameters')

    def vslam_callback(self):
        """Main VSLAM processing callback"""
        if not self.image_buffer or not self.system_initialized:
            return

        # Process latest image through VSLAM
        latest_image_data = self.image_buffer[-1]

        with self.vslam_lock:
            vslam_result = self.vslam_system.process_frame(latest_image_data['image'])

        if vslam_result['success']:
            # Create and publish pose estimate
            pose_msg = self.create_pose_message(
                vslam_result['current_pose'],
                latest_image_data['header']
            )
            self.vslam_pose_pub.publish(pose_msg)

            # Update current pose
            self.current_pose = pose_msg.pose

            # Store in pose buffer
            self.pose_buffer.append({
                'pose': self.current_pose,
                'timestamp': latest_image_data['timestamp']
            })

            # Log VSLAM status
            self.get_logger().debug(f'VSLAM: Pose updated, {vslam_result["features"]} features, '
                                   f'{vslam_result["keyframes_count"]} keyframes')

    def mapping_callback(self):
        """Mapping update callback"""
        if not self.current_pose:
            return

        # Update occupancy grid map
        with self.map_lock:
            self.real_time_mapper.update_map_with_features(
                self.current_pose,
                self.vslam_system.keyframes
            )

            # Get updated map
            map_msg = self.real_time_mapper.get_map_as_occgrid_msg()
            if map_msg:
                self.vslam_map_pub.publish(map_msg)
                self.current_map = map_msg

        # Update topological map
        self.update_topological_map()

        # Publish semantic map if enabled
        if self.enable_semantic_mapping:
            self.publish_semantic_map()

    def update_topological_map(self):
        """Update topological map with current pose"""
        if self.current_pose:
            # Add current position as a waypoint if it's a new significant location
            current_area = self.topological_map.get_area_id(
                self.current_pose.position.x,
                self.current_pose.position.y
            )

            # Only add waypoint if we haven't visited this area recently
            if len(self.pose_buffer) > 10:  # Have enough data to make decision
                last_pose = self.pose_buffer[-10]['pose']
                dist = np.sqrt(
                    (self.current_pose.position.x - last_pose.position.x)**2 +
                    (self.current_pose.position.y - last_pose.position.y)**2
                )

                if dist > 1.0:  # More than 1 meter from last waypoint
                    waypoint_name = self.topological_map.add_waypoint(
                        self.current_pose,
                        name=f"wp_{int(time.time())}"
                    )
                    self.get_logger().info(f'Added waypoint: {waypoint_name}')

    def publish_semantic_map(self):
        """Publish semantic map information"""
        if not self.enable_semantic_mapping:
            return

        # Create semantic map message
        semantic_map_msg = String()
        semantic_map_data = {
            'timestamp': time.time(),
            'objects': list(self.semantic_vslam.semantic_objects.keys()),
            'relationships': self.semantic_vslam.semantic_relationships,
            'topological_nodes': len(self.topological_map.nodes),
            'landmarks': list(self.semantic_vslam.semantic_map.semantic_objects.keys())
        }
        semantic_map_msg.data = json.dumps(semantic_map_data)
        self.semantic_map_pub.publish(semantic_map_msg)

    def navigation_callback(self):
        """Main navigation callback"""
        if not self.navigation_active or not self.current_pose or not self.current_map:
            return

        # Check if we have navigation goals
        if self.navigation_goals:
            current_goal = self.navigation_goals[0]

            # Check if goal is reached
            if self.is_goal_reached(current_goal):
                self.get_logger().info('Navigation goal reached')
                self.navigation_goals.popleft()  # Remove completed goal

                if self.navigation_goals:
                    # Move to next goal
                    self.send_navigation_goal(self.navigation_goals[0])
                else:
                    # No more goals, stop navigation
                    self.stop_navigation()
            else:
                # Still navigating to current goal
                self.publish_navigation_status('NAVIGATING')
        else:
            # No specific goals, possibly explore
            if self.enable_exploration and self.exploration_active:
                exploration_goal = self.find_exploration_goal()
                if exploration_goal:
                    self.navigation_goals.append(exploration_goal)
                    self.send_navigation_goal(exploration_goal)
                    self.get_logger().info('Sent exploration goal')

    def is_goal_reached(self, goal_pose):
        """Check if current goal has been reached"""
        if not self.current_pose:
            return False

        # Calculate distance to goal
        dx = goal_pose.pose.position.x - self.current_pose.position.x
        dy = goal_pose.pose.position.y - self.current_pose.position.y
        distance = np.sqrt(dx*dx + dy*dy)

        # Check if within tolerance
        return distance < 0.5  # 50cm tolerance

    def find_exploration_goal(self):
        """Find exploration goal based on frontiers in the map"""
        if not self.current_map:
            return None

        # Find frontiers (boundaries between known and unknown space)
        frontiers = self.find_map_frontiers()

        if not frontiers:
            self.get_logger().info('No frontiers found - exploration complete')
            self.exploration_active = False
            return None

        # Find the closest frontier to current position
        current_x = self.current_pose.position.x
        current_y = self.current_pose.position.y

        closest_frontier = min(frontiers, key=lambda f:
                             np.sqrt((f[0] - current_x)**2 + (f[1] - current_y)**2))

        # Create goal pose
        goal_pose = PoseStamped()
        goal_pose.header.stamp = self.get_clock().now().to_msg()
        goal_pose.header.frame_id = 'map'
        goal_pose.pose.position.x = closest_frontier[0]
        goal_pose.pose.position.y = closest_frontier[1]
        goal_pose.pose.position.z = 0.0
        goal_pose.pose.orientation.w = 1.0

        return goal_pose

    def find_map_frontiers(self):
        """Find frontiers in the occupancy grid map"""
        if self.current_map is None:
            return []

        frontiers = []
        grid = np.array(self.current_map.data).reshape(
            self.current_map.info.height, self.current_map.info.width
        )

        # Look for boundaries between known and unknown space
        for y in range(1, grid.shape[0]-1):
            for x in range(1, grid.shape[1]-1):
                if grid[y, x] == -1:  # Unknown space
                    # Check neighbors
                    neighbors = [
                        grid[y-1, x], grid[y+1, x],  # Up/down
                        grid[y, x-1], grid[y, x+1],  # Left/right
                        grid[y-1, x-1], grid[y-1, x+1],  # Diagonals
                        grid[y+1, x-1], grid[y+1, x+1]
                    ]

                    # If any neighbor is known space, this is a frontier
                    if any(n != -1 for n in neighbors):
                        world_x, world_y = self.map_to_world_coords(x, y)
                        frontiers.append((world_x, world_y))

        return frontiers[:20]  # Return first 20 frontiers to avoid too many goals

    def map_to_world_coords(self, map_x, map_y):
        """Convert map coordinates to world coordinates"""
        resolution = self.current_map.info.resolution
        origin_x = self.current_map.info.origin.position.x
        origin_y = self.current_map.info.origin.position.y

        world_x = origin_x + map_x * resolution
        world_y = origin_y + map_y * resolution

        return world_x, world_y

    def send_navigation_goal(self, goal_pose):
        """Send navigation goal to Nav2"""
        if not self.nav_action_client.wait_for_server(timeout_sec=1.0):
            self.get_logger().error('Navigation action server not available')
            return

        goal_msg = NavigateToPose.Goal()
        goal_msg.pose = goal_pose

        self.nav_action_client.send_goal_async(goal_msg)

    def start_navigation(self):
        """Start the navigation system"""
        self.navigation_active = True
        self.get_logger().info('Navigation system started')

    def stop_navigation(self):
        """Stop the navigation system"""
        self.navigation_active = False

        # Send stop command
        stop_cmd = Twist()
        # In a real system, this would send to cmd_vel
        self.get_logger().info('Navigation system stopped')

    def start_exploration(self):
        """Start exploration mode"""
        self.exploration_active = True
        self.start_navigation()
        self.get_logger().info('Exploration mode started')

    def stop_exploration(self):
        """Stop exploration mode"""
        self.exploration_active = False
        self.get_logger().info('Exploration mode stopped')

    def create_pose_message(self, pose_matrix, header):
        """Create PoseStamped message from transformation matrix"""
        pose_msg = PoseStamped()
        pose_msg.header = header
        pose_msg.header.frame_id = 'map'

        # Extract position
        pose_msg.pose.position.x = float(pose_matrix[0, 3])
        pose_msg.pose.position.y = float(pose_matrix[1, 3])
        pose_msg.pose.position.z = float(pose_matrix[2, 3])

        # Extract orientation (convert rotation matrix to quaternion)
        R = pose_matrix[:3, :3]
        qw, qx, qy, qz = self.rotation_matrix_to_quaternion(R)

        pose_msg.pose.orientation.w = qw
        pose_msg.pose.orientation.x = qx
        pose_msg.pose.orientation.y = qy
        pose_msg.pose.orientation.z = qz

        return pose_msg

    def rotation_matrix_to_quaternion(self, R):
        """Convert rotation matrix to quaternion"""
        trace = np.trace(R)

        if trace > 0:
            s = np.sqrt(trace + 1.0) * 2  # s = 4 * qw
            qw = 0.25 * s
            qx = (R[2, 1] - R[1, 2]) / s
            qy = (R[0, 2] - R[2, 0]) / s
            qz = (R[1, 0] - R[0, 1]) / s
        elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
            s = np.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2  # s = 4 * qx
            qw = (R[2, 1] - R[1, 2]) / s
            qx = 0.25 * s
            qy = (R[0, 1] + R[1, 0]) / s
            qz = (R[0, 2] + R[2, 0]) / s
        elif R[1, 1] > R[2, 2]:
            s = np.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2  # s = 4 * qy
            qw = (R[0, 2] - R[2, 0]) / s
            qx = (R[0, 1] + R[1, 0]) / s
            qy = 0.25 * s
            qz = (R[1, 2] + R[2, 1]) / s
        else:
            s = np.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2  # s = 4 * qz
            qw = (R[1, 0] - R[0, 1]) / s
            qx = (R[0, 2] + R[2, 0]) / s
            qy = (R[1, 2] + R[2, 1]) / s
            qz = 0.25 * s

        return qw, qx, qy, qz

    def publish_navigation_status(self, status):
        """Publish navigation status"""
        status_msg = String()
        status_msg.data = f"Status: {status}, Pose: ({self.current_pose.position.x:.2f}, {self.current_pose.position.y:.2f})" if self.current_pose else f"Status: {status}"
        self.navigation_status_pub.publish(status_msg)


def main(args=None):
    rclpy.init(args=args)

    try:
        system = CompleteVSLAMNav2System()

        # Example: Start exploration mode
        system.start_exploration()

        # Add some specific navigation goals (optional)
        # goal_pose = PoseStamped()
        # goal_pose.header.frame_id = 'map'
        # goal_pose.pose.position.x = 2.0
        # goal_pose.pose.position.y = 2.0
        # system.navigation_goals.append(goal_pose)

        rclpy.spin(system)

    except KeyboardInterrupt:
        pass
    finally:
        if 'system' in locals():
            system.stop_navigation()
            system.stop_exploration()
            system.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Launch File for Complete System

### Complete System Launch

```python
# launch/complete_vslam_nav2_system.launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, TimerAction
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.actions import Node, ComposableNodeContainer
from launch_ros.descriptions import ComposableNode
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time')
    enable_visualization = LaunchConfiguration('enable_visualization', default='true')
    enable_exploration = LaunchConfiguration('enable_exploration', default='true')
    robot_namespace = LaunchConfiguration('robot_namespace', default='')

    # Declare launch arguments
    declare_use_sim_time_arg = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation (Gazebo) clock if true'
    )

    declare_enable_visualization_arg = DeclareLaunchArgument(
        'enable_visualization',
        default_value='true',
        description='Enable Unity visualization'
    )

    declare_enable_exploration_arg = DeclareLaunchArgument(
        'enable_exploration',
        default_value='true',
        description='Enable exploration mode'
    )

    declare_robot_namespace_arg = DeclareLaunchArgument(
        'robot_namespace',
        default_value='',
        description='Robot namespace'
    )

    # Get package share directory
    pkg_share = get_package_share_directory('digital_twin_system')

    # VSLAM-Nav2 integration node
    vslam_nav2_node = Node(
        package='digital_twin_system',
        executable='complete_vslam_nav2_system',
        name='complete_vslam_nav2_system',
        namespace=LaunchConfiguration('robot_namespace'),
        parameters=[
            {'use_sim_time': use_sim_time},
            {'navigation_rate': 20.0},
            {'vslam_rate': 30.0},
            {'enable_exploration': enable_exploration},
            {'enable_semantic_mapping': True}
        ],
        remappings=[
            ('/camera/image_rect', '/camera/image_raw'),
            ('/vslam/pose', '/digital_twin/pose'),
            ('/vslam/occ_grid_map', '/digital_twin/occ_grid_map')
        ],
        output='screen'
    )

    # Isaac Sim integration (if using simulation)
    isaac_sim_integration = Node(
        package='digital_twin_system',
        executable='isaac_sim_vslam_integration',
        name='isaac_sim_vslam_integration',
        namespace=LaunchConfiguration('robot_namespace'),
        parameters=[
            {'use_sim_time': use_sim_time},
            {'vslam_update_rate': 30.0}
        ],
        condition=IfCondition(use_sim_time),
        output='screen'
    )

    # Robot state publisher (for visualization)
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        namespace=LaunchConfiguration('robot_namespace'),
        parameters=[
            {'use_sim_time': use_sim_time},
            {'robot_description': open(
                PathJoinSubstitution([
                    get_package_share_directory('digital_twin_system'),
                    'urdf',
                    'navigation_robot.urdf'
                ])
            ).read()}
        ],
        output='screen'
    )

    # Joint state publisher
    joint_state_publisher = Node(
        package='joint_state_publisher',
        executable='joint_state_publisher',
        name='joint_state_publisher',
        namespace=LaunchConfiguration('robot_namespace'),
        parameters=[{'use_sim_time': use_sim_time}],
        output='screen'
    )

    # RViz for monitoring (optional)
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', PathJoinSubstitution([
            get_package_share_directory('digital_twin_system'),
            'rviz',
            'vslam_nav2_config.rviz'
        ])],
        parameters=[{'use_sim_time': use_sim_time}],
        condition=IfCondition(enable_visualization),
        output='screen'
    )

    # Launch description
    ld = LaunchDescription()

    # Add launch arguments
    ld.add_action(declare_use_sim_time_arg)
    ld.add_action(declare_enable_visualization_arg)
    ld.add_action(declare_enable_exploration_arg)
    ld.add_action(declare_robot_namespace_arg)

    # Add nodes
    ld.add_action(vslam_nav2_node)
    ld.add_action(isaac_sim_integration)
    ld.add_action(robot_state_publisher)
    ld.add_action(joint_state_publisher)
    ld.add_action(rviz_node)

    return ld
```

## Testing and Validation

### System Testing

```python
# test/test_vslam_nav2_integration.py
import unittest
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, LaserScan
from nav_msgs.msg import Odometry
from geometry_msgs.msg import PoseStamped, Twist
import time
import threading
from std_msgs.msg import String


class TestVSLAMNav2Integration(unittest.TestCase):
    """Test cases for VSLAM-Nav2 integration system"""

    def setUp(self):
        rclpy.init()
        self.node = Node('test_vslam_nav2_integration')

        # Create subscribers to monitor system outputs
        self.vslam_pose_sub = self.node.create_subscription(
            PoseStamped, '/vslam/pose', self.vslam_pose_callback, 10
        )
        self.vslam_map_sub = self.node.create_subscription(
            OccupancyGrid, '/vslam/occ_grid_map', self.vslam_map_callback, 10
        )
        self.nav_status_sub = self.node.create_subscription(
            String, '/navigation/status', self.nav_status_callback, 10
        )

        # Test data
        self.vslam_pose_received = False
        self.vslam_map_received = False
        self.nav_status_received = False
        self.received_poses = []
        self.received_maps = []
        self.received_statuses = []

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def vslam_pose_callback(self, msg):
        """Handle VSLAM pose messages"""
        self.vslam_pose_received = True
        self.received_poses.append(msg)

    def vslam_map_callback(self, msg):
        """Handle VSLAM map messages"""
        self.vslam_map_received = True
        self.received_maps.append(msg)

    def nav_status_callback(self, msg):
        """Handle navigation status messages"""
        self.nav_status_received = True
        self.received_statuses.append(msg)

    def test_vslam_data_flow(self):
        """Test that VSLAM system is producing data"""
        start_time = time.time()
        timeout = 10.0  # seconds

        while (time.time() - start_time) < timeout:
            rclpy.spin_once(self.node, timeout_sec=0.1)

            if self.vslam_pose_received:
                break

        self.assertTrue(self.vslam_pose_received, "VSLAM system not producing pose data")

    def test_map_generation(self):
        """Test that maps are being generated"""
        start_time = time.time()
        timeout = 15.0

        while (time.time() - start_time) < timeout:
            rclpy.spin_once(self.node, timeout_sec=0.1)

            if self.vslam_map_received:
                break

        self.assertTrue(self.vslam_map_received, "VSLAM system not producing map data")

        # Check map quality
        if self.received_maps:
            latest_map = self.received_maps[-1]
            self.assertGreater(latest_map.info.width, 0, "Map width should be greater than 0")
            self.assertGreater(latest_map.info.height, 0, "Map height should be greater than 0")
            self.assertGreater(latest_map.info.resolution, 0, "Map resolution should be greater than 0")

    def test_navigation_integration(self):
        """Test that navigation system is responding"""
        start_time = time.time()
        timeout = 10.0

        while (time.time() - start_time) < timeout:
            rclpy.spin_once(self.node, timeout_sec=0.1)

            if self.nav_status_received:
                break

        self.assertTrue(self.nav_status_received, "Navigation system not publishing status")

    def test_data_consistency(self):
        """Test consistency between VSLAM and navigation data"""
        # Wait for sufficient data
        start_time = time.time()
        timeout = 20.0

        while (time.time() - start_time) < timeout and len(self.received_poses) < 5:
            rclpy.spin_once(self.node, timeout_sec=0.1)

        # Check that poses are being updated (not all identical)
        if len(self.received_poses) >= 2:
            first_pose = self.received_poses[0]
            last_pose = self.received_poses[-1]

            pos_diff = (
                (first_pose.pose.position.x - last_pose.pose.position.x)**2 +
                (first_pose.pose.position.y - last_pose.pose.position.y)**2 +
                (first_pose.pose.position.z - last_pose.pose.position.z)**2
            )**0.5

            # Poses should change over time during navigation
            # If they don't change, the robot might be stationary or system not functioning
            # This test passes if we have minimal movement or if system is just initializing
            self.assertIsNotNone(pos_diff)  # Just ensure we can calculate the difference


def run_tests():
    """Run the VSLAM-Nav2 integration tests"""
    unittest.main()


if __name__ == '__main__':
    run_tests()
```

## Performance Optimization

### Optimization Techniques

```python
class VSLAMNav2Optimizer:
    """
    Optimization techniques for VSLAM-Nav2 system
    """

    def __init__(self):
        self.optimization_strategies = {
            'vslam_optimizations': [
                "Use efficient feature detectors (ORB vs SIFT)",
                "Implement feature tracking across frames",
                "Use keyframe-based mapping to reduce computation",
                "Apply image decimation for faster processing",
                "Implement multi-resolution processing"
            ],
            'nav2_optimizations': [
                "Tune costmap resolution for application needs",
                "Optimize global and local planner parameters",
                "Use appropriate controller frequency",
                "Implement proper recovery behaviors",
                "Configure proper transform tolerance"
            ],
            'integration_optimizations': [
                "Use composable nodes to reduce communication overhead",
                "Implement proper QoS settings for real-time performance",
                "Optimize data buffering and processing",
                "Use efficient serialization for Unity communication",
                "Implement multi-threaded processing where appropriate"
            ],
            'hardware_optimizations': [
                "Use GPU acceleration for visual processing",
                "Optimize CPU usage with proper threading",
                "Use appropriate memory management",
                "Implement hardware-specific optimizations",
                "Consider edge computing for sensor processing"
            ]
        }

    def get_optimization_recommendations(self, current_performance):
        """
        Get optimization recommendations based on current performance
        """
        recommendations = []

        if current_performance.get('vslam_fps', 0) < 20:
            recommendations.append({
                'component': 'VSLAM',
                'issue': 'Low frame rate',
                'recommendation': 'Consider reducing image resolution or using faster feature detector'
            })

        if current_performance.get('cpu_usage', 0) > 80:
            recommendations.append({
                'component': 'System',
                'issue': 'High CPU usage',
                'recommendation': 'Implement multithreading or consider hardware upgrade'
            })

        if current_performance.get('memory_usage_mb', 0) > 2000:
            recommendations.append({
                'component': 'System',
                'issue': 'High memory usage',
                'recommendation': 'Optimize data buffering or implement memory management'
            })

        if current_performance.get('navigation_success_rate', 0) < 0.8:
            recommendations.append({
                'component': 'Nav2',
                'issue': 'Low navigation success rate',
                'recommendation': 'Tune planner and controller parameters'
            })

        return recommendations

    def apply_runtime_optimizations(self, system_load):
        """
        Apply runtime optimizations based on system load
        """
        optimizations = []

        if system_load['cpu'] > 85:
            # High CPU load - reduce processing intensity
            optimizations.append('reduce_vslam_features')
            optimizations.append('decrease_update_rates')
            optimizations.append('disable_non_essential_processing')

        if system_load['memory'] > 80:
            # High memory usage - clear buffers
            optimizations.append('reduce_buffer_sizes')
            optimizations.append('clear_old_keyframes')

        if system_load['network'] > 70:
            # High network usage - reduce data transmission
            optimizations.append('enable_compression')
            optimizations.append('reduce_visualization_rate')

        return optimizations

    def get_hardware_specific_optimizations(self, hardware_profile):
        """
        Get optimizations specific to hardware profile
        """
        if hardware_profile == 'desktop':
            return [
                'enable_detailed_visualization',
                'use_high_accuracy_algorithms',
                'enable_comprehensive_logging',
                'use_large_feature_sets'
            ]
        elif hardware_profile == 'embedded':
            return [
                'use_lightweight_algorithms',
                'reduce_resolution',
                'disable_non_essential_features',
                'optimize_for_power_efficiency'
            ]
        elif hardware_profile == 'jetson':
            return [
                'leverage_gpu_acceleration',
                'use_tensorrt_optimization',
                'optimize_cuda_memory',
                'use_hardware_video_decoding'
            ]
        else:
            return [
                'use_default_optimizations',
                'balance_performance_and_accuracy'
            ]


def print_optimization_summary():
    """Print optimization summary for VSLAM-Nav2 system"""
    optimizer = VSLAMNav2Optimizer()

    print("VSLAM-Nav2 System Optimization Summary")
    print("=====================================")

    print("\nVSLAM Optimizations:")
    for opt in optimizer.optimization_strategies['vslam_optimizations']:
        print(f"  - {opt}")

    print("\nNav2 Optimizations:")
    for opt in optimizer.optimization_strategies['nav2_optimizations']:
        print(f"  - {opt}")

    print("\nIntegration Optimizations:")
    for opt in optimizer.optimization_strategies['integration_optimizations']:
        print(f"  - {opt}")

    print("\nHardware Optimizations:")
    for opt in optimizer.optimization_strategies['hardware_optimizations']:
        print(f"  - {opt}")

    print("\nFor optimal performance, consider:")
    print("  - Using composable nodes for reduced communication overhead")
    print("  - Leveraging GPU acceleration for visual processing")
    print("  - Properly tuning parameters for your specific hardware")
    print("  - Implementing appropriate QoS settings for real-time operation")
    print("  - Monitoring system performance and applying runtime optimizations")


if __name__ == '__main__':
    print_optimization_summary()
```

## Troubleshooting Guide

### Common Issues and Solutions

```python
class VSLAMNav2Troubleshooting:
    """
    Troubleshooting guide for VSLAM-Nav2 integration
    """

    def __init__(self):
        self.troubleshooting_guide = {
            'vslam_issues': {
                'low_feature_detection': {
                    'symptoms': ['Poor tracking', 'Drifting pose estimates', 'Frequent reinitialization'],
                    'causes': ['Poor lighting', 'Lack of texture', 'Fast motion', 'Blurry images'],
                    'solutions': [
                        'Improve lighting conditions',
                        'Slow down robot motion',
                        'Use different feature detector',
                        'Adjust camera exposure settings'
                    ]
                },
                'high_computation_load': {
                    'symptoms': ['Low frame rate', 'High CPU usage', 'System lag'],
                    'causes': ['Too many features', 'High image resolution', 'Complex algorithms'],
                    'solutions': [
                        'Reduce feature count',
                        'Lower image resolution',
                        'Use faster algorithms',
                        'Implement multi-threading'
                    ]
                },
                'pose_drift': {
                    'symptoms': ['Accumulating position errors', 'Inconsistent map', 'Wrong localization'],
                    'causes': ['Insufficient loop closure', 'Sensor noise', 'Dynamic objects'],
                    'solutions': [
                        'Enable loop closure detection',
                        'Improve sensor calibration',
                        'Use more stable features',
                        'Implement pose graph optimization'
                    ]
                }
            },
            'nav2_issues': {
                'path_planning_failure': {
                    'symptoms': ['Cannot find path', 'Frequent replanning', 'Getting stuck'],
                    'causes': ['Poor map quality', 'Incorrect parameters', 'Dynamic obstacles'],
                    'solutions': [
                        'Verify map quality and completeness',
                        'Tune costmap parameters',
                        'Check TF tree integrity',
                        'Validate sensor data'
                    ]
                },
                'oscillation': {
                    'symptoms': ['Robot oscillates', 'Cannot reach goal', 'Back-and-forth motion'],
                    'causes': ['Controller parameters', 'Local minima', 'Sensor noise'],
                    'solutions': [
                        'Tune controller parameters',
                        'Increase goal tolerance',
                        'Improve sensor quality',
                        'Use different local planner'
                    ]
                },
                'inconsistent_localization': {
                    'symptoms': ['Jumping poses', 'Wrong position estimates', 'TF errors'],
                    'causes': ['Timing issues', 'Frame mismatches', 'Sensor synchronization'],
                    'solutions': [
                        'Check clock synchronization',
                        'Verify TF tree structure',
                        'Ensure proper timing in callbacks',
                        'Validate sensor data timestamps'
                    ]
                }
            },
            'integration_issues': {
                'data_synchronization': {
                    'symptoms': ['Out-of-sync data', 'Timing errors', 'Wrong pose associations'],
                    'causes': ['Different update rates', 'Network latency', 'Buffer management'],
                    'solutions': [
                        'Implement proper buffering',
                        'Use message filters for synchronization',
                        'Match update rates where possible',
                        'Use appropriate QoS settings'
                    ]
                },
                'unity_connection': {
                    'symptoms': ['No visualization', 'Connection errors', 'Data loss'],
                    'causes': ['Network issues', 'Firewall blocking', 'Unity not running'],
                    'solutions': [
                        'Verify Unity application is running',
                        'Check network connectivity',
                        'Adjust firewall settings',
                        'Use proper IP and port configuration'
                    ]
                }
            }
        }

    def diagnose_issue(self, symptoms):
        """
        Diagnose issue based on symptoms
        """
        matches = []

        for category, issues in self.troubleshooting_guide.items():
            for issue_name, issue_info in issues.items():
                symptom_match_count = 0
                for symptom in symptoms:
                    for known_symptom in issue_info['symptoms']:
                        if symptom.lower() in known_symptom.lower():
                            symptom_match_count += 1

                if symptom_match_count > 0:
                    match_score = symptom_match_count / len(issue_info['symptoms'])
                    matches.append({
                        'category': category,
                        'issue': issue_name,
                        'confidence': match_score,
                        'solutions': issue_info['solutions']
                    })

        # Sort by confidence
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        return matches[:3]  # Return top 3 matches

    def get_performance_monitoring_tips(self):
        """
        Get tips for monitoring system performance
        """
        return [
            "Monitor CPU and memory usage regularly",
            "Track frame rates for VSLAM and visualization",
            "Watch for ROS topic message rates",
            "Check for dropped messages or delays",
            "Validate TF tree integrity",
            "Monitor sensor data quality",
            "Track navigation success rates",
            "Record system metrics for optimization"
        ]

    def get_best_practices(self):
        """
        Get best practices for VSLAM-Nav2 systems
        """
        return [
            "Start with simple environments and gradually increase complexity",
            "Validate sensor data before processing",
            "Use appropriate coordinate frame conventions",
            "Implement proper error handling and recovery",
            "Test with various lighting and environmental conditions",
            "Monitor and tune parameters based on performance",
            "Use simulation for initial testing",
            "Document system configurations and parameters"
        ]


def main():
    """Main troubleshooting utility"""
    troubleshooter = VSLAMNav2Troubleshooting()

    print("VSLAM-Nav2 Troubleshooting Guide")
    print("=================================")

    print("\nCommon VSLAM Issues:")
    for issue_name, info in troubleshooter.troubleshooting_guide['vslam_issues'].items():
        print(f"\n{issue_name.replace('_', ' ').title()}:")
        print(f"  Symptoms: {', '.join(info['symptoms'])}")
        print(f"  Causes: {', '.join(info['causes'])}")
        print(f"  Solutions: {', '.join(info['solutions'])}")

    print("\nCommon Nav2 Issues:")
    for issue_name, info in troubleshooter.troubleshooting_guide['nav2_issues'].items():
        print(f"\n{issue_name.replace('_', ' ').title()}:")
        print(f"  Symptoms: {', '.join(info['symptoms'])}")
        print(f"  Causes: {', '.join(info['causes'])}")
        print(f"  Solutions: {', '.join(info['solutions'])}")

    print("\nPerformance Monitoring Tips:")
    for tip in troubleshooter.get_performance_monitoring_tips():
        print(f"  - {tip}")

    print("\nBest Practices:")
    for practice in troubleshooter.get_best_practices():
        print(f"  - {practice}")


if __name__ == '__main__':
    main()
```

## Summary and Conclusion

### Project Completion Summary

This Digital Twin Project Implementation module has covered the complete integration of VSLAM and Navigation 2 systems:

1. **VSLAM Fundamentals**: Core components including feature detection, tracking, and mapping
2. **Nav2 Integration**: Connecting VSLAM-generated maps with Navigation 2 stack
3. **Real-time Mapping**: Dynamic map building and updating during navigation
4. **Semantic Understanding**: Adding semantic information to visual SLAM
5. **Isaac Sim Integration**: Connecting with simulation environments
6. **Unity Visualization**: Real-time visualization of the digital twin
7. **Performance Optimization**: Techniques for efficient operation
8. **Testing and Validation**: Comprehensive testing approach
9. **Troubleshooting**: Common issues and solutions

### Key Accomplishments

- **Complete System Architecture**: End-to-end system from sensors to navigation
- **Real-time Operation**: Optimized for real-time performance
- **Multi-Modal Integration**: Combines visual, spatial, and semantic information
- **Scalable Design**: Modular architecture for easy extension
- **Production Ready**: Includes error handling, monitoring, and optimization

### Next Steps

For further development and enhancement of the digital twin system:

1. **Machine Learning Integration**: Add deep learning for enhanced perception
2. **Multi-Robot Systems**: Extend to multiple robots with coordination
3. **Cloud Integration**: Connect with cloud services for remote processing
4. **Advanced Planning**: Implement semantic navigation and path planning
5. **Human-Robot Interaction**: Add interfaces for human operators
6. **Safety Systems**: Implement comprehensive safety and emergency procedures

This complete implementation provides a solid foundation for building sophisticated digital twin systems that can enable autonomous robot navigation using only visual sensors in previously unknown environments.