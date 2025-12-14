---
title: ROS 2 Launch Files
sidebar_position: 5
---

# ROS 2 Launch Files

## Introduction to Launch Files

Launch files in ROS 2 are used to start multiple nodes simultaneously with a single command. They allow you to define complex robot applications with all their dependencies, parameters, and configurations in a single file. This module covers creating and using launch files to manage complex ROS 2 applications efficiently.

### Why Use Launch Files?

Launch files provide several advantages:
- **Convenience**: Start multiple nodes with a single command
- **Configuration**: Set parameters for multiple nodes at once
- **Reusability**: Define common configurations that can be reused
- **Maintainability**: Centralize the definition of your robot's configuration

## Launch System Architecture

### Python Launch System

ROS 2 uses a Python-based launch system that provides:

```python
# Example launch file structure
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node, ComposableNodeContainer
from launch_ros.descriptions import ComposableNode
from launch.substitutions import TextSubstitution
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    """Generate the launch description for our example"""
    # Define launch arguments
    example_arg = DeclareLaunchArgument(
        'example_param',
        default_value='default_value',
        description='Example launch argument'
    )

    # Create nodes
    example_node = Node(
        package='example_package',
        executable='example_node',
        name='example_node_name',
        parameters=[
            {
                'param1': 'value1',
                'param2': 42
            }
        ],
        remappings=[
            ('original_topic', 'new_topic')
        ]
    )

    # Return launch description
    return LaunchDescription([
        example_arg,
        example_node
    ])
```

## Basic Launch File Creation

### Simple Launch File

Let's start with a basic launch file:

```python
# launch/simple_launch.py
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    """Launch a simple publisher and subscriber"""
    return LaunchDescription([
        # Publisher node
        Node(
            package='demo_nodes_cpp',
            executable='talker',
            name='publisher_node',
            parameters=[
                {'message': 'Hello from launch file!'}
            ],
            output='screen'
        ),

        # Subscriber node
        Node(
            package='demo_nodes_cpp',
            executable='listener',
            name='subscriber_node',
            output='screen'
        )
    ])
```

### Launch Arguments

Launch arguments allow you to customize your launch files:

```python
# launch/parameterized_launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    # Declare launch arguments
    message_arg = DeclareLaunchArgument(
        'message',
        default_value='Default message from launch',
        description='Message to publish'
    )

    frequency_arg = DeclareLaunchArgument(
        'frequency',
        default_value='1.0',
        description='Publish frequency in Hz'
    )

    # Use launch arguments in node parameters
    talker_node = Node(
        package='demo_nodes_cpp',
        executable='talker',
        name='parameterized_talker',
        parameters=[
            {'message': LaunchConfiguration('message')},
            {'frequency': LaunchConfiguration('frequency')}
        ],
        output='screen'
    )

    return LaunchDescription([
        message_arg,
        frequency_arg,
        talker_node
    ])
```

## Advanced Launch Concepts

### Conditional Launch

Launch files can include conditional logic:

```python
# launch/conditional_launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.conditions import IfCondition, UnlessCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    # Declare arguments
    use_sim_time_arg = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation time'
    )

    enable_viz_arg = DeclareLaunchArgument(
        'enable_viz',
        default_value='false',
        description='Enable visualization'
    )

    # Conditional nodes
    clock_node = Node(
        package='demo_nodes_cpp',
        executable='talker',
        name='clock_publisher',
        condition=IfCondition(LaunchConfiguration('use_sim_time'))
    )

    viz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='visualizer',
        condition=IfCondition(LaunchConfiguration('enable_viz'))
    )

    return LaunchDescription([
        use_sim_time_arg,
        enable_viz_arg,
        clock_node,
        viz_node
    ])
```

### Composable Nodes (Components)

Composable nodes run within a single process for better performance:

```python
# launch/composable_launch.py
from launch import LaunchDescription
from launch_ros.actions import ComposableNodeContainer
from launch_ros.descriptions import ComposableNode

def generate_launch_description():
    """Launch composable nodes in a single container"""

    # Create container for composable nodes
    container = ComposableNodeContainer(
        name='image_processing_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container',
        composable_node_descriptions=[
            ComposableNode(
                package='image_tools',
                plugin='image_tools::Cam2Image',
                name='cam2image_node',
                parameters=[
                    {'frequency': 30.0},
                    {'burger_mode': False}
                ],
                remappings=[
                    ('image', 'camera/image_raw')
                ]
            ),
            ComposableNode(
                package='image_tools',
                plugin='image_tools::ShowImage',
                name='showimage_node',
                remappings=[
                    ('image', 'camera/image_raw')
                ]
            )
        ],
        output='screen'
    )

    return LaunchDescription([container])
```

## Launch File Best Practices

### Parameter Management

Organize parameters effectively using YAML files:

```python
# launch/parameter_launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    # Get package directory
    pkg_share = get_package_share_directory('my_robot_package')

    # Declare launch arguments
    params_file_arg = DeclareLaunchArgument(
        'params_file',
        default_value=PathJoinSubstitution([pkg_share, 'config', 'robot_params.yaml']),
        description='Full path to the parameters file to use'
    )

    # Launch node with parameter file
    robot_controller = Node(
        package='my_robot_package',
        executable='robot_controller',
        name='robot_controller',
        parameters=[
            LaunchConfiguration('params_file'),
            {'use_sim_time': False}
        ],
        output='screen'
    )

    return LaunchDescription([
        params_file_arg,
        robot_controller
    ])
```

### Configuration File Example

Example parameter file (config/robot_params.yaml):

```yaml
/**:
  ros__parameters:
    # Robot configuration
    robot_name: "my_robot"
    max_velocity: 1.0
    safe_distance: 0.5

    # Navigation parameters
    navigation:
      planner_frequency: 5.0
      controller_frequency: 20.0
      recovery_enabled: true

    # Sensor parameters
    sensors:
      laser_scan_topic: "/scan"
      camera_topic: "/camera/rgb/image_raw"
      imu_topic: "/imu/data"
```

## Complex Launch File Example

### Complete Robot Launch

Here's a comprehensive launch file for a complete robot system:

```python
# launch/complete_robot.launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, GroupAction, SetEnvironmentVariable
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution, PythonExpression
from launch_ros.actions import Node, PushRosNamespace
from launch_ros.substitutions import FindPackageShare
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time', default='false')
    use_rviz = LaunchConfiguration('use_rviz', default='true')
    robot_namespace = LaunchConfiguration('robot_namespace', default='')
    params_file = LaunchConfiguration('params_file')

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

    declare_params_file_arg = DeclareLaunchArgument(
        'params_file',
        default_value=os.path.join(get_package_share_directory('my_robot_package'),
                                  'config', 'robot_params.yaml'),
        description='Full path to the ROS2 parameters file to use for the robot'
    )

    # Nodes
    # Robot state publisher
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        namespace=robot_namespace,
        parameters=[
            params_file,
            {'use_sim_time': use_sim_time}
        ],
        remappings=[
            ('/tf', 'tf'),
            ('/tf_static', 'tf_static')
        ]
    )

    # Joint state publisher
    joint_state_publisher = Node(
        package='joint_state_publisher',
        executable='joint_state_publisher',
        name='joint_state_publisher',
        namespace=robot_namespace,
        parameters=[
            {'use_sim_time': use_sim_time}
        ]
    )

    # Navigation stack
    navigation_nodes = GroupAction(
        condition=IfCondition(
            PythonExpression(['not ', use_sim_time])  # Only for real robot
        ),
        actions=[
            Node(
                package='nav2_map_server',
                executable='map_server',
                name='map_server',
                namespace=robot_namespace,
                parameters=[params_file],
                remappings=[('cmd_vel', 'cmd_vel_nav')]
            ),
            Node(
                package='nav2_planner',
                executable='planner_server',
                name='planner_server',
                namespace=robot_namespace,
                parameters=[params_file]
            ),
            Node(
                package='nav2_controller',
                executable='controller_server',
                name='controller_server',
                namespace=robot_namespace,
                parameters=[params_file]
            )
        ]
    )

    # RVIZ
    rviz = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', PathJoinSubstitution([FindPackageShare('my_robot_package'), 'rviz', 'robot_view.rviz'])],
        condition=IfCondition(use_rviz),
        parameters=[
            {'use_sim_time': use_sim_time}
        ]
    )

    # Launch description
    ld = LaunchDescription()

    # Add actions
    ld.add_action(declare_use_sim_time_arg)
    ld.add_action(declare_use_rviz_arg)
    ld.add_action(declare_robot_namespace_arg)
    ld.add_action(declare_params_file_arg)

    # Add nodes with namespace if specified
    if robot_namespace.perform({}):
        ld.add_action(PushRosNamespace(robot_namespace))

    ld.add_action(robot_state_publisher)
    ld.add_action(joint_state_publisher)
    ld.add_action(navigation_nodes)
    ld.add_action(rviz)

    return ld
```

## Launch File Commands

### Running Launch Files

```bash
# Basic launch
ros2 launch my_package my_launch_file.py

# With arguments
ros2 launch my_package my_launch_file.py param_name:=value

# With multiple arguments
ros2 launch my_package my_launch_file.py param1:=value1 param2:=value2

# Using simulation time
ros2 launch my_package my_launch_file.py use_sim_time:=true

# Dry run to see what would be launched
ros2 launch --dry-run my_package my_launch_file.py
```

## Launch File Testing

### Creating Launch Tests

```python
# test/test_launch_files.py
import unittest
import launch
from launch import LaunchDescription
from launch_ros.actions import Node
import launch_testing.actions
import pytest

@pytest.mark.launch_test
def generate_test_description():
    """Generate test launch description"""
    # Launch the nodes under test
    test_node = Node(
        package='my_package',
        executable='test_node',
        name='test_node'
    )

    return LaunchDescription([
        test_node,
        # Start tests right away - no need to wait for anything
        launch_testing.actions.ReadyToTest()
    ])

def test_node_launch_success():
    """Test that the node launches successfully"""
    # This test will pass if the launch completes without errors
    assert True
```

## Practical Lab: Creating a Robot Launch System

### Lab: Complete Robot Launch

**Objective**: Create a launch file that starts a complete robot system with navigation, visualization, and control nodes.

**Steps**:
1. Create a launch file that starts robot state publisher
2. Add joint state publisher
3. Include navigation stack nodes
4. Add RVIZ for visualization
5. Implement parameter configuration
6. Add conditional logic for simulation vs real robot

**Complete Example Solution**:

```python
# launch/robot_system_launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, TimerAction
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time')
    use_rviz = LaunchConfiguration('use_rviz')
    robot_name = LaunchConfiguration('robot_name')
    world = LaunchConfiguration('world')

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

    declare_robot_name_arg = DeclareLaunchArgument(
        'robot_name',
        default_value='my_robot',
        description='Name of the robot'
    )

    # Get package directories
    pkg_share = get_package_share_directory('my_robot_package')
    default_model_path = os.path.join(pkg_share, 'urdf', 'robot.urdf')
    default_rviz_config_path = os.path.join(pkg_share, 'rviz', 'config.rviz')

    # Robot state publisher
    robot_state_publisher_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'robot_description': open(default_model_path).read()}
        ]
    )

    # Joint state publisher
    joint_state_publisher_node = Node(
        package='joint_state_publisher',
        executable='joint_state_publisher',
        name='joint_state_publisher',
        parameters=[
            {'use_sim_time': use_sim_time}
        ]
    )

    # Robot controller
    robot_controller_node = Node(
        package='my_robot_package',
        executable='robot_controller',
        name='robot_controller',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'robot_name': robot_name}
        ],
        output='screen'
    )

    # RVIZ
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        output='screen',
        condition=IfCondition(use_rviz),
        arguments=['-d', default_rviz_config_path],
        parameters=[
            {'use_sim_time': use_sim_time}
        ]
    )

    # Delay RVIZ to allow other nodes to start first
    delayed_rviz_launch = TimerAction(
        period=3.0,
        actions=[rviz_node]
    )

    return LaunchDescription([
        declare_use_sim_time_arg,
        declare_use_rviz_arg,
        declare_robot_name_arg,
        robot_state_publisher_node,
        joint_state_publisher_node,
        robot_controller_node,
        delayed_rviz_launch
    ])
```

## Launch File Debugging

### Common Issues and Solutions

1. **Node not found**: Ensure packages are built and sourced
2. **Parameters not loading**: Check file paths and YAML syntax
3. **Namespace issues**: Verify namespace handling in launch files
4. **Timing issues**: Use TimerAction for dependent nodes

### Debugging Commands

```bash
# Check available launch files
ros2 launch -s

# List all launch arguments for a file
ros2 launch -d my_package my_launch.py

# Verbose launch output
ros2 launch --log-level debug my_package my_launch.py

# Check launch process tree
ros2 launch --show-process-tree my_package my_launch.py
```

## Summary

Launch files are essential for managing complex ROS 2 applications. This module covered:
- Basic launch file structure and syntax
- Launch arguments and parameter management
- Advanced concepts like composable nodes and conditional launches
- Best practices for organizing launch files
- A practical lab creating a complete robot launch system
- Debugging techniques for launch files

Launch files allow you to create reproducible, configurable robot applications that can be easily deployed and managed across different environments.