---
title: VSLAM-Nav2 Integration Details
sidebar_position: 6 
---

# VSLAM-Nav2 Integration Details

This section provides more in-depth guidance on integrating Visual SLAM (VSLAM) with the Navigation 2 (Nav2) stack for robust autonomous navigation in environments mapped by the robot itself.

## Robust Path Planning on VSLAM Maps

VSLAM systems generate `OccupancyGrid` maps that can be directly utilized by Nav2's global planners. This allows the robot to navigate based on the environment it has mapped in real-time.

**Configuration for Nav2 Costmap:**

To incorporate the VSLAM-generated map into Nav2's navigation process, configure the `global_costmap` to use a `StaticLayer` that subscribes to the VSLAM map topic (e.g., `/vslam/occ_grid_map`). This enables Nav2's global planner to generate paths considering the dynamically mapped environment.

**Example `nav2_params.yaml` Snippet:**

```yaml
# global_costmap:
#   ros__parameters:
#     plugins: ["costmap_filter_layer", "static_layer", "obstacle_layer"]
#     costmap_filter_layer:
#       plugin: "nav2_costmap_2d/CostmapFilter"
#       # ... (other layer configurations if needed) ...
#     static_layer: # This layer will ingest the VSLAM map
#       plugin: "nav2_costmap_2d/StaticLayer"
#       map_topic: "/vslam/occ_grid_map" # Topic publishing the VSLAM OccupancyGrid
#       first_map_only: false
#       unknown_cost_value: 0 # Treat unknown cells as free space initially
#       trinary_encoding: true # Use -1 (unknown), 0 (free), 100 (occupied)
#       # ... (other static layer parameters) ...
#     obstacle_layer:
#       plugin: "nav2_costmap_2d/ObstacleLayer"
#       # ... (configurations for sensors like LiDAR, depth cameras) ...

# Ensure your planner is configured to use the global costmap
# planner_server:
#   ros__parameters:
#     planner_plugins: ["grid_based"]
#     grid_based:
#       plugin: "nav2_smac_planner/SmacPlanner2D"
#       # ... (planner specific parameters) ...
```

---

## Enhanced Obstacle Avoidance Logic

Local navigation must react to immediate obstacles detected by sensors, potentially overriding the global path to ensure safety. This complements global path planning by handling dynamic, short-range obstacles.

**Illustrative Code Snippet (within a ROS 2 controller node):**

This snippet shows how a controller node can integrate local sensor data for immediate obstacle avoidance.

```python
# In a ROS 2 node managing robot velocity commands and local avoidance
# Assumes subscription to '/scan' topic and publisher to '/cmd_vel'

def compute_velocity_command_with_local_avoidance(self, current_pose, global_path):
    # First, determine the desired velocity based on the global path
    desired_cmd = self.follow_global_path(current_pose, global_path) # Assume this function exists

    # --- Local Obstacle Avoidance Check ---
    min_sensor_distance = self.get_min_distance_from_laser_scan() # Function to process '/scan' data

    # Define a safe distance threshold
    safe_distance_threshold = 0.5 # meters

    if min_sensor_distance < safe_distance_threshold:
        self.get_logger().warn(f"Immediate obstacle detected at {min_sensor_distance:.2f}m. Reacting.")
        # Override desired command to avoid obstacle by rotating
        avoidance_cmd = Twist()
        avoidance_cmd.linear.x = 0.0
        avoidance_cmd.angular.z = self.angular_speed # Rotate to clear obstacle
        return avoidance_cmd
    # --- End Local Obstacle Avoidance ---

    # If no immediate obstacle, use the desired command from global path following
    return desired_cmd
```

---

## Exploration Strategy Details

Autonomous exploration requires the robot to navigate towards unexplored areas. This can be achieved by identifying "frontiers" – areas on the boundary between known free space and unknown space within the `OccupancyGrid`. The robot then navigates to the closest or most promising frontier.

**Illustrative Algorithm (Conceptual Python Snippet for Frontier Detection):**

```python
# Inside the exploration logic of the VSLAM-Nav2 system node
def find_exploration_goal(self):
    # Assumes self.current_map is an OccupancyGrid message
    # Convert ROS message data to a NumPy array for easier processing
    grid_data = np.array(self.current_map.data).reshape(self.current_map.info.height, self.current_map.info.width)

    frontiers = []
    # Iterate through grid cells to find frontiers
    for y in range(grid_data.shape[0]):
        for x in range(grid_data.shape[1]):
            if grid_data[y, x] == -1: # Unknown cell (-1 in OccupancyGrid)
                # Check 8 neighbors for free space (0)
                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        if dx == 0 and dy == 0: continue # Skip self
                        nx, ny = x + dx, y + dy
                        # Check bounds
                        if 0 <= ny < grid_data.shape[0] and 0 <= nx < grid_data.shape[1]:
                            if grid_data[ny, nx] == 0: # Found a free neighbor
                                # Convert map index (x, y) to world coordinates using map info
                                world_x, world_y = self.map_to_world_coords(x, y) 
                                frontiers.append((world_x, world_y))
                                break # Found a frontier cell, move to next neighbor check
                    if len(frontiers) > 0 and frontiers[-1][0] == world_x and frontiers[-1][1] == world_y: break # Exit inner loop if frontier found
                if len(frontiers) > 0 and frontiers[-1][0] == world_x and frontiers[-1][1] == world_y: break # Exit outer loop if frontier found

    if not frontiers:
        self.get_logger().info("No frontiers found for exploration. Exploration may be complete.")
        return None

    # Select the closest frontier to the robot's current position for navigation
    current_x, current_y = self.current_pose.position.x, self.current_pose.position.y
    closest_frontier_world = min(frontiers, key=lambda f:
                                 np.sqrt((f[0] - current_x)**2 + (f[1] - current_y)**2))

    # Create a PoseStamped goal for the closest frontier
    goal_pose = PoseStamped()
    goal_pose.header.stamp = self.get_clock().now().to_msg()
    goal_pose.header.frame_id = 'map' # Assuming VSLAM provides 'map' frame
    goal_pose.pose.position.x = closest_frontier_world[0]
    goal_pose.pose.position.y = closest_frontier_world[1]
    goal_pose.pose.orientation.w = 1.0 # Default orientation
    return goal_pose

def map_to_world_coords(self, map_x, map_y):
    """Helper to convert map indices to world coordinates."""
    # This would use the map metadata (resolution, origin) from the OccupancyGrid message
    resolution = self.current_map.info.resolution
    origin_x = self.current_map.info.origin.position.x
    origin_y = self.current_map.info.origin.position.y

    world_x = origin_x + map_x * resolution
    world_y = origin_y + map_y * resolution
    return world_x, world_y
```
