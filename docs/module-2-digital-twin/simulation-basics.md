---
title: Simulation Basics with Gazebo
sidebar_position: 1
---

# Simulation Basics with Gazebo

## Introduction to Robotics Simulation

Robotics simulation is a fundamental component of modern robotics development, providing a safe, cost-effective, and efficient environment for testing, validating, and debugging robotic systems. Gazebo is one of the most widely used simulation environments in the robotics community, offering high-fidelity physics simulation, realistic rendering, and seamless integration with ROS and ROS 2.

### Why Simulate?

Simulation offers several key advantages in robotics development:

1. **Safety**: Test algorithms without risk of damaging expensive hardware
2. **Cost-Effectiveness**: No physical hardware required for initial development
3. **Repeatability**: Same conditions can be recreated for consistent testing
4. **Speed**: Simulations can run faster than real-time
5. **Debugging**: Easier to inspect internal states and variables
6. **Scalability**: Test multiple robots or scenarios simultaneously

### Gazebo Overview

Gazebo provides a comprehensive simulation environment with:

- **High-fidelity physics**: Accurate simulation of rigid body dynamics
- **Realistic rendering**: High-quality 3D graphics using OGRE
- **Sensor simulation**: Support for various sensors (cameras, LiDAR, IMU, GPS, etc.)
- **Plugin architecture**: Extensible functionality through plugins
- **ROS/ROS 2 integration**: Seamless communication with robotic frameworks
- **World editor**: Tools for creating and modifying simulation environments

## Setting Up Your First Simulation

### Prerequisites

Before starting with Gazebo simulations, ensure you have:

1. ROS 2 installed (Humble Hawksbill or Jazzy Jalisco recommended)
2. Gazebo installed (Garden or Harmonic)
3. Basic knowledge of ROS 2 concepts (nodes, topics, services)

### Installing Gazebo

For ROS 2 Humble with Gazebo Garden:

```bash
# Add OSRF repository
sudo apt update && sudo apt install wget
sudo wget https://packages.osrfoundation.org/gazebo.gpg -O /usr/share/keyrings/pkgs-osrf-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/pkgs-osrf-archive-keyring.gpg] http://packages.osrfoundation.org/gazebo/ubuntu-stable $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/gazebo-stable.list > /dev/null

# Install Gazebo Garden
sudo apt update
sudo apt install gazebo-garden

# Install ROS 2 Gazebo packages
sudo apt install ros-$ROS_DISTRO-gazebo-*
sudo apt install ros-$ROS_DISTRO-ros-gz
```

### Launching Your First Simulation

Let's start with the simplest possible simulation:

```bash
# Launch Gazebo with the default empty world
gazebo

# Or using the new gz command
gz sim
```

## Creating a Simple Robot Model

### Basic URDF Robot

Let's create a simple differential drive robot model. Create a file called `simple_robot.urdf`:

```xml
<?xml version="1.0"?>
<robot name="simple_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">
  <!-- Robot base -->
  <link name="base_link">
    <visual>
      <geometry>
        <cylinder radius="0.2" length="0.1"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.2" length="0.1"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="5.0"/>
      <inertia ixx="0.1" ixy="0.0" ixz="0.0" iyy="0.1" iyz="0.0" izz="0.2"/>
    </inertial>
  </link>

  <!-- Left wheel -->
  <link name="wheel_left">
    <visual>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.00125" ixy="0.0" ixz="0.0" iyy="0.00125" iyz="0.0" izz="0.0025"/>
    </inertial>
  </link>

  <!-- Right wheel -->
  <link name="wheel_right">
    <visual>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.00125" ixy="0.0" ixz="0.0" iyy="0.00125" iyz="0.0" izz="0.0025"/>
    </inertial>
  </link>

  <!-- Joints -->
  <joint name="left_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_left"/>
    <origin xyz="0 0.15 0" rpy="1.570796 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <joint name="right_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="wheel_right"/>
    <origin xyz="0 -0.15 0" rpy="1.570796 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- Gazebo plugins for simulation -->
  <gazebo reference="base_link">
    <material>Gazebo/Blue</material>
  </gazebo>

  <gazebo reference="wheel_left">
    <material>Gazebo/Black</material>
    <mu1>0.8</mu1>
    <mu2>0.8</mu2>
  </gazebo>

  <gazebo reference="wheel_right">
    <material>Gazebo/Black</material>
    <mu1>0.8</mu1>
    <mu2>0.8</mu2>
  </gazebo>

  <gazebo>
    <plugin name="diff_drive" filename="libgazebo_ros_diff_drive.so">
      <left_joint>left_wheel_joint</left_joint>
      <right_joint>right_wheel_joint</right_joint>
      <wheel_separation>0.3</wheel_separation>
      <wheel_diameter>0.2</wheel_diameter>
      <command_topic>cmd_vel</command_topic>
      <odometry_topic>odom</odometry_topic>
      <odometry_frame>odom</odometry_frame>
      <robot_base_frame>base_link</robot_base_frame>
    </plugin>
  </gazebo>
</robot>
```

## Loading Your Robot into Gazebo

### Method 1: Using spawn_entity

```bash
# First, make sure Gazebo is running
gz sim

# In another terminal, spawn your robot
ros2 run gazebo_ros spawn_entity.py -entity simple_robot -file /path/to/simple_robot.urdf -x 0 -y 0 -z 0.1
```

### Method 2: Using a launch file

Create a launch file called `launch_robot.launch.py`:

```python
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare
import os

def generate_launch_description():
    # Get the package share directory
    pkg_share = FindPackageShare('my_robot_description').find('my_robot_description')
    urdf_path = os.path.join(pkg_share, 'urdf', 'simple_robot.urdf')

    return LaunchDescription([
        # Launch Gazebo
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([
                PathJoinSubstitution([
                    FindPackageShare('gazebo_ros'),
                    'launch',
                    'gazebo.launch.py'
                ])
            ])
        ),

        # Robot State Publisher
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            name='robot_state_publisher',
            parameters=[{
                'robot_description': open(urdf_path).read()
            }]
        ),

        # Spawn robot in Gazebo
        Node(
            package='gazebo_ros',
            executable='spawn_entity.py',
            arguments=[
                '-entity', 'simple_robot',
                '-file', urdf_path,
                '-x', '0', '-y', '0', '-z', '0.1'
            ],
            output='screen'
        )
    ])
```

## Understanding Gazebo World Files

### Basic World Structure

A Gazebo world file defines the environment, including:

- Physics properties
- Models and objects
- Lighting conditions
- Plugins

Here's a basic world file (`basic_world.sdf`):

```xml
<?xml version="1.0" ?>
<sdf version="1.7">
  <world name="basic_world">
    <!-- Physics engine configuration -->
    <physics name="1ms" type="ode">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1</real_time_factor>
      <real_time_update_rate>1000</real_time_update_rate>
    </physics>

    <!-- Include standard models -->
    <include>
      <uri>model://ground_plane</uri>
    </include>

    <include>
      <uri>model://sun</uri>
    </include>

    <!-- Define a simple box obstacle -->
    <model name="box_obstacle" static="false">
      <pose>2 0 0.5 0 0 0</pose>
      <link name="box_link">
        <visual name="visual">
          <geometry>
            <box>
              <size>1 1 1</size>
            </box>
          </geometry>
          <material>
            <ambient>1 0 0 1</ambient>
            <diffuse>1 0 0 1</diffuse>
          </material>
        </visual>
        <collision name="collision">
          <geometry>
            <box>
              <size>1 1 1</size>
            </box>
          </geometry>
        </collision>
        <inertial>
          <mass>1.0</mass>
          <inertia>
            <ixx>0.167</ixx>
            <iyy>0.167</iyy>
            <izz>0.167</izz>
          </inertia>
        </inertial>
      </link>
    </model>

    <!-- Define a simple robot -->
    <model name="simple_robot" static="false">
      <pose>0 0 0.1 0 0 0</pose>
      <include>
        <uri>file://path/to/simple_robot.urdf</uri>
      </include>
    </model>
  </world>
</sdf>
```

### Loading a Custom World

```bash
# Launch Gazebo with a custom world
gz sim -r basic_world.sdf

# Or using ROS 2
ros2 launch gazebo_ros empty_world.launch.py world:=/path/to/basic_world.sdf
```

## Controlling Your Robot in Simulation

### Sending Commands

Once your robot is in simulation, you can control it by publishing to ROS topics:

```bash
# Send a velocity command to make the robot move forward
ros2 topic pub /cmd_vel geometry_msgs/Twist '{linear: {x: 0.5}, angular: {z: 0.0}}'

# Make the robot turn
ros2 topic pub /cmd_vel geometry_msgs/Twist '{linear: {x: 0.2}, angular: {z: 0.5}}'
```

### Python Control Script

Create a simple Python script to control your robot:

```python
#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
import time

class SimpleController(Node):
    def __init__(self):
        super().__init__('simple_controller')
        self.publisher = self.create_publisher(Twist, 'cmd_vel', 10)

        # Create a timer to send commands periodically
        self.timer = self.create_timer(0.1, self.timer_callback)
        self.i = 0

    def timer_callback(self):
        msg = Twist()

        # Simple square movement pattern
        if self.i < 50:  # Move forward for 5 seconds
            msg.linear.x = 0.5
            msg.angular.z = 0.0
        elif self.i < 60:  # Turn for 1 second
            msg.linear.x = 0.0
            msg.angular.z = 0.5
        elif self.i < 110:  # Move forward for 5 seconds
            msg.linear.x = 0.5
            msg.angular.z = 0.0
        elif self.i < 120:  # Turn for 1 second
            msg.linear.x = 0.0
            msg.angular.z = 0.5
        else:
            self.i = 0  # Reset counter

        self.publisher.publish(msg)
        self.i += 1

def main(args=None):
    rclpy.init(args=args)

    controller = SimpleController()

    try:
        rclpy.spin(controller)
    except KeyboardInterrupt:
        pass
    finally:
        controller.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

## Understanding Physics in Gazebo

### Physics Properties

Gazebo uses physics engines (like ODE, Bullet, or DART) to simulate realistic physics. Key properties include:

- **Mass**: How heavy an object is
- **Inertia**: Resistance to rotational motion
- **Friction**: How objects interact with surfaces
- **Damping**: Energy loss over time

### Friction Parameters

The friction parameters (`mu1` and `mu2`) control how objects interact with surfaces:

```xml
<gazebo reference="wheel_link">
  <mu1>0.8</mu1>  <!-- Primary friction coefficient -->
  <mu2>0.8</mu2>  <!-- Secondary friction coefficient -->
  <kp>10000000.0</kp>  <!-- Contact stiffness -->
  <kd>1.0</kd>  <!-- Contact damping -->
</gazebo>
```

## Common Simulation Issues and Solutions

### Robot Falling Through Ground

This typically happens when collision properties aren't properly defined:

```xml
<!-- Make sure your base link has proper collision -->
<link name="base_link">
  <collision>
    <geometry>
      <cylinder radius="0.2" length="0.1"/>
    </geometry>
  </collision>
  <inertial>
    <mass value="5.0"/>
    <inertia ixx="0.1" ixy="0.0" ixz="0.0" iyy="0.1" iyz="0.0" izz="0.2"/>
  </inertial>
</link>
```

### Robot Not Moving

Check that your differential drive plugin is properly configured:

```xml
<gazebo>
  <plugin name="diff_drive" filename="libgazebo_ros_diff_drive.so">
    <left_joint>left_wheel_joint</left_joint>
    <right_joint>right_wheel_joint</right_joint>
    <wheel_separation>0.3</wheel_separation>
    <wheel_diameter>0.2</wheel_diameter>
    <command_topic>cmd_vel</command_topic>
    <odometry_topic>odom</odometry_topic>
    <robot_base_frame>base_link</robot_base_frame>
  </plugin>
</gazebo>
```

## Visualization and Debugging

### Using Gazebo GUI

The Gazebo GUI provides real-time visualization of your simulation:

- **Play/Pause**: Control simulation time
- **Step**: Advance simulation frame by frame
- **Reset**: Reset simulation to initial state
- **Models**: View and manipulate objects in the scene

### Monitoring Topics

Monitor your robot's behavior using ROS tools:

```bash
# List all topics
ros2 topic list

# Monitor odometry
ros2 topic echo /odom

# Monitor laser scans (if your robot has a LiDAR)
ros2 topic echo /scan
```

## Practical Lab: Create Your Own Simulation

### Lab Objective

Create a complete simulation environment with a robot that can navigate around obstacles.

### Steps

1. **Create a robot model** with appropriate physical properties
2. **Design a world file** with obstacles and landmarks
3. **Implement a simple controller** to navigate the environment
4. **Test and validate** the simulation behavior

### Solution Template

**Robot Model** (`maze_robot.urdf`):
```xml
<?xml version="1.0"?>
<robot name="maze_robot">
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.3 0.3 0.15"/>
      </geometry>
      <material name="green">
        <color rgba="0 1 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.3 0.3 0.15"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="2.0"/>
      <inertia ixx="0.025" ixy="0.0" ixz="0.0" iyy="0.025" iyz="0.0" izz="0.05"/>
    </inertial>
  </link>

  <!-- Add wheels and differential drive plugin -->
  <!-- Similar to previous example -->
</robot>
```

**World File** (`maze_world.sdf`):
```xml
<?xml version="1.0" ?>
<sdf version="1.7">
  <world name="maze_world">
    <physics name="ode" default="0" type="ode">
      <max_step_size>0.004</max_step_size>
      <real_time_factor>1</real_time_factor>
    </physics>

    <include>
      <uri>model://ground_plane</uri>
    </include>

    <include>
      <uri>model://sun</uri>
    </include>

    <!-- Maze walls -->
    <model name="wall_1">
      <static>true</static>
      <link name="link">
        <collision name="collision">
          <geometry>
            <box>
              <size>5 0.1 1</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>5 0.1 1</size>
            </box>
          </geometry>
          <material>
            <ambient>0.5 0.5 0.5 1</ambient>
            <diffuse>0.7 0.7 0.7 1</diffuse>
          </material>
        </visual>
      </link>
    </model>

    <!-- Add more walls to create a maze pattern -->
    <!-- Position them to create paths and obstacles -->
  </world>
</sdf>
```

## Performance Optimization

### Simulation Speed

To improve simulation performance:

1. **Reduce physics update rate** in world file
2. **Simplify collision meshes** for complex models
3. **Reduce sensor resolution** if not needed
4. **Use fewer plugins** than necessary

### Physics Settings

```xml
<physics name="fast_physics" type="ode">
  <max_step_size>0.01</max_step_size>  <!-- Larger steps = faster but less accurate -->
  <real_time_update_rate>100</real_time_update_rate>
  <real_time_factor>1</real_time_factor>
</physics>
```

## Best Practices

1. **Start Simple**: Begin with basic models and gradually add complexity
2. **Validate Physics**: Ensure realistic mass and inertia values
3. **Use Standard Models**: Leverage existing models when possible
4. **Test Incrementally**: Add one feature at a time and test
5. **Document Your Work**: Keep track of model parameters and configurations

## Summary

This module covered the fundamentals of Gazebo simulation:

- Setting up and launching Gazebo
- Creating basic robot models in URDF
- Loading robots into simulation environments
- Controlling robots through ROS topics
- Understanding physics properties and common issues
- Best practices for simulation development

The next module will dive deeper into sensor simulation, covering cameras, LiDAR, IMU, and other sensor types in detail.