import React, { useEffect } from 'react';

let modelViewerLoaded = false;

export default function Model3D({ src, alt, size, className }) {

    useEffect(() => {
        if (!modelViewerLoaded) {
            import('@google/model-viewer/dist/model-viewer');
            modelViewerLoaded = true;
        }
    }, []);

    return (
        <model-viewer
            camera-controls
            touch-action="pan-y"
            disable-zoom
            src={src}
            alt={alt}
            auto-rotate
            disable-pan
            shadow-intensity="1"
            exposure={0.3}
            className={className}
            style={{ width: size.width, height: size.height }}
        />
    );
}