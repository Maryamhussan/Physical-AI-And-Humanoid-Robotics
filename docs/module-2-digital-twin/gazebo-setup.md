---
title: Gazebo Setup and Configuration
sidebar_position: 2
---

# Gazebo Setup and Configuration

## Introduction to Gazebo

Gazebo is a powerful 3D simulation environment that enables accurate and efficient testing of robotics applications. It provides high-fidelity physics simulation, realistic rendering, and convenient programmatic interfaces.

### Key Features of Gazebo
- **Physics Simulation**: Accurate simulation of rigid body dynamics, collisions, and contacts
- **Sensor Simulation**: Support for various sensors including cameras, LiDAR, IMU, GPS, etc.
- **Rendering**: High-quality 3D graphics rendering using OGRE
- **Plugins**: Extensible architecture through plugins
- **ROS Integration**: Seamless integration with ROS and ROS 2

## Installing Gazebo

### Gazebo Garden (Recommended for ROS 2 Humble)

For ROS 2 Humble Hawksbill (the LTS version), we recommend using Gazebo Garden:

```bash
# Add the OSRF APT repository
sudo apt update && sudo apt install wget
sudo wget https://packages.osrfoundation.org/gazebo.gpg -O /usr/share/keyrings/pkgs-osrf-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/pkgs-osrf-archive-keyring.gpg] http://packages.osrfoundation.org/gazebo/ubuntu-stable $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/gazebo-stable.list > /dev/null

# Update and install Gazebo Garden
sudo apt update
sudo apt install gazebo-garden
```

### Alternative: Gazebo Harmonic (For ROS 2 Jazzy)

For ROS 2 Jazzy Jalisco, you might prefer Gazebo Harmonic:

```bash
# Install Gazebo Harmonic
sudo apt install gazebo-harmonic
```

## ROS 2 Gazebo Integration

ROS 2 provides several packages for Gazebo integration:

```bash
# Install ROS 2 Gazebo packages
sudo apt install ros-$ROS_DISTRO-gazebo-*
sudo apt install ros-$ROS_DISTRO-ros-gz
sudo apt install ros-$ROS_DISTRO-ros-gazebo-*
```

## Basic Gazebo Launch

### Launching Gazebo Standalone

```bash
# Launch Gazebo GUI
gazebo

# Launch Gazebo without GUI (headless)
gz sim -s
```

### Launching Gazebo with ROS 2

```xml
<!-- Example launch file: launch/gazebo.launch.py -->
import os
from launch import LaunchDescription
from launch.actions import ExecuteProcess
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import ThisLaunchFileDir
from launch_ros.actions import Node

def generate_launch_description():
    world_file = os.path.join(
        get_package_share_directory('my_robot_gazebo'),
        'worlds',
        'my_world.sdf'
    )

    return LaunchDescription([
        # Launch Gazebo with world file
        ExecuteProcess(
            cmd=['gazebo', '--verbose', world_file, '-s', 'libgazebo_ros_init.so', '-s', 'libgazebo_ros_factory.so'],
            output='screen'
        ),
    ])
```

## Creating Custom Worlds

### World File Structure

A basic Gazebo world file in SDF format:

```xml
<?xml version="1.0" ?>
<sdf version="1.7">
  <world name="my_world">
    <!-- Include models from Gazebo database -->
    <include>
      <uri>model://ground_plane</uri>
    </include>

    <include>
      <uri>model://sun</uri>
    </include>

    <!-- Define a custom model -->
    <model name="my_robot">
      <pose>0 0 0.5 0 0 0</pose>
      <link name="chassis">
        <collision name="collision">
          <geometry>
            <box>
              <size>1.0 0.5 0.3</size>
            </box>
          </geometry>
        </collision>
        <visual name="visual">
          <geometry>
            <box>
              <size>1.0 0.5 0.3</size>
            </box>
          </geometry>
        </visual>
        <inertial>
          <mass>1.0</mass>
          <inertia>
            <ixx>0.083</ixx>
            <iyy>0.167</iyy>
            <izz>0.167</izz>
          </inertia>
        </inertial>
      </link>
    </model>
  </world>
</sdf>
```

## Robot Model Integration

### URDF to SDF Conversion

Gazebo can work with both SDF and URDF models. To use URDF models in Gazebo:

```xml
<!-- Example URDF with Gazebo plugins -->
<?xml version="1.0"?>
<robot name="my_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.5 0.5 0.2"/>
      </geometry>
    </visual>
    <collision>
      <geometry>
        <box size="0.5 0.5 0.2"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.01" ixy="0.0" ixz="0.0" iyy="0.01" iyz="0.0" izz="0.01"/>
    </inertial>
  </link>

  <!-- Gazebo plugin for ROS control -->
  <gazebo>
    <plugin name="diff_drive" filename="libgazebo_ros_diff_drive.so">
      <left_joint>left_wheel_joint</left_joint>
      <right_joint>right_wheel_joint</right_joint>
      <wheel_separation>0.4</wheel_separation>
      <wheel_diameter>0.2</wheel_diameter>
      <command_topic>cmd_vel</command_topic>
      <odometry_topic>odom</odometry_topic>
      <odometry_frame>odom</odometry_frame>
      <robot_base_frame>base_link</robot_base_frame>
    </plugin>
  </gazebo>
</robot>
```

## Common Gazebo Plugins

### Sensor Plugins

```xml
<!-- Camera sensor plugin -->
<gazebo reference="camera_link">
  <sensor name="camera" type="camera">
    <camera>
      <horizontal_fov>1.047</horizontal_fov>
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.1</near>
        <far>100</far>
      </clip>
    </camera>
    <plugin name="camera_controller" filename="libgazebo_ros_camera.so">
      <frame_name>camera_optical_frame</frame_name>
      <topic_name>image_raw</topic_name>
    </plugin>
  </sensor>
</gazebo>

<!-- LiDAR sensor plugin -->
<gazebo reference="lidar_link">
  <sensor name="lidar" type="ray">
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
        <max>30.0</max>
        <resolution>0.01</resolution>
      </range>
    </ray>
    <plugin name="lidar_controller" filename="libgazebo_ros_ray_sensor.so">
      <ros>
        <remapping>~/out:=scan</remapping>
      </ros>
    </plugin>
  </sensor>
</gazebo>
```

### Physics and Control Plugins

```xml
<!-- Joint state publisher -->
<gazebo>
  <plugin name="joint_state_publisher" filename="libgazebo_ros_joint_state_publisher.so">
    <joint_name>joint1, joint2, joint3</joint_name>
  </plugin>
</gazebo>

<!-- Joint trajectory controller -->
<gazebo>
  <plugin name="position_controller" filename="libgazebo_ros_joint_position.so">
    <command_topic>position_cmd</command_topic>
    <joint_name>joint1</joint_name>
    <pid>
      <p>100.0</p>
      <i>0.1</i>
      <d>10.0</d>
    </pid>
  </plugin>
</gazebo>
```

## Troubleshooting Common Issues

### Performance Issues
- **Reduce rendering quality**: Use `gz sim -s` for headless mode
- **Optimize physics settings**: Adjust solver parameters in world file
- **Limit sensor resolution**: Reduce camera resolution or LiDAR samples

### Plugin Loading Issues
- Ensure plugin libraries are properly installed
- Check that plugin filenames match available libraries
- Verify ROS_DISTRO environment variable is set correctly

### Model Spawning Issues
- Verify model paths and URDF/SDF syntax
- Check that required meshes and textures are available
- Ensure proper permissions on model files

## Best Practices

1. **Start Simple**: Begin with basic models and gradually add complexity
2. **Use Standard Models**: Leverage existing models from Gazebo database when possible
3. **Optimize for Performance**: Balance realism with simulation speed
4. **Validate Physics**: Ensure realistic mass, inertia, and friction parameters
5. **Test Integration**: Verify ROS 2 communication works properly with simulated sensors

## Common Commands

- `gz sim` - Launch Gazebo simulation
- `gz model` - Spawn or delete models
- `gz topic` - List and interact with topics
- `gz service` - List and call services
- `gazebo` - Launch Gazebo with GUI (legacy)

## Summary

Setting up Gazebo properly is crucial for effective robotics simulation. The integration with ROS 2 provides powerful capabilities for testing and validating robotic applications in a safe, controlled environment. In the next chapter, we'll explore the differences between SDF and URDF formats and when to use each.