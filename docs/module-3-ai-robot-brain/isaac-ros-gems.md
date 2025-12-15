---
title: Isaac ROS GEMs Integration
sidebar_position: 4
---

# Isaac ROS GEMs Integration

## Introduction to Isaac ROS GEMs

Isaac ROS GEMs (GPU Acceleration Modules) are specialized packages that leverage NVIDIA GPU acceleration to enhance the performance of robotics applications. These modules provide optimized implementations of common robotics algorithms that run significantly faster on GPU hardware compared to CPU-only implementations. This module covers the integration of Isaac ROS GEMs with ROS 2 systems to accelerate perception, navigation, and control tasks.

### What Are Isaac ROS GEMs?

Isaac ROS GEMs are a collection of hardware-accelerated packages specifically designed for:
- **Perception**: Object detection, segmentation, depth estimation
- **Navigation**: Visual SLAM, path planning, obstacle avoidance
- **Control**: Model predictive control, trajectory optimization
- **Simulation**: Physics simulation, sensor simulation

### Benefits of GEMs Integration

1. **Performance**: Significant speedup for computationally intensive tasks
2. **Efficiency**: Better power efficiency for edge computing applications
3. **Real-time Capability**: Enable real-time processing of high-resolution data
4. **Scalability**: Handle multiple sensors and complex algorithms
5. **Production Ready**: Optimized for deployment on NVIDIA hardware

## Installation and Setup

### Prerequisites

Before installing Isaac ROS GEMs, ensure your system meets the requirements:

```bash
# Check NVIDIA GPU availability and driver
nvidia-smi

# Verify CUDA installation
nvcc --version

# Check for compatible GPU (Turing architecture or newer recommended)
# Compatible GPUs: RTX series, Tesla T4/V100/A100, Jetson AGX Orin, etc.
```

### Installation Process

```bash
# Add NVIDIA package repositories
wget https://repo.download.nvidia.com/nvidia.pub
sudo apt-key add nvidia.pub
echo 'deb https://repo.download.nvidia.com/jetson/common r35.4 main' | sudo tee /etc/apt/sources.list.d/nvidia.list
echo 'deb https://repo.download.nvidia.com/jetson/incoming r35.4 main' | sudo tee -a /etc/apt/sources.list.d/nvidia.list

# Update package list
sudo apt update

# Install Isaac ROS packages
sudo apt install ros-$ROS_DISTRO-isaac-ros-common
sudo apt install ros-$ROS_DISTRO-isaac-ros-gems

# Install specific GEMs based on requirements
sudo apt install ros-$ROS_DISTRO-isaac-ros-stereo-depth
sudo apt install ros-$ROS_DISTRO-isaac-ros-visual-slam
sudo apt install ros-$ROS_DISTRO-isaac-ros-segmentation
sudo apt install ros-$ROS_DISTRO-isaac-ros-april-tag
sudo apt install ros-$ROS_DISTRO-isaac-ros-dope
sudo apt install ros-$ROS_DISTRO-isaac-ros-occupancy-grid-localizer
```

### Verification

```bash
# Verify GEMs installation
ros2 pkg list | grep isaac_ros

# Check available GEMs
apt list --installed | grep isaac-ros
```

## Core GEMs Overview

### Isaac ROS Stereo DNN

Accelerates stereo vision and depth estimation:

```python
# Example: Isaac ROS Stereo DNN node configuration
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from stereo_msgs.msg import DisparityImage
from isaac_ros_stereo_image_proc import RectifyNode
from isaac_ros_stereo_depth import StereoDepthNode

class StereoDNNProcessor(Node):
    def __init__(self):
        super().__init__('stereo_dnn_processor')

        # Parameters for stereo processing
        self.declare_parameter('disparity_range', [0.1, 100.0])
        self.declare_parameter('stereo_algorithm', 'sgbm')
        self.declare_parameter('tensor_padding', [0.0, 0.0, 0.0, 0.0])

        # Publishers and subscribers
        self.left_image_sub = self.create_subscription(
            Image, 'left/image_rect', self.left_image_callback, 10
        )
        self.right_image_sub = self.create_subscription(
            Image, 'right/image_rect', self.right_image_callback, 10
        )
        self.disparity_pub = self.create_publisher(
            DisparityImage, 'disparity', 10
        )
        self.depth_pub = self.create_publisher(
            Image, 'depth', 10
        )

        # Initialize stereo processing pipeline
        self.initialize_stereo_pipeline()

        self.get_logger().info('Stereo DNN Processor initialized')

    def initialize_stereo_pipeline(self):
        """Initialize the stereo processing pipeline"""
        # Configure stereo rectification
        self.rectification_params = {
            'alpha': 0.0,  # Full rectification
            'roi_left': None,
            'roi_right': None
        }

        # Configure disparity computation
        self.disparity_params = {
            'algorithm': self.get_parameter('stereo_algorithm').value,
            'min_disparity': 0,
            'num_disparities': 128,
            'block_size': 15,
            'disp12_max_diff': 1,
            'pre_filter_cap': 63,
            'uniqueness_ratio': 10,
            'speckle_window_size': 100,
            'speckle_range': 32
        }

        self.get_logger().info('Stereo pipeline initialized')

    def left_image_callback(self, msg):
        """Process left stereo image"""
        # This would be connected to the stereo processing pipeline
        # In practice, this node would be part of a larger stereo processing pipeline
        pass

    def right_image_callback(self, msg):
        """Process right stereo image"""
        # This would be connected to the stereo processing pipeline
        pass

    def process_stereo_pair(self, left_image, right_image):
        """Process stereo image pair to generate depth"""
        try:
            # Use Isaac ROS stereo processing
            # This would call the actual stereo processing functions
            # Implementation would depend on the specific stereo algorithm used
            disparity = self.compute_disparity(left_image, right_image)
            depth = self.convert_disparity_to_depth(disparity)

            return depth
        except Exception as e:
            self.get_logger().error(f'Error processing stereo pair: {e}')
            return None

    def compute_disparity(self, left_image, right_image):
        """Compute disparity map from stereo images"""
        # This would use Isaac ROS optimized stereo algorithms
        # For example, using CUDA-accelerated SGM (Semi-Global Matching)
        return None  # Placeholder

    def convert_disparity_to_depth(self, disparity):
        """Convert disparity to depth image"""
        # Using calibrated camera parameters
        # depth = focal_length * baseline / disparity
        return None  # Placeholder
```

### Isaac ROS Visual SLAM

Visual SLAM implementation with GPU acceleration:

```python
# Example: Isaac ROS Visual SLAM node
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, Imu
from geometry_msgs.msg import PoseStamped
from nav_msgs.msg import Odometry
from visualization_msgs.msg import MarkerArray
from std_msgs.msg import Header
from isaac_ros_visual_slam import VisualSlamNode

class IsaacVisualSLAMNode(Node):
    def __init__(self):
        super().__init__('isaac_visual_slam')

        # Parameters
        self.declare_parameter('enable_imu_fusion', True)
        self.declare_parameter('enable_debug_mode', False)
        self.declare_parameter('map_frame', 'map')
        self.declare_parameter('odom_frame', 'odom')
        self.declare_parameter('base_frame', 'base_link')

        # Publishers
        self.odom_pub = self.create_publisher(Odometry, 'visual_slam/odometry', 10)
        self.pose_pub = self.create_publisher(PoseStamped, 'visual_slam/pose', 10)
        self.map_pub = self.create_publisher(MarkerArray, 'visual_slam/map', 10)
        self.tf_broadcaster = self.create_publisher(tf2_msgs.msg.TFMessage, '/tf', 10)

        # Subscribers
        self.image_sub = self.create_subscription(
            Image, 'camera/image', self.image_callback, 10
        )
        self.imu_sub = self.create_subscription(
            Imu, 'imu', self.imu_callback, 10
        )

        # Initialize Visual SLAM system
        self.initialize_vslam_system()

        self.get_logger().info('Isaac Visual SLAM node initialized')

    def initialize_vslam_system(self):
        """Initialize the Visual SLAM system"""
        # Configure SLAM parameters
        self.slam_config = {
            'enable_imu_fusion': self.get_parameter('enable_imu_fusion').value,
            'enable_loop_closure': True,
            'enable_global_bundle_adjustment': True,
            'min_num_features': 100,
            'max_num_features': 1000,
            'tracking_rate_hz': 30.0,
            'mapping_rate_hz': 1.0
        }

        # Initialize feature detector and tracker
        self.feature_detector = self.initialize_feature_detector()
        self.pose_estimator = self.initialize_pose_estimator()
        self.map_builder = self.initialize_map_builder()

    def image_callback(self, msg):
        """Process incoming camera images for SLAM"""
        try:
            # Process image through Visual SLAM pipeline
            slam_result = self.process_image_for_slam(msg)

            if slam_result:
                # Publish odometry
                self.publish_odometry(slam_result)

                # Publish pose
                self.publish_pose(slam_result)

                # Update map if needed
                if slam_result.get('new_keyframe', False):
                    self.publish_map()

        except Exception as e:
            self.get_logger().error(f'Error in image processing: {e}')

    def imu_callback(self, msg):
        """Process IMU data for sensor fusion"""
        if self.slam_config['enable_imu_fusion']:
            try:
                # Integrate IMU data for better pose estimation
                self.integrate_imu_data(msg)
            except Exception as e:
                self.get_logger().error(f'Error processing IMU data: {e}')

    def process_image_for_slam(self, image_msg):
        """Process image through Visual SLAM pipeline"""
        # Extract features using GPU-accelerated feature detection
        features = self.extract_features_gpu(image_msg)

        # Track features across frames
        tracked_features = self.track_features(features)

        # Estimate pose using GPU-accelerated PnP solver
        pose_estimate = self.estimate_pose(tracked_features)

        # Build map using GPU-accelerated bundle adjustment
        map_update = self.update_map(features, pose_estimate)

        return {
            'pose': pose_estimate,
            'features': features,
            'map_update': map_update,
            'new_keyframe': len(features) > self.slam_config['min_num_features']
        }

    def extract_features_gpu(self, image_msg):
        """Extract features using GPU acceleration"""
        # This would use Isaac ROS optimized feature extraction
        # For example, using CUDA-accelerated ORB or FAST feature detection
        return []  # Placeholder

    def track_features(self, features):
        """Track features across image frames"""
        # This would use GPU-accelerated optical flow
        return []  # Placeholder

    def estimate_pose(self, tracked_features):
        """Estimate camera pose using tracked features"""
        # This would use GPU-accelerated PnP (Perspective-n-Point) solver
        return {}  # Placeholder

    def update_map(self, features, pose_estimate):
        """Update the map with new features and pose"""
        # This would use GPU-accelerated bundle adjustment
        return {}  # Placeholder

    def publish_odometry(self, slam_result):
        """Publish odometry results"""
        odom_msg = Odometry()
        odom_msg.header.stamp = self.get_clock().now().to_msg()
        odom_msg.header.frame_id = self.get_parameter('odom_frame').value
        odom_msg.child_frame_id = self.get_parameter('base_frame').value

        # Set pose from SLAM result
        if 'pose' in slam_result:
            pose_data = slam_result['pose']
            odom_msg.pose.pose.position.x = pose_data.get('x', 0.0)
            odom_msg.pose.pose.position.y = pose_data.get('y', 0.0)
            odom_msg.pose.pose.position.z = pose_data.get('z', 0.0)
            odom_msg.pose.pose.orientation.w = pose_data.get('qw', 1.0)
            odom_msg.pose.pose.orientation.x = pose_data.get('qx', 0.0)
            odom_msg.pose.pose.orientation.y = pose_data.get('qy', 0.0)
            odom_msg.pose.pose.orientation.z = pose_data.get('qz', 0.0)

        self.odom_pub.publish(odom_msg)

    def publish_pose(self, slam_result):
        """Publish pose results"""
        pose_msg = PoseStamped()
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.header.frame_id = self.get_parameter('map_frame').value

        if 'pose' in slam_result:
            pose_data = slam_result['pose']
            pose_msg.pose.position.x = pose_data.get('x', 0.0)
            pose_msg.pose.position.y = pose_data.get('y', 0.0)
            pose_msg.pose.position.z = pose_data.get('z', 0.0)
            pose_msg.pose.orientation.w = pose_data.get('qw', 1.0)
            pose_msg.pose.orientation.x = pose_data.get('qx', 0.0)
            pose_msg.pose.orientation.y = pose_data.get('qy', 0.0)
            pose_msg.pose.orientation.z = pose_data.get('qz', 0.0)

        self.pose_pub.publish(pose_msg)

    def integrate_imu_data(self, imu_msg):
        """Integrate IMU data for sensor fusion"""
        # Use IMU data to improve pose estimation
        # This would implement sensor fusion algorithms
        pass

    def publish_map(self):
        """Publish map visualization"""
        # Create marker array for map visualization
        marker_array = MarkerArray()
        # Add map points and features as markers
        # This would visualize the SLAM map
        self.map_pub.publish(marker_array)
```

### Isaac ROS AprilTag Detection

GPU-accelerated AprilTag detection:

```python
# Example: Isaac ROS AprilTag Detection node
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from geometry_msgs.msg import PoseArray, Point
from visualization_msgs.msg import MarkerArray, Marker
from std_msgs.msg import Header
from builtin_interfaces.msg import Time
from isaac_ros_apriltag import AprilTagNode

class IsaacAprilTagNode(Node):
    def __init__(self):
        super().__init__('isaac_apriltag_detector')

        # Parameters
        self.declare_parameter('family', 'tag36h11')
        self.declare_parameter('max_hamming', 0)
        self.declare_parameter('quad_decimate', 2.0)
        self.declare_parameter('quad_sigma', 0.0)
        self.declare_parameter('refine_edges', True)
        self.declare_parameter('decode_sharpening', 0.25)
        self.declare_parameter('tag_size', 0.166)  # Size in meters

        # Publishers
        self.detections_pub = self.create_publisher(PoseArray, 'apriltag_detections', 10)
        self.visualizations_pub = self.create_publisher(MarkerArray, 'apriltag_visualizations', 10)

        # Subscribers
        self.image_sub = self.create_subscription(
            Image, 'image_rect', self.image_callback, 10
        )

        # Initialize AprilTag detector
        self.initialize_apriltag_detector()

        self.get_logger().info('Isaac AprilTag detector initialized')

    def initialize_apriltag_detector(self):
        """Initialize the AprilTag detection system"""
        # Configure AprilTag parameters
        self.tag_config = {
            'family': self.get_parameter('family').value,
            'max_hamming': self.get_parameter('max_hamming').value,
            'quad_decimate': self.get_parameter('quad_decimate').value,
            'quad_sigma': self.get_parameter('quad_sigma').value,
            'refine_edges': self.get_parameter('refine_edges').value,
            'decode_sharpening': self.get_parameter('decode_sharpening').value,
            'tag_size': self.get_parameter('tag_size').value
        }

        # Initialize detector with GPU acceleration
        self.detector = self.create_gpu_accelerated_detector()

    def create_gpu_accelerated_detector(self):
        """Create GPU-accelerated AprilTag detector"""
        # This would create an Isaac ROS AprilTag detector with GPU acceleration
        # In practice, this would use the Isaac ROS AprilTag package
        class MockAprilTagDetector:
            def detect(self, image):
                return []  # Placeholder for GPU-accelerated detection

        return MockAprilTagDetector()

    def image_callback(self, msg):
        """Process image for AprilTag detection"""
        try:
            # Use Isaac ROS GPU-accelerated AprilTag detection
            detections = self.detect_apriltags(msg)

            # Publish detections
            if detections:
                self.publish_detections(detections, msg.header)

                # Publish visualizations
                self.publish_visualizations(detections, msg.header)

        except Exception as e:
            self.get_logger().error(f'Error in AprilTag detection: {e}')

    def detect_apriltags(self, image_msg):
        """Detect AprilTags in image using GPU acceleration"""
        # Process image through GPU-accelerated AprilTag detection
        # This would use Isaac ROS optimized AprilTag detection
        return self.detector.detect(image_msg)  # Placeholder

    def publish_detections(self, detections, header):
        """Publish AprilTag detection results"""
        pose_array = PoseArray()
        pose_array.header = header

        for detection in detections:
            pose = Pose()
            # Set position and orientation from detection
            pose.position.x = detection.get('x', 0.0)
            pose.position.y = detection.get('y', 0.0)
            pose.position.z = detection.get('z', 0.0)

            # Set orientation
            pose.orientation.w = detection.get('qw', 1.0)
            pose.orientation.x = detection.get('qx', 0.0)
            pose.orientation.y = detection.get('qy', 0.0)
            pose.orientation.z = detection.get('qz', 0.0)

            pose_array.poses.append(pose)

        self.detections_pub.publish(pose_array)

    def publish_visualizations(self, detections, header):
        """Publish AprilTag visualizations"""
        marker_array = MarkerArray()

        for i, detection in enumerate(detections):
            # Create marker for tag outline
            marker = Marker()
            marker.header = header
            marker.ns = "apriltags"
            marker.id = i
            marker.type = Marker.LINE_STRIP
            marker.action = Marker.ADD

            # Set tag outline points (square)
            marker.points = [
                Point(x=detection.get('x', 0.0) - 0.083, y=detection.get('y', 0.0) - 0.083, z=detection.get('z', 0.0)),
                Point(x=detection.get('x', 0.0) + 0.083, y=detection.get('y', 0.0) - 0.083, z=detection.get('z', 0.0)),
                Point(x=detection.get('x', 0.0) + 0.083, y=detection.get('y', 0.0) + 0.083, z=detection.get('z', 0.0)),
                Point(x=detection.get('x', 0.0) - 0.083, y=detection.get('y', 0.0) + 0.083, z=detection.get('z', 0.0)),
                Point(x=detection.get('x', 0.0) - 0.083, y=detection.get('y', 0.0) - 0.083, z=detection.get('z', 0.0))
            ]

            marker.scale.x = 0.01  # Line width
            marker.color.r = 1.0
            marker.color.g = 0.0
            marker.color.b = 0.0
            marker.color.a = 1.0

            marker_array.markers.append(marker)

        self.visualizations_pub.publish(marker_array)
```

## Integration with ROS 2 Systems

### Launch File Integration

```python
# launch/isaac_ros_gems.launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, SetEnvironmentVariable
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node, ComposableNodeContainer
from launch_ros.descriptions import ComposableNode
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time')
    enable_debug = LaunchConfiguration('enable_debug')
    camera_namespace = LaunchConfiguration('camera_namespace', default='camera')

    # Declare launch arguments
    declare_use_sim_time_arg = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation (Gazebo) clock if true'
    )

    declare_enable_debug_arg = DeclareLaunchArgument(
        'enable_debug',
        default_value='false',
        description='Enable debug output'
    )

    # Get package share directory
    pkg_share = get_package_share_directory('my_robot_package')

    # Isaac ROS Stereo DNN container
    stereo_dnn_container = ComposableNodeContainer(
        name='stereo_dnn_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        composable_node_descriptions=[
            ComposableNode(
                package='isaac_ros_stereo_image_proc',
                plugin='isaac_ros::stereo_image_proc::RectifyNode',
                name='stereo_rectify_node',
                parameters=[{
                    'alpha': 0.0,
                    'use_sim_time': use_sim_time
                }],
                remappings=[
                    ('left/image', [camera_namespace, '/left/image_raw']),
                    ('left/camera_info', [camera_namespace, '/left/camera_info']),
                    ('right/image', [camera_namespace, '/right/image_raw']),
                    ('right/camera_info', [camera_namespace, '/right/camera_info']),
                    ('left/image_rect', [camera_namespace, '/left/image_rect']),
                    ('right/image_rect', [camera_namespace, '/right/image_rect'])
                ]
            ),
            ComposableNode(
                package='isaac_ros_stereo_depth',
                plugin='isaac_ros::stereo_depth::StereoDepthNode',
                name='stereo_depth_node',
                parameters=[{
                    'disparity_range': [0.1, 100.0],
                    'stereo_algorithm': 'sgbm',
                    'tensor_padding': [0.0, 0.0, 0.0, 0.0],
                    'use_sim_time': use_sim_time
                }],
                remappings=[
                    ('left/image_rect', [camera_namespace, '/left/image_rect']),
                    ('right/image_rect', [camera_namespace, '/right/image_rect']),
                    ('left/camera_info', [camera_namespace, '/left/camera_info']),
                    ('right/camera_info', [camera_namespace, '/right/camera_info']),
                    ('disparity', 'disparity'),
                    ('depth', 'depth')
                ]
            )
        ],
        output='both'
    )

    # Isaac ROS Visual SLAM container
    visual_slam_container = ComposableNodeContainer(
        name='visual_slam_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        composable_node_descriptions=[
            ComposableNode(
                package='isaac_ros_visual_slam',
                plugin='isaac_ros::visual_slam::VisualSlamNode',
                name='visual_slam_node',
                parameters=[{
                    'enable_imu_fusion': True,
                    'enable_debug_mode': enable_debug,
                    'map_frame': 'map',
                    'odom_frame': 'odom',
                    'base_frame': 'base_link',
                    'use_sim_time': use_sim_time
                }],
                remappings=[
                    ('stereo_camera/left/image', [camera_namespace, '/left/image_rect']),
                    ('stereo_camera/right/image', [camera_namespace, '/right/image_rect']),
                    ('stereo_camera/left/camera_info', [camera_namespace, '/left/camera_info']),
                    ('stereo_camera/right/camera_info', [camera_namespace, '/right/camera_info']),
                    ('imu', '/imu/data'),
                    ('visual_slam/odometry', 'visual_slam/odometry'),
                    ('visual_slam/pose_graph/optimization_result', 'visual_slam/optimization_result')
                ]
            )
        ],
        output='both'
    )

    # Isaac ROS AprilTag container
    apriltag_container = ComposableNodeContainer(
        name='apriltag_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        composable_node_descriptions=[
            ComposableNode(
                package='isaac_ros_apriltag',
                plugin='isaac_ros::apriltag::AprilTagNode',
                name='apriltag_node',
                parameters=[{
                    'family': 'tag36h11',
                    'max_hamming': 0,
                    'quad_decimate': 2.0,
                    'tag_size': 0.166,
                    'use_sim_time': use_sim_time
                }],
                remappings=[
                    ('image', [camera_namespace, '/image_rect']),
                    ('camera_info', [camera_namespace, '/camera_info']),
                    ('detections', 'apriltag_detections')
                ]
            )
        ],
        output='both'
    )

    # Launch description
    ld = LaunchDescription()

    # Add environment variables
    ld.add_action(SetEnvironmentVariable('RCUTILS_LOGGING_BUFFERED_STREAM', '1'))

    # Add launch arguments
    ld.add_action(declare_use_sim_time_arg)
    ld.add_action(declare_enable_debug_arg)

    # Add containers
    ld.add_action(stereo_dnn_container)
    ld.add_action(visual_slam_container)
    ld.add_action(apriltag_container)

    return ld
```

### Parameter Configuration

```yaml
# config/isaac_ros_gems_params.yaml
/**:
  ros__parameters:
    # Stereo DNN Parameters
    stereo_dnn:
      enable_rectification: true
      rectification_alpha: 0.0
      stereo_algorithm: "sgbm"
      min_disparity: 0
      num_disparities: 128
      block_size: 15
      disp12_max_diff: 1
      pre_filter_cap: 63
      uniqueness_ratio: 10
      speckle_window_size: 100
      speckle_range: 32

    # Visual SLAM Parameters
    visual_slam:
      enable_imu_fusion: true
      enable_loop_closure: true
      enable_global_bundle_adjustment: true
      min_num_features: 100
      max_num_features: 1000
      tracking_rate_hz: 30.0
      mapping_rate_hz: 1.0
      map_frame: "map"
      odom_frame: "odom"
      base_frame: "base_link"

    # AprilTag Parameters
    apriltag:
      family: "tag36h11"
      max_hamming: 0
      quad_decimate: 2.0
      quad_sigma: 0.0
      refine_edges: true
      decode_sharpening: 0.25
      tag_size: 0.166
      max_tags: 100

    # General Parameters
    use_sim_time: false
    enable_debug: false
    camera_namespace: "camera"
```

## Performance Optimization

### GPU Memory Management

```python
# gpu_memory_optimizer.py
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float32
import pycuda.driver as cuda
import pycuda.autoinit
from pycuda.compiler import SourceModule
import numpy as np

class GPUMemoryOptimizer(Node):
    """
    Optimizes GPU memory usage for Isaac ROS GEMs
    """

    def __init__(self):
        super().__init__('gpu_memory_optimizer')

        # Parameters
        self.declare_parameter('memory_threshold', 0.8)
        self.declare_parameter('enable_optimization', True)
        self.declare_parameter('optimization_frequency', 1.0)

        self.memory_threshold = self.get_parameter('memory_threshold').value
        self.enable_optimization = self.get_parameter('enable_optimization').value
        self.optimization_frequency = self.get_parameter('optimization_frequency').value

        # Publishers
        self.gpu_usage_pub = self.create_publisher(Float32, '/gpu_memory_usage', 10)

        # Timer for monitoring GPU usage
        self.monitor_timer = self.create_timer(
            1.0 / self.optimization_frequency,
            self.monitor_gpu_usage
        )

        # Initialize CUDA context
        self.cuda_context = cuda.Device(0).make_context()

        self.get_logger().info('GPU Memory Optimizer initialized')

    def monitor_gpu_usage(self):
        """Monitor GPU memory usage and trigger optimizations if needed"""
        try:
            # Get GPU memory info
            free_mem, total_mem = cuda.mem_get_info()
            used_mem = total_mem - free_mem
            usage_percentage = used_mem / total_mem

            # Publish GPU usage
            usage_msg = Float32()
            usage_msg.data = float(usage_percentage)
            self.gpu_usage_pub.publish(usage_msg)

            # Log usage
            self.get_logger().debug(f'GPU Memory Usage: {usage_percentage:.2%} '
                                  f'({used_mem/1024/1024:.1f}MB / {total_mem/1024/1024:.1f}MB)')

            # Trigger optimization if threshold exceeded
            if self.enable_optimization and usage_percentage > self.memory_threshold:
                self.optimize_gpu_memory()

        except Exception as e:
            self.get_logger().error(f'Error monitoring GPU memory: {e}')

    def optimize_gpu_memory(self):
        """Optimize GPU memory usage"""
        self.get_logger().warn('High GPU memory usage detected, optimizing...')

        # Clear CUDA context
        cuda.Context.pop()

        # Recreate context
        self.cuda_context = cuda.Device(0).make_context()

        # Trigger garbage collection for GPU memory
        self.cleanup_gpu_memory()

        self.get_logger().info('GPU memory optimization completed')

    def cleanup_gpu_memory(self):
        """Clean up GPU memory allocations"""
        # This would include specific cleanup procedures for each GEM
        # that may be holding GPU memory
        pass

    def destroy_node(self):
        """Clean up GPU resources when node is destroyed"""
        if hasattr(self, 'cuda_context'):
            self.cuda_context.pop()
        super().destroy_node()
```

### TensorRT Integration

```python
# tensorrt_integrator.py
import rclpy
from rclpy.node import Node
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
import numpy as np
from sensor_msgs.msg import Image
from cv_bridge import CvBridge

class TensorRTIntegrator(Node):
    """
    Integrates TensorRT optimization with Isaac ROS GEMs
    """

    def __init__(self):
        super().__init__('tensorrt_integrator')

        # Parameters
        self.declare_parameter('engine_path', '')
        self.declare_parameter('input_shape', [1, 3, 224, 224])
        self.declare_parameter('output_shape', [1, 1000])

        self.engine_path = self.get_parameter('engine_path').value
        self.input_shape = self.get_parameter('input_shape').value
        self.output_shape = self.get_parameter('output_shape').value

        # Initialize TensorRT
        self.trt_logger = trt.Logger(trt.Logger.WARNING)
        self.engine = self.load_tensorrt_engine()
        self.context = self.engine.create_execution_context() if self.engine else None

        # CUDA memory buffers
        self.host_inputs = []
        self.host_outputs = []
        self.cuda_inputs = []
        self.cuda_outputs = []
        self.bindings = []
        self.stream = cuda.Stream() if self.engine else None

        # Initialize memory buffers
        if self.engine:
            self.initialize_cuda_buffers()

        # Image processing
        self.cv_bridge = CvBridge()

        self.get_logger().info('TensorRT Integrator initialized')

    def load_tensorrt_engine(self):
        """Load TensorRT engine from file"""
        if not self.engine_path:
            self.get_logger().warn('No TensorRT engine path specified')
            return None

        try:
            with open(self.engine_path, 'rb') as f:
                engine_data = f.read()
            runtime = trt.Runtime(self.trt_logger)
            engine = runtime.deserialize_cuda_engine(engine_data)
            return engine
        except Exception as e:
            self.get_logger().error(f'Failed to load TensorRT engine: {e}')
            return None

    def initialize_cuda_buffers(self):
        """Initialize CUDA memory buffers for TensorRT inference"""
        for binding in self.engine:
            size = trt.volume(self.engine.get_binding_shape(binding)) * self.engine.max_batch_size
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))
            # Allocate host and device buffers
            host_mem = cuda.pagelocked_empty(size, dtype)
            cuda_mem = cuda.mem_alloc(host_mem.nbytes)
            # Append the device buffer to the bindings list
            self.bindings.append(int(cuda_mem))
            # Append to the appropriate list
            if self.engine.binding_is_input(binding):
                self.host_inputs.append(host_mem)
                self.cuda_inputs.append(cuda_mem)
            else:
                self.host_outputs.append(host_mem)
                self.cuda_outputs.append(cuda_mem)

    def preprocess_image(self, image_msg):
        """Preprocess image for TensorRT inference"""
        try:
            # Convert ROS image to OpenCV
            cv_image = self.cv_bridge.imgmsg_to_cv2(image_msg, desired_encoding='bgr8')

            # Resize image to match model input
            import cv2
            resized_image = cv2.resize(cv_image, (self.input_shape[3], self.input_shape[2]))

            # Normalize and convert to float
            normalized_image = resized_image.astype(np.float32) / 255.0

            # Transpose from HWC to CHW
            chw_image = np.transpose(normalized_image, (2, 0, 1))

            # Add batch dimension
            batched_image = np.expand_dims(chw_image, axis=0)

            return batched_image
        except Exception as e:
            self.get_logger().error(f'Error preprocessing image: {e}')
            return None

    def run_tensorrt_inference(self, input_data):
        """Run inference using TensorRT engine"""
        if not self.engine or not self.context:
            return None

        try:
            # Copy input to host buffer
            np.copyto(self.host_inputs[0], input_data.ravel())

            # Transfer input data to GPU
            cuda.memcpy_htod_async(self.cuda_inputs[0], self.host_inputs[0], self.stream)

            # Run inference
            self.context.execute_async_v2(bindings=self.bindings, stream_handle=self.stream.handle)

            # Transfer predictions back from GPU
            cuda.memcpy_dtoh_async(self.host_outputs[0], self.cuda_outputs[0], self.stream)

            # Synchronize threads
            self.stream.synchronize()

            # Get output
            output = self.host_outputs[0]

            return output
        except Exception as e:
            self.get_logger().error(f'Error running TensorRT inference: {e}')
            return None
```

## Practical Implementation Examples

### Example 1: Autonomous Navigation with GEMs

```python
# autonomous_navigation_with_gems.py
#!/usr/bin/env python3
"""
Autonomous Navigation Example using Isaac ROS GEMs
Demonstrates integration of multiple GEMs for navigation
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan, Image, Imu
from geometry_msgs.msg import Twist, PoseStamped
from nav_msgs.msg import Odometry
from std_msgs.msg import String, Bool
from geometry_msgs.msg import Point
import numpy as np
import math
from collections import deque

class AutonomousNavigationWithGEMs(Node):
    """
    Autonomous navigation system using Isaac ROS GEMs for enhanced perception
    """

    def __init__(self):
        super().__init__('autonomous_navigation_gems')

        # Parameters
        self.declare_parameter('safety_distance', 0.5)
        self.declare_parameter('navigation_speed', 0.3)
        self.declare_parameter('rotation_speed', 0.5)
        self.declare_parameter('enable_visual_navigation', True)

        self.safety_distance = self.get_parameter('safety_distance').value
        self.nav_speed = self.get_parameter('navigation_speed').value
        self.rot_speed = self.get_parameter('rotation_speed').value
        self.enable_visual_nav = self.get_parameter('enable_visual_navigation').value

        # Publishers
        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.goal_pub = self.create_publisher(PoseStamped, '/goal_pose', 10)
        self.status_pub = self.create_publisher(String, '/navigation_status', 10)

        # Subscribers
        self.scan_sub = self.create_subscription(
            LaserScan, '/scan', self.scan_callback, 10
        )
        self.odom_sub = self.create_subscription(
            Odometry, '/odom', self.odom_callback, 10
        )
        self.imu_sub = self.create_subscription(
            Imu, '/imu/data', self.imu_callback, 10
        )

        # If visual navigation is enabled, subscribe to visual SLAM
        if self.enable_visual_nav:
            self.visual_pose_sub = self.create_subscription(
                PoseStamped, '/visual_slam/pose', self.visual_pose_callback, 10
            )

        # Navigation state
        self.current_pose = None
        self.visual_pose = None
        self.odom_pose = None
        self.imu_data = None
        self.scan_data = None

        # Navigation state machine
        self.navigation_state = 'IDLE'  # IDLE, NAVIGATING, AVOIDING, GOAL_REACHED
        self.goal_pose = None
        self.path = deque()

        # Timer for navigation control
        self.nav_timer = self.create_timer(0.1, self.navigation_control)

        self.get_logger().info('Autonomous Navigation with GEMs initialized')

    def scan_callback(self, msg):
        """Process laser scan data from sensors"""
        self.scan_data = msg

    def odom_callback(self, msg):
        """Process odometry data"""
        self.odom_pose = msg.pose.pose
        self.current_pose = msg.pose.pose  # Use odometry as primary source if no visual SLAM

    def imu_callback(self, msg):
        """Process IMU data for orientation"""
        self.imu_data = msg

    def visual_pose_callback(self, msg):
        """Process visual SLAM pose if available"""
        self.visual_pose = msg.pose
        if self.enable_visual_nav:
            self.current_pose = msg.pose  # Use visual SLAM as primary pose source

    def navigation_control(self):
        """Main navigation control loop"""
        if not self.current_pose:
            self.get_logger().debug('Waiting for pose data...')
            return

        # Determine navigation state
        if self.navigation_state == 'IDLE':
            self.handle_idle_state()
        elif self.navigation_state == 'NAVIGATING':
            self.handle_navigating_state()
        elif self.navigation_state == 'AVOIDING':
            self.handle_avoiding_state()
        elif self.navigation_state == 'GOAL_REACHED':
            self.handle_goal_reached_state()

    def handle_idle_state(self):
        """Handle idle navigation state"""
        status_msg = String()
        status_msg.data = 'IDLE'
        self.status_pub.publish(status_msg)

        # Check if we have a goal to pursue
        if self.goal_pose:
            self.navigation_state = 'NAVIGATING'

    def handle_navigating_state(self):
        """Handle navigation state"""
        if not self.goal_pose:
            self.navigation_state = 'IDLE'
            return

        # Check for obstacles
        if self.scan_data and self.has_obstacle_ahead():
            self.navigation_state = 'AVOIDING'
            self.get_logger().warn('Obstacle detected, switching to avoidance mode')
            return

        # Calculate direction to goal
        goal_direction = self.calculate_direction_to_goal()

        # Create navigation command
        cmd = Twist()
        cmd.linear.x = self.nav_speed
        cmd.angular.z = goal_direction * 0.5  # Proportional control

        # Publish command
        self.cmd_vel_pub.publish(cmd)

        # Check if goal is reached
        if self.is_goal_reached():
            self.navigation_state = 'GOAL_REACHED'
            self.get_logger().info('Goal reached!')

        # Update status
        status_msg = String()
        status_msg.data = f'NAVIGATING - Dist to goal: {self.distance_to_goal():.2f}m'
        self.status_pub.publish(status_msg)

    def handle_avoiding_state(self):
        """Handle obstacle avoidance state"""
        if not self.scan_data:
            return

        # Simple wall-following algorithm
        cmd = Twist()

        # Check left and right sides for clearance
        left_clear = self.check_side_clearance('left')
        right_clear = self.check_side_clearance('right')

        if left_clear and not right_clear:
            # Turn left to follow wall
            cmd.angular.z = self.rot_speed
            cmd.linear.x = self.nav_speed * 0.5
        elif right_clear and not left_clear:
            # Turn right to follow wall
            cmd.angular.z = -self.rot_speed
            cmd.linear.x = self.nav_speed * 0.5
        elif left_clear and right_clear:
            # Both sides clear, turn toward goal
            goal_direction = self.calculate_direction_to_goal()
            cmd.angular.z = goal_direction * 0.5
            cmd.linear.x = self.nav_speed
        else:
            # Neither side clear, rotate in place
            cmd.angular.z = self.rot_speed
            cmd.linear.x = 0.0

        # Publish avoidance command
        self.cmd_vel_pub.publish(cmd)

        # Check if obstacle is cleared
        if not self.has_obstacle_ahead() and self.navigation_state == 'AVOIDING':
            self.navigation_state = 'NAVIGATING'
            self.get_logger().info('Obstacle avoided, resuming navigation')

        # Update status
        status_msg = String()
        status_msg.data = 'AVOIDING'
        self.status_pub.publish(status_msg)

    def handle_goal_reached_state(self):
        """Handle goal reached state"""
        # Stop the robot
        cmd = Twist()
        cmd.linear.x = 0.0
        cmd.angular.z = 0.0
        self.cmd_vel_pub.publish(cmd)

        status_msg = String()
        status_msg.data = 'GOAL_REACHED'
        self.status_pub.publish(status_msg)

        # Stay in this state until new goal is set
        pass

    def has_obstacle_ahead(self) -> bool:
        """Check if there's an obstacle ahead based on laser scan"""
        if not self.scan_data:
            return False

        # Get ranges in front of robot (e.g., +/- 30 degrees)
        front_start = int(len(self.scan_data.ranges) / 2 - len(self.scan_data.ranges) / 12)  # -30 degrees
        front_end = int(len(self.scan_data.ranges) / 2 + len(self.scan_data.ranges) / 12)   # +30 degrees

        front_ranges = self.scan_data.ranges[front_start:front_end]

        # Filter out invalid ranges
        valid_ranges = [r for r in front_ranges if self.scan_data.range_min < r < self.scan_data.range_max]

        if not valid_ranges:
            return False

        # Check if any valid range is within safety distance
        min_range = min(valid_ranges)
        return min_range < self.safety_distance

    def check_side_clearance(self, side: str) -> bool:
        """Check if left or right side is clear of obstacles"""
        if not self.scan_data:
            return False

        if side == 'left':
            # Check left side ranges (e.g., 30-60 degrees)
            start_idx = int(len(self.scan_data.ranges) * 0.25)  # 30 degrees
            end_idx = int(len(self.scan_data.ranges) * 0.33)    # 60 degrees
        else:  # right
            # Check right side ranges (e.g., -60 to -30 degrees)
            start_idx = int(len(self.scan_data.ranges) * 0.67)  # -60 degrees
            end_idx = int(len(self.scan_data.ranges) * 0.75)    # -30 degrees

        side_ranges = self.scan_data.ranges[start_idx:end_idx]
        valid_ranges = [r for r in side_ranges if self.scan_data.range_min < r < self.scan_data.range_max]

        if not valid_ranges:
            return False

        return min(valid_ranges) > self.safety_distance

    def calculate_direction_to_goal(self) -> float:
        """Calculate angular direction to goal"""
        if not self.current_pose or not self.goal_pose:
            return 0.0

        # Calculate current robot angle from orientation
        current_yaw = self.quaternion_to_yaw(self.current_pose.orientation)

        # Calculate angle to goal
        dx = self.goal_pose.position.x - self.current_pose.position.x
        dy = self.goal_pose.position.y - self.current_pose.position.y
        goal_yaw = math.atan2(dy, dx)

        # Calculate difference
        angle_diff = goal_yaw - current_yaw

        # Normalize to [-pi, pi]
        while angle_diff > math.pi:
            angle_diff -= 2 * math.pi
        while angle_diff < -math.pi:
            angle_diff += 2 * math.pi

        return angle_diff

    def distance_to_goal(self) -> float:
        """Calculate distance to goal"""
        if not self.current_pose or not self.goal_pose:
            return float('inf')

        dx = self.goal_pose.position.x - self.current_pose.position.x
        dy = self.goal_pose.position.y - self.current_pose.position.y
        return math.sqrt(dx*dx + dy*dy)

    def is_goal_reached(self) -> bool:
        """Check if goal has been reached"""
        if not self.goal_pose:
            return False

        distance = self.distance_to_goal()
        return distance < 0.2  # 20cm tolerance

    def quaternion_to_yaw(self, quat) -> float:
        """Convert quaternion to yaw angle"""
        siny_cosp = 2 * (quat.w * quat.z + quat.x * quat.y)
        cosy_cosp = 1 - 2 * (quat.y * quat.y + quat.z * quat.z)
        return math.atan2(siny_cosp, cosy_cosp)

    def set_goal(self, x: float, y: float, z: float = 0.0):
        """Set navigation goal"""
        self.goal_pose = PoseStamped()
        self.goal_pose.pose.position.x = x
        self.goal_pose.pose.position.y = y
        self.goal_pose.pose.position.z = z
        self.navigation_state = 'NAVIGATING'

        self.get_logger().info(f'Setting goal to ({x}, {y})')


def main(args=None):
    rclpy.init(args=args)

    try:
        navigator = AutonomousNavigationWithGEMs()

        # Example: Set a goal after initialization
        # This would typically be set by a higher-level planner
        navigator.set_goal(2.0, 2.0)

        rclpy.spin(navigator)

    except KeyboardInterrupt:
        pass
    finally:
        if 'navigator' in locals():
            navigator.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Advanced Integration Patterns

### Multi-Sensor Fusion Node

```python
# multi_sensor_fusion.py
#!/usr/bin/env python3
"""
Multi-Sensor Fusion Node using Isaac ROS GEMs
Integrates data from multiple sensors using GPU acceleration
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan, Image, Imu, PointCloud2
from nav_msgs.msg import Odometry
from geometry_msgs.msg import PoseWithCovarianceStamped, TwistWithCovarianceStamped
from std_msgs.msg import Header
from visualization_msgs.msg import MarkerArray
import numpy as np
from scipy.spatial.transform import Rotation as R
from collections import deque
import time

class MultiSensorFusion(Node):
    """
    Fuses data from multiple sensors using Isaac ROS GEMs for enhanced perception
    """

    def __init__(self):
        super().__init__('multi_sensor_fusion')

        # Parameters
        self.declare_parameter('fusion_rate', 30.0)
        self.declare_parameter('sensor_buffer_size', 50)
        self.declare_parameter('enable_visual_slam', True)
        self.declare_parameter('enable_lidar_odometry', True)

        self.fusion_rate = self.get_parameter('fusion_rate').value
        self.sensor_buffer_size = self.get_parameter('sensor_buffer_size').value
        self.enable_visual_slam = self.get_parameter('enable_visual_slam').value
        self.enable_lidar_odometry = self.get_parameter('enable_lidar_odometry').value

        # Publishers
        self.fused_pose_pub = self.create_publisher(
            PoseWithCovarianceStamped, '/fused_pose', 10
        )
        self.fused_twist_pub = self.create_publisher(
            TwistWithCovarianceStamped, '/fused_twist', 10
        )
        self.pointcloud_pub = self.create_publisher(
            PointCloud2, '/fused_pointcloud', 10
        )
        self.fusion_status_pub = self.create_publisher(
            MarkerArray, '/fusion_markers', 10
        )

        # Subscribers
        self.lidar_sub = self.create_subscription(
            LaserScan, '/scan', self.lidar_callback, 10
        )
        self.imu_sub = self.create_subscription(
            Imu, '/imu/data', self.imu_callback, 10
        )
        self.odom_sub = self.create_subscription(
            Odometry, '/odom', self.odom_callback, 10
        )
        self.camera_sub = self.create_subscription(
            Image, '/camera/image_rect', self.camera_callback, 10
        )

        if self.enable_visual_slam:
            self.visual_pose_sub = self.create_subscription(
                PoseWithCovarianceStamped, '/visual_slam/pose', self.visual_pose_callback, 10
            )

        # Data buffers
        self.lidar_buffer = deque(maxlen=self.sensor_buffer_size)
        self.imu_buffer = deque(maxlen=self.sensor_buffer_size)
        self.odom_buffer = deque(maxlen=self.sensor_buffer_size)
        self.camera_buffer = deque(maxlen=10)  # Images don't need large buffer
        self.visual_pose_buffer = deque(maxlen=self.sensor_buffer_size)

        # Fusion algorithm
        self.pose_fusion = PoseFusionAlgorithm()
        self.pointcloud_fusion = PointCloudFusionAlgorithm()

        # Timer for fusion
        self.fusion_timer = self.create_timer(1.0/self.fusion_rate, self.fusion_callback)

        self.get_logger().info('Multi-Sensor Fusion Node initialized')

    def lidar_callback(self, msg):
        """Process LiDAR data"""
        self.lidar_buffer.append({
            'timestamp': self.get_clock().now(),
            'data': msg
        })

    def imu_callback(self, msg):
        """Process IMU data"""
        self.imu_buffer.append({
            'timestamp': self.get_clock().now(),
            'data': msg
        })

    def odom_callback(self, msg):
        """Process odometry data"""
        self.odom_buffer.append({
            'timestamp': self.get_clock().now(),
            'data': msg
        })

    def camera_callback(self, msg):
        """Process camera data"""
        self.camera_buffer.append({
            'timestamp': self.get_clock().now(),
            'data': msg
        })

    def visual_pose_callback(self, msg):
        """Process visual SLAM pose data"""
        if self.enable_visual_slam:
            self.visual_pose_buffer.append({
                'timestamp': self.get_clock().now(),
                'data': msg
            })

    def fusion_callback(self):
        """Main fusion callback"""
        # Get the most recent data from each sensor
        lidar_data = self.get_latest_from_buffer(self.lidar_buffer)
        imu_data = self.get_latest_from_buffer(self.imu_buffer)
        odom_data = self.get_latest_from_buffer(self.odom_buffer)
        visual_pose_data = self.get_latest_from_buffer(self.visual_pose_buffer) if self.enable_visual_slam else None

        # Perform sensor fusion
        if lidar_data and imu_data and odom_data:
            fused_result = self.pose_fusion.fuse_poses(
                lidar_data, imu_data, odom_data, visual_pose_data
            )

            if fused_result:
                # Publish fused pose
                self.publish_fused_pose(fused_result)

                # Publish fused twist (velocity)
                self.publish_fused_twist(fused_result)

        # Process point cloud fusion if available
        camera_data = self.get_latest_from_buffer(self.camera_buffer)
        if camera_data and lidar_data:
            fused_pointcloud = self.pointcloud_fusion.fuse_camera_lidar(
                camera_data['data'], lidar_data['data']
            )
            if fused_pointcloud:
                self.pointcloud_pub.publish(fused_pointcloud)

    def get_latest_from_buffer(self, buffer):
        """Get the latest data from a buffer"""
        if buffer:
            return buffer[-1]
        return None

    def publish_fused_pose(self, fused_result):
        """Publish fused pose estimate"""
        pose_msg = PoseWithCovarianceStamped()
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.header.frame_id = 'map'

        # Set pose from fusion result
        pose_msg.pose.pose = fused_result['pose']
        pose_msg.pose.covariance = fused_result['covariance']

        self.fused_pose_pub.publish(pose_msg)

    def publish_fused_twist(self, fused_result):
        """Publish fused twist (velocity) estimate"""
        twist_msg = TwistWithCovarianceStamped()
        twist_msg.header.stamp = self.get_clock().now().to_msg()
        twist_msg.header.frame_id = 'base_link'

        # Set twist from fusion result
        twist_msg.twist.twist = fused_result['twist']
        twist_msg.twist.covariance = fused_result['velocity_covariance']

        self.fused_twist_pub.publish(twist_msg)


class PoseFusionAlgorithm:
    """
    Advanced pose fusion algorithm using Kalman filtering and sensor weighting
    """

    def __init__(self):
        # Initialize fusion parameters
        self.process_noise = np.diag([0.1, 0.1, 0.05, 0.1, 0.1, 0.05])  # [x, y, theta, vx, vy, omega]
        self.measurement_noise = {
            'lidar': np.diag([0.05, 0.05, 0.02]),
            'imu': np.diag([0.01, 0.01, 0.01, 0.05, 0.05, 0.05]),  # [acc, gyro]
            'odom': np.diag([0.02, 0.02, 0.01, 0.05, 0.05, 0.02]),  # [pose, twist]
            'visual': np.diag([0.03, 0.03, 0.01])
        }

        # State: [x, y, theta, vx, vy, omega]
        self.state = np.zeros(6)
        self.covariance = np.eye(6) * 1000  # High initial uncertainty

    def fuse_poses(self, lidar_data, imu_data, odom_data, visual_data=None):
        """
        Fuse pose estimates from multiple sensors
        """
        # Prediction step using IMU data
        dt = self.calculate_time_difference(imu_data, odom_data)
        self.predict_state(imu_data['data'], dt)

        # Update with odometry data (most reliable for position)
        self.update_with_odometry(odom_data['data'])

        # Update with LiDAR data (for position correction)
        if lidar_data:
            self.update_with_lidar(lidar_data['data'])

        # Update with visual data if available
        if visual_data:
            self.update_with_visual(visual_data['data'])

        # Prepare result
        result = {
            'pose': self.extract_pose_from_state(),
            'twist': self.extract_twist_from_state(),
            'covariance': self.covariance.flatten().tolist(),
            'velocity_covariance': self.extract_velocity_covariance()
        }

        return result

    def predict_state(self, imu_msg, dt):
        """Predict state based on IMU measurements"""
        if dt <= 0:
            return

        # Extract angular velocity from IMU
        omega_x = imu_msg.angular_velocity.x
        omega_y = imu_msg.angular_velocity.y
        omega_z = imu_msg.angular_velocity.z

        # Extract linear acceleration from IMU
        acc_x = imu_msg.linear_acceleration.x
        acc_y = imu_msg.linear_acceleration.y
        acc_z = imu_msg.linear_acceleration.z

        # Update state based on IMU measurements
        theta = self.state[2]
        self.state[0] += self.state[3] * dt + 0.5 * acc_x * dt * dt  # x = x + vx*dt + 0.5*ax*dt^2
        self.state[1] += self.state[4] * dt + 0.5 * acc_y * dt * dt  # y = y + vy*dt + 0.5*ay*dt^2
        self.state[2] += self.state[5] * dt + 0.5 * omega_z * dt * dt  # theta = theta + omega*dt + 0.5*alpha*dt^2
        self.state[3] += acc_x * dt  # vx = vx + ax*dt
        self.state[4] += acc_y * dt  # vy = vy + ay*dt
        self.state[5] += omega_z * dt  # omega = omega + alpha*dt

        # Update covariance (simplified)
        F = self.compute_jacobian(dt)
        self.covariance = F @ self.covariance @ F.T + self.process_noise

    def compute_jacobian(self, dt):
        """Compute Jacobian for prediction step"""
        theta = self.state[2]
        F = np.eye(6)
        F[0, 3] = dt  # dx/dvx
        F[0, 2] = -self.state[3] * dt * np.sin(theta)  # dx/dtheta
        F[1, 4] = dt  # dy/dvy
        F[1, 2] = self.state[4] * dt * np.cos(theta)   # dy/dtheta
        F[2, 5] = dt  # dtheta/domega
        F[3, 5] = dt  # dvx/domega (simplified)
        F[4, 5] = dt  # dvy/domega (simplified)
        return F

    def update_with_odometry(self, odom_msg):
        """Update state with odometry measurements"""
        # Measurement vector [x, y, theta, vx, vy, omega]
        z = np.array([
            odom_msg.pose.pose.position.x,
            odom_msg.pose.pose.position.y,
            self.quaternion_to_yaw(odom_msg.pose.pose.orientation),
            odom_msg.twist.twist.linear.x,
            odom_msg.twist.twist.linear.y,
            odom_msg.twist.twist.angular.z
        ])

        # Measurement matrix (direct observation of all states)
        H = np.eye(6)

        # Innovation
        y = z - self.state

        # Normalize angle difference
        y[2] = self.normalize_angle(y[2])

        # Innovation covariance
        R = self.measurement_noise['odom']
        S = H @ self.covariance @ H.T + R

        # Kalman gain
        K = self.covariance @ H.T @ np.linalg.inv(S)

        # Update state
        self.state = self.state + K @ y

        # Normalize angle
        self.state[2] = self.normalize_angle(self.state[2])

        # Update covariance
        I = np.eye(len(self.state))
        self.covariance = (I - K @ H) @ self.covariance

    def update_with_lidar(self, lidar_msg):
        """Update state with LiDAR-based position estimates"""
        # This would involve using LiDAR scan matching to estimate position changes
        # For simplicity, we'll use a simplified approach
        pass

    def update_with_visual(self, visual_msg):
        """Update state with visual SLAM estimates"""
        # Use visual pose estimate to correct position
        z = np.array([
            visual_msg.pose.pose.position.x,
            visual_msg.pose.pose.position.y,
            self.quaternion_to_yaw(visual_msg.pose.pose.orientation)
        ])

        # Measurement matrix for position only
        H = np.zeros((3, 6))
        H[0, 0] = 1  # x
        H[1, 1] = 1  # y
        H[2, 2] = 1  # theta

        # Innovation
        y = z - self.state[:3]

        # Normalize angle difference
        y[2] = self.normalize_angle(y[2])

        # Innovation covariance
        R = self.measurement_noise['visual']
        S = H @ self.covariance[:3, :3] + R

        # Kalman gain
        K = np.zeros((6, 3))
        K[:3, :] = self.covariance[:3, :3] @ H.T @ np.linalg.inv(S)

        # Update state
        self.state = self.state + K @ y

        # Normalize angle
        self.state[2] = self.normalize_angle(self.state[2])

        # Update covariance
        I = np.eye(len(self.state))
        self.covariance = (I - K @ H) @ self.covariance

    def quaternion_to_yaw(self, quat):
        """Convert quaternion to yaw angle"""
        siny_cosp = 2 * (quat.w * quat.z + quat.x * quat.y)
        cosy_cosp = 1 - 2 * (quat.y * quat.y + quat.z * quat.z)
        return math.atan2(siny_cosp, cosy_cosp)

    def normalize_angle(self, angle):
        """Normalize angle to [-pi, pi]"""
        while angle > math.pi:
            angle -= 2 * math.pi
        while angle < -math.pi:
            angle += 2 * math.pi
        return angle

    def extract_pose_from_state(self):
        """Extract pose from state vector"""
        from geometry_msgs.msg import Pose
        pose = Pose()
        pose.position.x = float(self.state[0])
        pose.position.y = float(self.state[1])
        pose.position.z = 0.0  # Assuming 2D navigation

        # Convert angle to quaternion
        yaw = self.state[2]
        cy = math.cos(yaw * 0.5)
        sy = math.sin(yaw * 0.5)
        pose.orientation.z = sy
        pose.orientation.w = cy

        return pose

    def extract_twist_from_state(self):
        """Extract twist from state vector"""
        from geometry_msgs.msg import Twist
        twist = Twist()
        twist.linear.x = float(self.state[3])
        twist.linear.y = float(self.state[4])
        twist.linear.z = 0.0
        twist.angular.x = 0.0
        twist.angular.y = 0.0
        twist.angular.z = float(self.state[5])

        return twist

    def calculate_time_difference(self, data1, data2):
        """Calculate time difference between two data points"""
        try:
            t1 = data1['timestamp'].nanoseconds / 1e9
            t2 = data2['timestamp'].nanoseconds / 1e9
            return abs(t1 - t2)
        except:
            return 0.1  # Default to 100ms if timestamps unavailable


class PointCloudFusionAlgorithm:
    """
    Algorithm for fusing camera and LiDAR data into colored point clouds
    """

    def __init__(self):
        self.camera_intrinsics = None
        self.extrinsics = None  # Camera-LiDAR transformation

    def fuse_camera_lidar(self, camera_msg, lidar_msg):
        """
        Fuse camera image and LiDAR scan into a colored point cloud
        """
        # This would implement the projection of camera pixels onto LiDAR points
        # and assign colors to the point cloud
        # Implementation would use Isaac ROS tools for this fusion
        pass


def main(args=None):
    rclpy.init(args=args)

    try:
        fusion_node = MultiSensorFusion()
        rclpy.spin(fusion_node)

    except KeyboardInterrupt:
        pass
    finally:
        if 'fusion_node' in locals():
            fusion_node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Performance Optimization and Best Practices

### Optimized Launch Configuration

```python
# launch/optimized_gems_launch.py
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, SetEnvironmentVariable, TimerAction
from launch.conditions import IfCondition
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node, ComposableNodeContainer
from launch_ros.descriptions import ComposableNode
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Launch configuration variables
    use_sim_time = LaunchConfiguration('use_sim_time')
    enable_debug = LaunchConfiguration('enable_debug')
    gpu_device_id = LaunchConfiguration('gpu_device_id', default='0')
    tensorrt_precision = LaunchConfiguration('tensorrt_precision', default='fp16')

    # Declare launch arguments
    declare_use_sim_time_arg = DeclareLaunchArgument(
        'use_sim_time',
        default_value='false',
        description='Use simulation (Gazebo) clock if true'
    )

    declare_enable_debug_arg = DeclareLaunchArgument(
        'enable_debug',
        default_value='false',
        description='Enable debug output'
    )

    declare_gpu_device_arg = DeclareLaunchArgument(
        'gpu_device_id',
        default_value='0',
        description='GPU device ID to use'
    )

    declare_tensorrt_precision_arg = DeclareLaunchArgument(
        'tensorrt_precision',
        default_value='fp16',
        description='TensorRT precision mode (fp32, fp16, int8)'
    )

    # Set environment variables for optimization
    set_cuda_device = SetEnvironmentVariable(
        name='CUDA_VISIBLE_DEVICES',
        value=gpu_device_id
    )

    set_trt_precision = SetEnvironmentVariable(
        name='TRT_MINIMUM_SEGMENT_SIZE',
        value='3'
    )

    # Optimized Isaac ROS containers with GPU acceleration
    perception_container = ComposableNodeContainer(
        name='perception_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        parameters=[{'use_sim_time': use_sim_time}],
        composable_node_descriptions=[
            # Stereo rectification with GPU acceleration
            ComposableNode(
                package='isaac_ros_stereo_image_proc',
                plugin='isaac_ros::stereo_image_proc::RectifyNode',
                name='stereo_rectify_node',
                parameters=[{
                    'alpha': 0.0,
                    'use_sim_time': use_sim_time,
                    'enable_decimation_filter': True,
                    'decimation_factor': 2
                }],
                remappings=[
                    ('left/image', '/camera/left/image_raw'),
                    ('right/image', '/camera/right/image_raw'),
                    ('left/camera_info', '/camera/left/camera_info'),
                    ('right/camera_info', '/camera/right/camera_info')
                ]
            ),

            # Stereo depth with TensorRT optimization
            ComposableNode(
                package='isaac_ros_stereo_depth',
                plugin='isaac_ros::stereo_depth::StereoDepthNode',
                name='stereo_depth_node',
                parameters=[{
                    'disparity_range': [0.1, 100.0],
                    'stereo_algorithm': 'sgbm',
                    'tensor_padding': [0.0, 0.0, 0.0, 0.0],
                    'use_sim_time': use_sim_time,
                    'trt_precision': tensorrt_precision,
                    'trt_max_workspace_size_bytes': 2147483648,  # 2GB
                    'enable_fill': True
                }],
                remappings=[
                    ('left/image_rect', '/camera/left/image_rect'),
                    ('right/image_rect', '/camera/right/image_rect'),
                    ('depth', '/camera/depth')
                ]
            )
        ],
        output='both'
    )

    # Visual SLAM container with optimization
    slam_container = ComposableNodeContainer(
        name='slam_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        parameters=[{'use_sim_time': use_sim_time}],
        composable_node_descriptions=[
            ComposableNode(
                package='isaac_ros_visual_slam',
                plugin='isaac_ros::visual_slam::VisualSlamNode',
                name='visual_slam_node',
                parameters=[{
                    'enable_imu_fusion': True,
                    'enable_debug_mode': enable_debug,
                    'map_frame': 'map',
                    'odom_frame': 'odom',
                    'base_frame': 'base_link',
                    'use_sim_time': use_sim_time,
                    'enable_localization': False,
                    'use_odometry_input': True,
                    'rectified_images': True,
                    'image_jitter_threshold_ms': 5.0
                }],
                remappings=[
                    ('stereo_camera/left/image', '/camera/left/image_rect'),
                    ('stereo_camera/right/image', '/camera/right/image_rect'),
                    ('stereo_camera/left/camera_info', '/camera/left/camera_info'),
                    ('stereo_camera/right/camera_info', '/camera/right/camera_info'),
                    ('imu', '/imu/data'),
                    ('visual_slam/odometry', '/visual_slam/odometry'),
                    ('visual_slam/pose_graph/optimization_result', '/visual_slam/optimization_result')
                ]
            )
        ],
        output='both'
    )

    # AprilTag detection with optimization
    apriltag_container = ComposableNodeContainer(
        name='apriltag_container',
        namespace='',
        package='rclcpp_components',
        executable='component_container_mt',
        parameters=[{'use_sim_time': use_sim_time}],
        composable_node_descriptions=[
            ComposableNode(
                package='isaac_ros_apriltag',
                plugin='isaac_ros::apriltag::AprilTagNode',
                name='apriltag_node',
                parameters=[{
                    'family': 'tag36h11',
                    'max_hamming': 0,
                    'quad_decimate': 2.0,
                    'tag_size': 0.166,
                    'use_sim_time': use_sim_time,
                    'num_threads': 2
                }],
                remappings=[
                    ('image', '/camera/image_rect'),
                    ('camera_info', '/camera/camera_info'),
                    ('detections', '/apriltag/detections')
                ]
            )
        ],
        output='both'
    )

    # Multi-sensor fusion node
    fusion_node = Node(
        package='my_robot_package',
        executable='multi_sensor_fusion',
        name='multi_sensor_fusion',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'fusion_rate': 30.0},
            {'enable_visual_slam': True}
        ],
        remappings=[
            ('/fused_pose', '/fused_pose'),
            ('/fused_twist', '/fused_twist')
        ],
        output='screen'
    )

    # Launch description
    ld = LaunchDescription()

    # Add environment variables
    ld.add_action(set_cuda_device)
    ld.add_action(set_trt_precision)

    # Add launch arguments
    ld.add_action(declare_use_sim_time_arg)
    ld.add_action(declare_enable_debug_arg)
    ld.add_action(declare_gpu_device_arg)
    ld.add_action(declare_tensorrt_precision_arg)

    # Add nodes
    ld.add_action(perception_container)
    ld.add_action(slam_container)
    ld.add_action(apriltag_container)
    ld.add_action(fusion_node)

    return ld
```

## Troubleshooting and Debugging

### Common Issues and Solutions

```python
# troubleshooting_guide.py
class IsaacGEMSTroubleshootingGuide:
    """
    Troubleshooting guide for Isaac ROS GEMs
    """

    def __init__(self):
        self.common_issues = {
            'gpu_not_detected': {
                'symptoms': ['CUDA error', 'GPU not found', 'TensorRT not initialized'],
                'causes': ['Driver not installed', 'CUDA not installed', 'GPU not supported'],
                'solutions': [
                    'Install NVIDIA drivers: sudo apt install nvidia-driver-XXX',
                    'Install CUDA toolkit: sudo apt install nvidia-cuda-toolkit',
                    'Verify GPU compatibility: nvidia-smi',
                    'Check Isaac ROS compatibility with your GPU'
                ]
            },
            'poor_performance': {
                'symptoms': ['Low FPS', 'High latency', 'GPU utilization low'],
                'causes': ['CPU bottleneck', 'Memory issues', 'Incorrect parameters'],
                'solutions': [
                    'Use composable nodes to reduce communication overhead',
                    'Optimize parameters for your hardware',
                    'Use TensorRT optimization',
                    'Reduce input resolution if possible'
                ]
            },
            'inaccurate_results': {
                'symptoms': ['Wrong detections', 'Poor pose estimates', 'Drifting'],
                'causes': ['Calibration issues', 'Parameter misconfiguration', 'Sensor problems'],
                'solutions': [
                    'Verify camera calibration',
                    'Check extrinsic calibration between sensors',
                    'Adjust GEM parameters for your specific setup',
                    'Validate sensor data quality'
                ]
            }
        }

    def diagnose_issue(self, error_message):
        """
        Diagnose an issue based on error message
        """
        for issue_type, info in self.common_issues.items():
            for symptom in info['symptoms']:
                if symptom.lower() in error_message.lower():
                    return {
                        'issue_type': issue_type,
                        'diagnosis': f'Likely issue: {issue_type}',
                        'solutions': info['solutions'],
                        'causes': info['causes']
                    }

        return {'issue_type': 'unknown', 'diagnosis': 'Issue not recognized in common problems'}

    def get_performance_tips(self):
        """
        Get performance optimization tips
        """
        return [
            'Use composable nodes to minimize inter-process communication',
            'Enable TensorRT for neural network acceleration',
            'Use appropriate input resolutions for your application',
            'Monitor GPU memory usage and optimize accordingly',
            'Configure parameters based on your specific hardware',
            'Use multi-threaded executors for better performance',
            'Consider decimation filters to reduce data rate',
            'Profile your application to identify bottlenecks'
        ]


def create_troubleshooting_node():
    """
    Create a troubleshooting helper node
    """
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import String

    class TroubleshootingHelper(Node):
        def __init__(self):
            super().__init__('troubleshooting_helper')

            self.diagnostic_sub = self.create_subscription(
                String, '/diagnostics', self.diagnostic_callback, 10
            )
            self.issue_publisher = self.create_publisher(
                String, '/troubleshooting_advice', 10
            )

            self.troubleshooter = IsaacGEMSTroubleshootingGuide()

        def diagnostic_callback(self, msg):
            diagnosis = self.troubleshooter.diagnose_issue(msg.data)
            advice_msg = String()
            advice_msg.data = f"Diagnosis: {diagnosis['diagnosis']}\nSolutions: {', '.join(diagnosis.get('solutions', []))}"
            self.issue_publisher.publish(advice_msg)

    return TroubleshootingHelper()
```

## Summary and Best Practices

### Key Takeaways

This module covered comprehensive integration of Isaac ROS GEMs with ROS 2 systems:

1. **Understanding GEMs**: Different types of GPU-accelerated modules and their applications
2. **Installation and Setup**: Proper installation and configuration of Isaac ROS packages
3. **Node Integration**: Creating nodes that utilize GEMs for enhanced performance
4. **Launch Configuration**: Optimizing launch files for GEM integration
5. **Performance Optimization**: Techniques for maximizing GPU utilization
6. **Sensor Fusion**: Combining multiple GEMs for comprehensive perception
7. **Troubleshooting**: Common issues and solutions when working with GEMs

### Best Practices for GEM Integration

1. **Architecture Design**: Use composable nodes to minimize communication overhead
2. **Resource Management**: Monitor GPU memory and compute usage
3. **Parameter Tuning**: Optimize parameters for your specific hardware and use case
4. **Error Handling**: Implement robust error handling for GPU-related failures
5. **Testing**: Validate performance improvements and accuracy with real-world data
6. **Documentation**: Document GPU requirements and parameter settings
7. **Scalability**: Design systems that can scale with additional GEMs

### Performance Considerations

- **GPU Memory**: Monitor and optimize GPU memory usage
- **TensorRT**: Use appropriate precision modes (FP16 for speed, FP32 for accuracy)
- **Input Resolution**: Balance input resolution with performance requirements
- **Communication**: Use shared memory or zero-copy where possible
- **Threading**: Leverage multi-threaded containers for parallel processing
- **Decimation**: Use filters to reduce data rate when appropriate

By following these practices and leveraging the Isaac ROS GEMs effectively, you can create high-performance robotic applications that take full advantage of GPU acceleration for perception, navigation, and control tasks.