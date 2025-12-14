---
title: URDF Fundamentals for Robot Modeling
sidebar_position: 4
---

# URDF Fundamentals for Robot Modeling

## Introduction to URDF

Unified Robot Description Format (URDF) is an XML-based format used to describe robot models in ROS. URDF defines the physical and visual properties of a robot, including its links, joints, and their relationships in a tree structure.

### What URDF Defines

- **Links**: Rigid bodies that make up the robot
- **Joints**: Connections between links with specific degrees of freedom
- **Visual**: How the robot appears in simulation and visualization tools
- **Collision**: Collision properties for physics simulation
- **Inertial**: Mass, center of mass, and inertia properties
- **Materials**: Visual appearance properties

## Basic URDF Structure

A minimal URDF file follows this structure:

```xml
<?xml version="1.0"?>
<robot name="my_robot">
  <!-- Links define rigid bodies -->
  <link name="base_link">
    <visual>
      <geometry>
        <box size="1.0 0.5 0.3"/>
      </geometry>
    </visual>
    <collision>
      <geometry>
        <box size="1.0 0.5 0.3"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.083" ixy="0.0" ixz="0.0" iyy="0.167" iyz="0.0" izz="0.167"/>
    </inertial>
  </link>
</robot>
```

## Links: The Building Blocks of Robots

Links represent rigid bodies in a robot. Each link can have visual, collision, and inertial properties.

### Link Properties

```xml
<link name="link_name">
  <!-- Visual properties for rendering -->
  <visual>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <geometry>
      <!-- Various geometry types -->
      <box size="1 1 1"/>
      <!-- <cylinder radius="0.5" length="1.0"/> -->
      <!-- <sphere radius="0.5"/> -->
      <!-- <mesh filename="package://my_robot/meshes/link.dae"/> -->
    </geometry>
    <material name="red">
      <color rgba="1 0 0 1"/>
    </material>
  </visual>

  <!-- Collision properties for physics simulation -->
  <collision>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <geometry>
      <box size="1 1 1"/>
    </geometry>
  </collision>

  <!-- Inertial properties for physics simulation -->
  <inertial>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <mass value="1.0"/>
    <inertia ixx="0.083" ixy="0.0" ixz="0.0" iyy="0.167" iyz="0.0" izz="0.167"/>
  </inertial>
</link>
```

## Joints: Connecting Links

Joints define the relationship between links and specify how they can move relative to each other.

### Joint Types

```xml
<!-- Fixed joint (no movement) -->
<joint name="fixed_joint" type="fixed">
  <parent link="parent_link"/>
  <child link="child_link"/>
  <origin xyz="0 0 0.1" rpy="0 0 0"/>
</joint>

<!-- Revolute joint (rotational) -->
<joint name="revolute_joint" type="revolute">
  <parent link="base_link"/>
  <child link="arm_link"/>
  <origin xyz="0 0 0.5" rpy="0 0 0"/>
  <axis xyz="0 0 1"/>
  <limit lower="-1.57" upper="1.57" effort="100" velocity="1"/>
</joint>

<!-- Continuous joint (unlimited rotation) -->
<joint name="continuous_joint" type="continuous">
  <parent link="base_link"/>
  <child link="wheel_link"/>
  <origin xyz="0.2 0 -0.1" rpy="0 0 0"/>
  <axis xyz="0 1 0"/>
</joint>

<!-- Prismatic joint (linear motion) -->
<joint name="prismatic_joint" type="prismatic">
  <parent link="base_link"/>
  <child link="slider_link"/>
  <origin xyz="0 0 0.3" rpy="0 0 0"/>
  <axis xyz="0 0 1"/>
  <limit lower="0" upper="0.5" effort="100" velocity="1"/>
</joint>

<!-- Floating joint (6 DOF) -->
<joint name="floating_joint" type="floating">
  <parent link="base_link"/>
  <child link="floating_link"/>
  <origin xyz="0 0 1" rpy="0 0 0"/>
</joint>
```

## Complete Robot Example

Here's a complete example of a simple differential drive robot:

```xml
<?xml version="1.0"?>
<robot name="diff_drive_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Base link -->
  <link name="base_link">
    <visual>
      <origin xyz="0 0 0.1" rpy="0 0 0"/>
      <geometry>
        <box size="0.5 0.3 0.2"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0.1" rpy="0 0 0"/>
      <geometry>
        <box size="0.5 0.3 0.2"/>
      </geometry>
    </collision>
    <inertial>
      <origin xyz="0 0 0.1" rpy="0 0 0"/>
      <mass value="2.0"/>
      <inertia ixx="0.025" ixy="0.0" ixz="0.0" iyy="0.042" iyz="0.0" izz="0.065"/>
    </inertial>
  </link>

  <!-- Left wheel -->
  <link name="left_wheel">
    <visual>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
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
  <link name="right_wheel">
    <visual>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
      <material name="black">
        <color rgba="0 0 0 1"/>
      </material>
    </visual>
    <collision>
      <origin xyz="0 0 0" rpy="1.570796 0 0"/>
      <geometry>
        <cylinder radius="0.1" length="0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.00125" ixy="0.0" ixz="0.0" iyy="0.00125" iyz="0.0" izz="0.0025"/>
    </inertial>
  </link>

  <!-- Base to left wheel joint -->
  <joint name="left_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="left_wheel"/>
    <origin xyz="0 0.2 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- Base to right wheel joint -->
  <joint name="right_wheel_joint" type="continuous">
    <parent link="base_link"/>
    <child link="right_wheel"/>
    <origin xyz="0 -0.2 0" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
  </joint>

  <!-- Add a camera to the front -->
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
      <inertia ixx="0.000083" ixy="0.0" ixz="0.0" iyy="0.000083" iyz="0.0" izz="0.000083"/>
    </inertial>
  </link>

  <joint name="camera_joint" type="fixed">
    <parent link="base_link"/>
    <child link="camera_link"/>
    <origin xyz="0.2 0 0.15" rpy="0 0 0"/>
  </joint>

</robot>
```

## Xacro: URDF Macros for Complex Robots

Xacro is a macro language that extends URDF with features like variables, mathematical expressions, and includes.

### Basic Xacro Example

```xml
<?xml version="1.0"?>
<robot name="xacro_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Define properties -->
  <xacro:property name="M_PI" value="3.1415926535897931" />
  <xacro:property name="base_width" value="0.5" />
  <xacro:property name="base_length" value="0.3" />
  <xacro:property name="base_height" value="0.2" />
  <xacro:property name="wheel_radius" value="0.1" />
  <xacro:property name="wheel_width" value="0.05" />

  <!-- Define a macro for wheels -->
  <xacro:macro name="wheel" params="prefix *origin">
    <link name="${prefix}_wheel">
      <visual>
        <xacro:insert_block name="origin"/>
        <geometry>
          <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
        </geometry>
        <material name="black">
          <color rgba="0 0 0 1"/>
        </material>
      </visual>
      <collision>
        <xacro:insert_block name="origin"/>
        <geometry>
          <cylinder radius="${wheel_radius}" length="${wheel_width}"/>
        </geometry>
      </collision>
      <inertial>
        <mass value="0.5"/>
        <inertia ixx="0.00125" ixy="0.0" ixz="0.0" iyy="0.00125" iyz="0.0" izz="0.0025"/>
      </inertial>
    </link>
  </xacro:macro>

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
      <inertia ixx="0.025" ixy="0.0" ixz="0.0" iyy="0.042" iyz="0.0" izz="0.065"/>
    </inertial>
  </link>

  <!-- Create wheels using macro -->
  <xacro:wheel prefix="left">
    <origin xyz="0 ${base_length/2} 0" rpy="${M_PI/2} 0 0"/>
  </xacro:wheel>

  <xacro:wheel prefix="right">
    <origin xyz="0 -${base_length/2} 0" rpy="${M_PI/2} 0 0"/>
  </xacro:wheel>

</robot>
```

## Advanced URDF Features

### Gazebo-Specific Tags

When using URDF with Gazebo, you can add Gazebo-specific tags:

```xml
<link name="camera_link">
  <visual>
    <geometry>
      <box size="0.05 0.05 0.05"/>
    </geometry>
  </visual>
  <collision>
    <geometry>
      <box size="0.05 0.05 0.05"/>
    </geometry>
  </collision>
</link>

<!-- Gazebo plugin for camera -->
<gazebo reference="camera_link">
  <sensor type="camera" name="camera1">
    <update_rate>30.0</update_rate>
    <camera name="head">
      <horizontal_fov>1.3962634</horizontal_fov>
      <image>
        <width>800</width>
        <height>600</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.02</near>
        <far>300</far>
      </clip>
    </camera>
    <plugin name="camera_controller" filename="libgazebo_ros_camera.so">
      <frame_name>camera_link</frame_name>
    </plugin>
  </sensor>
</gazebo>

<!-- Gazebo plugin for differential drive -->
<gazebo>
  <plugin name="differential_drive_controller" filename="libgazebo_ros_diff_drive.so">
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
```

## Practical Lab: Create Your Own Robot Model

### Lab: Build a Simple Arm Robot

**Objective**: Create a URDF model of a simple 3-DOF robotic arm.

**Steps**:
1. Create a base link
2. Add 3 revolute joints for shoulder, elbow, and wrist
3. Add appropriate links for each segment
4. Include visual and collision properties
5. Add Gazebo plugins for simulation

**Solution Template**:

```xml
<?xml version="1.0"?>
<robot name="simple_arm" xmlns:xacro="http://www.ros.org/wiki/xacro">

  <!-- Properties -->
  <xacro:property name="M_PI" value="3.14159265359"/>
  <xacro:property name="arm_base_radius" value="0.1"/>
  <xacro:property name="arm_base_height" value="0.1"/>
  <xacro:property name="upper_arm_length" value="0.3"/>
  <xacro:property name="forearm_length" value="0.25"/>
  <xacro:property name="hand_length" value="0.1"/>

  <!-- Base link -->
  <link name="base_link">
    <visual>
      <geometry>
        <cylinder radius="${arm_base_radius}" length="${arm_base_height}"/>
      </geometry>
      <material name="gray">
        <color rgba="0.5 0.5 0.5 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="${arm_base_radius}" length="${arm_base_height}"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="1.0"/>
      <inertia ixx="0.00146" ixy="0.0" ixz="0.0" iyy="0.00146" iyz="0.0" izz="0.0025"/>
    </inertial>
  </link>

  <!-- Base rotation joint -->
  <joint name="base_rotation_joint" type="revolute">
    <parent link="base_link"/>
    <child link="shoulder_link"/>
    <origin xyz="0 0 ${arm_base_height/2}" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="${-M_PI}" upper="${M_PI}" effort="100" velocity="${2*M_PI}"/>
  </joint>

  <!-- Shoulder link -->
  <link name="shoulder_link">
    <visual>
      <geometry>
        <cylinder radius="0.075" length="0.1"/>
      </geometry>
      <material name="red">
        <color rgba="1 0 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.075" length="0.1"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.5"/>
      <inertia ixx="0.000625" ixy="0.0" ixz="0.0" iyy="0.000625" iyz="0.0" izz="0.000469"/>
    </inertial>
  </link>

  <!-- Shoulder joint -->
  <joint name="shoulder_joint" type="revolute">
    <parent link="shoulder_link"/>
    <child link="upper_arm_link"/>
    <origin xyz="0 0 0.05" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
    <limit lower="${-M_PI/2}" upper="${M_PI/2}" effort="100" velocity="${2*M_PI}"/>
  </joint>

  <!-- Upper arm link -->
  <link name="upper_arm_link">
    <visual>
      <geometry>
        <cylinder radius="0.05" length="${upper_arm_length}"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.05" length="${upper_arm_length}"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.8"/>
      <inertia ixx="0.00533" ixy="0.0" ixz="0.0" iyy="0.00533" iyz="0.0" izz="0.00001"/>
    </inertial>
  </link>

  <!-- Elbow joint -->
  <joint name="elbow_joint" type="revolute">
    <parent link="upper_arm_link"/>
    <child link="forearm_link"/>
    <origin xyz="0 0 ${upper_arm_length}" rpy="0 0 0"/>
    <axis xyz="0 1 0"/>
    <limit lower="${-M_PI/2}" upper="${M_PI/2}" effort="100" velocity="${2*M_PI}"/>
  </joint>

  <!-- Forearm link -->
  <link name="forearm_link">
    <visual>
      <geometry>
        <cylinder radius="0.04" length="${forearm_length}"/>
      </geometry>
      <material name="green">
        <color rgba="0 1 0 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.04" length="${forearm_length}"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.6"/>
      <inertia ixx="0.00304" ixy="0.0" ixz="0.0" iyy="0.00304" iyz="0.0" izz="0.000008"/>
    </inertial>
  </link>

  <!-- Gazebo plugins -->
  <gazebo reference="base_link">
    <material>Gazebo/Gray</material>
  </gazebo>

  <gazebo reference="shoulder_link">
    <material>Gazebo/Red</material>
  </gazebo>

  <gazebo reference="upper_arm_link">
    <material>Gazebo/Blue</material>
  </gazebo>

  <gazebo reference="forearm_link">
    <material>Gazebo/Green</material>
  </gazebo>

</robot>
```

## Working with URDF Files

### Validating URDF

To validate your URDF file:

```bash
# Check URDF syntax
check_urdf /path/to/robot.urdf

# Or if using xacro:
ros2 run xacro xacro /path/to/robot.xacro > robot.urdf
check_urdf robot.urdf
```

### Visualizing URDF

To visualize your robot model:

```bash
# Launch RViz with robot state publisher
ros2 launch urdf_tutorial display.launch.py model:=/path/to/robot.urdf
```

### Launching with Robot State Publisher

```xml
<!-- launch/robot_state_publisher.launch.py -->
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        DeclareLaunchArgument(
            'model',
            default_value='/path/to/robot.urdf',
            description='Path to robot URDF file'
        ),

        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            name='robot_state_publisher',
            output='screen',
            parameters=[{
                'robot_description': open(LaunchConfiguration('model')).read()
            }]
        ),

        Node(
            package='joint_state_publisher_gui',
            executable='joint_state_publisher_gui',
            name='joint_state_publisher_gui',
            output='screen'
        )
    ])
```

## Best Practices for URDF

1. **Use consistent naming conventions**: Use underscores and descriptive names
2. **Define realistic inertial properties**: Use CAD software to calculate accurate values
3. **Use collision meshes**: For complex geometries, use simplified collision meshes
4. **Organize with Xacro**: Use macros and properties for maintainable code
5. **Validate regularly**: Check your URDF as you build it
6. **Consider simulation**: Add appropriate Gazebo plugins for simulation
7. **Document your model**: Add comments explaining complex parts

## Common Issues and Troubleshooting

### Joint Limits
- Ensure joint limits are appropriate for your robot's physical constraints
- Check that joint axes are correctly oriented

### Inertial Properties
- Inertia values must be positive
- Center of mass should be at the origin of the link
- Use the parallel axis theorem if needed

### Visual vs Collision
- Visual geometry can be detailed for rendering
- Collision geometry should be simpler for performance
- Both can use different origins if needed

## Summary

URDF is a fundamental tool for defining robot models in ROS. This module covered:
- Basic URDF structure and elements
- Links and joints with their properties
- Xacro macros for complex robots
- Gazebo integration
- Best practices and troubleshooting

The hands-on lab provided practical experience with creating a simple robotic arm model.