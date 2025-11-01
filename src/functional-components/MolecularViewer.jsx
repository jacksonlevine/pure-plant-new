import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// ===== GLOBAL SINGLETONS =====
let sharedRenderer;
let sharedScene;
let sharedCamera;
let sharedControls;
let sharedSprites = [];
let animationFrameId;
let cycleInterval;
let resizeObserver;

const POSITION_SETS = [
    [
        [-0.4, -0.4, -0.4],
        [0.4, -0.4, -0.4],
        [-0.4, 0.4, -0.4],
        [0.4, 0.4, -0.4],
        [-0.4, -0.4, 0.4],
        [0.4, -0.4, 0.4],
        [-0.4, 0.4, 0.4],
        [0.4, 0.4, 0.4],
    ],
    Array.from({ length: 50 }, () => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.4;
        return [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)];
    }),
    Array.from({ length: 50 }, (_, i) => {
        const t = (i / 50) * Math.PI * 4;
        return [0.3 * Math.cos(t), i / 50 - 0.5, 0.3 * Math.sin(t)];
    }),
    Array.from({ length: 50 }, () => [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]),
];

const maxPoints = 50;

// ===== ANIMATION STATE =====
let currentSet = 0;
let progress = 0;
let animating = false;

const transition = (idx) => {
    const set = POSITION_SETS[idx];
    sharedSprites.forEach((s, i) => {
        s.userData.start.copy(s.position);
        s.userData.fadeStart = s.material.opacity;
        if (i < set.length) {
            s.userData.target.set(...set[i]);
            s.userData.fadeEnd = 1;
        } else {
            s.userData.target.copy(s.position);
            s.userData.fadeEnd = 0;
        }
    });
    progress = 0;
    animating = true;
};

const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    if (animating) {
        progress += 0.01;
        if (progress >= 1) {
            progress = 1;
            animating = false;
        }
        const t = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        sharedSprites.forEach((s) => {
            s.position.lerpVectors(s.userData.start, s.userData.target, t);
            s.material.opacity = THREE.MathUtils.lerp(s.userData.fadeStart, s.userData.fadeEnd, t);
        });
    }

    sharedControls?.update();
    sharedRenderer?.render(sharedScene, sharedCamera);
};

const PointCloudBillboard = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // ===== INIT SHARED RENDERER =====
        if (!sharedRenderer) {
            sharedScene = new THREE.Scene();
            sharedCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            sharedCamera.position.z = 2;

            sharedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            sharedRenderer.setClearColor(0x000000, 0);

            sharedControls = new OrbitControls(sharedCamera, sharedRenderer.domElement);
            sharedControls.enableDamping = true;
            sharedControls.dampingFactor = 0.05;
            sharedControls.maxDistance = 3.5;
            sharedControls.minDistance = 3.5;
            sharedControls.enableZoom = false;
            sharedControls.enablePan = false;

            // Load dot texture
            const dotTexture = new THREE.TextureLoader().load("/pure-plant-new/images/dot.png");

            // Create sprites
            for (let i = 0; i < maxPoints; i++) {
                const mat = new THREE.SpriteMaterial({ map: dotTexture, transparent: true, opacity: 0 });
                const sprite = new THREE.Sprite(mat);
                sprite.scale.set(0.1, 0.1, 1);
                const pos = POSITION_SETS[0][i] || [0, 0, 0];
                sprite.position.set(...pos);
                sprite.userData = {
                    start: new THREE.Vector3(...pos),
                    target: new THREE.Vector3(...pos),
                    fadeStart: 0,
                    fadeEnd: 1,
                };
                sharedScene.add(sprite);
                sharedSprites.push(sprite);
            }

            // Start animation cycle
            transition(2);
            cycleInterval = setInterval(() => {
                currentSet = (currentSet + 1) % POSITION_SETS.length;
                transition(currentSet);
            }, 3000);

            animate();
        }

        // Append shared renderer canvas
        mountRef.current.appendChild(sharedRenderer.domElement);

        // Resize observer
        const resize = () => {
            if (!mountRef.current) return;
            const { clientWidth, clientHeight } = mountRef.current;
            sharedCamera.aspect = clientWidth / clientHeight;
            sharedCamera.updateProjectionMatrix();
            sharedRenderer.setSize(clientWidth, clientHeight);
            sharedRenderer.setPixelRatio(window.devicePixelRatio * 2); 
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mountRef.current);
        resize();

        // ===== CLEANUP =====
        return () => {
            if (mountRef.current.contains(sharedRenderer.domElement)) {
                mountRef.current.removeChild(sharedRenderer.domElement);
            }
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                position: "relative",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "scale(2)",
                transformOrigin: "center center",
                pointerEvents: "all",
                zIndex: 50,
                overflow: "hidden",
            }}
        />
    );
};

export default PointCloudBillboard;
