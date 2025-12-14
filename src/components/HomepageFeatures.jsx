import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Comprehensive Curriculum',
    description: (
      <>
        Our course covers the full stack of physical AI and humanoid robotics, from ROS 2 fundamentals to Vision-Language-Action systems.
      </>
    ),
  },
  {
    title: 'Hands-On Learning',
    description: (
      <>
        Practical exercises and projects that let you build real-world robotic systems using industry-standard tools and frameworks.
      </>
    ),
  },
  {
    title: 'Cutting-Edge Technology',
    description: (
      <>
        Learn with the latest tools including NVIDIA Isaac™, Gazebo simulation, Unity, and state-of-the-art AI models.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}