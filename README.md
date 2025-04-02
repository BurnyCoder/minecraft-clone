# Block Sandbox

A simple Minecraft-inspired block building sandbox built with Three.js.

![Minecraft Sandbox](mc.jpg)

## How to Run

1.  Ensure you have a web server capable of serving static files (e.g., Python's `http.server`, Node's `serve`, or live server extensions in IDEs).
2.  Serve the `index.html` file from the project root.
    - Example using Python 3: `python -m http.server`
3.  Open the served URL (usually `http://localhost:8000`) in your web browser.

*(Note: You need to add an image named `mc.jpg` to the root directory for the screenshot to display.)*

## Features

*   **Infinite Voxel World:** Explore a procedurally generated world (currently fixed size).
*   **Block Interaction:** Place and break different block types.
*   **Player Movement:** Standard FPS controls (WASD), jumping (Space), and descending (Shift).
*   **Pointer Lock Controls:** Immersive mouse look.
*   **Hotbar:** Select blocks using numbers (1-9) or the scroll wheel.
*   **Block Drops:** Breaking certain blocks yields collectible items (e.g., Stone drops Cobblestone).
*   **Collected Item Counter:** Tracks the blocks you've gathered.
*   **Basic Physics:** Gravity affects the player and certain blocks (Sand).
*   **Sound Effects:** Basic sounds for placing, breaking, jumping, and footsteps.
*   **Day/Night Cycle:** Dynamic sky color, fog, and lighting changes over time.

## Controls

*   **Mouse Click:** Lock pointer into the game window.
*   **WASD:** Move Forward / Left / Backward / Right
*   **Space:** Jump
*   **Shift:** Descend / Sneak (currently just moves down)
*   **Mouse:** Look around
*   **Left Mouse Button (Hold):** Break the targeted block.
*   **Right Mouse Button:** Place the selected block.
*   **Scroll Wheel / Keys 1-9:** Select active block in the hotbar.
*   **ESC:** Unlock mouse pointer.

## Block Types

The following blocks are currently available:

*   Grass (Drops Dirt)
*   Dirt
*   Stone (Drops Cobblestone)
*   Wood
*   Leaves (No drops)
*   Sand (Affected by gravity)
*   Glass (Transparent, no drops)
*   Cobblestone
*   Planks 