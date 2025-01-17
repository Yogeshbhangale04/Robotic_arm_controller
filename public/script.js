  import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
  import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
  import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
  // Establish socket connection
  const socket = io();

  // List of servo names
  const servos = ['servo1', 'servo2', 'servo3', 'servo4'];

  // Attach event listeners to sliders
  servos.forEach((servo) => {
    const slider = document.getElementById(servo);

    if (slider) {
      // Send updated servo value to the server when the slider changes
      slider.addEventListener('input', () => {
        const value = parseInt(slider.value, 10);
        socket.emit('updateServo', { [servo]: value });
        console.log(`Servo: ${servo}, Value: ${value}`);
        // Update the displayed value
        document.getElementById(`${servo}-value`).textContent = value;
      });
    }
  });

  // Update slider positions when receiving data from the server
  socket.on('servoUpdate', (data) => {
    servos.forEach((servo) => {
      const slider = document.getElementById(servo);
      if (slider && data[servo] !== undefined) {
        slider.value = data[servo];


        document.getElementById(`${servo}-value`).textContent = data[servo];
      }
    });
  });

  // Initialize sliders with the current servo positions from the server
  socket.on('init', (data) => {
    servos.forEach((servo) => {
      const slider = document.getElementById(servo);
      if (slider && data[servo] !== undefined) {
        slider.value = data[servo];
        document.getElementById(`${servo}-value`).textContent = data[servo];
      }
    });
  });

// // Import the required libraries
// import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa); // Light gray background

// Create a perspective camera
const camera = new THREE.PerspectiveCamera(
  75,
  (window.innerWidth / 2) / window.innerHeight, // Adjust aspect ratio for half-width canvas
  0.1,
  1000
);
camera.position.set(0, 10, 30); // Adjust the position to fit your model

// Create the WebGL renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth / 2, window.innerHeight); // Render only on half the screen width
renderer.shadowMap.enabled = true; // Enable shadows
document.getElementById('container3D').appendChild(renderer.domElement); // Append to the container div

// Add orbit controls for interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05;

// Add lighting to the scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true; // Enable shadows
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft ambient light
scene.add(ambientLight);

// Load the GLTF model
let model; // Global variable for the model
const loader = new GLTFLoader();

loader.load(
  './models/arm/scene.gltf', // Path to your .gltf file
  function (gltf) {
    model = gltf.scene;
    model.scale.set(15, 15, 15); // Adjust the scale
    model.position.set(0, -3, 0); // Adjust the position
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(model);
    console.log('Model loaded successfully!');
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred while loading the model:', error);
  }
);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = (window.innerWidth / 2) / window.innerHeight; // Adjust for half-width canvas
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth / 2, window.innerHeight);
});

// Animate the scene with a loop
function animate() {
  requestAnimationFrame(animate);

  // Add a loop to animate the robotic arm
  if (model) {
    // Rotate the base of the robotic arm
    model.rotation.y += 0.01; // Rotate continuously along the Y-axis

    // Oscillate a specific joint (replace 'joint_name' with the name of your joint)
    model.traverse((child) => {
      if (child.name === 'joint_name') { // Replace with your joint's actual name
        const time = Date.now() * 0.001; // Time in seconds
        child.rotation.z = Math.sin(time) * Math.PI / 6; // Oscillate ±30 degrees
      }
    });
  }

  controls.update(); // Update orbit controls
  renderer.render(scene, camera);
}

// Start the animation loop
animate();

