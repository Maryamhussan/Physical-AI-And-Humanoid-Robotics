---
title: Sensor Simulation in Gazebo
sidebar_position: 4
---

# Sensor Simulation in Gazebo

## Introduction to Sensor Simulation

Sensor simulation is a critical aspect of robotics development, enabling robots to perceive their environment in a virtual setting. Gazebo provides realistic simulation of various sensor types, including cameras, LiDAR, IMU, GPS, and more. This module covers the implementation and configuration of different sensor types in Gazebo simulation environments.

### Why Simulate Sensors?

Sensor simulation provides several key benefits:

1. **Safe Testing**: Test perception algorithms without hardware risk
2. **Cost Reduction**: No expensive sensors needed for initial development
3. **Repeatability**: Consistent sensor data across multiple runs
4. **Controlled Environments**: Create specific scenarios for testing
5. **Performance Analysis**: Evaluate sensor performance under various conditions
6. **Algorithm Development**: Develop and refine perception algorithms

## Camera Sensors

### Basic Camera Setup

Camera sensors in Gazebo simulate RGB cameras that publish image data to ROS topics:

```xml
<!-- Camera sensor in URDF with Gazebo plugin -->
<gazebo reference="camera_link">
  <sensor name="camera" type="camera">
    <always_on>true</always_on>
    <update_rate>30</update_rate>
    <camera name="head">
      <horizontal_fov>1.047</horizontal_fov>  <!-- 60 degrees in radians -->
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.1</near>
        <far>100</far>
      </clip>
      <noise>
        <type>gaussian</type>
        <mean>0.0</mean>
        <stddev>0.007</stddev>
      </noise>
    </camera>
    <plugin name="camera_controller" filename="libgazebo_ros_camera.so">
      <frame_name>camera_optical_frame</frame_name>
      <topic_name>image_raw</topic_name>
      <hack_baseline>0.07</hack_baseline>
      <distortion_k1>0.0</distortion_k1>
      <distortion_k2>0.0</distortion_k2>
      <distortion_k3>0.0</distortion_k3>
      <distortion_t1>0.0</distortion_t1>
      <distortion_t2>0.0</distortion_t2>
    </plugin>
  </sensor>
</gazebo>
```

### Camera Sensor Parameters

Key parameters for camera sensors include:

- **horizontal_fov**: Horizontal field of view in radians
- **image**: Resolution and format settings
- **clip**: Near and far clipping distances
- **noise**: Noise model parameters
- **update_rate**: How often the sensor publishes data

### Advanced Camera Configurations

```xml
<!-- Stereo camera setup -->
<gazebo reference="left_camera_link">
  <sensor name="stereo_left" type="camera">
    <pose>0 0 0 0 0 0</pose>
    <camera name="left">
      <horizontal_fov>1.047</horizontal_fov>
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.1</near>
        <far>10</far>
      </clip>
    </camera>
    <plugin name="stereo_left_controller" filename="libgazebo_ros_camera.so">
      <frame_name>left_camera_optical_frame</frame_name>
      <topic_name>left/image_raw</topic_name>
      <camera_info_topic_name>left/camera_info</camera_info_topic_name>
    </plugin>
  </sensor>
</gazebo>

<gazebo reference="right_camera_link">
  <sensor name="stereo_right" type="camera">
    <pose>0 0.12 0 0 0 0</pose>  <!-- 12cm baseline -->
    <camera name="right">
      <horizontal_fov>1.047</horizontal_fov>
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.1</near>
        <far>10</far>
      </clip>
    </camera>
    <plugin name="stereo_right_controller" filename="libgazebo_ros_camera.so">
      <frame_name>right_camera_optical_frame</frame_name>
      <topic_name>right/image_raw</topic_name>
      <camera_info_topic_name>right/camera_info</camera_info_topic_name>
    </plugin>
  </sensor>
</gazebo>
```

## LiDAR Sensors

### 2D LiDAR (Planar Scanner)

```xml
<!-- 2D LiDAR sensor -->
<gazebo reference="lidar_link">
  <sensor name="lidar" type="ray">
    <always_on>true</always_on>
    <update_rate>10</update_rate>
    <ray>
      <scan>
        <horizontal>
          <samples>360</samples>
          <resolution>1</resolution>
          <min_angle>-3.14159</min_angle>  <!-- -π radians -->
          <max_angle>3.14159</max_angle>    <!-- π radians -->
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
      <output_type>sensor_msgs/LaserScan</output_type>
    </plugin>
  </sensor>
</gazebo>
```

### 3D LiDAR (Velodyne-style)

```xml
<!-- 3D LiDAR sensor -->
<gazebo reference="velodyne_link">
  <sensor name="velodyne" type="ray">
    <always_on>true</always_on>
    <update_rate>10</update_rate>
    <ray>
      <scan>
        <horizontal>
          <samples>512</samples>
          <resolution>1</resolution>
          <min_angle>-3.14159</min_angle>
          <max_angle>3.14159</max_angle>
        </horizontal>
        <vertical>
          <samples>16</samples>
          <resolution>1</resolution>
          <min_angle>-0.2618</min_angle>  <!-- -15 degrees -->
          <max_angle>0.2618</max_angle>   <!-- 15 degrees -->
        </vertical>
      </scan>
      <range>
        <min>0.5</min>
        <max>100.0</max>
        <resolution>0.01</resolution>
      </range>
    </ray>
    <plugin name="velodyne_controller" filename="libgazebo_ros_gpu_laser.so">
      <topicName>points</topicName>
      <frameName>velodyne</frameName>
    </plugin>
  </sensor>
</gazebo>
```

## IMU Sensors

### Basic IMU Configuration

```xml
<!-- IMU sensor -->
<gazebo reference="imu_link">
  <sensor name="imu_sensor" type="imu">
    <always_on>true</always_on>
    <update_rate>100</update_rate>
    <imu>
      <angular_velocity>
        <x>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>2e-4</stddev>
            <bias_mean>0.0000075</bias_mean>
            <bias_stddev>0.0000008</bias_stddev>
          </noise>
        </x>
        <y>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>2e-4</stddev>
            <bias_mean>0.0000075</bias_mean>
            <bias_stddev>0.0000008</bias_stddev>
          </noise>
        </y>
        <z>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>2e-4</stddev>
            <bias_mean>0.0000075</bias_mean>
            <bias_stddev>0.0000008</bias_stddev>
          </noise>
        </z>
      </angular_velocity>
      <linear_acceleration>
        <x>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>1.7e-2</stddev>
            <bias_mean>0.1</bias_mean>
            <bias_stddev>0.001</bias_stddev>
          </noise>
        </x>
        <y>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>1.7e-2</stddev>
            <bias_mean>0.1</bias_mean>
            <bias_stddev>0.001</bias_stddev>
          </noise>
        </y>
        <z>
          <noise type="gaussian">
            <mean>0.0</mean>
            <stddev>1.7e-2</stddev>
            <bias_mean>0.1</bias_mean>
            <bias_stddev>0.001</bias_stddev>
          </noise>
        </z>
      </linear_acceleration>
    </imu>
    <plugin name="imu_plugin" filename="libgazebo_ros_imu.so">
      <topicName>imu</topicName>
      <bodyName>imu_link</bodyName>
      <frameName>imu_link</frameName>
      <serviceName>imu_service</serviceName>
      <gaussianNoise>0.01</gaussianNoise>
      <updateRate>100.0</updateRate>
    </plugin>
  </sensor>
</gazebo>
```

## GPS Sensors

### GPS Configuration

```xml
<!-- GPS sensor -->
<gazebo reference="gps_link">
  <sensor name="gps_sensor" type="gps">
    <always_on>true</always_on>
    <update_rate>10</update_rate>
    <plugin name="gps_plugin" filename="libgazebo_ros_gps.so">
      <topicName>fix</topicName>
      <frameName>gps_link</frameName>
      <updateRate>10.0</updateRate>
      <gaussianNoise>0.1</gaussianNoise>
    </plugin>
  </sensor>
```

## Depth Cameras and 3D Sensors

### Depth Camera Setup

```xml
<!-- Depth camera (RGB-D sensor like Kinect) -->
<gazebo reference="depth_camera_link">
  <sensor name="depth_camera" type="depth">
    <always_on>true</always_on>
    <update_rate>20</update_rate>
    <camera name="depth_head">
      <horizontal_fov>1.047</horizontal_fov>
      <image>
        <width>640</width>
        <height>480</height>
        <format>R8G8B8</format>
      </image>
      <clip>
        <near>0.1</near>
        <far>10</far>
      </clip>
      <noise>
        <type>gaussian</type>
        <mean>0.0</mean>
        <stddev>0.007</stddev>
      </noise>
    </camera>
    <plugin name="depth_camera_controller" filename="libgazebo_ros_openni_kinect.so">
      <baseline>0.2</baseline>
      <always_on>true</always_on>
      <update_rate>20.0</update_rate>
      <camera_name>camera</camera_name>
      <image_topic_name>rgb/image_raw</image_topic_name>
      <depth_image_topic_name>depth/image_raw</depth_image_topic_name>
      <point_cloud_topic_name>depth/points</point_cloud_topic_name>
      <camera_info_topic_name>rgb/camera_info</camera_info_topic_name>
      <frame_name>depth_camera_optical_frame</frame_name>
      <point_cloud_cutoff>0.5</point_cloud_cutoff>
      <point_cloud_cutoff_max>3.0</point_cloud_cutoff_max>
      <distortion_k1>0.0</distortion_k1>
      <distortion_k2>0.0</distortion_k2>
      <distortion_k3>0.0</distortion_k3>
      <distortion_t1>0.0</distortion_t1>
      <distortion_t2>0.0</distortion_t2>
      <CxPrime>0</CxPrime>
      <Cx>0</Cx>
      <Cy>0</Cy>
      <focal_length>0</focal_length>
    </plugin>
  </sensor>
</gazebo>
```

## Multi-Sensor Integration

### Complete Robot with Multiple Sensors

```xml
<?xml version="1.0"?>
<robot name="sensor_robot" xmlns:xacro="http://www.ros.org/wiki/xacro">
  <!-- Robot base -->
  <link name="base_link">
    <visual>
      <geometry>
        <cylinder radius="0.2" length="0.15"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.2" length="0.15"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="5.0"/>
      <inertia ixx="0.1" ixy="0.0" ixz="0.0" iyy="0.1" iyz="0.0" izz="0.2"/>
    </inertial>
  </link>

  <!-- Camera link -->
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
    <inertial>
      <mass value="0.1"/>
      <inertia ixx="0.0001" ixy="0.0" ixz="0.0" iyy="0.0001" iyz="0.0" izz="0.0001"/>
    </inertial>
  </link>

  <joint name="camera_joint" type="fixed">
    <parent link="base_link"/>
    <child link="camera_link"/>
    <origin xyz="0.15 0 0.1" rpy="0 0 0"/>
  </joint>

  <!-- LiDAR link -->
  <link name="lidar_link">
    <visual>
      <geometry>
        <cylinder radius="0.05" length="0.05"/>
      </geometry>
    </visual>
    <collision>
      <geometry>
        <cylinder radius="0.05" length="0.05"/>
      </geometry>
    </collision>
    <inertial>
      <mass value="0.2"/>
      <inertia ixx="0.0001" ixy="0.0" ixz="0.0" iyy="0.0001" iyz="0.0" izz="0.0002"/>
    </inertial>
  </link>

  <joint name="lidar_joint" type="fixed">
    <parent link="base_link"/>
    <child link="lidar_link"/>
    <origin xyz="0.15 0 0.15" rpy="0 0 0"/>
  </joint>

  <!-- IMU link -->
  <link name="imu_link">
    <inertial>
      <mass value="0.01"/>
      <inertia ixx="0.0001" ixy="0.0" ixz="0.0" iyy="0.0001" iyz="0.0" izz="0.0001"/>
    </inertial>
  </link>

  <joint name="imu_joint" type="fixed">
    <parent link="base_link"/>
    <child link="imu_link"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
  </joint>

  <!-- Wheels for movement -->
  <link name="wheel_left">
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
      <mass value="0.5"/>
      <inertia ixx="0.00125" ixy="0.0" ixz="0.0" iyy="0.00125" iyz="0.0" izz="0.0025"/>
    </inertial>
  </link>

  <link name="wheel_right">
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

  <!-- Gazebo sensor plugins -->
  <gazebo reference="base_link">
    <material>Gazebo/Blue</material>
  </gazebo>

  <gazebo reference="camera_link">
    <sensor name="camera" type="camera">
      <always_on>true</always_on>
      <update_rate>30</update_rate>
      <camera name="head">
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
        <topic_name>camera/image_raw</topic_name>
      </plugin>
    </sensor>
  </gazebo>

  <gazebo reference="lidar_link">
    <sensor name="lidar" type="ray">
      <always_on>true</always_on>
      <update_rate>10</update_rate>
      <ray>
        <scan>
          <horizontal>
            <samples>360</samples>
            <resolution>1</resolution>
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
        <output_type>sensor_msgs/LaserScan</output_type>
      </plugin>
    </sensor>
  </gazebo>

  <gazebo reference="imu_link">
    <sensor name="imu_sensor" type="imu">
      <always_on>true</always_on>
      <update_rate>100</update_rate>
      <imu>
        <angular_velocity>
          <x>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>2e-4</stddev>
            </noise>
          </x>
          <y>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>2e-4</stddev>
            </noise>
          </y>
          <z>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>2e-4</stddev>
            </noise>
          </z>
        </angular_velocity>
        <linear_acceleration>
          <x>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>1.7e-2</stddev>
            </noise>
          </x>
          <y>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>1.7e-2</stddev>
            </noise>
          </y>
          <z>
            <noise type="gaussian">
              <mean>0.0</mean>
              <stddev>1.7e-2</stddev>
            </noise>
          </z>
        </linear_acceleration>
      </imu>
      <plugin name="imu_plugin" filename="libgazebo_ros_imu.so">
        <topicName>imu</topicName>
        <bodyName>imu_link</bodyName>
        <frameName>imu_link</frameName>
      </plugin>
    </sensor>
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

## Sensor Data Processing

### Processing Sensor Data in ROS

```python
#!/usr/bin/env python3
"""
Sensor Data Processing Node
Demonstrates how to process data from multiple simulated sensors
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, LaserScan, Imu
from cv_bridge import CvBridge
import cv2
import numpy as np

class SensorProcessor(Node):
    def __init__(self):
        super().__init__('sensor_processor')

        # Create subscriptions for different sensor types
        self.image_sub = self.create_subscription(
            Image,
            'camera/image_raw',
            self.image_callback,
            10
        )

        self.lidar_sub = self.create_subscription(
            LaserScan,
            'scan',
            self.lidar_callback,
            10
        )

        self.imu_sub = self.create_subscription(
            Imu,
            'imu',
            self.imu_callback,
            10
        )

        # CV Bridge for image processing
        self.bridge = CvBridge()

        # Sensor data storage
        self.latest_image = None
        self.latest_lidar = None
        self.latest_imu = None

        # Timer for processing combined data
        self.process_timer = self.create_timer(0.1, self.process_sensor_data)

        self.get_logger().info('Sensor Processor Node Initialized')

    def image_callback(self, msg):
        """Process incoming camera data"""
        try:
            # Convert ROS Image to OpenCV format
            cv_image = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
            self.latest_image = cv_image

            # Simple image processing example
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)

            # Log some basic image info
            height, width = cv_image.shape[:2]
            self.get_logger().debug(f'Image received: {width}x{height}')

        except Exception as e:
            self.get_logger().error(f'Error processing image: {e}')

    def lidar_callback(self, msg):
        """Process incoming LiDAR data"""
        # Store the latest LiDAR scan
        self.latest_lidar = msg

        # Analyze the scan for obstacles
        ranges = np.array(msg.ranges)
        valid_ranges = ranges[(ranges > msg.range_min) & (ranges < msg.range_max)]

        if len(valid_ranges) > 0:
            min_distance = np.min(valid_ranges)
            self.get_logger().debug(f'Min obstacle distance: {min_distance:.2f}m')

    def imu_callback(self, msg):
        """Process incoming IMU data"""
        self.latest_imu = msg

        # Extract orientation (simplified)
        orientation = msg.orientation
        self.get_logger().debug(f'IMU orientation: ({orientation.x:.2f}, {orientation.y:.2f}, {orientation.z:.2f}, {orientation.w:.2f})')

    def process_sensor_data(self):
        """Process combined sensor data"""
        if self.latest_image is not None:
            # Process image data
            cv2.putText(self.latest_image, 'Camera Active', (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            # Display processed image (optional)
            cv2.imshow('Camera View', self.latest_image)
            cv2.waitKey(1)

        if self.latest_lidar is not None:
            # Process LiDAR data for navigation
            ranges = np.array(self.latest_lidar.ranges)
            front_ranges = ranges[150:210]  # Front 60 degrees
            front_ranges = front_ranges[(front_ranges > self.latest_lidar.range_min) &
                                       (front_ranges < self.latest_lidar.range_max)]

            if len(front_ranges) > 0:
                min_front = np.min(front_ranges)
                if min_front < 1.0:  # Less than 1 meter to obstacle
                    self.get_logger().warn('Obstacle ahead! Distance: {:.2f}m'.format(min_front))

    def destroy_node(self):
        """Cleanup when node is destroyed"""
        cv2.destroyAllWindows()
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)

    processor = SensorProcessor()

    try:
        rclpy.spin(processor)
    except KeyboardInterrupt:
        pass
    finally:
        processor.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

## Sensor Calibration and Validation

### Sensor Accuracy Considerations

When simulating sensors, it's important to consider:

1. **Noise Models**: Real sensors have noise characteristics
2. **Bias and Drift**: Sensors may have systematic errors
3. **Resolution Limits**: Sensors have finite precision
4. **Environmental Factors**: Lighting, weather, etc. affect sensors

### Adding Noise Models

```xml
<!-- Example with realistic noise for camera -->
<sensor name="noisy_camera" type="camera">
  <camera>
    <noise>
      <type>gaussian</type>
      <mean>0.0</mean>
      <stddev>0.01</stddev>  <!-- 1% noise level -->
    </noise>
  </camera>
</sensor>

<!-- Example with realistic noise for LiDAR -->
<sensor name="noisy_lidar" type="ray">
  <ray>
    <range>
      <noise>
        <type>gaussian</type>
        <mean>0.0</mean>
        <stddev>0.02</stddev>  <!-- 2cm standard deviation -->
      </noise>
    </range>
  </ray>
</sensor>
```

## Sensor Fusion Concepts

### Combining Multiple Sensors

Sensor fusion combines data from multiple sensors to improve perception:

```python
#!/usr/bin/env python3
"""
Basic Sensor Fusion Example
Combines data from camera, LiDAR, and IMU
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, LaserScan, Imu
from geometry_msgs.msg import Twist
import numpy as np
from cv_bridge import CvBridge

class SensorFusionNode(Node):
    def __init__(self):
        super().__init__('sensor_fusion')

        # Subscriptions
        self.image_sub = self.create_subscription(Image, 'camera/image_raw', self.image_callback, 10)
        self.lidar_sub = self.create_subscription(LaserScan, 'scan', self.lidar_callback, 10)
        self.imu_sub = self.create_subscription(Imu, 'imu', self.imu_callback, 10)

        # Publisher for fused decisions
        self.cmd_pub = self.create_publisher(Twist, 'cmd_vel', 10)

        # Data storage
        self.bridge = CvBridge()
        self.latest_data = {
            'image': None,
            'lidar': None,
            'imu': None,
            'timestamp': None
        }

        # Fusion timer
        self.fusion_timer = self.create_timer(0.1, self.fuse_sensors)

        self.get_logger().info('Sensor Fusion Node Initialized')

    def image_callback(self, msg):
        """Handle camera data"""
        self.latest_data['image'] = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
        self.latest_data['timestamp'] = self.get_clock().now()

    def lidar_callback(self, msg):
        """Handle LiDAR data"""
        self.latest_data['lidar'] = msg

    def imu_callback(self, msg):
        """Handle IMU data"""
        self.latest_data['imu'] = msg

    def fuse_sensors(self):
        """Combine sensor data for decision making"""
        if not all(self.latest_data[key] is not None for key in ['image', 'lidar', 'imu']):
            return  # Wait for all sensors to be ready

        # Example fusion logic:
        # 1. Check LiDAR for obstacles
        lidar_obstacle = self.check_lidar_obstacles()

        # 2. Use camera for object recognition
        image_objects = self.process_camera_image()

        # 3. Use IMU for orientation
        imu_orientation = self.get_imu_orientation()

        # 4. Make fused decision
        cmd = self.make_fusion_decision(lidar_obstacle, image_objects, imu_orientation)

        # 5. Publish command
        self.cmd_pub.publish(cmd)

    def check_lidar_obstacles(self):
        """Check LiDAR for obstacles in front"""
        lidar = self.latest_data['lidar']
        front_ranges = lidar.ranges[150:210]  # Front 60 degrees
        front_ranges = [r for r in front_ranges if lidar.range_min < r < lidar.range_max]

        if front_ranges:
            min_distance = min(front_ranges)
            return min_distance < 1.0  # Obstacle within 1 meter
        return False

    def process_camera_image(self):
        """Simple image processing for object detection"""
        image = self.latest_data['image']
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # Apply threshold to detect bright objects
        _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)

        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Return number of bright objects detected
        return len([c for c in contours if cv2.contourArea(c) > 100])

    def get_imu_orientation(self):
        """Extract orientation from IMU"""
        imu = self.latest_data['imu']
        # Simplified orientation extraction
        return {
            'roll': imu.orientation.x,
            'pitch': imu.orientation.y,
            'yaw': imu.orientation.z
        }

    def make_fusion_decision(self, lidar_obstacle, image_objects, imu_orientation):
        """Make navigation decision based on fused sensor data"""
        cmd = Twist()

        if lidar_obstacle:
            # Stop if obstacle detected
            cmd.linear.x = 0.0
            cmd.angular.z = 0.5  # Turn right to avoid
            self.get_logger().warn('Obstacle detected - turning')
        elif image_objects > 0:
            # Slow down when objects detected in camera
            cmd.linear.x = 0.2
            cmd.angular.z = 0.0
            self.get_logger().info(f'Objects detected: {image_objects}')
        else:
            # Move forward if clear
            cmd.linear.x = 0.5
            cmd.angular.z = 0.0

        return cmd

def main(args=None):
    rclpy.init(args=args)

    fusion_node = SensorFusionNode()

    try:
        rclpy.spin(fusion_node)
    except KeyboardInterrupt:
        pass
    finally:
        fusion_node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

## Practical Lab: Multi-Sensor Robot Navigation

### Lab Objective

Create a robot that uses multiple sensors to navigate an environment safely.

### Steps

1. **Create a robot model** with camera, LiDAR, and IMU sensors
2. **Implement sensor processing** for each sensor type
3. **Create a sensor fusion algorithm** that combines sensor data
4. **Test navigation** in a simulated environment with obstacles

### Implementation Considerations

- **Timing**: Ensure sensors are synchronized
- **Coordinate frames**: Maintain proper TF relationships
- **Data validation**: Check for sensor failures
- **Performance**: Optimize processing for real-time operation

## Troubleshooting Common Sensor Issues

### Camera Issues

1. **No image data**: Check camera plugin configuration and topic names
2. **Distorted images**: Verify camera parameters and distortion coefficients
3. **Low frame rate**: Check update_rate and resolution settings

### LiDAR Issues

1. **Empty scans**: Verify ray sensor configuration
2. **Incorrect ranges**: Check min/max range settings
3. **Low resolution**: Increase samples parameter

### IMU Issues

1. **Drifting values**: Check noise parameters and biases
2. **Incorrect orientation**: Verify sensor orientation in URDF
3. **High noise**: Adjust noise parameters for realism

## Best Practices

1. **Use realistic noise models** to match real sensor characteristics
2. **Validate sensor data** before using in algorithms
3. **Consider sensor limitations** when designing algorithms
4. **Implement sensor health checks** to detect failures
5. **Document sensor parameters** for reproducible results
6. **Test with various environments** to ensure robustness

## Summary

This module covered sensor simulation in Gazebo, including:

- Camera sensors (2D, stereo, depth)
- LiDAR sensors (2D, 3D)
- IMU and GPS sensors
- Multi-sensor integration
- Sensor data processing in ROS
- Sensor fusion concepts
- Troubleshooting common issues
- Best practices for sensor simulation

Proper sensor simulation is crucial for developing robust perception and navigation algorithms that can transition successfully from simulation to real-world deployment.