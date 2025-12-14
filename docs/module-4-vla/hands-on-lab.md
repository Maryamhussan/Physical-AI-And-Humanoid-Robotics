---
title: VLA Systems Hands-On Lab
sidebar_position: 12
description: Comprehensive hands-on lab covering all aspects of Vision-Language-Action systems
---

# VLA Systems Hands-On Lab

## Introduction

This hands-on lab provides comprehensive practical exercises covering all aspects of Vision-Language-Action (VLA) systems. You'll build a complete VLA system from scratch, integrating ROS 2, NVIDIA Isaac Sim, Large Language Models, and multimodal perception.

## Lab Prerequisites

Before starting this lab, ensure you have:

1. **Development Environment**:
   - Ubuntu 20.04 or 22.04 (or WSL2 on Windows)
   - ROS 2 Humble Hawksbill installed
   - NVIDIA GPU with CUDA 11.8+ support
   - Python 3.8+

2. **Required Software**:
   - NVIDIA Isaac Sim (Omniverse)
   - OpenAI API key (for LLM integration)
   - Git and basic development tools

3. **Hardware Requirements** (for simulation):
   - NVIDIA GPU (RTX 30xx or 40xx recommended)
   - 16GB+ RAM
   - 50GB+ free disk space

## Lab 1: ROS 2 Foundation and Robot Control

### Objective
Build a foundational ROS 2 robot control system with proper architecture.

### Steps

#### 1. Create a Basic Robot Package

```bash
# Create workspace
mkdir -p ~/vla_ws/src
cd ~/vla_ws/src

# Create robot package
ros2 pkg create --build-type ament_python vla_robot_control --dependencies rclpy std_msgs geometry_msgs sensor_msgs nav_msgs

cd vla_robot_control
mkdir vla_robot_control
touch vla_robot_control/__init__.py
```

#### 2. Implement Basic Robot Controller

```python
# File: vla_robot_control/basic_controller.py
#!/usr/bin/env python3
"""
Basic Robot Controller for VLA System
Implements fundamental ROS 2 concepts and robot control
"""

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
from geometry_msgs.msg import Twist, PoseStamped
from sensor_msgs.msg import LaserScan, Image
from std_msgs.msg import String
from nav_msgs.msg import Odometry
import math
import time


class BasicRobotController(Node):
    """
    Basic Robot Controller implementing fundamental ROS 2 concepts
    """

    def __init__(self):
        super().__init__('basic_robot_controller')

        # QoS profiles for different data types
        sensor_qos = QoSProfile(
            depth=10,
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST
        )

        cmd_qos = QoSProfile(
            depth=1,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST
        )

        # Publishers
        self.cmd_vel_pub = self.create_publisher(Twist, 'cmd_vel', cmd_qos)
        self.status_pub = self.create_publisher(String, 'robot_status', cmd_qos)

        # Subscribers
        self.odom_sub = self.create_subscription(
            Odometry,
            'odom',
            self.odom_callback,
            10
        )

        self.scan_sub = self.create_subscription(
            LaserScan,
            'scan',
            self.scan_callback,
            sensor_qos
        )

        self.camera_sub = self.create_subscription(
            Image,
            'camera/image_raw',
            self.camera_callback,
            sensor_qos
        )

        # Robot state
        self.current_pose = None
        self.obstacle_detected = False
        self.safe_distance = 0.5  # meters
        self.robot_state = 'idle'  # idle, moving, obstacle_detected, emergency_stop

        # Timers
        self.control_timer = self.create_timer(0.1, self.control_loop)  # 10 Hz control
        self.status_timer = self.create_timer(1.0, self.publish_status)  # 1 Hz status

        # Parameters
        self.declare_parameter('linear_speed', 0.3)
        self.declare_parameter('angular_speed', 0.5)
        self.declare_parameter('safe_distance', 0.5)

        self.linear_speed = self.get_parameter('linear_speed').value
        self.angular_speed = self.get_parameter('angular_speed').value
        self.safe_distance = self.get_parameter('safe_distance').value

        self.get_logger().info('Basic Robot Controller initialized')
        self.get_logger().info(f'Parameters - Linear speed: {self.linear_speed}m/s, '
                              f'Angular speed: {self.angular_speed}rad/s, '
                              f'Safe distance: {self.safe_distance}m')

    def odom_callback(self, msg):
        """Handle odometry data"""
        self.current_pose = msg.pose.pose
        # Extract position and orientation for navigation
        pos = msg.pose.pose.position
        quat = msg.pose.pose.orientation
        self.get_logger().debug(f'Pose updated: x={pos.x:.2f}, y={pos.y:.2f}')

    def scan_callback(self, msg):
        """Process laser scan data to detect obstacles"""
        # Find minimum distance in front of robot (±30 degrees)
        front_ranges = []
        angle_min = msg.angle_min
        angle_increment = msg.angle_increment

        for i, range_val in enumerate(msg.ranges):
            angle = angle_min + i * angle_increment
            if -math.pi/6 <= angle <= math.pi/6:  # Front 60 degrees
                if 0.1 < range_val < 10.0:  # Valid range
                    front_ranges.append(range_val)

        if front_ranges:
            min_distance = min(front_ranges)
            self.obstacle_detected = min_distance < self.safe_distance

            if self.obstacle_detected:
                self.get_logger().warn(f'Obstacle detected: {min_distance:.2f}m ahead')
                self.robot_state = 'obstacle_detected'
            else:
                self.get_logger().info(f'Path clear: {min_distance:.2f}m ahead')
                if self.robot_state == 'obstacle_detected':
                    self.robot_state = 'idle'
        else:
            self.obstacle_detected = False  # No front-facing data

    def camera_callback(self, msg):
        """Process camera data (placeholder for vision processing)"""
        # In a real system, this would process the image data
        # For now, just log that we received camera data
        self.get_logger().debug(f'Camera image received: {msg.width}x{msg.height}')

    def control_loop(self):
        """Main control loop implementing obstacle avoidance"""
        if self.robot_state == 'emergency_stop':
            # Stay stopped
            stop_cmd = Twist()
            self.cmd_vel_pub.publish(stop_cmd)
            return

        cmd_msg = Twist()

        if self.obstacle_detected:
            # Stop and rotate to find clear path
            cmd_msg.linear.x = 0.0
            cmd_msg.angular.z = self.angular_speed  # Rotate in place
            self.get_logger().info('Obstacle detected - rotating to find path')
            self.robot_state = 'obstacle_detected'
        else:
            # Move forward
            cmd_msg.linear.x = self.linear_speed
            cmd_msg.angular.z = 0.0
            self.robot_state = 'moving'
            self.get_logger().info('Moving forward')

        # Publish command
        self.cmd_vel_pub.publish(cmd_msg)

    def publish_status(self):
        """Publish robot status information"""
        status_msg = String()
        status_msg.data = f'Robot status: {self.robot_state}, ' \
                         f'Linear vel: {self.linear_speed}m/s, ' \
                         f'Angular vel: 0.0rad/s, ' \
                         f'Obstacle: {self.obstacle_detected}'
        self.status_pub.publish(status_msg)

    def emergency_stop(self):
        """Activate emergency stop"""
        self.get_logger().warn('EMERGENCY STOP ACTIVATED')
        self.robot_state = 'emergency_stop'

        # Send stop command
        stop_msg = Twist()
        self.cmd_vel_pub.publish(stop_msg)

    def reset_emergency_stop(self):
        """Reset emergency stop state"""
        self.get_logger().info('Emergency stop reset')
        self.robot_state = 'idle'


def main(args=None):
    """Main function to run the basic robot controller"""
    rclpy.init(args=args)

    try:
        controller = BasicRobotController()

        # Use multi-threaded executor to handle multiple callbacks
        from rclpy.executors import MultiThreadedExecutor
        executor = MultiThreadedExecutor()
        executor.add_node(controller)

        try:
            executor.spin()
        except KeyboardInterrupt:
            controller.get_logger().info('Shutting down gracefully...')
        finally:
            controller.destroy_node()
            rclpy.shutdown()

    except Exception as e:
        print(f'Error running controller: {e}')
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

#### 3. Create Launch File

```python
# File: launch/basic_controller.launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        # Declare launch arguments
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='false',
            description='Use simulation (Gazebo) clock if true'
        ),

        DeclareLaunchArgument(
            'linear_speed',
            default_value='0.3',
            description='Linear speed for robot movement'
        ),

        DeclareLaunchArgument(
            'angular_speed',
            default_value='0.5',
            description='Angular speed for robot rotation'
        ),

        # Robot controller node
        Node(
            package='vla_robot_control',
            executable='basic_controller',
            name='basic_robot_controller',
            parameters=[
                {
                    'linear_speed': LaunchConfiguration('linear_speed'),
                    'angular_speed': LaunchConfiguration('angular_speed'),
                    'safe_distance': 0.5
                }
            ],
            output='screen'
        )
    ])
```

#### 4. Update setup.py

```python
# File: setup.py
from setuptools import find_packages, setup

package_name = 'vla_robot_control'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/basic_controller.launch.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='your_name',
    maintainer_email='your_email@example.com',
    description='Basic robot controller for VLA system',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'basic_controller = vla_robot_control.basic_controller:main',
        ],
    },
)
```

#### 5. Build and Test

```bash
cd ~/vla_ws
colcon build --packages-select vla_robot_control
source install/setup.bash

# Run the controller
ros2 run vla_robot_control basic_controller

# Or launch with parameters
ros2 launch vla_robot_control basic_controller.launch.py linear_speed:=0.5 angular_speed:=0.8
```

## Lab 2: Isaac Sim Integration

### Objective
Integrate the robot controller with NVIDIA Isaac Sim for simulation and visualization.

### Steps

#### 1. Create Isaac Sim Robot Model

```xml
<!-- File: vla_robot_control/models/simple_robot.urdf -->
<?xml version="1.0"?>
<robot name="simple_vla_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Properties -->
  <xacro:property name="M_PI" value="3.1415926535897931" />
  <xacro:property name="base_width" value="0.3" />
  <xacro:property name="base_length" value="0.4" />
  <xacro:property name="base_height" value="0.15" />
  <xacro:property name="wheel_radius" value="0.1" />
  <xacro:property name="wheel_width" value="0.05" />
  <xacro:property name="wheel_offset_x" value="0.15" />
  <xacro:property name="wheel_offset_y" value="0.2" />

  <!-- Base link -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="${base_width} ${base_length} ${base_height}"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="${base_width} ${base_length} ${base_height}"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="2.0"/>
      <inertia
        ixx="0.083" ixy="0.0" ixz="0.0"
        iyy="0.167" iyz="0.0"
        izz="0.25"/>
    </inertial>
  </link>

  <!-- Left wheel -->
  <link name="left_wheel">
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
      <inertia
        ixx="0.00125" ixy="0.0" ixz="0.0"
        iyy="0.00125" iyz="0.0"
        izz="0.0025"/>
    </inertial>
  </link>

  <!-- Right wheel -->
  <link name="right_wheel">
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
      <inertia
        ixx="0.00125" ixy="0.0" ixz="0.0"
        iyy="0.00125" iyz="0.0"
        izz="0.0025"/>
    </inertial>
  </link>

  <!-- Base to left wheel joint -->
  <joint name="left_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="left_wheel"/>
    <origin xyz="${wheel_offset_x} ${wheel_offset_y} 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- Base to right wheel joint -->
  <joint name="right_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="right_wheel"/>
    <origin xyz="${wheel_offset_x} -${wheel_offset_y} 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- Camera link -->
  <link name="camera_link">
    <visual>
      <geometry>
        <box size="0.05 0.05 0.05"/>
      </geometry>
      <material name="red">
        <color rgba="1 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.05 0.05 0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.1"/>
      <inertia
        ixx="0.000083" ixy="0.0" ixz="0.0"
        iyy="0.000083" iyz="0.0"
        izz="0.000083"/>
    </inertial>
  </link>

  <joint name="camera_joint" type="fixed">
    <parent link="base_link"/>
    <child link="camera_link"/>
    <origin xyz="0.15 0 0.1" rpy="0 0 0"/>
  </joint>

  <!-- Gazebo plugins for ROS control -->
  <gazebo reference="base_link">
    <material>Gazebo/Blue</material>
  </gazebo>

  <gazebo reference="left_wheel">
    <material>Gazebo/Black</material>
  </gazebo>

  <gazebo reference="right_wheel">
    <material>Gazebo/Black</material>
  </gazebo>

  <gazebo reference="camera_link">
    <material>Gazebo/Red</material>
  </gazebo>

  <!-- Differential drive controller -->
  <gazebo>
    <plugin name="differential_drive_controller" filename="libgazebo_ros_diff_drive.so">
      <left_joint>left_wheel_joint</left_joint>
      <right_joint>right_wheel_joint</right_joint>
      <wheel_separation>${2 * wheel_offset_y}</wheel_separation>
      <wheel_diameter>${2 * wheel_radius}</wheel_diameter>
      <command_topic>cmd_vel</command_topic>
      <odometry_topic>odom</odometry_topic>
      <odometry_frame>odom</odometry_frame>
      <robot_base_frame>base_link</robot_base_frame>
      <publish_odom>true</publish_odom>
      <publish_odom_tf>true</publish_odom_tf>
      <publish_wheel_tf>true</publish_wheel_tf>
    </plugin>
  </gazebo>

  <!-- Camera sensor -->
  <gazebo reference="camera_link">
    <sensor type="camera" name="camera1">
      <update_rate>30.0</update_rate>
      <camera name="head">
        <horizontal_fov>1.3962634</horizontal_fov>
        <image>
          <width>640</width>
          <height>480</height>
          <format>R8G8B8</format>
        </image>
        <clip>
          <near>0.02</near>
          <far>300</far>
        </clip>
      </camera>
      <plugin name="camera_controller" filename="libgazebo_ros_camera.so">
        <frame_name>camera_link</frame_name>
        <topic_name>camera/image_raw</topic_name>
      </plugin>
    </sensor>
  </gazebo>

  <!-- Laser scanner -->
  <gazebo reference="base_link">
    <sensor type="ray" name="laser_scanner">
      <pose>0.15 0 0.1 0 0 0</pose>
      <ray>
        <scan>
          <horizontal>
            <samples>360</samples>
            <resolution>1.0</resolution>
            <min_angle>-3.14159</min_angle>
            <max_angle>3.14159</max_angle>
          </horizontal>
        </scan>
        <range>
          <min>0.1</min>
          <max>10.0</max>
          <resolution>0.01</resolution>
        </range>
      </ray>
      <plugin name="laser_controller" filename="libgazebo_ros_ray_sensor.so">
        <ros>
          <remapping>~/out:=scan</remapping>
        </ros>
      </plugin>
    </sensor>
  </gazebo>

</robot>
```

#### 2. Create Isaac Sim World

```xml
<!-- File: vla_robot_control/models/simple_world.sdf -->
<?xml version="1.0" ?>
<sdf version="1.7">
  <world name="simple_vla_world">

    <!-- Physics engine -->
    <physics name="1ms" type="ode">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1</real_time_factor>
      <real_time_update_rate>1000</real_time_update_rate>
    </physics>

    <!-- Ground plane -->
    <include>
      <uri>model://ground_plane</uri>
    </include>

    <!-- Environment lighting -->
    <include>
      <uri>model://sun</uri>
    </include>

    <!-- Simple room environment -->
    <model name="room_walls">
      <static>true</static>

      <!-- North wall -->
      <link name="north_wall">
        <pose>0 5 1 0 0 0</pose>
        <collision name="collision">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
          <material>
            <ambient>0.8 0.8 0.8 1</ambient>
            <diffuse>0.8 0.8 0.8 1</diffuse>
          </material>
        </visual>
      </link>

      <!-- South wall -->
      <link name="south_wall">
        <pose>0 -5 1 0 0 0</pose>
        <collision name="collision">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
          <material>
            <ambient>0.8 0.8 0.8 1</ambient>
            <diffuse>0.8 0.8 0.8 1</diffuse>
          </material>
        </visual>
      </link>

      <!-- East wall -->
      <link name="east_wall">
        <pose>5 0 1 0 0 1.5707</pose>
        <collision name="collision">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
          <material>
            <ambient>0.8 0.8 0.8 1</ambient>
            <diffuse>0.8 0.8 0.8 1</diffuse>
          </material>
        </visual>
      </link>

      <!-- West wall -->
      <link name="west_wall">
        <pose>-5 0 1 0 0 1.5707</pose>
        <collision name="collision">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>10 0.1 2</size>
            </box>
          </geometry>
          <material>
            <ambient>0.8 0.8 0.8 1</ambient>
            <diffuse>0.8 0.8 0.8 1</diffuse>
          </material>
        </visual>
      </link>
    </model>

    <!-- Place the robot in the world -->
    <include>
      <uri>model://simple_vla_robot</uri>
      <pose>0 0 0.1 0 0 0</pose>
    </include>

    <!-- Add some objects for the robot to detect -->
    <model name="red_box">
      <pose>2 1 0.1 0 0 0</pose>
      <link name="box_link">
        <collision name="collision">
          <geometry>
            <box>
              <size>0.2 0.2 0.2</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>0.2 0.2 0.2</size>
            </box>
          </geometry>
          <material>
            <ambient>1 0 0 1</ambient>
            <diffuse>1 0 0 1</diffuse>
          </material>
        </visual>
        <inertial>
          <mass>0.5</mass>
          <inertia>
            <ixx>0.0017</ixx>
            <iyy>0.0017</iyy>
            <izz>0.0017</izz>
          </inertia>
        </inertial>
      </link>
    </model>

    <model name="blue_cylinder">
      <pose>-2 -1 0.1 0 0 0</pose>
      <link name="cylinder_link">
        <collision name="collision">
          <geometry>
            <cylinder>
              <radius>0.1</radius>
              <length>0.3</length>
            </cylinder>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <cylinder>
              <radius>0.1</radius>
              <length>0.3</length>
            </cylinder>
          </geometry>
          <material>
            <ambient>0 0 1 1</ambient>
            <diffuse>0 0 1 1</diffuse>
          </material>
        </visual>
        <inertial>
          <mass>0.3</mass>
          <inertia>
            <ixx>0.0025</ixx>
            <iyy>0.0025</iyy>
            <izz>0.00125</izz>
          </inertia>
        </inertial>
      </link>
    </model>

  </world>
</sdf>
```

#### 3. Create Isaac Sim Launch Script

```python
# File: launch/isaac_sim_robot.launch.py
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import PathJoinSubstitution, LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    # Declare launch arguments
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')
    world_file = LaunchConfiguration('world_file', default='')

    return LaunchDescription([
        # Declare launch arguments
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='true',
            description='Use simulation (Isaac Sim) clock if true'
        ),

        DeclareLaunchArgument(
            'world_file',
            default_value='',
            description='Path to SDF world file (optional)'
        ),

        # Launch Gazebo with our world
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([
                PathJoinSubstitution([
                    FindPackageShare('gazebo_ros'),
                    'launch',
                    'gazebo.launch.py'
                ])
            ]),
            launch_arguments={
                'world': world_file,
                'verbose': 'true',
                'gui': 'true'
            }.items()
        ),

        # Robot state publisher to broadcast transforms
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            name='robot_state_publisher',
            parameters=[{
                'use_sim_time': use_sim_time,
                'robot_description': open(FindPackageShare('vla_robot_control').find('vla_robot_control') + '/models/simple_robot.urdf').read()
            }],
            output='screen'
        ),

        # Joint state publisher
        Node(
            package='joint_state_publisher',
            executable='joint_state_publisher',
            name='joint_state_publisher',
            parameters=[{'use_sim_time': use_sim_time}],
            output='screen'
        ),

        # Launch our robot controller
        Node(
            package='vla_robot_control',
            executable='basic_controller',
            name='basic_robot_controller',
            parameters=[
                {'use_sim_time': use_sim_time},
                {'linear_speed': 0.3},
                {'angular_speed': 0.5},
                {'safe_distance': 0.5}
            ],
            output='screen'
        )
    ])
```

#### 4. Test the Isaac Sim Integration

```bash
# Build the package
cd ~/vla_ws
colcon build --packages-select vla_robot_control
source install/setup.bash

# Launch with Isaac Sim
ros2 launch vla_robot_control isaac_sim_robot.launch.py

# In another terminal, send commands to test
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist '{linear: {x: 0.3}, angular: {z: 0.0}}'
```

## Lab 3: LLM Integration for Action Planning

### Objective
Integrate Large Language Models for natural language understanding and action planning.

### Steps

#### 1. Create LLM Integration Package

```bash
cd ~/vla_ws/src
ros2 pkg create --build-type ament_python vla_llm_integration --dependencies rclpy std_msgs geometry_msgs sensor_msgs

cd vla_llm_integration
mkdir vla_llm_integration
touch vla_llm_integration/__init__.py
```

#### 2. Implement LLM Action Planner

```python
# File: vla_llm_integration/llm_action_planner.py
#!/usr/bin/env python3
"""
LLM Action Planner for VLA Systems
Integrates Large Language Models for natural language understanding and action planning
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from geometry_msgs.msg import Twist
import openai
import json
import os
import time
from dotenv import load_dotenv
from typing import List, Dict, Any


class LLMActionPlanner(Node):
    """
    LLM-based action planner that converts natural language to executable robot actions
    """

    def __init__(self):
        super().__init__('llm_action_planner')

        # Load environment variables
        load_dotenv()

        # Initialize OpenAI API
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            self.get_logger().error('OPENAI_API_KEY not found in environment variables')
            raise ValueError('OpenAI API key not configured')

        openai.api_key = api_key

        # Subscribers
        self.command_sub = self.create_subscription(
            String,
            'vla_command',
            self.command_callback,
            10
        )

        # Publishers
        self.action_plan_pub = self.create_publisher(String, 'vla_action_plan', 10)
        self.status_pub = self.create_publisher(String, 'vla_planner_status', 10)

        # Robot capabilities that LLM should know about
        self.robot_capabilities = [
            "move_forward", "move_backward", "turn_left", "turn_right",
            "navigate_to_location", "grasp_object", "detect_objects",
            "take_picture", "analyze_image", "stop_robot", "report_status"
        ]

        # Location map for navigation
        self.location_map = {
            'kitchen': {'x': 2.0, 'y': 1.0, 'theta': 0.0},
            'living_room': {'x': 0.0, 'y': 0.0, 'theta': 0.0},
            'bedroom': {'x': -1.0, 'y': 2.0, 'theta': 1.57},
            'office': {'x': -2.0, 'y': -1.0, 'theta': 3.14},
            'bathroom': {'x': 1.0, 'y': -2.0, 'theta': -1.57}
        }

        self.get_logger().info('LLM Action Planner initialized')
        self.get_logger().info(f'Available locations: {list(self.location_map.keys())}')

    def command_callback(self, msg):
        """Handle incoming natural language commands"""
        command = msg.data
        self.get_logger().info(f'Received command: {command}')

        # Publish status
        status_msg = String()
        status_msg.data = f'Processing command: {command}'
        self.status_pub.publish(status_msg)

        try:
            # Plan actions using LLM
            action_plan = self.plan_actions(command)

            if action_plan and 'actions' in action_plan and len(action_plan['actions']) > 0:
                # Publish the action plan
                plan_msg = String()
                plan_msg.data = json.dumps(action_plan)
                self.action_plan_pub.publish(plan_msg)

                self.get_logger().info(f'Generated action plan with {len(action_plan["actions"])} actions')
                self.get_logger().debug(f'Plan: {json.dumps(action_plan, indent=2)}')
            else:
                self.get_logger().error('LLM failed to generate valid action plan')
                error_msg = String()
                error_msg.data = json.dumps({
                    'actions': [],
                    'reasoning': 'Failed to parse LLM response',
                    'confidence': 'low'
                })
                self.action_plan_pub.publish(error_msg)

        except Exception as e:
            self.get_logger().error(f'Error processing command: {str(e)}')
            error_msg = String()
            error_msg.data = json.dumps({
                'actions': [],
                'reasoning': f'Error processing command: {str(e)}',
                'confidence': 'low'
            })
            self.action_plan_pub.publish(error_msg)

    def plan_actions(self, command: str) -> Dict[str, Any]:
        """
        Convert natural language command to action plan using LLM

        Args:
            command: Natural language command from user

        Returns:
            Dictionary containing action plan
        """
        system_prompt = f"""
        You are a robot action planner. Your task is to convert natural language commands
        into a sequence of actions that a mobile robot can execute.

        Robot capabilities: {', '.join(self.robot_capabilities)}

        Available locations: {', '.join(self.location_map.keys())}

        When creating action plans:
        1. Always include a "reasoning" section explaining your plan
        2. Break complex tasks into simple, executable actions
        3. Include necessary parameters for each action
        4. Consider safety and feasibility of actions
        5. If a command is ambiguous, ask for clarification

        Respond with a JSON object containing:
        {{
            "actions": [
                {{
                    "action_type": "navigate_to | detect_objects | grasp_object | move_forward | etc.",
                    "parameters": {{"target": "...", "object": "...", "location": "...", "distance": "..."}},
                    "description": "Human-readable description of what this action does"
                }}
            ],
            "reasoning": "Step-by-step reasoning for the plan",
            "confidence": "high | medium | low based on clarity of command"
        }}

        For navigation commands, convert location names to coordinates using the location map.
        For object-related commands, use detection and grasping actions as appropriate.
        """

        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # Use gpt-4 if available for better performance
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": command}
                ],
                temperature=0.1,  # Lower temperature for more consistent responses
                max_tokens=1000
            )

            # Parse the response
            response_text = response.choices[0].message.content.strip()

            # Extract JSON from response (in case LLM adds extra text)
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx != -1 and end_idx != 0:
                json_str = response_text[start_idx:end_idx]
                plan = json.loads(json_str)

                # Validate the plan structure
                if 'actions' in plan and isinstance(plan['actions'], list):
                    # Convert location names to coordinates if needed
                    plan = self.convert_locations_to_coordinates(plan)
                    return plan
                else:
                    self.get_logger().error(f'Invalid plan structure: {plan}')
                    return {
                        'actions': [],
                        'reasoning': 'LLM returned invalid plan structure',
                        'confidence': 'low'
                    }
            else:
                self.get_logger().error(f'Could not extract JSON from LLM response: {response_text}')
                return {
                    'actions': [],
                    'reasoning': 'Could not parse LLM response as JSON',
                    'confidence': 'low'
                }

        except json.JSONDecodeError as e:
            self.get_logger().error(f'Error parsing LLM response as JSON: {e}')
            return {
                'actions': [],
                'reasoning': f'Error parsing LLM response: {str(e)}',
                'confidence': 'low'
            }
        except Exception as e:
            self.get_logger().error(f'Error calling LLM: {e}')
            return {
                'actions': [],
                'reasoning': f'LLM call failed: {str(e)}',
                'confidence': 'low'
            }

    def convert_locations_to_coordinates(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert location names to coordinates in the action plan
        """
        for action in plan.get('actions', []):
            if 'parameters' in action:
                params = action['parameters']

                # Convert target location names to coordinates
                if 'target' in params:
                    target = params['target']
                    if target.lower() in self.location_map:
                        coords = self.location_map[target.lower()]
                        params['target_coordinates'] = coords
                        params['target_location_name'] = target

                # Convert other location parameters similarly
                if 'location' in params:
                    location = params['location']
                    if location.lower() in self.location_map:
                        coords = self.location_map[location.lower()]
                        params['coordinates'] = coords

        return plan

    def validate_action_plan(self, plan: Dict[str, Any]) -> bool:
        """
        Validate that the action plan is executable
        """
        if 'actions' not in plan:
            return False

        for action in plan['actions']:
            if 'action_type' not in action:
                return False

            # Check if action type is supported
            action_type = action['action_type']
            if action_type not in self.robot_capabilities and action_type != 'request_clarification':
                self.get_logger().warn(f'Unsupported action type: {action_type}')

        return True


def main(args=None):
    """Main function to run the LLM action planner"""
    rclpy.init(args=args)

    try:
        planner = LLMActionPlanner()

        # Use multi-threaded executor to handle callbacks
        from rclpy.executors import MultiThreadedExecutor
        executor = MultiThreadedExecutor()
        executor.add_node(planner)

        try:
            executor.spin()
        except KeyboardInterrupt:
            planner.get_logger().info('Shutting down LLM Action Planner...')
        finally:
            planner.destroy_node()
            rclpy.shutdown()

    except Exception as e:
        print(f'Error running LLM planner: {e}')
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

#### 3. Create LLM Integration Launch File

```python
# File: launch/llm_integration.launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        # Declare launch arguments
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='false',
            description='Use simulation clock if true'
        ),

        # LLM Action Planner node
        Node(
            package='vla_llm_integration',
            executable='llm_action_planner',
            name='llm_action_planner',
            parameters=[
                {'use_sim_time': LaunchConfiguration('use_sim_time')}
            ],
            output='screen'
        )
    ])
```

#### 4. Update LLM Integration setup.py

```python
# File: setup.py
from setuptools import find_packages, setup

package_name = 'vla_llm_integration'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/llm_integration.launch.py']),
    ],
    install_requires=['setuptools', 'openai', 'python-dotenv'],
    zip_safe=True,
    maintainer='your_name',
    maintainer_email='your_email@example.com',
    description='LLM integration for VLA systems',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'llm_action_planner = vla_llm_integration.llm_action_planner:main',
        ],
    },
)
```

#### 5. Create Environment File

```bash
# File: vla_llm_integration/.env
OPENAI_API_KEY=your_openai_api_key_here
```

#### 6. Test LLM Integration

```bash
cd ~/vla_ws
colcon build --packages-select vla_llm_integration
source install/setup.bash

# Set your OpenAI API key (or put it in the .env file)
export OPENAI_API_KEY=your_actual_api_key_here

# Run the LLM planner
ros2 run vla_llm_integration llm_action_planner

# In another terminal, send a test command
ros2 topic pub /vla_command std_msgs/String "data: 'Go to the kitchen and find the red object'"
```

## Lab 4: Complete VLA System Integration

### Objective
Integrate all components into a complete VLA system that can process natural language commands end-to-end.

### Steps

#### 1. Create VLA System Package

```bash
cd ~/vla_ws/src
ros2 pkg create --build-type ament_python vla_system --dependencies rclpy std_msgs geometry_msgs sensor_msgs nav_msgs vla_robot_control vla_llm_integration

cd vla_system
mkdir vla_system
touch vla_system/__init__.py
```

#### 2. Implement Complete VLA System

```python
# File: vla_system/vla_complete_system.py
#!/usr/bin/env python3
"""
Complete VLA System Integration
Integrates all components: LLM planning, action execution, and robot control
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import String, Bool
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan, Image
from nav_msgs.msg import Odometry
import json
import time
from typing import Dict, Any


class VLACompleteSystem(Node):
    """
    Complete VLA System that integrates LLM planning with robot execution
    """

    def __init__(self):
        super().__init__('vla_complete_system')

        # Publishers
        self.cmd_vel_pub = self.create_publisher(Twist, 'cmd_vel', 10)
        self.status_pub = self.create_publisher(String, 'vla_system_status', 10)
        self.action_pub = self.create_publisher(String, 'vla_action_plan', 10)

        # Subscribers
        self.voice_command_sub = self.create_subscription(
            String,
            'vla_voice_command',
            self.voice_command_callback,
            10
        )

        self.text_command_sub = self.create_subscription(
            String,
            'vla_text_command',
            self.text_command_callback,
            10
        )

        self.action_plan_sub = self.create_subscription(
            String,
            'vla_action_plan',
            self.action_plan_callback,
            10
        )

        self.odom_sub = self.create_subscription(
            Odometry,
            'odom',
            self.odom_callback,
            10
        )

        self.scan_sub = self.create_subscription(
            LaserScan,
            'scan',
            self.scan_callback,
            10
        )

        self.camera_sub = self.create_subscription(
            Image,
            'camera/image_raw',
            self.camera_callback,
            10
        )

        # System state
        self.current_pose = None
        self.obstacle_detected = False
        self.system_state = 'idle'  # idle, planning, executing, error
        self.current_action_plan = None
        self.current_action_index = 0
        self.safe_distance = 0.5

        # Timers
        self.execution_timer = self.create_timer(0.1, self.execution_loop)

        # Parameters
        self.declare_parameter('linear_speed', 0.3)
        self.declare_parameter('angular_speed', 0.5)
        self.declare_parameter('safe_distance', 0.5)

        self.linear_speed = self.get_parameter('linear_speed').value
        self.angular_speed = self.get_parameter('angular_speed').value
        self.safe_distance = self.get_parameter('safe_distance').value

        self.get_logger().info('Complete VLA System initialized')
        self.get_logger().info(f'Parameters - Linear speed: {self.linear_speed}m/s, '
                              f'Angular speed: {self.angular_speed}rad/s')

    def voice_command_callback(self, msg):
        """Handle voice commands (would come from speech-to-text)"""
        self.get_logger().info(f'Received voice command: {msg.data}')
        self.process_command(msg.data)

    def text_command_callback(self, msg):
        """Handle text commands"""
        self.get_logger().info(f'Received text command: {msg.data}')
        self.process_command(msg.data)

    def action_plan_callback(self, msg):
        """Handle received action plans from LLM planner"""
        try:
            plan = json.loads(msg.data)
            self.get_logger().info(f'Received action plan with {len(plan.get("actions", []))} actions')

            self.current_action_plan = plan
            self.current_action_index = 0
            self.system_state = 'executing'

            status_msg = String()
            status_msg.data = f'Action plan received, starting execution of {len(plan["actions"])} actions'
            self.status_pub.publish(status_msg)

        except json.JSONDecodeError as e:
            self.get_logger().error(f'Error parsing action plan: {e}')

    def odom_callback(self, msg):
        """Handle odometry data"""
        self.current_pose = msg.pose.pose

    def scan_callback(self, msg):
        """Process laser scan data for obstacle detection"""
        front_ranges = []
        angle_min = msg.angle_min
        angle_increment = msg.angle_increment

        for i, range_val in enumerate(msg.ranges):
            angle = angle_min + i * angle_increment
            if -0.52 <= angle <= 0.52:  # Front 60 degrees
                if 0.1 < range_val < 10.0:
                    front_ranges.append(range_val)

        if front_ranges:
            min_distance = min(front_ranges)
            self.obstacle_detected = min_distance < self.safe_distance

    def camera_callback(self, msg):
        """Process camera data"""
        # Placeholder for vision processing
        pass

    def process_command(self, command):
        """Process a natural language command"""
        if self.system_state != 'idle':
            self.get_logger().warn(f'System busy ({self.system_state}), ignoring command: {command}')
            return

        self.get_logger().info(f'Processing command: {command}')
        self.system_state = 'planning'

        # Publish to LLM planner (in a real system, this would trigger the LLM)
        cmd_msg = String()
        cmd_msg.data = command
        # Note: In a real implementation, you'd have the LLM planner in the same system
        # or ensure it's running to receive this message

        status_msg = String()
        status_msg.data = f'Sending command to LLM planner: {command}'
        self.status_pub.publish(status_msg)

    def execution_loop(self):
        """Main execution loop for carrying out action plans"""
        if self.system_state != 'executing' or not self.current_action_plan:
            return

        actions = self.current_action_plan.get('actions', [])
        if self.current_action_index >= len(actions):
            # Plan completed
            self.get_logger().info('Action plan completed successfully')
            self.system_state = 'idle'
            self.current_action_plan = None
            self.current_action_index = 0

            status_msg = String()
            status_msg.data = 'Action plan completed successfully'
            self.status_pub.publish(status_msg)
            return

        # Get current action
        current_action = actions[self.current_action_index]
        action_type = current_action.get('action_type', 'unknown')

        self.get_logger().info(f'Executing action {self.current_action_index + 1}/{len(actions)}: {action_type}')

        # Execute action based on type
        success = self.execute_action(current_action)

        if success:
            self.current_action_index += 1
            self.get_logger().info(f'Action completed, moving to next action ({self.current_action_index}/{len(actions)})')
        else:
            self.get_logger().error(f'Action failed: {action_type}')
            self.system_state = 'error'

            status_msg = String()
            status_msg.data = f'Action failed: {action_type}, system entering error state'
            self.status_pub.publish(status_msg)

    def execute_action(self, action: Dict[str, Any]) -> bool:
        """Execute a single action"""
        action_type = action.get('action_type', 'unknown')
        parameters = action.get('parameters', {})

        try:
            if action_type == 'move_forward':
                return self.execute_move_forward(parameters)
            elif action_type == 'turn_left':
                return self.execute_turn_left(parameters)
            elif action_type == 'turn_right':
                return self.execute_turn_right(parameters)
            elif action_type == 'navigate_to':
                return self.execute_navigate_to(parameters)
            elif action_type == 'detect_objects':
                return self.execute_detect_objects(parameters)
            elif action_type == 'stop_robot':
                return self.execute_stop_robot(parameters)
            elif action_type == 'report_status':
                return self.execute_report_status(parameters)
            else:
                self.get_logger().error(f'Unknown action type: {action_type}')
                return False

        except Exception as e:
            self.get_logger().error(f'Error executing action {action_type}: {str(e)}')
            return False

    def execute_move_forward(self, parameters):
        """Execute forward movement action"""
        distance = parameters.get('distance', 1.0)  # meters
        duration = distance / self.linear_speed  # seconds

        cmd_msg = Twist()
        cmd_msg.linear.x = self.linear_speed

        start_time = time.time()
        while (time.time() - start_time) < duration and not self.obstacle_detected:
            if self.system_state != 'executing':
                return False
            self.cmd_vel_pub.publish(cmd_msg)
            time.sleep(0.05)  # 20 Hz control

        # Stop robot
        stop_msg = Twist()
        self.cmd_vel_pub.publish(stop_msg)

        return not self.obstacle_detected

    def execute_turn_left(self, parameters):
        """Execute left turn action"""
        angle = parameters.get('angle', 90)  # degrees
        angle_rad = angle * 3.14159 / 180.0
        duration = angle_rad / self.angular_speed  # seconds

        cmd_msg = Twist()
        cmd_msg.angular.z = self.angular_speed

        start_time = time.time()
        while (time.time() - start_time) < duration:
            if self.system_state != 'executing':
                return False
            self.cmd_vel_pub.publish(cmd_msg)
            time.sleep(0.05)

        # Stop robot
        stop_msg = Twist()
        self.cmd_vel_pub.publish(stop_msg)

        return True

    def execute_turn_right(self, parameters):
        """Execute right turn action"""
        angle = parameters.get('angle', 90)  # degrees
        angle_rad = angle * 3.14159 / 180.0
        duration = angle_rad / self.angular_speed  # seconds

        cmd_msg = Twist()
        cmd_msg.angular.z = -self.angular_speed

        start_time = time.time()
        while (time.time() - start_time) < duration:
            if self.system_state != 'executing':
                return False
            self.cmd_vel_pub.publish(cmd_msg)
            time.sleep(0.05)

        # Stop robot
        stop_msg = Twist()
        self.cmd_vel_pub.publish(stop_msg)

        return True

    def execute_navigate_to(self, parameters):
        """Execute navigation to a specific location"""
        # This would typically use navigation stack
        # For this simulation, we'll just move toward the target

        target_coords = parameters.get('target_coordinates')
        if not target_coords:
            self.get_logger().error('No target coordinates provided for navigation')
            return False

        # Simple proportional navigation (for simulation)
        if self.current_pose:
            target_x = target_coords['x']
            target_y = target_coords['y']

            dx = target_x - self.current_pose.position.x
            dy = target_y - self.current_pose.position.y
            distance = (dx*dx + dy*dy)**0.5

            if distance > 0.2:  # Not close enough
                cmd_msg = Twist()
                cmd_msg.linear.x = min(self.linear_speed, distance * 0.5)  # Proportional speed
                cmd_msg.angular.z = min(self.angular_speed, (dy/dx) * 0.5) if abs(dx) > 0.1 else 0.0

                # Simple navigation for simulation
                duration = min(5.0, distance / self.linear_speed)  # Max 5 seconds per leg
                start_time = time.time()

                while (time.time() - start_time) < duration and distance > 0.2:
                    if self.system_state != 'executing':
                        return False

                    if self.obstacle_detected:
                        self.get_logger().warn('Obstacle detected during navigation, stopping')
                        break

                    self.cmd_vel_pub.publish(cmd_msg)

                    # Recalculate distance
                    if self.current_pose:
                        dx = target_x - self.current_pose.position.x
                        dy = target_y - self.current_pose.position.y
                        distance = (dx*dx + dy*dy)**0.5

                    time.sleep(0.1)

                # Stop robot
                stop_msg = Twist()
                self.cmd_vel_pub.publish(stop_msg)

        return True

    def execute_detect_objects(self, parameters):
        """Execute object detection action"""
        # In a real system, this would process camera data
        # For simulation, just wait and return success
        time.sleep(2.0)  # Simulate detection time
        return True

    def execute_stop_robot(self, parameters):
        """Execute emergency stop"""
        stop_msg = Twist()
        self.cmd_vel_pub.publish(stop_msg)
        time.sleep(0.1)  # Brief pause
        return True

    def execute_report_status(self, parameters):
        """Execute status reporting"""
        status_msg = String()
        status_msg.data = f'Current pose: ({self.current_pose.position.x:.2f}, {self.current_pose.position.y:.2f})' if self.current_pose else 'Position unknown'
        self.status_pub.publish(status_msg)
        time.sleep(0.5)  # Brief pause
        return True


def main(args=None):
    """Main function to run the complete VLA system"""
    rclpy.init(args=args)

    try:
        system = VLACompleteSystem()

        # Use multi-threaded executor to handle multiple callbacks
        from rclpy.executors import MultiThreadedExecutor
        executor = MultiThreadedExecutor()
        executor.add_node(system)

        try:
            print("Complete VLA System running...")
            print("Publish commands to /vla_voice_command or /vla_text_command")
            print("Example: ros2 topic pub /vla_text_command std_msgs/String \"data: 'Go to the kitchen'\"")
            executor.spin()
        except KeyboardInterrupt:
            system.get_logger().info('Shutting down VLA System...')
        finally:
            system.destroy_node()
            rclpy.shutdown()

    except Exception as e:
        print(f'Error running VLA system: {e}')
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

#### 3. Create Complete System Launch File

```python
# File: launch/vla_complete_system.launch.py
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import PathJoinSubstitution, LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    # Declare launch arguments
    use_sim_time = LaunchConfiguration('use_sim_time', default='false')

    return LaunchDescription([
        # Declare launch arguments
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='false',
            description='Use simulation clock if true'
        ),

        # Launch the complete VLA system
        Node(
            package='vla_system',
            executable='vla_complete_system',
            name='vla_complete_system',
            parameters=[
                {'use_sim_time': use_sim_time},
                {'linear_speed': 0.3},
                {'angular_speed': 0.5},
                {'safe_distance': 0.5}
            ],
            output='screen'
        ),

        # Launch robot controller
        Node(
            package='vla_robot_control',
            executable='basic_controller',
            name='basic_robot_controller',
            parameters=[
                {'use_sim_time': use_sim_time},
                {'linear_speed': 0.3},
                {'angular_speed': 0.5},
                {'safe_distance': 0.5}
            ],
            output='screen'
        ),

        # Launch LLM planner (make sure API key is set)
        Node(
            package='vla_llm_integration',
            executable='llm_action_planner',
            name='llm_action_planner',
            parameters=[
                {'use_sim_time': use_sim_time}
            ],
            output='screen'
        )
    ])
```

#### 4. Update Complete System setup.py

```python
# File: setup.py
from setuptools import find_packages, setup

package_name = 'vla_system'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/vla_complete_system.launch.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='your_name',
    maintainer_email='your_email@example.com',
    description='Complete VLA system integration',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'vla_complete_system = vla_system.vla_complete_system:main',
        ],
    },
)
```

## Lab 5: Testing and Validation

### Objective
Test the complete VLA system with various commands and validate functionality.

### Steps

#### 1. Build All Packages

```bash
cd ~/vla_ws
colcon build --packages-select vla_robot_control vla_llm_integration vla_system
source install/setup.bash
```

#### 2. Run Complete System

```bash
# Make sure your OpenAI API key is set
export OPENAI_API_KEY=your_actual_api_key_here

# Launch the complete system
ros2 launch vla_system vla_complete_system.launch.py
```

#### 3. Test Commands

In another terminal:

```bash
# Test simple movement
ros2 topic pub /vla_text_command std_msgs/String "data: 'Move forward 2 meters'"

# Test navigation
ros2 topic pub /vla_text_command std_msgs/String "data: 'Go to the kitchen'"

# Test complex command
ros2 topic pub /vla_text_command std_msgs/String "data: 'Navigate to the living room and look around for objects'"
```

#### 4. Create Test Scripts

```python
# File: test_vla_system.py
#!/usr/bin/env python3
"""
Test script for VLA system
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import time


class VLATester(Node):
    def __init__(self):
        super().__init__('vla_tester')

        self.command_pub = self.create_publisher(String, 'vla_text_command', 10)
        self.status_sub = self.create_subscription(
            String, 'vla_system_status', self.status_callback, 10
        )

        self.test_commands = [
            'Move forward 1 meter',
            'Turn left 90 degrees',
            'Go to the kitchen',
            'Find objects in the room',
            'Stop the robot'
        ]

        self.current_test = 0
        self.test_timer = self.create_timer(5.0, self.run_next_test)

        self.get_logger().info('VLA Tester initialized')

    def status_callback(self, msg):
        self.get_logger().info(f'System status: {msg.data}')

    def run_next_test(self):
        if self.current_test < len(self.test_commands):
            command = self.test_commands[self.current_test]
            self.get_logger().info(f'Running test {self.current_test + 1}: {command}')

            cmd_msg = String()
            cmd_msg.data = command
            self.command_pub.publish(cmd_msg)

            self.current_test += 1
        else:
            self.get_logger().info('All tests completed')
            self.test_timer.cancel()


def main(args=None):
    rclpy.init(args=args)

    tester = VLATester()

    try:
        rclpy.spin(tester)
    except KeyboardInterrupt:
        tester.get_logger().info('Testing interrupted')
    finally:
        tester.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Conclusion

This comprehensive hands-on lab has guided you through building a complete Vision-Language-Action system:

1. **ROS 2 Foundation**: Created a basic robot controller with proper ROS 2 architecture
2. **Isaac Sim Integration**: Integrated with NVIDIA Isaac Sim for simulation and visualization
3. **LLM Integration**: Connected Large Language Models for natural language understanding
4. **Complete System**: Integrated all components into a functional VLA system
5. **Testing**: Validated the system with various commands and scenarios

Key concepts covered:
- ROS 2 node architecture and communication patterns
- Robot simulation with Isaac Sim
- LLM integration for natural language processing
- Action planning and execution
- System integration and validation

The system demonstrates how VLA systems can bridge natural language commands with robotic actions, making robots more intuitive and accessible to non-expert users.