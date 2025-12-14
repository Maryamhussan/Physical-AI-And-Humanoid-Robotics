---
title: Synthetic Data Generation with Isaac Sim
sidebar_position: 2
---

# Synthetic Data Generation with Isaac Sim

## Introduction to Synthetic Data Generation

Synthetic data generation is a critical component of modern AI development, particularly in robotics and computer vision. NVIDIA Isaac Sim provides powerful tools for creating diverse, high-quality synthetic datasets that can be used to train machine learning models without the need for expensive and time-consuming real-world data collection.

### Why Synthetic Data?

Synthetic data offers several advantages over real-world data:

- **Cost-effective**: No need for physical data collection campaigns
- **Safety**: Train models without risk to equipment or personnel
- **Control**: Precise control over environmental conditions
- **Scalability**: Generate large datasets quickly
- **Variety**: Create edge cases and rare scenarios
- **Annotation**: Perfect ground truth annotations automatically

## Isaac Sim Synthetic Data Framework

Isaac Sim provides a comprehensive framework for synthetic data generation with the following key components:

- **Sensor Simulation**: Accurate simulation of cameras, LiDAR, IMU, and other sensors
- **Domain Randomization**: Tools to randomize environments, lighting, and object properties
- **Ground Truth Generation**: Automatic generation of segmentation, depth, and other ground truth data
- **Data Pipeline**: Tools for exporting data in various formats

## Setting Up Synthetic Data Generation

### Prerequisites

Before starting synthetic data generation, ensure you have:

1. NVIDIA Isaac Sim installed
2. A suitable robot model
3. Python development environment
4. Understanding of USD (Universal Scene Description)

### Basic Synthetic Data Generation Script

Here's a comprehensive example for generating synthetic data:

```python
import omni
import carb
from omni.isaac.core import World
from omni.isaac.core.utils.stage import add_reference_to_stage
from omni.isaac.synthetic_utils import SyntheticDataHelper
from omni.isaac.synthetic_utils.sensors import *
from omni.isaac.synthetic_utils.visualizer import *
import numpy as np
import cv2
import os
from PIL import Image
from pxr import Gf, UsdGeom


class SyntheticDataGenerator:
    """
    A comprehensive synthetic data generator for Isaac Sim
    """

    def __init__(self, output_dir="synthetic_data", num_samples=1000):
        self.output_dir = output_dir
        self.num_samples = num_samples
        self.world = None
        self.sd_helper = None

        # Create output directories
        os.makedirs(f"{output_dir}/rgb", exist_ok=True)
        os.makedirs(f"{output_dir}/depth", exist_ok=True)
        os.makedirs(f"{output_dir}/segmentation", exist_ok=True)
        os.makedirs(f"{output_dir}/labels", exist_ok=True)

        # Initialize Isaac Sim world
        self.world = World(stage_units_in_meters=1.0)

        # Add a simple robot (using a basic cube as placeholder)
        add_reference_to_stage(
            usd_path="/Isaac/Robots/TurtleBot/turtlebot3_dqn.usd",
            prim_path="/World/Robot"
        )

        # Add a camera sensor
        self.setup_camera()

        # Initialize synthetic data helper
        self.sd_helper = SyntheticDataHelper()

    def setup_camera(self):
        """
        Set up camera sensor for data generation
        """
        # Create camera prim
        camera_path = "/World/Camera"
        camera_prim = self.world.stage.DefinePrim(camera_path, "Camera")

        # Set camera properties
        camera = UsdGeom.Camera(camera_prim)
        camera.GetFocalLengthAttr().Set(24.0)  # 24mm focal length
        camera.GetHorizontalApertureAttr().Set(20.955)  # 35mm equivalent
        camera.GetVerticalApertureAttr().Set(15.2908)   # 35mm equivalent

        # Position camera
        camera_prim.GetAttribute("xformOp:translate").Set(Gf.Vec3d(2.0, 0.0, 1.0))
        camera_prim.GetAttribute("xformOp:rotateXYZ").Set(Gf.Vec3d(0.0, 30.0, 0.0))

    def generate_sample(self, sample_id):
        """
        Generate a single synthetic data sample
        """
        # Randomize scene parameters
        self.randomize_scene()

        # Step the simulation to update randomizations
        self.world.step(render=True)

        # Get synthetic data
        try:
            # RGB image
            rgb_data = self.sd_helper.get_rgb_data()
            rgb_image = Image.fromarray(rgb_data, 'RGB')
            rgb_image.save(f"{self.output_dir}/rgb/sample_{sample_id:06d}.png")

            # Depth data
            depth_data = self.sd_helper.get_depth_data()
            # Normalize depth for visualization
            depth_normalized = ((depth_data - depth_data.min()) /
                               (depth_data.max() - depth_data.min()) * 255).astype(np.uint8)
            depth_image = Image.fromarray(depth_normalized, 'L')
            depth_image.save(f"{self.output_dir}/depth/sample_{sample_id:06d}.png")

            # Segmentation data
            seg_data = self.sd_helper.get_segmentation_data()
            seg_image = Image.fromarray(seg_data.astype(np.uint16), 'I;16')
            seg_image.save(f"{self.output_dir}/segmentation/sample_{sample_id:06d}.png")

            # Generate labels/annotations
            self.generate_labels(sample_id, seg_data)

            carb.log_info(f"Generated sample {sample_id}")

        except Exception as e:
            carb.log_error(f"Error generating sample {sample_id}: {e}")

    def randomize_scene(self):
        """
        Randomize various scene parameters for domain randomization
        """
        # Randomize lighting
        self.randomize_lighting()

        # Randomize object properties
        self.randomize_objects()

        # Randomize camera position
        self.randomize_camera()

    def randomize_lighting(self):
        """
        Randomize lighting conditions in the scene
        """
        # Get the default light
        light_path = "/World/light"
        light_prim = self.world.stage.GetPrimAtPath(light_path)

        if not light_prim.IsValid():
            # Create a light if it doesn't exist
            from omni.isaac.core.utils.prims import define_prim
            from omni.isaac.core.utils.light import add_light_to_stage

            add_light_to_stage(
                prim_path=light_path,
                light_type="DistantLight",
                color=[0.9, 0.9, 0.9],
                intensity=3000
            )
            light_prim = self.world.stage.GetPrimAtPath(light_path)

        # Randomize light properties
        import random
        intensity = random.uniform(1000, 5000)
        color = [random.uniform(0.8, 1.0), random.uniform(0.8, 1.0), random.uniform(0.8, 1.0)]

        # Update light attributes
        light_prim.GetAttribute("inputs:intensity").Set(intensity)
        light_prim.GetAttribute("inputs:color").Set(Gf.Vec3f(*color))

    def randomize_objects(self):
        """
        Randomize object properties in the scene
        """
        # This would typically randomize object positions, colors, textures, etc.
        # For this example, we'll just log what would be randomized
        carb.log_debug("Randomizing objects...")

    def randomize_camera(self):
        """
        Randomize camera position and orientation
        """
        import random

        camera_path = "/World/Camera"
        camera_prim = self.world.stage.GetPrimAtPath(camera_path)

        if camera_prim.IsValid():
            # Randomize position around the robot
            angle = random.uniform(0, 2 * 3.14159)
            distance = random.uniform(1.5, 3.0)
            height = random.uniform(0.5, 2.0)

            x = distance * np.cos(angle)
            y = distance * np.sin(angle)
            z = height

            camera_prim.GetAttribute("xformOp:translate").Set(Gf.Vec3d(x, y, z))

    def generate_labels(self, sample_id, segmentation_data):
        """
        Generate label information for the segmentation data
        """
        # Count unique objects in segmentation
        unique_ids = np.unique(segmentation_data)

        labels = {
            "sample_id": sample_id,
            "object_count": len(unique_ids) - 1,  # Exclude background (0)
            "objects": []
        }

        for obj_id in unique_ids:
            if obj_id == 0:  # Skip background
                continue

            # Find pixels belonging to this object
            mask = segmentation_data == obj_id
            pixel_count = np.sum(mask)

            # Calculate bounding box
            y_coords, x_coords = np.where(mask)
            if len(y_coords) > 0 and len(x_coords) > 0:
                bbox = {
                    "x_min": int(np.min(x_coords)),
                    "y_min": int(np.min(y_coords)),
                    "x_max": int(np.max(x_coords)),
                    "y_max": int(np.max(y_coords)),
                    "area": int(pixel_count)
                }

                labels["objects"].append({
                    "id": int(obj_id),
                    "bbox": bbox,
                    "pixel_count": int(pixel_count)
                })

        # Save labels as JSON
        import json
        with open(f"{self.output_dir}/labels/sample_{sample_id:06d}.json", 'w') as f:
            json.dump(labels, f, indent=2)

    def generate_dataset(self):
        """
        Generate the complete synthetic dataset
        """
        carb.log_info(f"Starting synthetic dataset generation: {self.num_samples} samples")

        # Reset the world
        self.world.reset()

        # Generate samples
        for i in range(self.num_samples):
            self.generate_sample(i)

            # Progress update
            if (i + 1) % 100 == 0:
                carb.log_info(f"Progress: {i + 1}/{self.num_samples} samples generated")

        carb.log_info(f"Dataset generation complete! Generated {self.num_samples} samples in {self.output_dir}")

    def cleanup(self):
        """
        Clean up resources
        """
        if self.world:
            self.world.clear()
            self.world = None


def main():
    """
    Main function to run synthetic data generation
    """
    # Initialize Isaac Sim
    omni.kit.pipapi.pip_install("numpy")
    omni.kit.pipapi.pip_install("Pillow")
    omni.kit.pipapi.pip_install("opencv-python")

    # Create synthetic data generator
    generator = SyntheticDataGenerator(
        output_dir="synthetic_robot_dataset",
        num_samples=100  # For demo purposes, using 100 samples
    )

    try:
        # Generate the dataset
        generator.generate_dataset()
    except Exception as e:
        carb.log_error(f"Error during dataset generation: {e}")
    finally:
        # Clean up
        generator.cleanup()


if __name__ == "__main__":
    main()
```

## Domain Randomization Techniques

Domain randomization is crucial for creating robust models that generalize well to real-world conditions. Here are several techniques you can implement:

### Lighting Randomization

```python
def randomize_lighting_conditions(self):
    """
    Advanced lighting randomization techniques
    """
    import random

    # Randomize multiple lights
    light_types = ["DistantLight", "DomeLight", "RectLight"]

    for i in range(3):  # Create 3 random lights
        light_path = f"/World/RandomLight_{i}"

        # Randomly choose light type
        light_type = random.choice(light_types)

        if light_type == "DistantLight":
            # Add distant light
            from omni.isaac.core.utils.light import add_distant_light
            add_distant_light(
                prim_path=light_path,
                color=[random.uniform(0.7, 1.0), random.uniform(0.7, 1.0), random.uniform(0.7, 1.0)],
                intensity=random.uniform(500, 5000),
                direction=[random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1)]
            )
        elif light_type == "DomeLight":
            # Add dome light
            from omni.isaac.core.utils.light import add_dome_light
            add_dome_light(
                prim_path=light_path,
                color=[random.uniform(0.5, 1.0), random.uniform(0.5, 1.0), random.uniform(0.5, 1.0)],
                intensity=random.uniform(300, 3000)
            )
        elif light_type == "RectLight":
            # Add rectangle light
            from omni.isaac.core.utils.light import add_rect_light
            add_rect_light(
                prim_path=light_path,
                width=random.uniform(0.5, 2.0),
                height=random.uniform(0.5, 2.0),
                color=[random.uniform(0.8, 1.0), random.uniform(0.8, 1.0), random.uniform(0.8, 1.0)],
                intensity=random.uniform(1000, 8000)
            )
```

### Material Randomization

```python
def randomize_materials(self):
    """
    Randomize materials for domain randomization
    """
    from omni.isaac.core.utils.materials import create_diffuse_material
    from omni.isaac.core.utils.prims import get_prim_at_path

    # Get all mesh prims in the scene
    stage = self.world.stage
    mesh_prims = [prim for prim in stage.TraverseAll() if prim.GetTypeName() == "Mesh"]

    for i, mesh_prim in enumerate(mesh_prims):
        # Create random material properties
        diffuse_color = [
            random.uniform(0.1, 1.0),
            random.uniform(0.1, 1.0),
            random.uniform(0.1, 1.0)
        ]

        material_path = f"/World/Looks/Material_{i}"

        # Create material
        material = create_diffuse_material(
            prim_path=material_path,
            color=diffuse_color
        )

        # Apply material to mesh
        mesh_prim.GetAttribute("material:binding").Set(material.prim.GetPath())
```

### Environment Randomization

```python
def randomize_environment(self):
    """
    Randomize environment properties
    """
    import random

    # Randomize background
    if random.random() > 0.5:
        # Use dome light with environment texture
        from omni.isaac.core.utils.light import add_dome_light
        add_dome_light(
            prim_path="/World/domeLight",
            color=[random.uniform(0.5, 0.8), random.uniform(0.5, 0.8), random.uniform(0.6, 0.9)],
            intensity=random.uniform(100, 500)
        )
    else:
        # Use simple background
        from omni.isaac.core.utils.prims import create_primitive
        create_primitive(
            prim_path="/World/background",
            prim_type="Sphere",
            scale=[50, 50, 50],
            position=[0, 0, -49.5],
            orientation=[0, 0, 0, 1]
        )
```

## Advanced Synthetic Data Pipelines

### Multi-Sensor Data Generation

```python
class MultiSensorDataGenerator:
    """
    Generate synthetic data from multiple sensors simultaneously
    """

    def __init__(self):
        self.sensors = []
        self.setup_multi_sensors()

    def setup_multi_sensors(self):
        """
        Set up multiple sensors for comprehensive data capture
        """
        # RGB Camera
        self.add_camera_sensor("/World/Camera/RGB", sensor_type="rgb")

        # Depth Camera
        self.add_camera_sensor("/World/Camera/Depth", sensor_type="depth")

        # Semantic Segmentation Camera
        self.add_camera_sensor("/World/Camera/Seg", sensor_type="segmentation")

        # LiDAR Sensor
        self.add_lidar_sensor("/World/LiDAR")

    def add_camera_sensor(self, prim_path, sensor_type):
        """
        Add a camera sensor to the scene
        """
        from omni.isaac.sensor import Camera

        camera = Camera(
            prim_path=prim_path,
            frequency=30,  # 30 Hz
            resolution=(640, 480)
        )

        self.sensors.append({
            'type': 'camera',
            'sensor': camera,
            'sensor_type': sensor_type
        })

    def add_lidar_sensor(self, prim_path):
        """
        Add a LiDAR sensor to the scene
        """
        from omni.isaac.sensor import RotatingLidarSensor

        lidar = RotatingLidarSensor(
            prim_path=prim_path,
            translation=np.array([0, 0, 0.5]),
            orientation=np.array([0, 0, 0, 1]),
            fov=360,
            horizontal_resolution=0.25,
            vertical_resolution=2.0,
            range=25.0
        )

        self.sensors.append({
            'type': 'lidar',
            'sensor': lidar,
            'sensor_type': 'lidar'
        })

    def capture_multi_sensor_data(self):
        """
        Capture data from all sensors simultaneously
        """
        data_bundle = {}

        for sensor_info in self.sensors:
            sensor_type = sensor_info['sensor_type']

            if sensor_info['type'] == 'camera':
                if sensor_type == 'rgb':
                    data_bundle['rgb'] = sensor_info['sensor'].get_rgb()
                elif sensor_type == 'depth':
                    data_bundle['depth'] = sensor_info['sensor'].get_depth()
                elif sensor_type == 'segmentation':
                    data_bundle['segmentation'] = sensor_info['sensor'].get_semantic_segmentation()

            elif sensor_info['type'] == 'lidar':
                data_bundle['lidar'] = sensor_info['sensor'].get_point_cloud()

        return data_bundle
```

## Data Annotation and Labeling

### Semantic Segmentation Labeling

```python
class SemanticSegmentationAnnotator:
    """
    Generate semantic segmentation labels for synthetic data
    """

    def __init__(self):
        self.label_map = {}
        self.next_label_id = 1

    def create_label_map(self, stage):
        """
        Create a mapping from USD prim paths to semantic labels
        """
        # Define semantic categories
        categories = {
            "robot": ["Robot", "TurtleBot", "Franka", "UR5"],
            "floor": ["Ground", "Floor", "Plane"],
            "wall": ["Wall", "Obstacle"],
            "furniture": ["Table", "Chair", "Desk"],
            "object": ["Box", "Cylinder", "Sphere"]
        }

        # Traverse the stage and assign semantic labels
        for prim in stage.TraverseAll():
            prim_type = prim.GetTypeName()
            prim_name = prim.GetName()

            for category, keywords in categories.items():
                if any(keyword.lower() in prim_name.lower() for keyword in keywords):
                    self.label_map[prim.GetPath().pathString] = {
                        "id": self.next_label_id,
                        "category": category,
                        "name": prim_name
                    }
                    self.next_label_id += 1
                    break

    def generate_segmentation_mask(self, raw_seg_data, stage):
        """
        Generate semantic segmentation mask from raw segmentation data
        """
        # Convert raw segmentation IDs to semantic labels
        semantic_mask = np.zeros_like(raw_seg_data, dtype=np.uint16)

        for prim_path, label_info in self.label_map.items():
            # Find pixels with this prim's segmentation ID
            # (This is a simplified example - actual implementation would depend on Isaac Sim's segmentation system)
            pass

        return semantic_mask
```

## Data Format Conversion and Export

### Export to Common ML Formats

```python
class DataExporter:
    """
    Export synthetic data in various ML-friendly formats
    """

    @staticmethod
    def export_to_coco_format(data_dir, output_path):
        """
        Export data to COCO format for object detection
        """
        import json
        import os
        from PIL import Image

        # Initialize COCO format structure
        coco_format = {
            "info": {
                "description": "Synthetic Robot Dataset",
                "version": "1.0",
                "year": 2025,
                "contributor": "Isaac Sim Synthetic Data Generator",
                "date_created": "2025-01-01"
            },
            "licenses": [
                {
                    "id": 1,
                    "name": "Synthetic Data License",
                    "url": "http://example.com/license"
                }
            ],
            "categories": [
                {
                    "id": 1,
                    "name": "robot",
                    "supercategory": "object"
                },
                {
                    "id": 2,
                    "name": "obstacle",
                    "supercategory": "object"
                }
            ],
            "images": [],
            "annotations": []
        }

        # Process each image
        rgb_dir = os.path.join(data_dir, "rgb")
        label_dir = os.path.join(data_dir, "labels")

        image_id = 1
        annotation_id = 1

        for filename in os.listdir(rgb_dir):
            if filename.endswith('.png'):
                # Add image info
                img_path = os.path.join(rgb_dir, filename)
                img = Image.open(img_path)
                width, height = img.size

                coco_format["images"].append({
                    "id": image_id,
                    "width": width,
                    "height": height,
                    "file_name": filename,
                    "license": 1,
                    "flickr_url": "",
                    "coco_url": "",
                    "date_captured": "2025-01-01"
                })

                # Load corresponding labels
                label_file = os.path.join(label_dir, filename.replace('.png', '.json'))
                if os.path.exists(label_file):
                    with open(label_file, 'r') as f:
                        labels = json.load(f)

                    # Add annotations
                    for obj in labels.get("objects", []):
                        bbox = obj["bbox"]
                        coco_format["annotations"].append({
                            "id": annotation_id,
                            "image_id": image_id,
                            "category_id": 1,  # Default to robot category
                            "bbox": [
                                bbox["x_min"],
                                bbox["y_min"],
                                bbox["x_max"] - bbox["x_min"],  # width
                                bbox["y_max"] - bbox["y_min"]   # height
                            ],
                            "area": obj["pixel_count"],
                            "iscrowd": 0
                        })
                        annotation_id += 1

                image_id += 1

        # Save COCO format
        with open(output_path, 'w') as f:
            json.dump(coco_format, f, indent=2)

    @staticmethod
    def export_to_kitti_format(data_dir, output_path):
        """
        Export data to KITTI format for 3D object detection
        """
        # Implementation for KITTI format export
        pass
```

## Practical Lab: Creating a Synthetic Dataset

### Lab: Generate a Dataset for Object Detection

**Objective**: Create a synthetic dataset with 500 samples for training an object detection model.

**Steps**:
1. Set up a scene with multiple objects
2. Implement domain randomization
3. Generate RGB and segmentation data
4. Create COCO-formatted annotations
5. Validate the dataset

**Complete Implementation**:

```python
#!/usr/bin/env python3
"""
Synthetic Dataset Generation Lab
Create a synthetic dataset for object detection using Isaac Sim
"""

import omni
from omni.isaac.core import World
from omni.isaac.core.utils.stage import add_reference_to_stage
from omni.isaac.core.utils.prims import create_primitive
from omni.isaac.core.utils.nucleus import get_assets_root_path
from omni.isaac.synthetic_utils import SyntheticDataHelper
from omni.isaac.core.utils import viewports
import numpy as np
import cv2
from PIL import Image
import json
import os
import random
from pxr import Gf, UsdGeom


class ObjectDetectionDatasetGenerator:
    """
    Generate a synthetic dataset for object detection
    """

    def __init__(self, output_dir="object_detection_dataset", num_samples=500):
        self.output_dir = output_dir
        self.num_samples = num_samples
        self.world = None
        self.sd_helper = None

        # Create output directories
        os.makedirs(f"{output_dir}/images", exist_ok=True)
        os.makedirs(f"{output_dir}/labels", exist_ok=True)
        os.makedirs(f"{output_dir}/annotations", exist_ok=True)

        # Initialize Isaac Sim world
        self.world = World(stage_units_in_meters=1.0)

        # Setup scene
        self.setup_scene()

        # Initialize synthetic data helper
        self.sd_helper = SyntheticDataHelper()

        # Object categories for labeling
        self.categories = {
            "robot": 1,
            "box": 2,
            "cylinder": 3,
            "sphere": 4
        }

    def setup_scene(self):
        """
        Set up the initial scene with objects
        """
        # Add ground plane
        create_primitive(
            prim_path="/World/ground_plane",
            prim_type="Plane",
            scale=np.array([10.0, 10.0, 1.0]),
            position=np.array([0, 0, 0]),
            orientation=np.array([0.707, 0, 0, 0.707])  # Rotate 90 degrees
        )

        # Add basic robot
        assets_root_path = get_assets_root_path()
        if assets_root_path:
            add_reference_to_stage(
                usd_path=assets_root_path + "/Isaac/Robots/TurtleBot/turtlebot3_dqn.usd",
                prim_path="/World/Robot"
            )

    def randomize_scene(self, sample_id):
        """
        Randomize the scene for domain randomization
        """
        # Clear previous objects
        self.clear_objects()

        # Add random objects
        num_objects = random.randint(3, 8)  # 3-8 objects per scene

        for i in range(num_objects):
            obj_type = random.choice(["box", "cylinder", "sphere"])
            obj_name = f"object_{i}"
            prim_path = f"/World/{obj_name}"

            # Random position
            x = random.uniform(-3, 3)
            y = random.uniform(-3, 3)
            z = random.uniform(0.1, 2)  # Above ground

            # Random scale
            scale = random.uniform(0.1, 0.5)

            if obj_type == "box":
                create_primitive(
                    prim_path=prim_path,
                    prim_type="Cube",
                    scale=np.array([scale, scale, scale]),
                    position=np.array([x, y, z]),
                    orientation=np.array([0, 0, 0, 1])
                )
            elif obj_type == "cylinder":
                create_primitive(
                    prim_path=prim_path,
                    prim_type="Cylinder",
                    scale=np.array([scale, scale, scale]),
                    position=np.array([x, y, z]),
                    orientation=np.array([0, 0, 0, 1])
                )
            elif obj_type == "sphere":
                create_primitive(
                    prim_path=prim_path,
                    prim_type="Sphere",
                    scale=np.array([scale, scale, scale]),
                    position=np.array([x, y, z]),
                    orientation=np.array([0, 0, 0, 1])
                )

    def clear_objects(self):
        """
        Clear all objects except the ground and robot
        """
        stage = self.world.stage
        for prim in stage.TraverseAll():
            prim_name = prim.GetName()
            if (prim.GetTypeName() in ["Cube", "Cylinder", "Sphere"] and
                not prim.GetPath().pathString.startswith("/World/ground") and
                not prim.GetPath().pathString.startswith("/World/Robot")):
                stage.RemovePrim(prim.GetPath())

    def generate_sample(self, sample_id):
        """
        Generate a single sample with image and annotations
        """
        # Randomize scene
        self.randomize_scene(sample_id)

        # Step simulation
        self.world.step(render=True)

        try:
            # Get RGB data
            rgb_data = self.sd_helper.get_rgb_data()
            rgb_image = Image.fromarray(rgb_data, 'RGB')
            image_filename = f"image_{sample_id:06d}.jpg"
            rgb_image.save(f"{self.output_dir}/images/{image_filename}")

            # Generate annotations
            annotations = self.generate_annotations(sample_id)

            # Save annotations
            annotation_filename = f"annotation_{sample_id:06d}.json"
            with open(f"{self.output_dir}/annotations/{annotation_filename}", 'w') as f:
                json.dump(annotations, f, indent=2)

            print(f"Generated sample {sample_id}: {image_filename}")

        except Exception as e:
            print(f"Error generating sample {sample_id}: {e}")

    def generate_annotations(self, sample_id):
        """
        Generate bounding box annotations for the sample
        """
        annotations = {
            "image_id": sample_id,
            "width": 640,  # Assuming 640x480 resolution
            "height": 480,
            "objects": []
        }

        # This would typically involve processing segmentation data
        # to get bounding boxes. For this example, we'll simulate
        # the process by creating random bounding boxes
        stage = self.world.stage
        for prim in stage.TraverseAll():
            prim_name = prim.GetName()
            if prim_name.startswith("object_"):
                # Simulate getting bounding box from segmentation
                # In real implementation, you'd use segmentation data
                bbox = {
                    "x_min": random.randint(50, 550),
                    "y_min": random.randint(50, 400),
                    "x_max": random.randint(100, 600),
                    "y_max": random.randint(100, 450),
                    "category": "object",
                    "confidence": 1.0  # Perfect confidence in synthetic data
                }

                annotations["objects"].append(bbox)

        return annotations

    def generate_dataset(self):
        """
        Generate the complete dataset
        """
        print(f"Generating {self.num_samples} samples...")

        # Reset world
        self.world.reset()

        # Generate samples
        for i in range(self.num_samples):
            self.generate_sample(i)

            if (i + 1) % 50 == 0:
                print(f"Progress: {i + 1}/{self.num_samples}")

        # Generate COCO format annotations
        self.generate_coco_annotations()

        print(f"Dataset generation complete! Output saved to {self.output_dir}")

    def generate_coco_annotations(self):
        """
        Generate COCO format annotations for the entire dataset
        """
        coco_format = {
            "info": {
                "description": "Synthetic Object Detection Dataset",
                "version": "1.0",
                "year": 2025,
                "contributor": "Isaac Sim",
                "date_created": "2025-01-01"
            },
            "licenses": [{"id": 1, "name": "Synthetic Data License", "url": ""}],
            "categories": [
                {"id": 1, "name": "robot", "supercategory": "object"},
                {"id": 2, "name": "box", "supercategory": "object"},
                {"id": 3, "name": "cylinder", "supercategory": "object"},
                {"id": 4, "name": "sphere", "supercategory": "object"}
            ],
            "images": [],
            "annotations": []
        }

        # Add image entries
        image_id = 1
        annotation_id = 1

        for filename in sorted(os.listdir(f"{self.output_dir}/images")):
            if filename.endswith(('.jpg', '.png')):
                # Add image info
                coco_format["images"].append({
                    "id": image_id,
                    "width": 640,
                    "height": 480,
                    "file_name": filename,
                    "license": 1
                })

                # Load and add annotations
                annotation_file = f"annotation_{image_id-1:06d}.json"
                annotation_path = f"{self.output_dir}/annotations/{annotation_file}"

                if os.path.exists(annotation_path):
                    with open(annotation_path, 'r') as f:
                        img_annotations = json.load(f)

                    for obj in img_annotations["objects"]:
                        coco_format["annotations"].append({
                            "id": annotation_id,
                            "image_id": image_id,
                            "category_id": 2,  # Default to box category
                            "bbox": [
                                obj["x_min"],
                                obj["y_min"],
                                obj["x_max"] - obj["x_min"],
                                obj["y_max"] - obj["y_min"]
                            ],
                            "area": (obj["x_max"] - obj["x_min"]) * (obj["y_max"] - obj["y_min"]),
                            "iscrowd": 0
                        })
                        annotation_id += 1

                image_id += 1

        # Save COCO annotations
        with open(f"{self.output_dir}/coco_annotations.json", 'w') as f:
            json.dump(coco_format, f, indent=2)

    def cleanup(self):
        """
        Clean up resources
        """
        if self.world:
            self.world.clear()
            self.world = None


def main():
    """
    Main function to run the synthetic dataset generation
    """
    # Create dataset generator
    generator = ObjectDetectionDatasetGenerator(
        output_dir="synthetic_object_detection_dataset",
        num_samples=100  # Using 100 for demo, can be increased
    )

    try:
        # Generate dataset
        generator.generate_dataset()
    except Exception as e:
        print(f"Error during dataset generation: {e}")
    finally:
        # Clean up
        generator.cleanup()


if __name__ == "__main__":
    main()
```

## Data Quality Assurance and Validation

### Dataset Validation Tools

```python
class DatasetValidator:
    """
    Validate synthetic datasets for quality and consistency
    """

    @staticmethod
    def validate_image_quality(image_path):
        """
        Validate image quality metrics
        """
        img = cv2.imread(image_path)

        if img is None:
            return False, "Could not load image"

        # Check for common issues
        mean_brightness = np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
        if mean_brightness < 30:  # Too dark
            return False, "Image too dark"
        elif mean_brightness > 225:  # Too bright
            return False, "Image too bright"

        # Check for blur
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 100:  # Too blurry
            return False, f"Image too blurry (variance: {laplacian_var})"

        return True, "Valid"

    @staticmethod
    def validate_annotations(annotation_path, image_path):
        """
        Validate annotation consistency with image
        """
        with open(annotation_path, 'r') as f:
            annotations = json.load(f)

        img = cv2.imread(image_path)
        if img is None:
            return False, "Could not load image for validation"

        height, width = img.shape[:2]

        for obj in annotations.get("objects", []):
            bbox = obj.get("bbox", {})
            x_min, y_min = bbox.get("x_min", 0), bbox.get("y_min", 0)
            x_max, y_max = bbox.get("x_max", 0), bbox.get("y_max", 0)

            # Validate bounding box coordinates
            if x_min < 0 or y_min < 0 or x_max > width or y_max > height:
                return False, f"Bounding box out of image bounds: {bbox}"

            if x_min >= x_max or y_min >= y_max:
                return False, f"Invalid bounding box: {bbox}"

        return True, "Valid"
```

## Best Practices for Synthetic Data Generation

### Performance Optimization

1. **Batch Processing**: Process multiple samples in parallel
2. **Resolution Management**: Use appropriate resolutions for your use case
3. **Scene Complexity**: Balance realism with performance
4. **Memory Management**: Clear unused data between samples

### Quality Assurance

1. **Validation Pipeline**: Always validate generated data
2. **Diversity Check**: Ensure good coverage of scenarios
3. **Realism Assessment**: Compare with real-world data when possible
4. **Annotation Accuracy**: Verify ground truth annotations

### Domain Randomization Strategy

1. **Gradual Introduction**: Start with minimal randomization
2. **Physics Consistency**: Maintain physically plausible scenarios
3. **Realism Bounds**: Don't randomize beyond realistic bounds
4. **Validation**: Test model performance on real data regularly

## Summary

Synthetic data generation with Isaac Sim provides a powerful approach to creating large, diverse, and perfectly annotated datasets for AI training. This module covered:

- Basic synthetic data generation setup and implementation
- Domain randomization techniques for robust model training
- Multi-sensor data generation pipelines
- Annotation and labeling strategies
- Data export to standard ML formats
- Quality assurance and validation techniques

The hands-on lab provided practical experience with creating a complete synthetic dataset for object detection, demonstrating the full pipeline from scene setup to dataset export.