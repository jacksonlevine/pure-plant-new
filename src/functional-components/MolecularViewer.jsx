import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const PointCloudBillboard = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 2;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 3.5;
        controls.minDistance = 3.5;
        controls.enableZoom = false;
        controls.enablePan = false;

        const POSITION_SETS = [
            [
                [-0.4, -0.4, -0.4], [0.4, -0.4, -0.4], [-0.4, 0.4, -0.4], [0.4, 0.4, -0.4],
                [-0.4, -0.4, 0.4], [0.4, -0.4, 0.4], [-0.4, 0.4, 0.4], [0.4, 0.4, 0.4],
            ],
            Array.from({ length: 50 }, () => {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 0.4;
                return [
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi),
                ];
            }),
            Array.from({ length: 50 }, (_, i) => {
                const t = (i / 50) * Math.PI * 4;
                return [
                    0.3 * Math.cos(t),
                    (i / 50) - 0.5,
                    0.3 * Math.sin(t),
                ];
            }),
            Array.from({ length: 50 }, () => [
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5,
            ]),
        ];

        const dotTexture = new THREE.TextureLoader().load("/pure-plant-new/images/dot.png");
        const sprites = [];
        const maxPoints = 50;

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

            scene.add(sprite);
            sprites.push(sprite);
        }

        let currentSet = 0;
        let progress = 0;
        let animating = false;

        const transition = (idx) => {
            const set = POSITION_SETS[idx];
            sprites.forEach((s, i) => {
                s.userData.start.copy(s.position);
                s.userData.fadeStart = s.material.opacity;
                if (i < set.length) {
                    s.userData.target.set(...set[i]);
                    s.userData.fadeEnd = 1; // fade in
                } else {
                    s.userData.target.copy(s.position); // stay
                    s.userData.fadeEnd = 0; // fade out
                }
            });
            progress = 0;
            animating = true;
        };

        transition(2);

        const cycle = setInterval(() => {
            currentSet = (currentSet + 1) % POSITION_SETS.length;
            transition(currentSet);
        }, 3000);

        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);

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

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // ===== ONLY CHANGE: ResizeObserver =====
        const resize = () => {
            if (!mountRef.current) return;
            const { clientWidth, clientHeight } = mountRef.current;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio * 2); // unchanged
        };

        const ro = new ResizeObserver(resize);
        ro.observe(mountRef.current);

        return () => {
            clearInterval(cycle);
            cancelAnimationFrame(frameId);
            ro.disconnect(); // important
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }

            // dispose scene objects
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
            dotTexture.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                position: 'relative',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: 'scale(2)',
                transformOrigin: 'center center',
                pointerEvents: 'all',
                zIndex: 50,
                overflow: 'hidden',
            }}
        />
    );
};

export default PointCloudBillboard;
