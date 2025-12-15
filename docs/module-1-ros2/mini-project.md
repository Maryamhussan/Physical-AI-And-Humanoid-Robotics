---
title: ROS 2 Mini-Project
sidebar_position: 6
---

# ROS 2 Mini-Project: Autonomous Robot Navigation System

## Project Overview

In this comprehensive mini-project, you'll build a complete autonomous robot navigation system using all the ROS 2 concepts learned in this module. This project integrates nodes, topics, services, actions, launch files, URDF models, and parameter configurations into a working robotic system.

### Learning Objectives

By completing this project, you will:

- Integrate multiple ROS 2 concepts into a cohesive system
- Create a complete robot application with navigation capabilities
- Implement sensor processing and control algorithms
- Use launch files to manage the complete system
- Apply best practices for ROS 2 development

## Project Architecture

### System Overview

The navigation system consists of:

- **Robot Model**: URDF representation of the robot
- **Sensor Processing**: Laser scan processing for obstacle detection
- **Navigation Stack**: Path planning and execution
- **Control System**: Robot movement control
- **Visualization**: RViz for monitoring and interaction

### Component Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Navigation    │    │   Sensor        │    │   Control       │
│   Node          │    │   Processing    │    │   Node          │
│                 │    │   Node          │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ geometry_msgs/Pose   │ sensor_msgs/LaserScan│ geometry_msgs/Twist
          │ nav_msgs/Path        │ sensor_msgs/PointCloud2│
          │ action_msgs/Goal     │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Robot State Publisher │
                    │   (URDF + TF)           │
                    └─────────────────────────┘
```

## Implementation Phase 1: Robot Model and URDF

### Creating the Robot URDF

First, let's create a URDF model for our robot:

```xml
<!-- urdf/navigation_robot.urdf -->
<?xml version="1.0"?>
<robot name="navigation_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Properties -->
  <xacro:property name="M_PI" value="3.14159265359"/>
  <xacro:property name="wheel_radius" value="0.05"/>
  <xacro:property name="wheel_width" value="0.02"/>
  <xacro:property name="base_length" value="0.3"/>
  <xacro:property name="base_width" value="0.25"/>
  <xacro:property name="base_height" value="0.1"/>
  <xacro:property name="caster_radius" value="0.025"/>

  <!-- Base link -->
  <link name="base_link">
    <visual>
      <origin xyz="0 0 ${base_height/2}" rpy="0 0 0"/>
      <geometry>
        <box size="${base_length} ${base_width} ${base_height}"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 0.8"/>
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 ${base_height/2}" rpy="0 0 0"/>
      <geometry>
        <box size="${base_length} ${base_width} ${base_height}"/>
      </geometry>
    </collision>
    <inertial>
      <origin xyz="0 0 ${base_height/2}" rpy="0 0 0"/>
      <mass value="2.0"/>
      <inertia ixx="0.1" ixy="0.0" ixz="0.0" iyy="0.1" iyz="0.0" izz="0.1"/>
    </inertial>
  </link>

  <!-- Front caster wheel -->
  <link name="caster_front">
    <visual>
      <geometry>
        <sphere radius="${caster_radius}"/>
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <sphere radius="${caster_radius}"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.1"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" iyy="0.001" iyz="0.0" izz="0.001"/>
    </inertial>
  </link>

  <!-- Caster joint -->
  <joint name="caster_front_joint" type="fixed">
    <parent link="base_link"/>
    <child link="caster_front"/>
    <origin xyz="${base_length/2 - caster_radius} 0 ${caster_radius}" rpy="0 0 0"/>
  </joint>

  <!-- Left wheel -->
  <link name="wheel_left">
    <visual>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0"/>
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0"/>
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" iyy="0.001" iyz="0.0" izz="0.002"/>
    </inertial>
  </link>

  <!-- Right wheel -->
  <link name="wheel_right">
    <visual>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0"/>
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="${M_PI/2} 0 0"/>
      <geometry>
        <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" iyy="0.001" iyz="0.0" izz="0.002"/>
    </inertial>
  </link>

  <!-- Left wheel joint -->
  <joint name="wheel_left_joint" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_left"/>
    <origin xyz="0 ${base_width/2 + wheel_width/2} ${wheel_radius}" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- Right wheel joint -->
  <joint name="wheel_right_joint" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_right"/>
    <origin xyz="0 ${-base_width/2 - wheel_width/2} ${wheel_radius}" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- Laser scanner -->
  <link name="laser_frame">
    <visual>
      <geometry>
        <cylinder radius="0.02" length="0.04"/>
      </geometry>
      <material name="red">
        <color rgba="1 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.02" length="0.04"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.1"/>
      <inertia ixx="0.0001" ixy="0.0" ixz="0.0" iyy="0.0001" iyz="0.0" izz="0.0001"/>
    </inertial>
  </link>

  <!-- Laser scanner joint -->
  <joint name="laser_joint" type="fixed">
    <parent link="base_link"/>
    <child link="laser_frame"/>
    <origin xyz="${base_length/2 - 0.02} 0 ${base_height + 0.02}" rpy="0 0 0"/>
  </joint>

</robot>
```

## Implementation Phase 2: Sensor Processing Node

### Creating the Sensor Processing Node

```python
#!/usr/bin/env python3
"""
Sensor Processing Node for Navigation Robot
Processes laser scan data to detect obstacles and free space
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from std_msgs.msg import Float32MultiArray
from geometry_msgs.msg import Twist
import math
import numpy as np
from collections import deque


class SensorProcessor(Node):
    """
    Processes laser scan data to detect obstacles and determine safe navigation directions
    """

    def __init__(self):
        super().__init__('sensor_processor')

        # Parameters
        self.declare_parameter('safe_distance', 0.5)
        self.declare_parameter('scan_angle_min', -1.57)  # -90 degrees
        self.declare_parameter('scan_angle_max', 1.57)   # 90 degrees
        self.declare_parameter('obstacle_threshold', 0.8)

        self.safe_distance = self.get_parameter('safe_distance').value
        self.scan_angle_min = self.get_parameter('scan_angle_min').value
        self.scan_angle_max = self.get_parameter('scan_angle_max').value
        self.obstacle_threshold = self.get_parameter('obstacle_threshold').value

        # Create subscribers and publishers
        self.scan_sub = self.create_subscription(
            LaserScan,
            'scan',
            self.scan_callback,
            10
        )

        self.obstacle_pub = self.create_publisher(
            Float32MultiArray,
            'obstacle_distances',
            10
        )

        self.cmd_pub = self.create_publisher(
            Twist,
            'cmd_vel',
            10
        )

        # State variables
        self.obstacle_detected = False
        self.obstacle_direction = 0.0  # Angle to closest obstacle
        self.obstacle_distance = float('inf')

        # History for smoothing
        self.obstacle_history = deque(maxlen=5)

        self.get_logger().info('Sensor Processor Node Initialized')
        self.get_logger().info(f'Parameters: safe_distance={self.safe_distance}, '
                              f'obstacle_threshold={self.obstacle_threshold}')

    def scan_callback(self, msg):
        """Process incoming laser scan data"""
        # Extract angle information
        angle_min = msg.angle_min
        angle_increment = msg.angle_increment

        # Find ranges within our sector of interest
        ranges = np.array(msg.ranges)
        valid_ranges = np.where((ranges > msg.range_min) & (ranges < msg.range_max))[0]

        # Calculate angles for each range
        angles = angle_min + np.arange(len(ranges)) * angle_increment

        # Filter for front sector (e.g., front 180 degrees)
        front_mask = (angles >= self.scan_angle_min) & (angles <= self.scan_angle_max) & (valid_ranges.size > 0)

        if valid_ranges.size > 0:
            # Get front ranges and angles
            front_ranges = ranges[front_mask]
            front_angles = angles[front_mask]

            if len(front_ranges) > 0:
                # Find closest obstacle in front
                min_idx = np.argmin(front_ranges)
                self.obstacle_distance = front_ranges[min_idx]
                self.obstacle_direction = front_angles[min_idx]
                self.obstacle_detected = self.obstacle_distance < self.obstacle_threshold

                # Publish obstacle information
                obstacle_msg = Float32MultiArray()
                obstacle_msg.data = [self.obstacle_distance, self.obstacle_direction,
                                   float(self.obstacle_detected)]
                self.obstacle_pub.publish(obstacle_msg)

                # Log obstacle detection
                if self.obstacle_detected:
                    self.get_logger().warn(f'Obstacle detected: {self.obstacle_distance:.2f}m '
                                          f'at {math.degrees(self.obstacle_direction):.1f}°')
                else:
                    self.get_logger().info(f'Clear path: {self.obstacle_distance:.2f}m ahead')
            else:
                self.obstacle_detected = False
                self.obstacle_distance = float('inf')
        else:
            self.obstacle_detected = False
            self.obstacle_distance = float('inf')

    def get_navigation_command(self):
        """Generate navigation command based on sensor data"""
        cmd_msg = Twist()

        if self.obstacle_detected:
            # If obstacle is close, stop and rotate
            if self.obstacle_distance < self.safe_distance:
                cmd_msg.linear.x = 0.0
                # Rotate away from obstacle (opposite direction)
                cmd_msg.angular.z = 0.5 if self.obstacle_direction < 0 else -0.5
                self.get_logger().info('Obstacle too close - rotating away')
            else:
                # If obstacle is far enough, move forward but turn slightly away
                cmd_msg.linear.x = 0.3
                cmd_msg.angular.z = 0.2 if self.obstacle_direction < 0 else -0.2
                self.get_logger().info('Obstacle detected - moving with avoidance')
        else:
            # No obstacles - move forward
            cmd_msg.linear.x = 0.5
            cmd_msg.angular.z = 0.0
            self.get_logger().info('Clear path - moving forward')

        return cmd_msg


def main(args=None):
    rclpy.init(args=args)

    try:
        processor = SensorProcessor()

        # Create a timer to periodically publish navigation commands
        def publish_command():
            cmd_msg = processor.get_navigation_command()
            processor.cmd_pub.publish(cmd_msg)

        # Publish commands at 10 Hz
        timer = processor.create_timer(0.1, publish_command)

        rclpy.spin(processor)

    except KeyboardInterrupt:
        pass
    finally:
        processor.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Implementation Phase 3: Navigation Node

### Creating the Navigation Node

```python
#!/usr/bin/env python3
"""
Navigation Node for Autonomous Robot
Implements path planning and goal-based navigation
"""

import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer, GoalResponse, CancelResponse
from rclpy.executors import MultiThreadedExecutor
from geometry_msgs.msg import PoseStamped, Twist
from nav_msgs.msg import Path
from std_msgs.msg import String
from example_interfaces.action import NavigateToPose
import math
import time
from enum import Enum


class NavigationState(Enum):
    IDLE = 0
    PLANNING = 1
    EXECUTING = 2
    RECOVERY = 3
    ERROR = 4


class NavigationNode(Node):
    """
    Navigation node that handles goal-based navigation using actions
    """

    def __init__(self):
        super().__init__('navigation_node')

        # Parameters
        self.declare_parameter('linear_speed', 0.3)
        self.declare_parameter('angular_speed', 0.5)
        self.declare_parameter('goal_tolerance', 0.2)
        self.declare_parameter('angular_tolerance', 0.1)

        self.linear_speed = self.get_parameter('linear_speed').value
        self.angular_speed = self.get_parameter('angular_speed').value
        self.goal_tolerance = self.get_parameter('goal_tolerance').value
        self.angular_tolerance = self.get_parameter('angular_tolerance').value

        # Publishers
        self.cmd_pub = self.create_publisher(Twist, 'cmd_vel', 10)
        self.path_pub = self.create_publisher(Path, 'current_path', 10)
        self.status_pub = self.create_publisher(String, 'navigation_status', 10)

        # Action server
        self._action_server = ActionServer(
            self,
            NavigateToPose,
            'navigate_to_pose',
            self.execute_callback,
            goal_callback=self.goal_callback,
            cancel_callback=self.cancel_callback
        )

        # State variables
        self.current_state = NavigationState.IDLE
        self.current_pose = None
        self.target_pose = None
        self.current_path = []

        # Create subscription for robot pose (in a real system, this would come from localization)
        # For this example, we'll simulate pose updates
        self.get_logger().info('Navigation Node Initialized')
        self.get_logger().info(f'Parameters: linear_speed={self.linear_speed}, '
                              f'angular_speed={self.angular_speed}, '
                              f'goal_tolerance={self.goal_tolerance}')

    def goal_callback(self, goal_request):
        """Accept or reject goal requests"""
        self.get_logger().info(f'Received navigation goal: ({goal_request.pose.pose.position.x}, '
                              f'{goal_request.pose.position.y})')
        return GoalResponse.ACCEPT

    def cancel_callback(self, goal_handle):
        """Accept or reject cancel requests"""
        self.get_logger().info('Received cancel request')
        return CancelResponse.ACCEPT

    def execute_callback(self, goal_handle):
        """Execute navigation goal"""
        self.get_logger().info('Executing navigation goal')

        # Update state
        self.current_state = NavigationState.PLANNING
        self.publish_status('PLANNING')

        # For this example, we'll simulate path planning
        # In a real system, this would call a path planner
        target_pose = goal_handle.request.pose
        self.target_pose = target_pose

        # Simulate planning delay
        time.sleep(0.5)

        # Generate a simple path (in real system, this would be from path planner)
        self.current_path = self.generate_simple_path(target_pose)
        self.path_pub.publish(self.create_path_msg(self.current_path))

        # Update state
        self.current_state = NavigationState.EXECUTING
        self.publish_status('EXECUTING')

        # Execute navigation
        result = self.follow_path(goal_handle)

        if goal_handle.is_cancel_requested:
            goal_handle.canceled()
            self.get_logger().info('Goal canceled')
            self.current_state = NavigationState.IDLE
            return NavigateToPose.Result()

        if result.success:
            goal_handle.succeed()
            self.get_logger().info('Goal succeeded')
        else:
            goal_handle.abort()
            self.get_logger().info('Goal aborted')

        self.current_state = NavigationState.IDLE
        return result

    def generate_simple_path(self, target_pose):
        """Generate a simple path to target (for demonstration)"""
        # In a real system, this would call a path planner like A*, Dijkstra, etc.
        # For this example, we'll create a straight line path
        path = []

        # Simulate current pose (in real system, this would come from localization)
        current_x, current_y = 0.0, 0.0  # Starting position

        # Create path points
        steps = 10
        for i in range(steps + 1):
            t = i / steps
            x = current_x + t * (target_pose.pose.position.x - current_x)
            y = current_y + t * (target_pose.pose.position.y - current_y)

            pose = PoseStamped()
            pose.pose.position.x = x
            pose.pose.position.y = y
            pose.pose.position.z = 0.0
            path.append(pose)

        return path

    def create_path_msg(self, poses):
        """Create Path message from pose list"""
        path_msg = Path()
        path_msg.header.frame_id = 'map'
        path_msg.header.stamp = self.get_clock().now().to_msg()
        path_msg.poses = poses
        return path_msg

    def follow_path(self, goal_handle):
        """Follow the planned path to reach the goal"""
        if not self.current_path:
            result = NavigateToPose.Result()
            result.success = False
            result.error_code = 1  # Invalid path
            return result

        self.get_logger().info(f'Following path with {len(self.current_path)} waypoints')

        for i, pose in enumerate(self.current_path):
            if goal_handle.is_cancel_requested:
                break

            # Move to this waypoint
            success = self.move_to_waypoint(pose.pose, goal_handle)

            if not success:
                result = NavigateToPose.Result()
                result.success = False
                result.error_code = 2  # Navigation failed
                return result

            # Publish feedback
            feedback = NavigateToPose.Feedback()
            feedback.current_pose = pose
            feedback.distance_remaining = self.calculate_distance_remaining(i)
            goal_handle.publish_feedback(feedback)

        # Check if we reached the final goal
        if self.is_at_goal():
            result = NavigateToPose.Result()
            result.success = True
            result.error_code = 0
            self.publish_status('SUCCEEDED')
            return result
        else:
            result = NavigateToPose.Result()
            result.success = False
            result.error_code = 3  # Goal not reached
            self.publish_status('FAILED')
            return result

    def move_to_waypoint(self, target_pose, goal_handle):
        """Move to a specific waypoint"""
        # Calculate distance and angle to target
        current_x, current_y = 0.0, 0.0  # Simulated current position
        target_x = target_pose.position.x
        target_y = target_pose.position.y

        dx = target_x - current_x
        dy = target_y - current_y
        distance = math.sqrt(dx*dx + dy*dy)

        # Calculate target angle
        target_angle = math.atan2(dy, dx)

        # Move until close enough to target
        while distance > self.goal_tolerance:
            if goal_handle.is_cancel_requested:
                return False

            # Calculate command
            cmd_msg = Twist()

            # Linear movement
            if distance > self.goal_tolerance:
                cmd_msg.linear.x = min(self.linear_speed, distance * 0.5)  # Proportional control
            else:
                cmd_msg.linear.x = 0.0

            # Angular movement
            current_angle = 0.0  # Simulated current angle
            angle_diff = target_angle - current_angle

            # Normalize angle difference
            while angle_diff > math.pi:
                angle_diff -= 2 * math.pi
            while angle_diff < -math.pi:
                angle_diff += 2 * math.pi

            if abs(angle_diff) > self.angular_tolerance:
                cmd_msg.angular.z = max(-self.angular_speed, min(self.angular_speed, angle_diff * 2.0))
            else:
                cmd_msg.angular.z = 0.0

            # Publish command
            self.cmd_pub.publish(cmd_msg)

            # Simulate movement (in real system, this would be handled by odometry/localization)
            time.sleep(0.1)

            # Update distance (simulated)
            current_x += cmd_msg.linear.x * 0.1 * math.cos(current_angle)
            current_y += cmd_msg.linear.x * 0.1 * math.sin(current_angle)
            current_angle += cmd_msg.angular.z * 0.1

            dx = target_x - current_x
            dy = target_y - current_y
            distance = math.sqrt(dx*dx + dy*dy)

        # Stop when reached
        stop_msg = Twist()
        self.cmd_pub.publish(stop_msg)
        return True

    def is_at_goal(self):
        """Check if robot is at goal position"""
        # Simulated goal check
        target_x = self.target_pose.pose.position.x
        target_y = self.target_pose.pose.position.y
        current_x, current_y = 0.0, 0.0  # Simulated current position

        distance = math.sqrt((target_x - current_x)**2 + (target_y - current_y)**2)
        return distance <= self.goal_tolerance

    def calculate_distance_remaining(self, current_index):
        """Calculate remaining distance to goal"""
        # Simplified calculation
        return len(self.current_path) - current_index

    def publish_status(self, status):
        """Publish navigation status"""
        status_msg = String()
        status_msg.data = status
        self.status_pub.publish(status_msg)


def main(args=None):
    rclpy.init(args=args)

    try:
        navigator = NavigationNode()

        # Use multi-threaded executor to handle action callbacks
        executor = MultiThreadedExecutor()
        executor.add_node(navigator)

        try:
            executor.spin()
        except KeyboardInterrupt:
            pass
        finally:
            navigator.destroy_node()

    finally:
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Implementation Phase 4: Control Node

### Creating the Robot Control Node

```python
#!/usr/bin/env python3
"""
Robot Control Node
Implements low-level robot control and safety features
"""

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist, Vector3
from sensor_msgs.msg import LaserScan
from std_srvs.srv import Trigger
from rclpy.qos import QoSProfile, ReliabilityPolicy
import time
import math


class RobotController(Node):
    """
    Robot controller that handles low-level motor commands and safety features
    """

    def __init__(self):
        super().__init__('robot_controller')

        # Parameters
        self.declare_parameter('max_linear_velocity', 1.0)
        self.declare_parameter('max_angular_velocity', 1.0)
        self.declare_parameter('emergency_stop_distance', 0.2)
        self.declare_parameter('safety_timeout', 1.0)

        self.max_linear = self.get_parameter('max_linear_velocity').value
        self.max_angular = self.get_parameter('max_angular_velocity').value
        self.emergency_distance = self.get_parameter('emergency_stop_distance').value
        self.safety_timeout = self.get_parameter('safety_timeout').value

        # QoS profile for safety-critical topics
        qos_profile = QoSProfile(depth=10)
        qos_profile.reliability = ReliabilityPolicy.RELIABLE

        # Publishers and subscribers
        self.cmd_sub = self.create_subscription(
            Twist,
            'cmd_vel',
            self.cmd_callback,
            qos_profile
        )

        self.safety_cmd_pub = self.create_publisher(
            Twist,
            'cmd_vel_safety',
            qos_profile
        )

        self.scan_sub = self.create_subscription(
            LaserScan,
            'scan',
            self.scan_callback,
            qos_profile
        )

        # Services
        self.emergency_stop_srv = self.create_service(
            Trigger,
            'emergency_stop',
            self.emergency_stop_callback
        )

        self.reset_srv = self.create_service(
            Trigger,
            'reset_safety',
            self.reset_safety_callback
        )

        # State variables
        self.last_cmd_time = self.get_clock().now()
        self.safety_enabled = True
        self.emergency_stopped = False
        self.obstacle_detected = False
        self.last_cmd = Twist()
        self.safety_cmd = Twist()

        # Timers
        self.safety_timer = self.create_timer(0.1, self.safety_check)
        self.cmd_forward_timer = self.create_timer(0.05, self.forward_command)

        self.get_logger().info('Robot Controller Initialized')
        self.get_logger().info(f'Parameters: max_linear={self.max_linear}, '
                              f'max_angular={self.max_angular}, '
                              f'emergency_distance={self.emergency_distance}')

    def cmd_callback(self, msg):
        """Handle incoming velocity commands"""
        # Validate and limit command values
        limited_msg = Twist()
        limited_msg.linear = Vector3(
            x=max(-self.max_linear, min(self.max_linear, msg.linear.x)),
            y=max(-self.max_linear, min(self.max_linear, msg.linear.y)),
            z=max(-self.max_linear, min(self.max_linear, msg.linear.z))
        )
        limited_msg.angular = Vector3(
            x=max(-self.max_angular, min(self.max_angular, msg.angular.x)),
            y=max(-self.max_angular, min(self.max_angular, msg.angular.y)),
            z=max(-self.max_angular, min(self.max_angular, msg.angular.z))
        )

        self.last_cmd = limited_msg
        self.last_cmd_time = self.get_clock().now()

        self.get_logger().debug(f'Received command: linear={self.last_cmd.linear.x:.2f}, '
                               f'angular={self.last_cmd.angular.z:.2f}')

    def scan_callback(self, msg):
        """Process laser scan for safety checks"""
        # Find minimum distance in front of robot
        ranges = [r for r in msg.ranges if msg.range_min < r < msg.range_max]

        if ranges:
            min_distance = min(ranges)
            self.obstacle_detected = min_distance < self.emergency_distance

            if self.obstacle_detected and self.safety_enabled:
                self.get_logger().warn(f'Obstacle detected: {min_distance:.2f}m - applying safety stop')
        else:
            self.obstacle_detected = False

    def safety_check(self):
        """Perform safety checks and apply safety measures"""
        current_time = self.get_clock().now()

        # Check for command timeout
        time_since_last_cmd = (current_time - self.last_cmd_time).nanoseconds / 1e9
        cmd_timeout = time_since_last_cmd > self.safety_timeout

        # Determine safety command
        if self.emergency_stopped:
            # Emergency stop - always send zero velocity
            self.safety_cmd = Twist()
            self.get_logger().warn('EMERGENCY STOP ACTIVE')
        elif self.obstacle_detected:
            # Obstacle detected - stop
            self.safety_cmd = Twist()
            self.get_logger().warn('OBSTACLE STOP ACTIVE')
        elif cmd_timeout:
            # Command timeout - stop for safety
            self.safety_cmd = Twist()
            self.get_logger().warn('COMMAND TIMEOUT - SAFETY STOP')
        else:
            # Safe to proceed with normal command
            self.safety_cmd = self.last_cmd

        # Log safety status
        if self.safety_cmd.linear.x == 0 and self.safety_cmd.angular.z == 0:
            if self.emergency_stopped:
                status = "EMERGENCY"
            elif self.obstacle_detected:
                status = "OBSTACLE"
            elif cmd_timeout:
                status = "TIMEOUT"
            else:
                status = "STOPPED"
            self.get_logger().info(f'Safety system active: {status}')
        else:
            self.get_logger().debug('Safety system normal operation')

    def forward_command(self):
        """Forward the safety-processed command to the robot"""
        if self.safety_enabled:
            self.safety_cmd_pub.publish(self.safety_cmd)

    def emergency_stop_callback(self, request, response):
        """Handle emergency stop service request"""
        self.get_logger().warn('EMERGENCY STOP REQUESTED')
        self.emergency_stopped = True
        self.safety_cmd = Twist()  # Immediate stop
        self.safety_cmd_pub.publish(self.safety_cmd)

        response.success = True
        response.message = 'Emergency stop activated'
        return response

    def reset_safety_callback(self, request, response):
        """Handle safety reset service request"""
        self.get_logger().info('Safety system reset requested')
        self.emergency_stopped = False
        self.get_logger().info('Safety system reset complete')

        response.success = True
        response.message = 'Safety system reset'
        return response


def main(args=None):
    rclpy.init(args=args)

    try:
        controller = RobotController()
        rclpy.spin(controller)

    except KeyboardInterrupt:
        pass
    finally:
        controller.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Implementation Phase 5: Launch Files

### Creating the Main Launch File

```python
# launch/navigation_robot.launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, TimerAction, GroupAction
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node, PushRosNamespace, SetParameter
from launch_ros.substitutions import FindPackageShare
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time', default='false')
    use_rviz = LaunchConfiguration('use_rviz', default='true')
    robot_namespace = LaunchConfiguration('robot_namespace', default='')
    log_level = LaunchConfiguration('log_level', default='info')

    # Declare launch arguments
    declare_use_sim_time_arg = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation (Gazebo) clock if true'
    )

    declare_use_rviz_arg = DeclareLaunchArgument(
        'use_rviz',
        default_value='true',
        description='Whether to start RVIZ'
    )

    declare_robot_namespace_arg = DeclareLaunchArgument(
        'robot_namespace',
        default_value='',
        description='Top-level namespace'
    )

    declare_log_level_arg = DeclareLaunchArgument(
        'log_level',
        default_value='info',
        description='Logging level'
    )

    # Get package share directory
    pkg_share = get_package_share_directory('navigation_robot_pkg')
    default_model_path = os.path.join(pkg_share, 'urdf', 'navigation_robot.urdf')
    default_rviz_config_path = os.path.join(pkg_share, 'rviz', 'navigation_view.rviz')

    # Set parameters
    set_use_sim_time = SetParameter(name='use_sim_time', value=use_sim_time)

    # Robot state publisher
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        parameters=[
            {'robot_description': open(default_model_path).read()},
            {'use_sim_time': use_sim_time.perform({}) == 'true'}
        ],
        remappings=[
            ('/tf', 'tf'),
            ('/tf_static', 'tf_static')
        ],
        arguments=['--ros-args', '--log-level', log_level]
    )

    # Joint state publisher (for non-fixed joints)
    joint_state_publisher = Node(
        package='joint_state_publisher',
        executable='joint_state_publisher',
        name='joint_state_publisher',
        parameters=[
            {'use_sim_time': use_sim_time.perform({}) == 'true'}
        ],
        arguments=['--ros-args', '--log-level', log_level]
    )

    # Sensor processor node
    sensor_processor = Node(
        package='navigation_robot_pkg',
        executable='sensor_processor',
        name='sensor_processor',
        parameters=[
            {'use_sim_time': use_sim_time.perform({}) == 'true'},
            {'safe_distance': 0.5},
            {'obstacle_threshold': 0.8}
        ],
        remappings=[
            ('scan', 'scan'),
            ('cmd_vel', 'cmd_vel_input')
        ],
        arguments=['--ros-args', '--log-level', log_level]
    )

    # Navigation node
    navigation_node = Node(
        package='navigation_robot_pkg',
        executable='navigation_node',
        name='navigation_node',
        parameters=[
            {'use_sim_time': use_sim_time.perform({}) == 'true'},
            {'linear_speed': 0.3},
            {'angular_speed': 0.5},
            {'goal_tolerance': 0.2}
        ],
        arguments=['--ros-args', '--log-level', log_level]
    )

    # Robot controller node
    robot_controller = Node(
        package='navigation_robot_pkg',
        executable='robot_controller',
        name='robot_controller',
        parameters=[
            {'use_sim_time': use_sim_time.perform({}) == 'true'},
            {'max_linear_velocity': 1.0},
            {'max_angular_velocity': 1.0},
            {'emergency_stop_distance': 0.2}
        ],
        remappings=[
            ('cmd_vel', 'cmd_vel_input'),
            ('cmd_vel_safety', 'cmd_vel')
        ],
        arguments=['--ros-args', '--log-level', log_level]
    )

    # RVIZ node
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', default_rviz_config_path],
        parameters=[
            {'use_sim_time': use_sim_time.perform({}) == 'true'}
        ],
        condition=IfCondition(use_rviz),
        arguments=['--ros-args', '--log-level', log_level]
    )

    # Delay RVIZ to allow other nodes to start first
    delayed_rviz_launch = TimerAction(
        period=2.0,
        actions=[rviz_node]
    )

    # Group nodes with namespace if specified
    all_nodes = GroupAction(
        actions=[
            robot_state_publisher,
            joint_state_publisher,
            sensor_processor,
            navigation_node,
            robot_controller,
        ],
        condition=IfCondition(
            LaunchConfiguration('robot_namespace').perform({}) == ''
        )
    )

    namespaced_nodes = GroupAction(
        actions=[
            PushRosNamespace(robot_namespace),
            robot_state_publisher,
            joint_state_publisher,
            sensor_processor,
            navigation_node,
            robot_controller,
        ],
        condition=IfCondition(
            LaunchConfiguration('robot_namespace').perform({}) != ''
        )
    )

    # Launch description
    ld = LaunchDescription()

    # Add launch arguments
    ld.add_action(declare_use_sim_time_arg)
    ld.add_action(declare_use_rviz_arg)
    ld.add_action(declare_robot_namespace_arg)
    ld.add_action(declare_log_level_arg)

    # Add nodes
    ld.add_action(set_use_sim_time)
    ld.add_action(all_nodes)
    ld.add_action(namespaced_nodes)
    ld.add_action(delayed_rviz_launch)

    return ld
```

## Implementation Phase 6: Configuration Files

### Creating Parameter Configuration

```yaml
# config/navigation_params.yaml
/**:
  ros__parameters:
    # Robot configuration
    robot_name: "navigation_robot"
    max_linear_velocity: 1.0
    max_angular_velocity: 1.0
    wheel_radius: 0.05
    wheel_separation: 0.3

    # Navigation parameters
    navigation:
      linear_speed: 0.3
      angular_speed: 0.5
      goal_tolerance: 0.2
      angular_tolerance: 0.1
      planner_frequency: 5.0
      controller_frequency: 20.0

    # Sensor processing parameters
    sensor_processor:
      safe_distance: 0.5
      scan_angle_min: -1.57 # -90 degrees
      scan_angle_max: 1.57 # 90 degrees
      obstacle_threshold: 0.8

    # Safety parameters
    robot_controller:
      emergency_stop_distance: 0.2
      safety_timeout: 1.0
      max_linear_velocity: 1.0
      max_angular_velocity: 1.0
```

## Implementation Phase 7: RViz Configuration

### Creating RViz Configuration

```yaml
# rviz/navigation_view.rviz
Panels:
  - Class: rviz_common/Displays
    Help Height: 78
    Name: Displays
    Property Tree Widget:
      Expanded:
        - /Global Options1
        - /Status1
        - /RobotModel1
        - /LaserScan1
        - /Path1
      Splitter Ratio: 0.5
    Tree Height: 617
  - Class: rviz_common/Selection
    Name: Selection
  - Class: rviz_common/Tool Properties
    Expanded:
      - /2D Goal Pose1
      - /Publish Point1
    Name: Tool Properties
    Splitter Ratio: 0.5886790156364441
  - Class: rviz_common/Views
    Expanded:
      - /Current View1
    Name: Views
    Splitter Ratio: 0.5
Visualization Manager:
  Class: ""
  Displays:
    - Alpha: 0.5
      Cell Size: 1
      Class: rviz_default_plugins/Grid
      Color: 160; 160; 164
      Enabled: true
      Line Style:
        Line Width: 0.029999999329447746
        Value: Lines
      Name: Grid
      Normal Cell Count: 0
      Offset:
        X: 0
        Y: 0
        Z: 0
      Plane: XY
      Plane Cell Count: 10
      Reference Frame: <Fixed Frame>
      Value: true
    - Alpha: 1
      Class: rviz_default_plugins/RobotModel
      Collision Enabled: false
      Description File: ""
      Description Source: Topic
      Description Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /robot_description
      Enabled: true
      Links:
        All Links Enabled: true
        Expand Joint Details: false
        Expand Link Details: false
        Expand Tree: false
        Link Tree Style: Links in Alphabetic Order
        base_link:
          Alpha: 1
          Show Axes: false
          Show Trail: false
          Value: true
        caster_front:
          Alpha: 1
          Show Axes: false
          Show Trail: false
          Value: true
        laser_frame:
          Alpha: 1
          Show Axes: false
          Show Trail: false
          Value: true
        wheel_left:
          Alpha: 1
          Show Axes: false
          Show Trail: false
          Value: true
        wheel_right:
          Alpha: 1
          Show Axes: false
          Show Trail: false
          Value: true
      Name: RobotModel
      TF Prefix: ""
      Update Interval: 0
      Value: true
      Visual Enabled: true
    - Alpha: 1
      Autocompute Intensity Bounds: true
      Autocompute Value Bounds:
        Max Value: 10
        Min Value: -10
        Value: true
      Axis: Z
      Channel Name: intensity
      Class: rviz_default_plugins/LaserScan
      Color: 255; 255; 255
      Color Transformer: Intensity
      Decay Time: 0
      Enabled: true
      Invert Rainbow: false
      Max Color: 255; 255; 255
      Max Intensity: 0
      Min Color: 0; 0; 0
      Min Intensity: 0
      Name: LaserScan
      Position Transformer: XYZ
      Queue Size: 10
      Selectable: true
      Size (Pixels): 3
      Size (m): 0.009999999776482582
      Style: Flat Squares
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /scan
      Use Fixed Frame: true
      Use rainbow: true
      Value: true
    - Alpha: 1
      Buffer Length: 1
      Class: rviz_default_plugins/Path
      Color: 25; 255; 0
      Enabled: true
      Head Diameter: 0.30000001192092896
      Head Length: 0.20000000298023224
      Length: 0.30000001192092896
      Line Style: Lines
      Line Width: 0.029999999329447746
      Name: Path
      Offset:
        X: 0
        Y: 0
        Z: 0
      Pose Color: 255; 85; 255
      Pose Style: None
      Radius: 0.029999999329447746
      Shaft Diameter: 0.10000000149011612
      Shaft Length: 0.10000000149011612
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /current_path
      Value: true
  Enabled: true
  Global Options:
    Background Color: 48; 48; 48
    Fixed Frame: map
    Frame Rate: 30
  Name: root
  Tools:
    - Class: rviz_default_plugins/Interact
      Hide Inactive Objects: true
    - Class: rviz_default_plugins/MoveCamera
    - Class: rviz_default_plugins/Select
    - Class: rviz_default_plugins/FocusCamera
    - Class: rviz_default_plugins/Measure
      Line color: 128; 128; 0
    - Class: rviz_default_plugins/SetInitialPose
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /initialpose
    - Class: rviz_default_plugins/SetGoal
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /goal_pose
    - Class: rviz_default_plugins/PublishPoint
      Single click: true
      Topic:
        Depth: 5
        Durability Policy: Volatile
        History Policy: Keep Last
        Reliability Policy: Reliable
        Value: /clicked_point
  Transformation:
    Current:
      Class: rviz_default_plugins/TF
  Value: true
  Views:
    Current:
      Class: rviz_default_plugins/Orbit
      Distance: 10
      Enable Stereo Rendering:
        Stereo Eye Separation: 0.05999999865889549
        Stereo Focal Distance: 1
        Swap Stereo Eyes: false
        Value: false
      Focal Point:
        X: 0
        Y: 0
        Z: 0
      Focal Shape Fixed Size: true
      Focal Shape Size: 0.05000000074505806
      Invert Z Axis: false
      Name: Current View
      Near Clip Distance: 0.009999999776482582
      Pitch: 0.7853981852531433
      Target Frame: <Fixed Frame>
      Value: Orbit (rviz)
      Yaw: 0.7853981852531433
    Saved: ~
Window Geometry:
  Displays:
    collapsed: false
  Height: 846
  Hide Left Dock: false
  Hide Right Dock: false
  QMainWindow State: 000000ff00000000fd000000040000000000000156000002f4fc0200000008fb0000001200530065006c0065006300740069006f006e00000001e10000009b0000005c00fffffffb0000001e0054006f006f006c002000500072006f007000650072007400690065007302000001ed000001df00000185000000a3fb000000120056006900650077007300200054006f006f02000001df000002110000018500000122fb000000200054006f006f006c002000500072006f0070006500720074006900650073003203000002880000011d000002210000017afb000000100044006900730070006c006100790073010000003d000002f4000000c900fffffffb0000002000730065006c0065006300740069006f006e00200062007500660066006500720200000138000000aa0000023a00000294fb00000014005700690064006500530074006500720065006f02000000e6000000d2000003ee0000030bfb0000000c004b0069006e0065006300740200000186000001060000030c00000261000000010000010f000002f4fc0200000003fb0000001e0054006f006f006c002000500072006f00700065007200740069006500730100000041000000780000000000000000fb0000000a00560069006500770073000000003d000002f4000000a400fffffffb0000001200530065006c0065006300740069006f006e010000025a000000b200000000000000000000000200000490000000a9fc0100000001fb0000000a00560069006500770073030000004e00000080000002e10000019700000003000004420000003efc0100000002fb0000000800540069006d00650100000000000004420000000000000000fb0000000800540069006d006501000000000000045000000000000000000000023f000002f400000004000000040000000800000008fc00000001000000020000000a0054006f006f006c00730100000000ffffffff0000000000000000
  Width: 1200
  X: 60
  Y: 60
```

## Implementation Phase 8: Package Setup

### Creating Package Files

```python
# setup.py
from setuptools import find_packages, setup

package_name = 'navigation_robot_pkg'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/navigation_robot.launch.py']),
        ('share/' + package_name + '/urdf', ['urdf/navigation_robot.urdf']),
        ('share/' + package_name + '/config', ['config/navigation_params.yaml']),
        ('share/' + package_name + '/rviz', ['rviz/navigation_view.rviz']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='ROS User',
    maintainer_email='user@todo.todo',
    description='ROS 2 Navigation Robot Package',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'sensor_processor = navigation_robot_pkg.sensor_processor:main',
            'navigation_node = navigation_robot_pkg.navigation_node:main',
            'robot_controller = navigation_robot_pkg.robot_controller:main',
        ],
    },
)
```

```xml
<!-- package.xml -->
<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>navigation_robot_pkg</name>
  <version>0.0.0</version>
  <description>ROS 2 Navigation Robot Package</description>
  <maintainer email="user@todo.todo">ROS User</maintainer>
  <license>Apache-2.0</license>

  <depend>rclpy</depend>
  <depend>std_msgs</depend>
  <depend>sensor_msgs</depend>
  <depend>geometry_msgs</depend>
  <depend>nav_msgs</end>
  <depend>std_srvs</depend>
  <depend>example_interfaces</depend>

  <test_depend>ament_copyright</test_depend>
  <test_depend>ament_flake8</test_depend>
  <test_depend>ament_pep257</test_depend>
  <test_depend>python3-pytest</test_depend>

  <export>
    <build_type>ament_python</build_type>
  </export>
</package>
```

## Testing the Complete System

### Running the System

1. **Build the package**:

```bash
cd ~/ros2_ws
colcon build --packages-select navigation_robot_pkg
source install/setup.bash
```

2. **Run the complete system**:

```bash
ros2 launch navigation_robot_pkg navigation_robot.launch.py
```

3. **Send navigation goals** (in another terminal):

```bash
# Send a navigation goal
ros2 action send_goal /navigate_to_pose example_interfaces/action/NavigateToPose "{pose: {position: {x: 1.0, y: 1.0, z: 0.0}, orientation: {z: 0.0, w: 1.0}}}"
```

4. **Monitor the system**:

```bash
# Check topics
ros2 topic list

# Monitor laser scan
ros2 topic echo /scan

# Monitor robot commands
ros2 topic echo /cmd_vel
```

## Project Extensions

### Advanced Features to Implement

1. **Map Building**: Integrate SLAM for map creation
2. **Path Planning**: Use A\* or Dijkstra for optimal path planning
3. **Localization**: Implement AMCL for robot localization
4. **Obstacle Avoidance**: Advanced local planners like DWA or TEB
5. **Multi-Robot Coordination**: Extend to multiple robots

## Summary

This mini-project demonstrates the integration of all major ROS 2 concepts:

- **Nodes and Topics**: Communication between system components
- **Services and Actions**: Synchronous and asynchronous operations
- **Parameters**: Configuration management
- **Launch Files**: System deployment and management
- **URDF**: Robot modeling and visualization
- **Safety Systems**: Emergency stops and safety checks

The project provides a solid foundation for developing more complex robotic applications and demonstrates best practices for ROS 2 development.
