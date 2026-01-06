// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: "category",
      label: "Introduction",
      items: ["intro"],
      collapsed: true,
    },
    {
      type: "category",
      label: "Module 1: ROS 2 (The Robotic Nervous System)",
      items: [
        {
          type: "doc",
          id: "module-1-ros2/architecture",
          label: "Chapter 1: Architecture Fundamentals",
        },
        {
          type: "doc",
          id: "module-1-ros2/nodes-topics-services",
          label: "Chapter 2: Nodes, Topics, and Services",
        },
        {
          type: "doc",
          id: "module-1-ros2/python-development",
          label: "Chapter 3: Python Development",
        },
        {
          type: "doc",
          id: "module-1-ros2/urdf-fundamentals",
          label: "Chapter 4: URDF Fundamentals",
        },
        {
          type: "doc",
          id: "module-1-ros2/launch-files",
          label: "Chapter 5: Launch Files",
        },
        {
          type: "doc",
          id: "module-1-ros2/mini-project",
          label: "Chapter 6: Mini Project",
        },
      ],
      collapsed: true,
    },
    {
      type: "category",
      label: "Module 2: Digital Twin (Gazebo & Unity)",
      items: [
        {
          type: "doc",
          id: "module-2-digital-twin/simulation-basics",
          label: "Chapter 1: Simulation Basics",
        },
        {
          type: "doc",
          id: "module-2-digital-twin/gazebo-setup",
          label: "Chapter 2: Gazebo Setup",
        },
        {
          type: "doc",
          id: "module-2-digital-twin/sdf-vs-urdf",
          label: "Chapter 3: SDF vs URDF",
        },
        {
          type: "doc",
          id: "module-2-digital-twin/sensors",
          label: "Chapter 4: Sensors",
        },
        {
          type: "doc",
          id: "module-2-digital-twin/unity-visualization",
          label: "Chapter 5: Unity Visualization",
        },
        {
          type: "doc",
          id: "module-2-digital-twin/digital-twin-project",
          label: "Chapter 6: Digital Twin Project",
        },
      ],
      collapsed: true,
    },
    {
      type: "category",
      label: "Module 3: AI Robot Brain (NVIDIA Isaac™)",
      items: [
        {
          type: "doc",
          id: "module-3-ai-robot-brain/isaac-sim-overview",
          label: "Chapter 1: Isaac Sim Overview",
        },
        {
          type: "doc",
          id: "module-3-ai-robot-brain/synthetic-data",
          label: "Chapter 2: Synthetic Data",
        },
        {
          type: "doc",
          id: "module-3-ai-robot-brain/perception-pipeline",
          label: "Chapter 3: Perception Pipeline",
        },
        {
          type: "doc",
          id: "module-3-ai-robot-brain/isaac-ros-gems",
          label: "Chapter 4: Isaac ROS Gems",
        },
        {
          type: "doc",
          id: "module-3-ai-robot-brain/vslam-nav2",
          label: "Chapter 5: VSLAM and Nav2",
        },
        {
          type: "doc",
          id: "module-3-ai-robot-brain/jetson-deployment",
          label: "Chapter 6: Jetson Deployment",
        },
      ],
      collapsed: true,
    },
    {
      type: "category",
      label: "Module 4: Vision-Language-Action (VLA)",
      items: [
        {
          type: "doc",
          id: "module-4-vla/intro",
          label: "Chapter 1: Introduction to VLA Systems",
        },
        {
          type: "doc",
          id: "module-4-vla/vla-theory",
          label: "Chapter 2: VLA Theory",
        },
        {
          type: "doc",
          id: "module-4-vla/whisper-integration",
          label: "Chapter 3: Whisper Integration",
        },
        {
          type: "doc",
          id: "module-4-vla/llm-planning",
          label: "Chapter 4: LLM Planning",
        },
        {
          type: "doc",
          id: "module-4-vla/ros2-actions",
          label: "Chapter 5: ROS2 Actions",
        },
        {
          type: "doc",
          id: "module-4-vla/multimodal-perception",
          label: "Chapter 6: Multimodal Perception",
        },
        {
          type: "doc",
          id: "module-4-vla/vla-isaac-integration",
          label: "Chapter 7: VLA Isaac Integration",
        },
        {
          type: "doc",
          id: "module-4-vla/performance-monitoring",
          label: "Chapter 8: Performance Monitoring",
        },
        {
          type: "doc",
          id: "module-4-vla/error-handling",
          label: "Chapter 9: Error Handling",
        },
        {
          type: "doc",
          id: "module-4-vla/privacy-handling",
          label: "Chapter 10: Privacy Handling",
        },
        {
          type: "doc",
          id: "module-4-vla/summary",
          label: "Chapter 11: Summary",
        },
      ],
      collapsed: true,
    },
    {
      type: "category",
      label: "Capstone Project",
      items: [
        "capstone-project/introduction",
        "capstone-project/implementation",
        "capstone-project/demo-instructions",
      ],
      collapsed: true,
    },
    {
      type: "category",
      label: "Appendices",
      items: [
        "hardware-appendix/workstation-recommendations",
        "cloud-onprem-guide/cloud-options",
      ],
      collapsed: true,
    },
  ],
};

module.exports = sidebars;
