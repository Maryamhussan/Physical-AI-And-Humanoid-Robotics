---
title: ROS 2 Architecture Fundamentals
sidebar_position: 1
---

# ROS 2 Architecture Fundamentals

## Overview of ROS 2

Robot Operating System 2 (ROS 2) is a flexible framework for writing robot software. It is a collection of tools, libraries, and conventions that aim to simplify the task of creating complex and robust robot behavior across a wide variety of robot platforms.

### Key Concepts

ROS 2 is built around several key architectural concepts that enable distributed robotics applications:

- **Nodes**: Processes that perform computation
- **Topics**: Named buses over which nodes exchange messages
- **Services**: Synchronous request/response communication
- **Actions**: Asynchronous goal-oriented communication
- **Parameters**: Configuration values that can be changed at runtime
- **Lifecycle**: Management of node states and transitions

## ROS 2 vs ROS 1

ROS 2 was developed to address several limitations of ROS 1:

- **Real-time support**: ROS 2 provides real-time capabilities
- **Multi-robot systems**: Better support for multiple robots
- **Security**: Built-in security features
- **Quality of Service (QoS)**: Configurable delivery guarantees
- **Middleware**: Support for different communication middlewares (DDS, Fast-RTPS, Cyclone DDS, etc.)

## Distributed Architecture

ROS 2 uses a distributed architecture where nodes can run on different machines and communicate over a network. This is made possible by the Data Distribution Service (DDS) middleware, which provides:

- **Discovery**: Automatic discovery of nodes and their interfaces
- **Communication**: Reliable message delivery between nodes
- **Configuration**: Quality of service settings for different communication needs

### DDS Implementation Options

ROS 2 supports multiple DDS implementations:

- **Fast DDS**: eProsima's Fast DDS (default in recent ROS 2 versions)
- **Cyclone DDS**: Eclipse Cyclone DDS
- **RTI Connext DDS**: RTI's implementation
- **OpenSplice DDS**: ADLINK's implementation

## Communication Patterns

ROS 2 provides several communication patterns for different use cases:

### Topics (Publish/Subscribe)
- **Asynchronous**: Publishers and subscribers don't need to be active simultaneously
- **Many-to-many**: Multiple publishers can publish to a topic, multiple subscribers can subscribe
- **Real-time**: Suitable for streaming data like sensor readings

### Services (Request/Response)
- **Synchronous**: Request blocks until response is received
- **One-to-one**: One server responds to one client at a time
- **Reliable**: Guarantees delivery and processing of requests

### Actions (Goal-Based)
- **Asynchronous**: Goal execution doesn't block the client
- **Feedback**: Continuous feedback during goal execution
- **Cancelation**: Ability to cancel goals in progress

## Practical Example

Let's look at a simple ROS 2 system architecture:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Camera    │    │   Planner   │    │ Controller  │
│   Node      │    │   Node      │    │   Node      │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      │ sensor_msgs/Image│ geometry_msgs/   │
      │ ────────────────→│ PoseStamped      │
      │                  │ ────────────────→│
      │                  │                  │
      │                  │                  │
      │                  │ ┌─────────────────▼─────────┐
      │                  │ │     /move_base Action     │
      │                  │ │        Server             │
      │                  │ └───────────────────────────┘
      │                  │
┌─────▼────────┐   ┌────▼─────────────┐
│  Perception  │   │  Navigation      │
│   Node       │   │    Node          │
└──────────────┘   └──────────────────┘
```

This diagram shows how different nodes communicate using various ROS 2 communication patterns.

## Quality of Service (QoS)

QoS settings allow you to configure how messages are delivered:

- **Reliability**: Best effort vs. reliable delivery
- **Durability**: Volatile vs. transient local
- **History**: Keep last N messages vs. keep all messages
- **Depth**: Size of the message queue

These settings are crucial for real-time applications where timing and reliability requirements vary.

## Summary

Understanding ROS 2 architecture is fundamental to developing robust robotic systems. The distributed nature, multiple communication patterns, and QoS settings provide the flexibility needed for complex robotics applications. In the next chapter, we'll dive deeper into nodes, topics, and services.