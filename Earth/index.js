import * as THREE from 'three';
// import { OrbitControls } from '../libs/jsm143/controls/OrbitControls.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setClearColor(0x000000, 1); // Set a dark background to simulate space
document.body.appendChild(renderer.domElement);

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * (Math.PI / 180); // Earth's axial tilt
earthGroup.rotation.y = Math.PI / 2; // Rotate to face the camera
scene.add(earthGroup);

// Load additional textures for realism
const textureLoader = new THREE.TextureLoader();
const bumpMap = textureLoader.load("./earthbump1k.jpg"); // Bump map for surface details
const specularMap = textureLoader.load("./earthspec1k.jpg"); // Specular map for reflections

const geometry = new THREE.IcosahedronGeometry(1, 12);
const material = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./earthmap1k.jpg"), // Diffuse map
    bumpMap: bumpMap,
    bumpScale: 0.05, // Adjust bump intensity
    specularMap: specularMap,
    specular: new THREE.Color(0x333333), // Specular color for reflections
});
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

// Create a glowing atmosphere effect
const atmosphereGeometry = new THREE.SphereGeometry(1.05, 32, 32); // Adjust the atmosphere geometry for a thinner glow
const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.0, 0.3, 0.8, 1.0) * intensity;
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
});
const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
earthGroup.add(atmosphereMesh);

// Update starfield for varying sizes and brightness
function getStarfield({ numStars = 5000, radius = 200 } = {}) {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });

    const positions = [];
    const colors = [];
    for (let i = 0; i < numStars; i++) {
        const x = (Math.random() - 0.5) * radius * 2;
        const y = (Math.random() - 0.5) * radius * 2;
        const z = (Math.random() - 0.5) * radius * 2;
        positions.push(x, y, z);

        // Randomize star brightness
        const brightness = Math.random() * 0.8 + 0.2;
        colors.push(brightness, brightness, brightness);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return new THREE.Points(starGeometry, starMaterial);
}
const stars = getStarfield({ numStars: 5000, radius: 300 });
scene.add(stars);

const controls = new OrbitControls(camera, renderer.domElement);

// Add ambient light for softer lighting
const ambientLight = new THREE.AmbientLight(0x222222); // Dim ambient light
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

function animate(t = 0) {
    requestAnimationFrame(animate);
    earthMesh.rotation.y = t * 0.000005; // Decreased rotation speed for a slower effect
    earthMesh.rotation.x = t * 0.0002;  // Decreased rotation on the x-axis
    renderer.render(scene, camera);
    controls.update();
}
animate();