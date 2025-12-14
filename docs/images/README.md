# Images Directory for Physical AI & Humanoid Robotics Documentation

## Overview

This directory contains all visual assets for the Physical AI & Humanoid Robotics educational materials. The images support the documentation by illustrating concepts, showing system architectures, and providing visual examples for learners.

## Directory Structure

```
images/
├── logo-concept.md           # Logo design concepts and SVG code
├── image-strategy.md         # Overall image strategy and specifications
├── module-diagrams.md        # Module-specific diagrams and visualizations
├── usage-examples.md         # Examples of how to use images in documentation
├── architecture/             # System architecture diagrams
│   ├── ros2-architecture.svg
│   ├── vla-system-architecture.svg
│   └── ...
├── diagrams/                 # Technical diagrams and illustrations
│   ├── sdf-urdf-comparison.svg
│   ├── performance-optimization.svg
│   └── ...
├── screenshots/              # Software interface screenshots
│   ├── simulation-environment.png
│   └── ...
├── hardware/                 # Robot hardware diagrams
│   ├── robot-architecture.svg
│   └── ...
└── workflows/                # Process flow diagrams
    ├── nlp-pipeline.svg
    └── ...
```

## Image Standards

### Formats
- **SVG**: For diagrams, illustrations, and scalable graphics
- **PNG**: For screenshots and detailed images (when SVG is not practical)
- **JPEG**: For photographs (use sparingly, mostly for documentation)

### Dimensions and Resolution
- **Diagrams**: Vector-based (SVG) preferred for scalability
- **Screenshots**: Actual resolution with clear text (minimum 1920x1080)
- **Print Materials**: 300 DPI minimum for raster images
- **Web Display**: Responsive designs that adapt to screen size

### Color Palette
- **Primary Blue**: `#1E3A8A` (Deep blue for headers and primary elements)
- **Secondary Blue**: `#3B82F6` (Electric blue for highlights and secondary elements)
- **Accent Orange**: `#F97316` (Orange for alerts, warnings, and highlights)
- **Neutral Colors**:
  - White: `#FFFFFF`
  - Light Gray: `#F3F4F6`
  - Dark Gray: `#1F2937`

### Typography
- **Headers**: Bold, sans-serif (Arial, Helvetica, or system default)
- **Body Text**: Regular, sans-serif for readability
- **Code/Technical**: Monospace font where appropriate
- **Minimum Size**: 12pt for all text in images

## Creating New Images

### Tools Recommended
1. **Vector Graphics**:
   - Inkscape (free, open-source)
   - Adobe Illustrator (commercial)
2. **Diagramming**:
   - Draw.io (free, web-based)
   - Lucidchart (commercial)
   - Mermaid (for code-based diagrams)
3. **Screen Capture**:
   - Built-in OS tools (Snipping Tool, Grab, Screenshot)
   - Greenshot (Windows)
   - Shutter (Linux)
4. **Photo Editing**:
   - GIMP (free, open-source)
   - Adobe Photoshop (commercial)
5. **3D Modeling**:
   - Blender (free, for robot models and environments)

### Naming Convention
Use descriptive, consistent names with the following pattern:
```
[category]-[subject]-[descriptor].[extension]
```

Examples:
- `architecture-ros2-communication.svg`
- `diagram-sdf-urdf-comparison.svg`
- `screenshot-gazebo-interface.png`
- `workflow-nlp-processing.svg`

### Version Control
- Keep source files (e.g., `.drawio`, `.svg`, `.blend`) alongside exports
- Use Git for version control of all image files
- Maintain history of changes to important diagrams
- Tag major revisions when updating system architectures

## Using Images in Documentation

### Markdown Syntax
```markdown
![Descriptive Alt Text](./images/[filename].[extension])

*Figure X: Caption explaining the image and its relevance.*
```

### Best Practices
1. **Alt Text**: Always provide meaningful alternative text for accessibility
2. **Captions**: Include numbered captions that explain the image's relevance
3. **Context**: Reference images from the main text content
4. **Size**: Use appropriate sizing (`{width=50%}` for half-width images)
5. **Placement**: Position images near the relevant text content

### Example Usage
```markdown
## ROS 2 Communication Architecture

The Robot Operating System 2 (ROS 2) uses a distributed architecture where nodes communicate through topics, services, and actions. Understanding these communication patterns is crucial for developing effective robotic applications.

![ROS 2 Communication Architecture](./images/architecture/ros2-communication.svg)

*Figure 1: ROS 2 communication architecture showing publisher-subscriber pattern and service calls.*

In this architecture:
- **Publishers** send messages to **topics**
- **Subscribers** receive messages from **topics**
- **Services** provide request-response communication
- **Actions** enable goal-feedback-result communication for long-running tasks
```

## Accessibility Standards

### Visual Accessibility
- **Contrast Ratio**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color Blindness**: Test images with color blindness simulators
- **Text Size**: Minimum 12pt for all text in images
- **Clarity**: Ensure all elements are clear and distinguishable

### Alternative Text
- **Descriptive**: Alt text should describe the image's content and function
- **Concise**: Keep alt text under 125 characters when possible
- **Contextual**: Tailor alt text to the surrounding content
- **Complex Images**: Provide detailed descriptions in captions for complex diagrams

### Keyboard Navigation
- Ensure interactive elements (if any) are keyboard accessible
- Provide focus indicators for interactive image elements

## Maintenance Guidelines

### Regular Reviews
- **Quarterly**: Review all images for technical accuracy
- **Biannually**: Update screenshots to reflect current interfaces
- **Annually**: Evaluate and refresh outdated diagrams

### Update Procedures
1. **Modify Source**: Update the original source file first
2. **Export**: Regenerate all required formats
3. **Test**: Verify the image displays correctly in documentation
4. **Commit**: Include both source and export files in commits
5. **Document**: Update any related documentation that references the image

### Quality Assurance
- **Technical Accuracy**: Verify all diagrams match actual implementations
- **Visual Clarity**: Ensure all text is readable and elements are clear
- **Consistency**: Maintain visual consistency across all materials
- **Accessibility**: Regular accessibility audits

## Contributing New Images

### Process
1. **Plan**: Create a concept sketch or wireframe
2. **Design**: Create the image using recommended tools
3. **Review**: Check against standards and accessibility guidelines
4. **Export**: Generate required formats
5. **Document**: Add to appropriate directory with clear naming
6. **Reference**: Update documentation to use the new image
7. **Commit**: Add to Git with descriptive commit message

### Review Checklist
- [ ] Image is technically accurate
- [ ] Follows color palette standards
- [ ] Has appropriate alt text and caption
- [ ] Is accessible (contrast, size, clarity)
- [ ] Uses proper naming convention
- [ ] Is placed in correct directory
- [ ] Is referenced in relevant documentation

## Tools and Resources

### Online Tools
- [Draw.io](https://draw.io) - Free diagramming tool
- [Mermaid Live Editor](https://mermaid.live) - For creating flowcharts
- [Coolors](https://coolors.co) - Color palette generator
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Accessibility checker

### Templates
The following templates are available in this directory:
- `template-diagram.svg` - Base template for technical diagrams
- `template-logo.svg` - Logo design template
- `template-process-flow.svg` - Process flow diagram template

### Example Files
- `example-good.svg` - Example of a well-designed diagram
- `example-accessible.md` - Example of proper image integration in documentation

## Contact and Support

For questions about image creation, usage, or standards:
- **Documentation Maintainers**: See main project README
- **Design Guidance**: Contact the design team
- **Accessibility Questions**: Consult the accessibility guidelines
- **Tool Recommendations**: Ask in the project channels

## Legal and Licensing

All images in this directory are licensed under the same license as the main project (see main LICENSE file). When creating new images:
- Use original content or properly attributed sources
- Follow licensing requirements for any third-party elements
- Include attribution when using external resources
- Maintain consistency with project branding guidelines