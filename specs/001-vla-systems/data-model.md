# Data Model: Physical AI & Humanoid Robotics (Docusaurus Book)

## Overview
This document defines the data models and entities for the Docusaurus-based educational book on Physical AI & Humanoid Robotics.

## Content Entities

### Book Module
- **name**: string (required) - The module name (e.g., "ROS 2 Fundamentals", "Digital Twin Simulation")
- **description**: string (required) - Brief description of the module content
- **target_audience**: string (required) - Intended audience level (e.g., "beginner", "intermediate", "advanced")
- **duration**: number (required) - Estimated time to complete in hours
- **prerequisites**: array of strings - List of prerequisite knowledge
- **learning_outcomes**: array of strings - Specific learning outcomes for the module
- **sections**: array of Section entities - The sections that comprise this module

### Section
- **title**: string (required) - The section title
- **description**: string (required) - Brief description of the section content
- **content_type**: enum (required) - Type of content ("text", "tutorial", "example", "exercise", "project")
- **word_count**: number (optional) - Approximate word count for the section
- **estimated_time**: number (optional) - Estimated time to complete in minutes
- **dependencies**: array of strings (optional) - Other sections this section depends on
- **resources**: array of Resource entities (optional) - Associated resources like code examples or diagrams

### Resource
- **name**: string (required) - Name of the resource
- **type**: enum (required) - Type of resource ("code_example", "diagram", "video", "dataset", "simulation")
- **url**: string (optional) - URL to the resource if external
- **path**: string (optional) - Local path to the resource if internal
- **description**: string (optional) - Description of the resource

### Code Example
- **title**: string (required) - Title of the code example
- **language**: string (required) - Programming language (e.g., "python", "c++", "bash")
- **code**: string (required) - The actual code content
- **description**: string (optional) - Explanation of what the code does
- **use_case**: string (optional) - Context where this code example is used
- **dependencies**: array of strings (optional) - ROS packages or libraries required

### Simulation Environment
- **name**: string (required) - Name of the simulation environment
- **type**: enum (required) - Type of environment ("gazebo", "isaac_sim", "unity", "custom")
- **description**: string (optional) - Description of the environment
- **configuration**: string (optional) - Configuration files or setup instructions
- **components**: array of strings (optional) - Components included in the environment

### Hardware Configuration
- **name**: string (required) - Name of the hardware configuration
- **type**: enum (required) - Type of hardware ("workstation", "robot", "sensor", "development_kit")
- **specifications**: object (optional) - Hardware specifications (CPU, GPU, RAM, etc.)
- **compatibility**: array of strings (optional) - Compatible software or frameworks
- **cost_estimate**: number (optional) - Estimated cost in USD

## Content Relationships

### Module contains Sections
- One Book Module contains many Sections
- Sections are ordered within a module via an implicit sequence in the array

### Section uses Resources
- One Section may reference many Resources
- Resources may be referenced by multiple Sections

### Section includes Code Examples
- One Section may include many Code Examples
- Code Examples are specific to one Section contextually

## Validation Rules

### Book Module
- Name must be 2-50 characters
- Description must be 10-500 characters
- Duration must be a positive number
- Learning outcomes array must contain 1-10 items

### Section
- Title must be 2-100 characters
- Content type must be one of the defined enum values
- Estimated time must be a positive number if provided

### Resource
- Name must be 2-100 characters
- Type must be one of the defined enum values
- Either URL or path must be provided, but not both

## State Transitions
- Content entities follow a lifecycle: draft → review → approved → published
- Each state has associated validation requirements
- State transitions are managed through the content management workflow