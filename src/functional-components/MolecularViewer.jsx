import React, { useEffect, useRef } from "react";
import * as THREE from "three";

let renderer, scene, camera;
let cloudGroup;
let sprites = [];
let animationFrameId;
let currentSet = 0;
let progress = 0;
let animating = false;

const POSITION_SETS = [
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
];

const maxPoints = 50;

function transition(idx) {
    const set = POSITION_SETS[idx];
    sprites.forEach((s, i) => {
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
}

export default function PointCloudBillboard() {
    const mountRef = useRef(null);
    const isDragging = useRef(false);
    const prevMouse = useRef({ x: 0, y: 0 });
    const rotationVelocity = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!mountRef.current) return;

        // Only create scene/renderer/camera once
        if (!renderer) {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            camera.position.set(0, 0, 3);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setClearColor(0x000000, 0);

            // Cloud group
            cloudGroup = new THREE.Group();
            cloudGroup.position.set(0.45, 0.2, 2.5);
            scene.add(cloudGroup);

            // Texture
            const tex = new THREE.TextureLoader().load("/pure-plant-new/images/dot.png");

            // Create sprites
            for (let i = 0; i < maxPoints; i++) {
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1 });
                const sp = new THREE.Sprite(mat);
                sp.scale.set(0.1, 0.1, 1);
                const pos = POSITION_SETS[0][i] || [0, 0, 0];
                sp.position.set(...pos);
                sp.userData = {
                    start: new THREE.Vector3(...pos),
                    target: new THREE.Vector3(...pos),
                    fadeStart: 0,
                    fadeEnd: 1,
                };
                cloudGroup.add(sp);
                sprites.push(sp);
            }

            // Append renderer DOM once
            mountRef.current.appendChild(renderer.domElement);
        } else {
            // Reattach existing renderer DOM if it was removed
            if (!mountRef.current.contains(renderer.domElement)) {
                mountRef.current.appendChild(renderer.domElement);
            }
        }

        // Mouse rotation handlers
        const onMouseDown = (e) => {
            isDragging.current = true;
            prevMouse.current = { x: e.clientX, y: e.clientY };
        };
        const onMouseUp = () => (isDragging.current = false);
        const onMouseMove = (e) => {
            if (!isDragging.current) return;
            const deltaX = e.clientX - prevMouse.current.x;
            const deltaY = e.clientY - prevMouse.current.y;
            rotationVelocity.current.x = deltaY * 0.002;
            rotationVelocity.current.y = deltaX * 0.002;
            prevMouse.current = { x: e.clientX, y: e.clientY };
        };

        mountRef.current.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("mousemove", onMouseMove);

        // Animate loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            if (!isDragging.current) {
                cloudGroup.rotation.x += 0.002;
                cloudGroup.rotation.y += 0.003;
                cloudGroup.rotation.z += 0.0015;
            }

            cloudGroup.rotation.x += rotationVelocity.current.x;
            cloudGroup.rotation.y += rotationVelocity.current.y;
            rotationVelocity.current.x *= 0.95;
            rotationVelocity.current.y *= 0.95;

            if (animating) {
                progress += 0.01;
                if (progress >= 1) {
                    progress = 1;
                    animating = false;
                }
                const t = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                sprites.forEach((s) => {
                    s.position.lerpVectors(s.userData.start, s.userData.target, t);
                    s.material.opacity = THREE.MathUtils.lerp(s.userData.fadeStart, s.userData.fadeEnd, t);
                });
            }

            renderer.render(scene, camera);
        };
        animate();

        // Resize observer
        const resize = () => {
            const { clientWidth, clientHeight } = mountRef.current;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mountRef.current);
        requestAnimationFrame(resize);

        // Cycle point sets
        const interval = setInterval(() => {
            currentSet = (currentSet + 1) % POSITION_SETS.length;
            transition(currentSet);
        }, 3000);

        return () => {
            // Only cleanup event listeners and intervals — do not destroy renderer
            clearInterval(interval);
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();

            mountRef.current.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                pointerEvents: "all",
            }}
        />
    );
}
