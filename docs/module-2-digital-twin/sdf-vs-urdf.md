---
title: SDF vs URDF Comparison
sidebar_position: 3
---

# SDF vs URDF Comparison

## Introduction

Simulation Description Format (SDF) and Unified Robot Description Format (URDF) are both XML-based formats used to describe robots and environments in simulation. While they serve similar purposes, they have different strengths and use cases in the robotics ecosystem.

## Overview of SDF (Simulation Description Format)

SDF is the native format for Gazebo simulation. It was developed specifically for physics simulation and provides comprehensive support for:

- **Simulation environments**: Worlds, lighting, terrain, and physics properties
- **Robot models**: With support for sensors, actuators, and plugins
- **Physics properties**: Material properties, collision models, and dynamics
- **Plugins**: Custom functionality through Gazebo plugins

### SDF Basic Structure

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

    <!-- Define a custom robot -->
    <model name="my_robot" static="false">
      <pose>0 0 0.5 0 0 0</pose>

      <!-- Link definition -->
      <link name="chassis">
        <pose>0 0 0.1 0 0 0</pose>
        <inertial>
          <mass>1.0</mass>
          <inertia>
            <ixx>0.083</ixx>
            <iyy>0.167</iyy>
            <izz>0.167</izz>
            <ixy>0</ixy>
            <ixz>0</ixz>
            <iyz>0</iyz>
          </inertia>
        </inertial>

        <!-- Visual properties -->
        <visual name="chassis_visual">
          <geometry>
            <box>
              <size>0.5 0.3 0.2</size>
            </box>
          </geometry>
          <material>
            <ambient>0.4 0.4 0.4 1</ambient>
            <diffuse>0.8 0.8 0.8 1</diffuse>
            <specular>0.2 0.2 0.2 1</specular>
          </material>
        </visual>

        <!-- Collision properties -->
        <collision name="chassis_collision">
          <geometry>
            <box>
              <size>0.5 0.3 0.2</size>
            </box>
          </geometry>
        </collision>
      </link>

      <!-- Joint definition -->
      <joint name="wheel_joint" type="revolute">
        <parent>chassis</parent>
        <child>wheel</child>
        <axis>
          <xyz>0 1 0</xyz>
          <limit>
            <lower>-1.57</lower>
            <upper>1.57</upper>
            <effort>100</effort>
            <velocity>1</velocity>
          </limit>
        </axis>
      </joint>

      <!-- Child link -->
      <link name="wheel">
        <inertial>
          <mass>0.2</mass>
          <inertia>
            <ixx>0.001</ixx>
            <iyy>0.002</iyy>
            <izz>0.001</izz>
          </inertia>
        </inertial>
        <visual name="wheel_visual">
          <geometry>
            <cylinder>
              <radius>0.1</radius>
              <length>0.05</length>
            </cylinder>
          </geometry>
        </visual>
        <collision name="wheel_collision">
          <geometry>
            <cylinder>
              <radius>0.1</radius>
              <length>0.05</length>
            </cylinder>
          </geometry>
        </collision>
      </link>

      <!-- Sensor definition -->
      <sensor name="camera" type="camera">
        <pose>0.2 0 0.1 0 0 0</pose>
        <camera>
          <horizontal_fov>1.047</horizontal_fov>
          <image>
            <width>640</width>
            <height>480</height>
          </image>
          <clip>
            <near>0.1</near>
            <far>10</far>
          </clip>
        </camera>
      </sensor>

      <!-- Plugin for ROS integration -->
      <plugin name="diff_drive" filename="libgazebo_ros_diff_drive.so">
        <left_joint>left_wheel_joint</left_joint>
        <right_joint>right_wheel_joint</right_joint>
        <wheel_separation>0.3</wheel_separation>
        <wheel_diameter>0.2</wheel_diameter>
        <command_topic>cmd_vel</command_topic>
        <odometry_topic>odom</odometry_topic>
        <robot_base_frame>chassis</robot_base_frame>
      </plugin>
    </model>
  </world>
</sdf>
```

## Overview of URDF (Unified Robot Description Format)

URDF is the native format for ROS and is used for robot modeling, kinematics, and visualization. It focuses on:

- **Robot structure**: Links and joints in a tree structure
- **Kinematic properties**: Joint limits, types, and transformations
- **Visual and collision properties**: For rendering and collision detection
- **ROS integration**: Through robot_state_publisher and other tools

### URDF Basic Structure

```xml
<?xml version="1.0"?>
<robot name="my_robot">
  <!-- Base link -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="0.5 0.3 0.2"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="0.5 0.3 0.2"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.083" ixy="0.0" ixz="0.0" iyy="0.167" iyz="0.0" izz="0.167"/>
    </inertial>
  </link>

  <!-- Wheel link -->
  <link name="wheel">
    <visual>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.2"/>
      <inertia ixx="0.001" ixy="0.0" ixz="0.0" iyy="0.002" iyz="0.0" izz="0.001"/>
    </inertial>
  </link>

  <!-- Joint connecting base and wheel -->
  <joint name="wheel_joint" type="revolute">
    <parent link="base_link"/>
    <child link="wheel"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
    <limit lower="-1.57" upper="1.57" effort="100" velocity="1"/>
  </joint>

  <!-- Gazebo-specific tags for simulation -->
  <gazebo reference="base_link">
    <material>Gazebo/Blue</material>
  </gazebo>

  <gazebo reference="wheel">
    <mu1>0.2</mu1>
    <mu2>0.2</mu2>
  </gazebo>

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
</robot>
```

## Key Differences

| Aspect | SDF | URDF |
|--------|-----|------|
| **Primary Purpose** | Simulation | Robot modeling and kinematics |
| **Native Ecosystem** | Gazebo | ROS/ROS 2 |
| **World Definition** | Yes (environments, lighting, terrain) | No (requires separate world files) |
| **Sensor Definition** | Native support | Requires Gazebo tags |
| **Plugin Support** | Native support | Requires Gazebo tags |
| **Joint Types** | All joint types | All joint types |
| **ROS Integration** | Through plugins | Native through robot_state_publisher |
| **File Extension** | .sdf, .world | .urdf |
| **Complexity** | Higher (more features) | Lower (focused on robot structure) |

## When to Use SDF

### Use SDF when:
- Creating complete simulation environments
- Defining complex physics properties
- Integrating custom Gazebo plugins
- Working primarily in Gazebo without ROS
- Need to define sensors directly in the model
- Creating world files with multiple robots and objects

### Example: Complete SDF World with Robot and Environment

```xml
<?xml version="1.0" ?>
<sdf version="1.7">
  <world name="maze_world">
    <!-- Physics engine configuration -->
    <physics name="1ms" type="ode">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1</real_time_factor>
      <real_time_update_rate>1000</real_time_update_rate>
    </physics>

    <!-- Include ground plane -->
    <include>
      <uri>model://ground_plane</uri>
    </include>

    <!-- Include lighting -->
    <include>
      <uri>model://sun</uri>
    </include>

    <!-- Define a maze environment -->
    <model name="maze_wall_1">
      <static>true</static>
      <link name="wall_link">
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
        <collision name="collision">
          <geometry>
            <box>
              <size>5 0.1 1</size>
            </box>
          </geometry>
        </collision>
      </link>
    </model>

    <!-- Robot with sensors -->
    <model name="turtlebot3_burger" static="false">
      <include>
        <uri>model://turtlebot3_burger</uri>
      </include>

      <!-- Additional sensor -->
      <sensor name="3d_camera" type="depth">
        <pose>0.1 0 0.1 0 0 0</pose>
        <visualize>true</visualize>
        <update_rate>30</update_rate>
        <camera name="head">
          <horizontal_fov>1.047</horizontal_fov>
          <image>
            <width>640</width>
            <height>480</height>
          </image>
          <clip>
            <near>0.1</near>
            <far>10</far>
          </clip>
        </camera>
        <plugin name="camera_controller" filename="libgazebo_ros_openni_kinect.so">
          <baseline>0.2</baseline>
          <always_on>true</always_on>
          <update_rate>30.0</update_rate>
          <camera_name>camera</camera_name>
          <image_topic_name>rgb/image_raw</image_topic_name>
          <depth_image_topic_name>depth/image_raw</depth_image_topic_name>
          <point_cloud_topic_name>depth/points</point_cloud_topic_name>
          <camera_info_topic_name>rgb/camera_info</camera_info_topic_name>
          <frame_name>camera_depth_optical_frame</frame_name>
          <point_cloud_cutoff>0.5</point_cloud_cutoff>
          <distortion_k1>0.0</distortion_k1>
          <distortion_k2>0.0</distortion_k2>
          <distortion_k3>0.0</distortion_k3>
          <distortion_t1>0.0</distortion_t1>
          <distortion_t2>0.0</distortion_t2>
        </plugin>
      </sensor>
    </model>

    <!-- Object to interact with -->
    <model name="ball">
      <pose>2 0 1 0 0 0</pose>
      <link name="ball_link">
        <inertial>
          <mass>0.1</mass>
          <inertia>
            <ixx>0.0001</ixx>
            <iyy>0.0001</iyy>
            <izz>0.0001</izz>
          </inertia>
        </inertial>
        <visual name="visual">
          <geometry>
            <sphere>
              <radius>0.1</radius>
            </sphere>
          </geometry>
          <material>
            <ambient>1 0 0 1</ambient>
            <diffuse>1 0 0 1</diffuse>
          </material>
        </visual>
        <collision name="collision">
          <geometry>
            <sphere>
              <radius>0.1</radius>
            </sphere>
          </geometry>
        </collision>
      </link>
    </model>
  </world>
</sdf>
```

## When to Use URDF

### Use URDF when:
- Working primarily in ROS/ROS 2 ecosystem
- Focusing on robot kinematics and structure
- Need compatibility with MoveIt! and other ROS tools
- Creating robot models for visualization in RViz
- Planning robot trajectories and motion
- Working with robot_state_publisher

### Example: Complex URDF with Xacro

```xml
<?xml version="1.0"?>
<robot name="industrial_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Properties -->
  <xacro:property name="M_PI" value="3.14159265359"/>
  <xacro:property name="link_radius" value="0.05"/>
  <xacro:property name="base_mass" value="10.0"/>
  <xacro:property name="arm_mass" value="2.0"/>

  <!-- Define a macro for robot links -->
  <xacro:macro name="robot_link" params="name mass length radius xyz rpy parent joint_name joint_type *origin">
    <link name="${name}">
      <visual>
        <xacro:insert_block name="origin"/>
        <geometry>
          <cylinder radius="${radius}" length="${length}"/>
        </geometry>
        <material name="gray">
          <color rgba="0.5 0.5 0.5 1"/>
        </material>
      </visual>
      <collision>
        <xacro:insert_block name="origin"/>
        <geometry>
          <cylinder radius="${radius}" length="${length}"/>
        </geometry>
      </collision>
      <inertial>
        <mass value="${mass}"/>
        <inertia ixx="0.01" ixy="0.0" ixz="0.0" iyy="0.01" iyz="0.0" izz="0.01"/>
      </inertial>
    </link>

    <joint name="${joint_name}" type="${joint_type}">
      <parent link="${parent}"/>
      <child link="${name}"/>
      <origin xyz="${xyz}" rpy="${rpy}"/>
      <axis xyz="0 0 1"/>
      <limit lower="${-M_PI}" upper="${M_PI}" effort="100" velocity="1"/>
    </joint>
  </xacro:macro>

  <!-- Base link -->
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
      <mass value="${base_mass}"/>
      <inertia ixx="0.1" ixy="0.0" ixz="0.0" iyy="0.1" iyz="0.0" izz="0.2"/>
    </inertial>
  </link>

  <!-- Create robot links using macro -->
  <xacro:robot_link name="link1" mass="${arm_mass}" length="0.3" radius="${link_radius}"
                   xyz="0 0 0.15" rpy="0 0 0" parent="base_link"
                   joint_name="joint1" joint_type="revolute">
    <origin xyz="0 0 0.05" rpy="0 0 0"/>
  </xacro:robot_link>

  <xacro:robot_link name="link2" mass="${arm_mass}" length="0.25" radius="${link_radius}"
                   xyz="0 0 0.125" rpy="0 0 0" parent="link1"
                   joint_name="joint2" joint_type="revolute">
    <origin xyz="0 0 0.2" rpy="0 0 0"/>
  </xacro:robot_link>

  <!-- End effector -->
  <link name="end_effector">
    <visual>
      <geometry>
        <sphere radius="0.03"/>
      </geometry>
      <material name="red">
        <color rgba="1 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <sphere radius="0.03"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.1"/>
      <inertia ixx="0.0001" ixy="0.0" ixz="0.0" iyy="0.0001" iyz="0.0" izz="0.0001"/>
    </inertial>
  </link>

  <joint name="ee_joint" type="fixed">
    <parent link="link2"/>
    <child link="end_effector"/>
    <origin xyz="0 0 0.15" rpy="0 0 0"/>
  </joint>

  <!-- Gazebo plugins for ROS integration -->
  <gazebo reference="base_link">
    <material>Gazebo/Blue</material>
  </gazebo>

  <gazebo reference="link1">
    <material>Gazebo/Gray</material>
  </gazebo>

  <gazebo reference="link2">
    <material>Gazebo/Gray</material>
  </gazebo>

  <gazebo reference="end_effector">
    <material>Gazebo/Red</material>
  </gazebo>

  <!-- ROS control plugin -->
  <gazebo>
    <plugin name="ros_control" filename="libgazebo_ros_control.so">
      <robotNamespace>/industrial_robot</robotNamespace>
    </plugin>
  </gazebo>

</robot>
```

## Converting Between SDF and URDF

### URDF to SDF Conversion

Gazebo can automatically convert URDF to SDF:

```bash
# Convert URDF to SDF
gz sdf -p robot.urdf > robot.sdf

# Or use the legacy tool
check_urdf robot.urdf  # Validate URDF first
gz sdf -p robot.urdf > robot.sdf
```

### Using URDF in Gazebo

To use a URDF model in Gazebo, you typically need to:

1. **Spawn the URDF model**:
```bash
# Using gazebo_ros spawn_entity
ros2 run gazebo_ros spawn_entity.py -entity my_robot -file /path/to/robot.urdf -x 0 -y 0 -z 1
```

2. **Launch with robot state publisher**:
```python
# launch/robot_with_gazebo.launch.py
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
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
                'robot_description': open('/path/to/robot.urdf').read()
            }]
        ),

        # Spawn robot in Gazebo
        Node(
            package='gazebo_ros',
            executable='spawn_entity.py',
            arguments=[
                '-entity', 'my_robot',
                '-file', '/path/to/robot.urdf',
                '-x', '0', '-y', '0', '-z', '0.1'
            ],
            output='screen'
        )
    ])
```

## Practical Lab: Converting Models Between Formats

### Lab: Convert URDF to SDF and Simulate

**Objective**: Convert a URDF model to SDF format and simulate it in Gazebo.

**Steps**:
1. Create a simple URDF robot model
2. Convert it to SDF format
3. Add Gazebo-specific properties to the SDF
4. Simulate the robot in Gazebo

**Solution**:

First, create the URDF model (`simple_robot.urdf`):

```xml
<?xml version="1.0"?>
<robot name="simple_robot">
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

  <!-- Gazebo plugins for ROS integration -->
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

Then convert to SDF:

```bash
gz sdf -p simple_robot.urdf > simple_robot.sdf
```

## Best Practices

### For SDF:
1. **Use SDF for complete simulation environments** that include multiple robots, objects, and complex physics
2. **Define sensors directly in SDF** when possible for better performance
3. **Use proper physics properties** for realistic simulation
4. **Organize complex worlds** with includes for reusability

### For URDF:
1. **Use URDF for robot modeling** when working primarily in ROS
2. **Add Gazebo tags** only when you need simulation-specific properties
3. **Use Xacro macros** for complex robots to avoid repetition
4. **Validate URDF** before simulation using `check_urdf`

### When Using Both:
1. **Keep robot models in URDF** and use Gazebo tags for simulation
2. **Use SDF for world files** and environments
3. **Convert formats only when necessary** - avoid unnecessary conversions
4. **Maintain both formats** if you need to work in both ecosystems

## Tools and Utilities

### URDF Tools:
```bash
# Validate URDF
check_urdf robot.urdf

# Visualize URDF in RViz
ros2 launch urdf_tutorial display.launch.py model:=robot.urdf

# Convert Xacro to URDF
ros2 run xacro xacro robot.xacro > robot.urdf
```

### SDF Tools:
```bash
# Validate and pretty-print SDF
gz sdf -p robot.sdf

# Validate SDF file
gz sdf -k robot.sdf
```

## Summary

Both SDF and URDF serve important roles in the robotics ecosystem:

- **SDF** is optimized for simulation and provides comprehensive support for environments, physics, and plugins
- **URDF** is optimized for robot modeling and ROS integration, with strong support for kinematics and visualization

Choose the format that best fits your primary use case, but be prepared to work with both when integrating simulation and ROS systems. Understanding both formats is crucial for developing complete robotic systems that work well in both simulation and reality.