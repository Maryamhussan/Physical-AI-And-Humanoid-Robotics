import React from 'react';
import clsx from 'clsx';
import styles from './RoboticsDiagram.module.css';

/**
 * Component for displaying robotics diagrams and visualizations
 */
export default function RoboticsDiagram({title, description, children, className}) {
  return (
    <div className={clsx('robotics-diagram', styles.diagramContainer, className)}>
      {title && <h3 className={styles.diagramTitle}>{title}</h3>}
      {children}
      {description && <p className={styles.diagramDescription}>{description}</p>}
    </div>
  );
}