// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      items: [
        'intro',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 1: ROS 2 (The Robotic Nervous System)',
      items: [
        'module-1-ros2/architecture',
        'module-1-ros2/nodes-topics-services',
        'module-1-ros2/python-development',
        'module-1-ros2/urdf-fundamentals',
        'module-1-ros2/launch-files',
        'module-1-ros2/mini-project',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 2: Digital Twin (Gazebo & Unity)',
      items: [
        'module-2-digital-twin/simulation-basics',
        'module-2-digital-twin/gazebo-setup',
        'module-2-digital-twin/sdf-vs-urdf',
        'module-2-digital-twin/sensors',
        'module-2-digital-twin/unity-visualization',
        'module-2-digital-twin/digital-twin-project',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 3: AI Robot Brain (NVIDIA Isaac™)',
      items: [
        'module-3-ai-robot-brain/isaac-sim-overview',
        'module-3-ai-robot-brain/synthetic-data',
        'module-3-ai-robot-brain/perception-pipeline',
        'module-3-ai-robot-brain/isaac-ros-gems',
        'module-3-ai-robot-brain/vslam-nav2',
        'module-3-ai-robot-brain/jetson-deployment',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Module 4: Vision-Language-Action (VLA)',
      items: [
        'module-4-vla/intro',
        'module-4-vla/vla-theory',
        'module-4-vla/whisper-integration',
        'module-4-vla/llm-planning',
        'module-4-vla/ros2-actions',
        'module-4-vla/multimodal-perception',
        'module-4-vla/vla-isaac-integration',
        'module-4-vla/performance-monitoring',
        'module-4-vla/error-handling',
        'module-4-vla/privacy-handling',
        'module-4-vla/summary',
        'module-4-vla/completion-report',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Capstone Project',
      items: [
        'capstone-project/introduction',
        'capstone-project/implementation',
        'capstone-project/demo-instructions',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Appendices',
      items: [
        'hardware-appendix/workstation-recommendations',
        'cloud-onprem-guide/cloud-options',
      ],
      collapsed: true,
    },
  ],
};

module.exports = sidebars;