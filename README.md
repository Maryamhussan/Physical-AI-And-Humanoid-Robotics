# Physical AI & Humanoid Robotics Educational Book

This repository contains a comprehensive educational book on Physical AI and Humanoid Robotics, structured as a Docusaurus website.

## Structure

The book is organized into 4 core modules:

1. **Module 1: ROS 2 (The Robotic Nervous System)** - Core ROS 2 fundamentals including nodes, topics, services, and Python agent integration
2. **Module 2: Digital Twin (Gazebo & Unity)** - Simulation environments, physics simulation, and digital twin concepts
3. **Module 3: AI Robot Brain (NVIDIA Isaac™)** - NVIDIA Isaac Sim, synthetic data, Isaac ROS pipelines, VSLAM, navigation, and perception
4. **Module 4: Vision-Language-Action (VLA)** - Vision-Language-Action systems for advanced human-robot interaction

## Local Development

1. Make sure all the required dependencies are installed:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

To build the website for production:

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

This website is configured to deploy to GitHub Pages automatically via GitHub Actions.

### GitHub Pages Deployment

The website is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployment is handled by the GitHub Actions workflow in `.github/workflows/deploy.yml`.

The site will be available at: https://Physical-AI-And-Humanoid-Robotics.github.io/physical-ai-humanoid-robotics-book/

### Manual Deployment

If you need to deploy manually, you can use:

```bash
GIT_USER=<Your GitHub username> USE_SSH=true npm run deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.