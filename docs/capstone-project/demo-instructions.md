---
title: Capstone Project Demo Instructions
sidebar_position: 2
---

# Capstone Project Demo Instructions

Detailed instructions for demonstrating the integrated Physical AI system.

## Pre-Demo Setup

### Environment Preparation
1. Ensure all prerequisite modules are completed
2. Set up the simulation environment
3. Configure ROS 2 workspace
4. Initialize Isaac Sim connection

### Hardware Requirements
- Compatible workstation (see hardware appendix)
- Internet connection for cloud services
- Audio input device for speech recognition

## Demo Workflow

### Phase 1: System Initialization
```bash
# Start ROS 2 network
source /opt/ros/humble/setup.bash
colcon build
source install/setup.bash
```

### Phase 2: Voice Command Processing
1. Activate speech recognition
2. Process command with VLA system
3. Generate action plan
4. Execute in simulation

### Phase 3: Action Execution
1. Monitor system response
2. Validate action completion
3. Handle any errors gracefully

## Expected Outcomes

- Successful voice command interpretation
- Correct action planning and execution
- Proper error handling
- Smooth system integration

## Troubleshooting

Common issues and resolutions:
- Audio input problems: Check microphone permissions
- ROS 2 connectivity: Verify network configuration
- Simulation errors: Restart Isaac Sim connection

## Evaluation Criteria

The demo will be evaluated on:
- System responsiveness
- Accuracy of command execution
- Error handling effectiveness
- Overall integration quality