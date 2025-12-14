---
title: Nodes, Topics, and Services in ROS 2
sidebar_position: 2
---

# Nodes, Topics, and Services in ROS 2

## Nodes

A node is an executable that uses ROS 2 to communicate with other nodes. Nodes are the fundamental building blocks of ROS 2 applications. Here's how to create and work with nodes:

### Creating a Node

In Python, a basic node looks like this:

```python
import rclpy
from rclpy.node import Node

class MinimalPublisher(Node):

    def __init__(self):
        super().__init__('minimal_publisher')
        self.publisher_ = self.create_publisher(String, 'topic', 10)
        timer_period = 0.5  # seconds
        self.timer = self.create_timer(timer_period, self.timer_callback)
        self.i = 0

    def timer_callback(self):
        msg = String()
        msg.data = 'Hello World: %d' % self.i
        self.publisher_.publish(msg)
        self.get_logger().info('Publishing: "%s"' % msg.data)
        self.i += 1

def main(args=None):
    rclpy.init(args=args)
    minimal_publisher = MinimalPublisher()
    rclpy.spin(minimal_publisher)
    minimal_publisher.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### Node Lifecycle

Nodes in ROS 2 can have a lifecycle that includes states like:
- **Unconfigured**: Node is created but not configured
- **Inactive**: Node is configured but not active
- **Active**: Node is running and processing
- **Finalized**: Node is shutting down

## Topics (Publish/Subscribe Pattern)

Topics are named buses over which nodes exchange messages. The publish/subscribe pattern is asynchronous and allows for many-to-many communication.

### Publisher Example

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Publisher(Node):

    def __init__(self):
        super().__init__('talker')
        self.publisher = self.create_publisher(String, 'chatter', 10)
        timer_period = 0.5
        self.timer = self.create_timer(timer_period, self.timer_callback)

    def timer_callback(self):
        msg = String()
        msg.data = 'Hello World: %d' % self.get_clock().now().nanoseconds
        self.publisher.publish(msg)
        self.get_logger().info('Publishing: "%s"' % msg.data)

def main(args=None):
    rclpy.init(args=args)
    publisher = Publisher()
    rclpy.spin(publisher)
    publisher.destroy_node()
    rclpy.shutdown()
```

### Subscriber Example

```python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class Subscriber(Node):

    def __init__(self):
        super().__init__('listener')
        self.subscription = self.create_subscription(
            String,
            'chatter',
            self.listener_callback,
            10)
        self.subscription  # prevent unused variable warning

    def listener_callback(self, msg):
        self.get_logger().info('I heard: "%s"' % msg.data)

def main(args=None):
    rclpy.init(args=args)
    subscriber = Subscriber()
    rclpy.spin(subscriber)
    subscriber.destroy_node()
    rclpy.shutdown()
```

### Quality of Service (QoS) for Topics

QoS settings are crucial for configuring how messages are delivered:

```python
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy

# Create a QoS profile
qos_profile = QoSProfile(
    depth=10,
    reliability=ReliabilityPolicy.RELIABLE,  # or BEST_EFFORT
    history=HistoryPolicy.KEEP_LAST  # or KEEP_ALL
)
```

## Services (Request/Response Pattern)

Services provide synchronous request/response communication between nodes. A service client sends a request to a service server, which processes the request and sends back a response.

### Service Definition

Services are defined using `.srv` files. For example, `AddTwoInts.srv`:

```
int64 a
int64 b
---
int64 sum
```

### Service Server Example

```python
from example_interfaces.srv import AddTwoInts
import rclpy
from rclpy.node import Node

class MinimalService(Node):

    def __init__(self):
        super().__init__('minimal_service')
        self.srv = self.create_service(AddTwoInts, 'add_two_ints', self.add_two_ints_callback)

    def add_two_ints_callback(self, request, response):
        response.sum = request.a + request.b
        self.get_logger().info('Incoming request\na: %d b: %d' % (request.a, request.b))
        return response

def main(args=None):
    rclpy.init(args=args)
    minimal_service = MinimalService()
    rclpy.spin(minimal_service)
    rclpy.shutdown()
```

### Service Client Example

```python
from example_interfaces.srv import AddTwoInts
import rclpy
from rclpy.node import Node

class MinimalClient(Node):

    def __init__(self):
        super().__init__('minimal_client')
        self.cli = self.create_client(AddTwoInts, 'add_two_ints')
        while not self.cli.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Service not available, waiting again...')
        self.req = AddTwoInts.Request()

    def send_request(self, a, b):
        self.req.a = a
        self.req.b = b
        self.future = self.cli.call_async(self.req)
        rclpy.spin_until_future_complete(self, self.future)
        return self.future.result()

def main(args=None):
    rclpy.init(args=args)
    minimal_client = MinimalClient()
    response = minimal_client.send_request(1, 2)
    minimal_client.get_logger().info(
        'Result of add_two_ints: %d' % response.sum)
    minimal_client.destroy_node()
    rclpy.shutdown()
```

## Communication Patterns Comparison

| Pattern | Synchronous/Asynchronous | Communication Type | Use Case |
|---------|--------------------------|-------------------|----------|
| Topics | Asynchronous | Many-to-many | Sensor data, streaming |
| Services | Synchronous | One-to-one | Request/response, RPC |
| Actions | Asynchronous | Goal-oriented | Long-running tasks |

## Best Practices

1. **Use appropriate QoS settings** based on your application's requirements
2. **Name your topics and services descriptively** to avoid conflicts
3. **Handle errors gracefully** in both publishers and subscribers
4. **Use appropriate message types** from standard ROS 2 message packages when possible
5. **Implement proper lifecycle management** for complex nodes
6. **Log important events** for debugging and monitoring

## Common Commands

- `ros2 node list` - List all running nodes
- `ros2 node info <node_name>` - Get information about a specific node
- `ros2 topic list` - List all active topics
- `ros2 topic echo <topic_name>` - Display messages published on a topic
- `ros2 service list` - List all available services
- `ros2 service call <service_name> <service_type>` - Call a service

## Summary

Nodes, topics, and services form the foundation of ROS 2 communication. Understanding these concepts is essential for building distributed robotic applications. In the next chapter, we'll explore Python development in ROS 2 and create more complex examples.