---
title: Python Development with ROS 2
sidebar_position: 3
---

# Python Development with ROS 2

## Overview

Python is one of the most popular languages for ROS 2 development due to its simplicity, extensive libraries, and strong support for robotics applications. This module will guide you through comprehensive Python development practices with ROS 2.

## Setting Up Your Development Environment

### Prerequisites

Before starting ROS 2 Python development, ensure you have:

1. ROS 2 installed (Humble Hawksbill or Jazzy Jalisco recommended)
2. Python 3.8 or higher
3. pip package manager
4. A suitable IDE (VS Code with ROS extension recommended)

### Creating a ROS 2 Python Package

```bash
# Source your ROS 2 installation
source /opt/ros/humble/setup.bash  # or your ROS distro

# Create a new workspace
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src

# Create a new Python package
ros2 pkg create --build-type ament_python my_robot_pkg --dependencies rclpy std_msgs geometry_msgs sensor_msgs
```

### Package Structure

A typical ROS 2 Python package looks like this:

```
my_robot_pkg/
├── my_robot_pkg/
│   ├── __init__.py
│   ├── publisher_member_function.py
│   ├── subscriber_member_function.py
│   └── talker.py
├── test/
│   └── test_copyright.py
├── package.xml
├── setup.cfg
├── setup.py
└── README.md
```

## Basic ROS 2 Python Concepts

The following diagram illustrates the ROS 2 communication architecture with nodes, topics, services, and actions:

![ROS 2 Architecture](/img/ros2-communication-patterns.svg)

### Creating Your First Publisher Node

Let's create a comprehensive publisher that demonstrates multiple ROS 2 concepts:

```python
#!/usr/bin/env python3
"""
Advanced Publisher Node Example
This node demonstrates advanced ROS 2 publishing concepts including
custom message types, QoS settings, and proper node lifecycle management.
"""

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
from std_msgs.msg import String
from sensor_msgs.msg import LaserScan
from geometry_msgs.msg import Twist
import time
import math


class AdvancedPublisher(Node):
    """
    Advanced Publisher Node demonstrating multiple publishing scenarios
    """

    def __init__(self):
        super().__init__('advanced_publisher')

        # Create QoS profile for different types of data
        # For sensor data: reliable delivery with keep last 10 samples
        sensor_qos = QoSProfile(
            depth=10,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST
        )

        # For command data: best effort with keep all samples
        cmd_qos = QoSProfile(
            depth=1,
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_ALL
        )

        # Create publishers
        self.string_publisher = self.create_publisher(String, 'chatter', sensor_qos)
        self.cmd_publisher = self.create_publisher(Twist, 'cmd_vel', cmd_qos)
        self.laser_publisher = self.create_publisher(LaserScan, 'scan', sensor_qos)

        # Create timers for different publishing rates
        self.string_timer = self.create_timer(0.5, self.string_timer_callback)  # 2 Hz
        self.cmd_timer = self.create_timer(0.1, self.cmd_timer_callback)        # 10 Hz
        self.laser_timer = self.create_timer(0.05, self.laser_timer_callback)   # 20 Hz

        # Counter for messages
        self.i = 0

        # Log node startup
        self.get_logger().info('Advanced Publisher Node Started')
        self.get_logger().info(f'Subscribe to: /chatter, /cmd_vel, /scan')

    def string_timer_callback(self):
        """Publish string messages"""
        msg = String()
        msg.data = f'Hello World: {self.i} at {self.get_clock().now().nanoseconds}'
        self.string_publisher.publish(msg)
        self.get_logger().info(f'Published: "{msg.data}"')
        self.i += 1

    def cmd_timer_callback(self):
        """Publish velocity commands"""
        msg = Twist()
        # Create a circular motion pattern
        msg.linear.x = 0.5  # Move forward at 0.5 m/s
        msg.angular.z = 0.2  # Rotate at 0.2 rad/s
        self.cmd_publisher.publish(msg)
        self.get_logger().debug(f'Published velocity: linear.x={msg.linear.x}, angular.z={msg.angular.z}')

    def laser_timer_callback(self):
        """Publish simulated laser scan data"""
        msg = LaserScan()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'laser_frame'

        # Configure laser scan parameters
        msg.angle_min = -math.pi / 2  # -90 degrees
        msg.angle_max = math.pi / 2   # 90 degrees
        msg.angle_increment = math.pi / 180  # 1 degree increments
        msg.time_increment = 0.0
        msg.scan_time = 0.1
        msg.range_min = 0.1
        msg.range_max = 10.0

        # Generate simulated range data (simulating a box in front of the robot)
        num_ranges = int((msg.angle_max - msg.angle_min) / msg.angle_increment) + 1
        msg.ranges = []

        for i in range(num_ranges):
            angle = msg.angle_min + i * msg.angle_increment
            # Simulate an obstacle 2 meters ahead at center
            if -0.2 < angle < 0.2:  # Front of robot
                distance = 2.0  # Obstacle at 2 meters
            else:
                distance = 5.0  # Clear at other angles
            msg.ranges.append(distance)

        self.laser_publisher.publish(msg)
        self.get_logger().debug(f'Published laser scan with {len(msg.ranges)} ranges')


def main(args=None):
    """Main function to run the advanced publisher node"""
    rclpy.init(args=args)

    try:
        publisher = AdvancedPublisher()

        # Add signal handler for graceful shutdown
        import signal
        import sys

        def signal_handler(sig, frame):
            publisher.get_logger().info('Shutting down gracefully...')
            publisher.destroy_node()
            rclpy.shutdown()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)

        # Spin the node
        rclpy.spin(publisher)

    except KeyboardInterrupt:
        pass
    finally:
        # Cleanup
        if 'publisher' in locals():
            publisher.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Creating Your First Subscriber Node

Now let's create a comprehensive subscriber that demonstrates advanced concepts:

```python
#!/usr/bin/env python3
"""
Advanced Subscriber Node Example
This node demonstrates advanced ROS 2 subscription concepts including
message filtering, callback groups, and multi-topic subscription.
"""

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
from std_msgs.msg import String
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan
import statistics
from collections import deque


class AdvancedSubscriber(Node):
    """
    Advanced Subscriber Node demonstrating multiple subscription scenarios
    """

    def __init__(self):
        super().__init__('advanced_subscriber')

        # Create QoS profiles
        sensor_qos = QoSProfile(
            depth=10,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST
        )

        # Create subscribers
        self.string_subscriber = self.create_subscription(
            String,
            'chatter',
            self.string_callback,
            sensor_qos
        )

        self.cmd_subscriber = self.create_subscription(
            Twist,
            'cmd_vel',
            self.cmd_callback,
            sensor_qos
        )

        self.laser_subscriber = self.create_subscription(
            LaserScan,
            'scan',
            self.laser_callback,
            sensor_qos
        )

        # Data storage for analysis
        self.received_messages = deque(maxlen=100)  # Keep last 100 messages
        self.velocity_history = deque(maxlen=50)
        self.obstacle_distances = deque(maxlen=20)

        # Statistics
        self.message_count = 0
        self.error_count = 0

        self.get_logger().info('Advanced Subscriber Node Started')
        self.get_logger().info('Listening to: /chatter, /cmd_vel, /scan')

    def string_callback(self, msg):
        """Handle incoming string messages"""
        self.message_count += 1
        self.received_messages.append({
            'timestamp': self.get_clock().now(),
            'content': msg.data,
            'length': len(msg.data)
        })

        # Log every 10th message to avoid spam
        if self.message_count % 10 == 0:
            self.get_logger().info(f'Received {self.message_count} messages, latest: {msg.data[:50]}...')

        # Check for message patterns
        if 'ERROR' in msg.data.upper():
            self.error_count += 1
            self.get_logger().warn(f'Error detected in message #{self.error_count}: {msg.data}')

    def cmd_callback(self, msg):
        """Handle incoming velocity commands"""
        self.velocity_history.append({
            'timestamp': self.get_clock().now(),
            'linear_x': msg.linear.x,
            'angular_z': msg.angular.z
        })

        # Log significant changes in velocity
        if abs(msg.linear.x) > 0.1 or abs(msg.angular.z) > 0.1:
            self.get_logger().info(f'Velocity command: linear.x={msg.linear.x:.2f}, angular.z={msg.angular.z:.2f}')

    def laser_callback(self, msg):
        """Handle incoming laser scan data"""
        # Calculate minimum distance to obstacles
        valid_ranges = [r for r in msg.ranges if 0.1 < r < 10.0]  # Filter valid ranges

        if valid_ranges:
            min_distance = min(valid_ranges)
            avg_distance = statistics.mean(valid_ranges) if valid_ranges else float('inf')

            self.obstacle_distances.append(min_distance)

            # Log obstacle warnings
            if min_distance < 1.0:  # Less than 1 meter to obstacle
                self.get_logger().warn(f'OBSTACLE DETECTED: {min_distance:.2f}m ahead!')
            elif min_distance < 2.0:
                self.get_logger().info(f'Obstacle ahead: {min_distance:.2f}m')

            # Log statistics periodically
            if len(self.obstacle_distances) % 10 == 0:
                recent_avg = statistics.mean(list(self.obstacle_distances)[-10:])
                self.get_logger().debug(f'Recent avg distance: {recent_avg:.2f}m')

    def get_statistics(self):
        """Get current statistics about received messages"""
        return {
            'total_messages': self.message_count,
            'error_messages': self.error_count,
            'avg_message_length': statistics.mean([m['length'] for m in self.received_messages]) if self.received_messages else 0,
            'recent_avg_velocity': statistics.mean([v['linear_x'] for v in self.velocity_history]) if self.velocity_history else 0,
            'min_obstacle_distance': min(self.obstacle_distances) if self.obstacle_distances else float('inf')
        }


def main(args=None):
    """Main function to run the advanced subscriber node"""
    rclpy.init(args=args)

    try:
        subscriber = AdvancedSubscriber()

        # Create a timer to periodically print statistics
        def print_stats():
            stats = subscriber.get_statistics()
            subscriber.get_logger().info(f'Statistics - Total: {stats["total_messages"]}, '
                                       f'Errors: {stats["error_messages"]}, '
                                       f'Min Obstacle: {stats["min_obstacle_distance"]:.2f}m')

        stats_timer = subscriber.create_timer(5.0, print_stats)  # Print every 5 seconds

        # Add signal handler for graceful shutdown
        import signal
        import sys

        def signal_handler(sig, frame):
            subscriber.get_logger().info('Shutting down gracefully...')
            stats = subscriber.get_statistics()
            subscriber.get_logger().info(f'Final statistics: {stats}')
            subscriber.destroy_node()
            rclpy.shutdown()
            sys.exit(0)

        signal.signal(signal.SIGINT, signal_handler)

        # Spin the node
        rclpy.spin(subscriber)

    except KeyboardInterrupt:
        pass
    finally:
        # Cleanup
        if 'subscriber' in locals():
            subscriber.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Creating Services in Python

Now let's create a service example:

```python
#!/usr/bin/env python3
"""
ROS 2 Service Server and Client Example
Demonstrates creating and using services in ROS 2 Python
"""

import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts, Trigger
import time


class CalculatorService(Node):
    """
    A service server that provides mathematical operations
    """

    def __init__(self):
        super().__init__('calculator_service')

        # Create service servers
        self.add_srv = self.create_service(AddTwoInts, 'add_two_ints', self.add_callback)
        self.trigger_srv = self.create_service(Trigger, 'system_trigger', self.trigger_callback)

        # Track service calls
        self.add_call_count = 0
        self.trigger_call_count = 0

        self.get_logger().info('Calculator Service Started')

    def add_callback(self, request, response):
        """Handle addition requests"""
        response.sum = request.a + request.b
        self.add_call_count += 1

        self.get_logger().info(f'Addition requested: {request.a} + {request.b} = {response.sum} '
                              f'(Call #{self.add_call_count})')
        return response

    def trigger_callback(self, request, response):
        """Handle trigger requests"""
        self.trigger_call_count += 1

        # Simulate some processing
        time.sleep(0.1)  # Simulate processing time

        response.success = True
        response.message = f'System triggered successfully (Call #{self.trigger_call_count})'

        self.get_logger().info(f'System triggered: {response.message}')
        return response


class CalculatorClient(Node):
    """
    A service client that uses the calculator service
    """

    def __init__(self):
        super().__init__('calculator_client')

        # Create service clients
        self.add_client = self.create_client(AddTwoInts, 'add_two_ints')
        self.trigger_client = self.create_client(Trigger, 'system_trigger')

        # Wait for services to be available
        while not self.add_client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Add service not available, waiting again...')

        while not self.trigger_client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Trigger service not available, waiting again...')

        self.get_logger().info('Calculator Client Started')

    def send_add_request(self, a, b):
        """Send an addition request"""
        request = AddTwoInts.Request()
        request.a = a
        request.b = b

        self.get_logger().info(f'Sending addition request: {a} + {b}')

        future = self.add_client.call_async(request)
        rclpy.spin_until_future_complete(self, future)

        if future.result() is not None:
            result = future.result()
            self.get_logger().info(f'Result: {a} + {b} = {result.sum}')
            return result.sum
        else:
            self.get_logger().error('Exception while calling service: %r' % future.exception())
            return None

    def send_trigger_request(self):
        """Send a trigger request"""
        request = Trigger.Request()

        self.get_logger().info('Sending trigger request')

        future = self.trigger_client.call_async(request)
        rclpy.spin_until_future_complete(self, future)

        if future.result() is not None:
            result = future.result()
            self.get_logger().info(f'Trigger result: {result.success}, {result.message}')
            return result.success
        else:
            self.get_logger().error('Exception while calling service: %r' % future.exception())
            return False


def main_service_server():
    """Run the service server"""
    rclpy.init()

    try:
        service = CalculatorService()
        rclpy.spin(service)
    except KeyboardInterrupt:
        pass
    finally:
        service.destroy_node()
        rclpy.shutdown()


def main_service_client():
    """Run the service client"""
    rclpy.init()

    try:
        client = CalculatorClient()

        # Test addition
        result = client.send_add_request(10, 20)
        if result is not None:
            client.get_logger().info(f'Addition result: {result}')

        # Test trigger
        success = client.send_trigger_request()
        if success:
            client.get_logger().info('Trigger successful')

        # More tests
        for i in range(5):
            result = client.send_add_request(i, i*2)
            time.sleep(0.5)  # Small delay between requests

    except KeyboardInterrupt:
        pass
    finally:
        client.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'server':
        main_service_server()
    elif len(sys.argv) > 1 and sys.argv[1] == 'client':
        main_service_client()
    else:
        print("Usage: python script.py [server|client]")
        print("  server - Run the service server")
        print("  client - Run the service client")
```

## Creating Actions in Python

Now let's create an action example:

```python
#!/usr/bin/env python3
"""
ROS 2 Action Server and Client Example
Demonstrates creating and using actions in ROS 2 Python
"""

import rclpy
from rclpy.action import ActionServer, ActionClient
from rclpy.node import Node
from rclpy.executors import MultiThreadedExecutor
from rclpy.callback_groups import ReentrantCallbackGroup
import time

# Import action messages (you may need to install or create these)
# For this example, we'll use the built-in Fibonacci action
from example_interfaces.action import Fibonacci


class FibonacciActionServer(Node):
    """
    An action server that generates Fibonacci sequences
    """

    def __init__(self):
        super().__init__('fibonacci_action_server')

        # Create action server
        self._action_server = ActionServer(
            self,
            Fibonacci,
            'fibonacci',
            self.execute_callback,
            callback_group=ReentrantCallbackGroup()
        )

        self.get_logger().info('Fibonacci Action Server Started')

    def execute_callback(self, goal_handle):
        """Execute the Fibonacci action"""
        self.get_logger().info(f'Executing goal: order={goal_handle.request.order}')

        # Initialize Fibonacci sequence
        feedback = Fibonacci.Feedback()
        result = Fibonacci.Result()

        # Generate Fibonacci sequence
        sequence = [0, 1]

        if goal_handle.request.order <= 0:
            result.sequence = [0]
            goal_handle.succeed()
            return result
        elif goal_handle.request.order == 1:
            result.sequence = sequence[:1]
            goal_handle.succeed()
            return result

        # Generate the sequence step by step
        for i in range(1, goal_handle.request.order):
            if goal_handle.is_cancel_requested:
                goal_handle.canceled()
                result.sequence = sequence
                self.get_logger().info('Goal canceled')
                return result

            # Update feedback
            feedback.sequence = sequence
            goal_handle.publish_feedback(feedback)

            # Add next number to sequence
            sequence.append(sequence[-1] + sequence[-2])

            # Simulate processing time
            time.sleep(0.5)

            # Check for preempt request
            if goal_handle.is_cancel_requested:
                goal_handle.canceled()
                result.sequence = sequence
                self.get_logger().info('Goal canceled during execution')
                return result

        # Complete successfully
        result.sequence = sequence
        goal_handle.succeed()

        self.get_logger().info(f'Goal succeeded with sequence: {sequence}')
        return result


class FibonacciActionClient(Node):
    """
    An action client that uses the Fibonacci action server
    """

    def __init__(self):
        super().__init__('fibonacci_action_client')

        # Create action client
        self._action_client = ActionClient(self, Fibonacci, 'fibonacci')

        self.get_logger().info('Fibonacci Action Client Started')

    def send_goal(self, order):
        """Send a Fibonacci goal"""
        # Wait for action server
        self._action_client.wait_for_server()

        # Create goal
        goal_msg = Fibonacci.Goal()
        goal_msg.order = order

        # Send goal
        self.get_logger().info(f'Sending Fibonacci goal: order={order}')

        send_goal_future = self._action_client.send_goal_async(
            goal_msg,
            feedback_callback=self.feedback_callback
        )

        # Add done callback
        send_goal_future.add_done_callback(self.goal_response_callback)

    def goal_response_callback(self, future):
        """Handle goal response"""
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().info('Goal rejected')
            return

        self.get_logger().info('Goal accepted')

        # Get result
        get_result_future = goal_handle.get_result_async()
        get_result_future.add_done_callback(self.get_result_callback)

    def get_result_callback(self, future):
        """Handle result"""
        result = future.result().result
        self.get_logger().info(f'Result: {result.sequence}')

        # Shutdown after getting result
        rclpy.shutdown()

    def feedback_callback(self, feedback_msg):
        """Handle feedback"""
        feedback = feedback_msg.feedback
        self.get_logger().info(f'Received feedback: {feedback.sequence[-3:]}')


def main_action_server():
    """Run the action server"""
    rclpy.init()

    try:
        server = FibonacciActionServer()

        # Use multi-threaded executor to handle multiple goals
        executor = MultiThreadedExecutor()
        executor.add_node(server)

        try:
            executor.spin()
        except KeyboardInterrupt:
            pass
        finally:
            server.destroy_node()
            rclpy.shutdown()
    except KeyboardInterrupt:
        pass
    finally:
        rclpy.shutdown()


def main_action_client():
    """Run the action client"""
    rclpy.init()

    try:
        client = FibonacciActionClient()
        client.send_goal(10)  # Generate first 10 Fibonacci numbers

        # Spin to process callbacks
        rclpy.spin(client)

    except KeyboardInterrupt:
        pass
    finally:
        client.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == 'server':
        main_action_server()
    elif len(sys.argv) > 1 and sys.argv[1] == 'client':
        main_action_client()
    else:
        print("Usage: python script.py [server|client]")
        print("  server - Run the action server")
        print("  client - Run the action client")
```

## Practical Lab: Creating a Robot Controller

Now let's create a practical lab that combines multiple concepts:

```python
#!/usr/bin/env python3
"""
Robot Controller Lab
A comprehensive example combining publishers, subscribers, services, and actions
to create a simple robot controller
"""

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
from geometry_msgs.msg import Twist
from sensor_msgs.msg import LaserScan
from std_msgs.msg import String
from example_interfaces.srv import Trigger
from example_interfaces.action import Fibonacci
from rclpy.action import ActionClient
from rclpy.executors import MultiThreadedExecutor
import time
import math


class RobotController(Node):
    """
    A comprehensive robot controller that demonstrates multiple ROS 2 concepts
    """

    def __init__(self):
        super().__init__('robot_controller')

        # QoS profile for robot control
        cmd_qos = QoSProfile(
            depth=1,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST
        )

        # Publishers
        self.cmd_publisher = self.create_publisher(Twist, 'cmd_vel', cmd_qos)
        self.status_publisher = self.create_publisher(String, 'robot_status', cmd_qos)

        # Subscribers
        self.scan_subscriber = self.create_subscription(
            LaserScan,
            'scan',
            self.scan_callback,
            cmd_qos
        )

        # Services
        self.emergency_stop_service = self.create_service(
            Trigger,
            'emergency_stop',
            self.emergency_stop_callback
        )

        # Action client
        self.fibonacci_client = ActionClient(self, Fibonacci, 'fibonacci')

        # Robot state
        self.obstacle_detected = False
        self.emergency_stopped = False
        self.safe_distance = 1.0  # meters

        # Timers
        self.control_timer = self.create_timer(0.1, self.control_loop)  # 10 Hz control loop

        self.get_logger().info('Robot Controller Initialized')

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
            else:
                self.get_logger().info(f'Path clear: {min_distance:.2f}m ahead')
        else:
            self.obstacle_detected = False  # No front-facing data

    def emergency_stop_callback(self, request, response):
        """Handle emergency stop service requests"""
        self.get_logger().warn('EMERGENCY STOP ACTIVATED')
        self.emergency_stopped = True

        # Send stop command
        stop_msg = Twist()
        self.cmd_publisher.publish(stop_msg)

        response.success = True
        response.message = 'Emergency stop activated'
        return response

    def control_loop(self):
        """Main control loop"""
        if self.emergency_stopped:
            # Stay stopped until emergency stop is reset
            stop_msg = Twist()
            self.cmd_publisher.publish(stop_msg)
            return

        # Simple navigation logic
        cmd_msg = Twist()

        if self.obstacle_detected:
            # Stop and rotate to find clear path
            cmd_msg.linear.x = 0.0
            cmd_msg.angular.z = 0.5  # Rotate in place
            self.get_logger().info('Obstacle detected - rotating to find path')
        else:
            # Move forward
            cmd_msg.linear.x = 0.3  # 0.3 m/s forward
            cmd_msg.angular.z = 0.0  # No rotation
            self.get_logger().info('Moving forward')

        # Publish command
        self.cmd_publisher.publish(cmd_msg)

        # Publish status
        status_msg = String()
        if self.emergency_stopped:
            status_msg.data = 'EMERGENCY_STOPPED'
        elif self.obstacle_detected:
            status_msg.data = 'OBSTACLE_AVOIDANCE'
        else:
            status_msg.data = 'MOVING_FORWARD'

        self.status_publisher.publish(status_msg)

    def reset_emergency_stop(self):
        """Reset emergency stop state"""
        self.emergency_stopped = False
        self.get_logger().info('Emergency stop reset')

    def send_fibonacci_request(self, order):
        """Send a Fibonacci action request"""
        if not self.fibonacci_client.wait_for_server(timeout_sec=1.0):
            self.get_logger().error('Fibonacci action server not available')
            return

        goal_msg = Fibonacci.Goal()
        goal_msg.order = order

        self.get_logger().info(f'Sending Fibonacci goal: order={order}')

        send_goal_future = self.fibonacci_client.send_goal_async(
            goal_msg,
            feedback_callback=self.fibonacci_feedback_callback
        )

        send_goal_future.add_done_callback(self.fibonacci_response_callback)

    def fibonacci_response_callback(self, future):
        """Handle Fibonacci goal response"""
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().info('Fibonacci goal rejected')
            return

        self.get_logger().info('Fibonacci goal accepted')

        get_result_future = goal_handle.get_result_async()
        get_result_future.add_done_callback(self.fibonacci_result_callback)

    def fibonacci_result_callback(self, future):
        """Handle Fibonacci result"""
        result = future.result().result
        self.get_logger().info(f'Fibonacci result: {result.sequence}')

    def fibonacci_feedback_callback(self, feedback_msg):
        """Handle Fibonacci feedback"""
        feedback = feedback_msg.feedback
        self.get_logger().info(f'Fibonacci feedback: len={len(feedback.sequence)}')


def main(args=None):
    """Main function to run the robot controller"""
    rclpy.init(args=args)

    try:
        controller = RobotController()

        # Use multi-threaded executor to handle multiple callbacks
        executor = MultiThreadedExecutor()
        executor.add_node(controller)

        try:
            # Send a test Fibonacci request
            time.sleep(2)  # Wait for services to be available
            controller.send_fibonacci_request(5)

            executor.spin()
        except KeyboardInterrupt:
            controller.get_logger().info('Shutting down gracefully...')
        finally:
            controller.destroy_node()
            rclpy.shutdown()
    except KeyboardInterrupt:
        pass
    finally:
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

## Running and Testing Your Code

### Creating Setup Files

First, you'll need to update the setup.py file in your package:

```python
from setuptools import find_packages, setup

package_name = 'my_robot_pkg'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='your_name',
    maintainer_email='your_email@example.com',
    description='Examples for ROS 2 Python development',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'publisher = my_robot_pkg.publisher_member_function:main',
            'subscriber = my_robot_pkg.subscriber_member_function:main',
            'calculator_server = my_robot_pkg.service_examples:main_service_server',
            'calculator_client = my_robot_pkg.service_examples:main_service_client',
            'fibonacci_server = my_robot_pkg.action_examples:main_action_server',
            'fibonacci_client = my_robot_pkg.action_examples:main_action_client',
            'robot_controller = my_robot_pkg.robot_controller:main',
        ],
    },
)
```

### Testing Your Nodes

1. **Build your package**:
```bash
cd ~/ros2_ws
colcon build --packages-select my_robot_pkg
source install/setup.bash
```

2. **Run the publisher**:
```bash
ros2 run my_robot_pkg publisher
```

3. **In another terminal, run the subscriber**:
```bash
ros2 run my_robot_pkg subscriber
```

4. **Test services**:
```bash
# Terminal 1 - start the service server
ros2 run my_robot_pkg calculator_server

# Terminal 2 - test the service client
ros2 run my_robot_pkg calculator_client
```

## Best Practices for Python Development with ROS 2

### 1. Error Handling and Logging

```python
import rclpy
from rclpy.exceptions import ParameterNotDeclaredException
from rclpy.node import Node

class RobustNode(Node):
    def __init__(self):
        super().__init__('robust_node')

        # Declare parameters with defaults
        self.declare_parameter('loop_rate', 10)
        self.declare_parameter('robot_name', 'default_robot')

        # Get parameters safely
        try:
            self.loop_rate = self.get_parameter('loop_rate').value
            self.robot_name = self.get_parameter('robot_name').value
        except ParameterNotDeclaredException as e:
            self.get_logger().error(f'Parameter not declared: {e}')
            return

        # Create timer with error handling
        try:
            self.timer = self.create_timer(1.0/self.loop_rate, self.timer_callback)
        except Exception as e:
            self.get_logger().error(f'Failed to create timer: {e}')

    def timer_callback(self):
        try:
            # Your main logic here
            self.get_logger().info(f'Running {self.robot_name} at {self.loop_rate}Hz')
        except Exception as e:
            self.get_logger().error(f'Error in timer callback: {e}')
```

### 2. Parameter Management

```python
class ParameterExample(Node):
    def __init__(self):
        super().__init__('parameter_example')

        # Declare parameters with descriptions and ranges
        self.declare_parameter(
            'max_velocity',
            1.0,
            descriptor=rclpy.node.ParameterDescriptor(
                description='Maximum linear velocity in m/s',
                floating_point_range=[rclpy.node.FloatingPointRange(from_value=0.0, to_value=5.0)]
            )
        )

        # Callback for parameter changes
        self.add_on_set_parameters_callback(self.parameters_callback)

    def parameters_callback(self, params):
        """Handle parameter changes"""
        for param in params:
            if param.name == 'max_velocity' and param.type_ == Parameter.Type.PARAMETER_DOUBLE:
                if 0.0 <= param.value <= 5.0:
                    self.get_logger().info(f'Max velocity updated to: {param.value}')
                    return SetParametersResult(successful=True)
                else:
                    self.get_logger().warn(f'Invalid max velocity: {param.value}')
                    return SetParametersResult(successful=False)

        return SetParametersResult(successful=True)
```

### 3. Testing Your Code

Create test files in the `test/` directory:

```python
# test/test_my_robot_pkg.py
import unittest
import rclpy
from my_robot_pkg.publisher_member_function import AdvancedPublisher
from my_robot_pkg.subscriber_member_function import AdvancedSubscriber


class TestMyRobotPkg(unittest.TestCase):

    def setUp(self):
        rclpy.init()

    def tearDown(self):
        rclpy.shutdown()

    def test_publisher_creation(self):
        """Test that publisher node can be created"""
        node = AdvancedPublisher()
        self.assertIsNotNone(node)
        node.destroy_node()

    def test_subscriber_creation(self):
        """Test that subscriber node can be created"""
        node = AdvancedSubscriber()
        self.assertIsNotNone(node)
        node.destroy_node()


if __name__ == '__main__':
    unittest.main()
```

## Lab Exercise: Create Your Own Robot Node

Now it's time for a hands-on lab exercise:

### Lab: Create a Simple Navigation Node

**Objective**: Create a node that uses laser scan data to navigate around obstacles.

**Steps**:
1. Create a new Python file `navigation_node.py`
2. Subscribe to `/scan` topic
3. Publish velocity commands to `/cmd_vel`
4. Implement simple obstacle avoidance logic
5. Add a parameter to control safe distance
6. Test with a simulated robot

**Solution Template**:

```python
#!/usr/bin/env python3
"""
Lab Exercise: Simple Navigation Node
Implement a robot that avoids obstacles using laser scan data
"""

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile
from sensor_msgs.msg import LaserScan
from geometry_msgs.msg import Twist
import math


class NavigationNode(Node):

    def __init__(self):
        super().__init__('navigation_node')

        # Declare parameters
        self.declare_parameter('safe_distance', 1.0)
        self.declare_parameter('linear_speed', 0.3)
        self.declare_parameter('angular_speed', 0.5)

        # Get parameters
        self.safe_distance = self.get_parameter('safe_distance').value
        self.linear_speed = self.get_parameter('linear_speed').value
        self.angular_speed = self.get_parameter('angular_speed').value

        # Create QoS profile
        qos = QoSProfile(depth=10)

        # Create publishers and subscribers
        self.scan_sub = self.create_subscription(LaserScan, 'scan', self.scan_callback, qos)
        self.cmd_pub = self.create_publisher(Twist, 'cmd_vel', qos)

        # Navigation state
        self.obstacle_ahead = False

        self.get_logger().info('Navigation Node Started')
        self.get_logger().info(f'Parameters - Safe distance: {self.safe_distance}m, '
                              f'Linear speed: {self.linear_speed}m/s, '
                              f'Angular speed: {self.angular_speed}rad/s')

    def scan_callback(self, msg):
        """Process laser scan data"""
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
            self.obstacle_ahead = min_distance < self.safe_distance
        else:
            self.obstacle_ahead = False

        # Create and publish velocity command
        cmd_msg = Twist()

        if self.obstacle_ahead:
            # Rotate to avoid obstacle
            cmd_msg.linear.x = 0.0
            cmd_msg.angular.z = self.angular_speed
            self.get_logger().warn(f'Obstacle detected: {min_distance:.2f}m - rotating')
        else:
            # Move forward
            cmd_msg.linear.x = self.linear_speed
            cmd_msg.angular.z = 0.0
            self.get_logger().info(f'Moving forward - distance to obstacle: {min_distance:.2f}m')

        self.cmd_pub.publish(cmd_msg)


def main(args=None):
    rclpy.init(args=args)

    try:
        node = NavigationNode()
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

This comprehensive Python development guide covers:
- Advanced publisher/subscriber patterns
- Service and action implementations
- Practical robot control examples
- Best practices for error handling
- Testing strategies
- A hands-on lab exercise

## Summary

In this module, you've learned:
1. How to create comprehensive ROS 2 nodes in Python
2. How to implement publishers, subscribers, services, and actions
3. Best practices for error handling and parameter management
4. How to structure complex robot applications
5. How to test your ROS 2 Python code

The hands-on lab provides practical experience with creating a navigation node that processes sensor data and controls a robot's movement.
