import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Start Learning - 5 min ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="A Comprehensive Educational Book on Robotics, AI, and Physical Intelligence">
      <HomepageHeader />
      <main>
        <section className={styles.modulesSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Learning Modules</h2>
            <p className={styles.sectionDescription}>
              Explore the four core modules that build upon each other to provide a comprehensive understanding of modern robotics and AI integration.
            </p>
            <div className={styles.modulesGrid}>
              <div className={styles.moduleCard}>
                <div className={styles.cardContent}>
                  <h3>Module 1: ROS 2 (The Robotic Nervous System)</h3>
                  <p>Core ROS 2 fundamentals including nodes, topics, services, and Python agent integration</p>
                  <Link
                    className="button button--primary"
                    to="/docs/module-1-ros2/architecture">
                    Explore Module
                  </Link>
                </div>
              </div>

              <div className={styles.moduleCard}>
                <div className={styles.cardContent}>
                  <h3>Module 2: Digital Twin (Gazebo & Unity)</h3>
                  <p>Simulation environments, physics simulation, and digital twin concepts</p>
                  <Link
                    className="button button--primary"
                    to="/docs/module-2-digital-twin/simulation-basics">
                    Explore Module
                  </Link>
                </div>
              </div>

              <div className={styles.moduleCard}>
                <div className={styles.cardContent}>
                  <h3>Module 3: AI Robot Brain (NVIDIA Isaac™)</h3>
                  <p>NVIDIA Isaac Sim, synthetic data, Isaac ROS pipelines, VSLAM, navigation, and perception</p>
                  <Link
                    className="button button--primary"
                    to="/docs/module-3-ai-robot-brain/isaac-sim-overview">
                    Explore Module
                  </Link>
                </div>
              </div>

              <div className={styles.moduleCard}>
                <div className={styles.cardContent}>
                  <h3>Module 4: Vision-Language-Action (VLA)</h3>
                  <p>Vision-Language-Action systems for advanced human-robot interaction</p>
                  <Link
                    className="button button--primary"
                    to="/docs/module-4-vla/intro">
                    Explore Module
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}