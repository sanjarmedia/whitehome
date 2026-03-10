import React, { useEffect, useRef } from 'react';

const ParticleLogo = ({ imageSrc, width = 600, height = 200 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationFrameId;

        const particleSize = 2;
        const mouseRadius = 30000; // Trigger area size (squared roughly or just logic trigger)
        const formSpeed = 0.08; // Smooth snap speed
        const waveSpeed = 0.02; // Idle floating speed

        let mouse = { x: null, y: null };
        let isHovering = false;

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
            isHovering = true;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
            isHovering = false;
        };

        class Particle {
            constructor(x, y, color) {
                // Target position (Logo pixel)
                this.originX = x;
                this.originY = y;
                this.color = color;

                // Current position (Start random/floating)
                this.x = Math.random() * width;
                this.y = Math.random() * height;

                // Wave properties
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.angle = Math.random() * Math.PI * 2; // For sine wave
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, particleSize, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }

            update() {
                if (isHovering) {
                    // FORM LOGO: Move towards origin
                    // Smooth easing (Linear Interpolation)
                    this.x += (this.originX - this.x) * formSpeed;
                    this.y += (this.originY - this.y) * formSpeed;
                } else {
                    // WAVE / FLOAT: Move around somewhat randomly but keep near-ish? 
                    // Or just full floating cloud effect.
                    // User said "To'lqinlanib tursin" (Wave).

                    this.x += Math.cos(this.angle) * 0.5;
                    this.y += Math.sin(this.angle) * 0.5;
                    this.angle += waveSpeed;

                    // Simple bouce off edges or wrap? 
                    // Let's just let them drift but pull slightly to center if too far
                    // to ensure they don't disappear completely.
                    // Actually, let's make them flow in a "Perlin noise" style fake wave
                    // relative to their CURRENT position (drifting).
                }
            }
        }

        const init = () => {
            particles = [];
            const image = new Image();
            image.src = imageSrc;
            image.crossOrigin = "Anonymous";

            image.onload = () => {
                // Calculate aspect ratio to fit image in canvas
                const targetWidth = width;
                const scale = Math.min(width / image.width, height / image.height);
                const w = image.width * scale;
                const h = image.height * scale;
                const offsetX = (width - w) / 2;
                const offsetY = (height - h) / 2;

                ctx.drawImage(image, offsetX, offsetY, w, h);
                const imageData = ctx.getImageData(0, 0, width, height);
                ctx.clearRect(0, 0, width, height);

                for (let y = 0; y < height; y += 4) {
                    for (let x = 0; x < width; x += 4) {
                        const index = (y * width + x) * 4;
                        const alpha = imageData.data[index + 3];

                        if (alpha > 128) {
                            const red = imageData.data[index];
                            const green = imageData.data[index + 1];
                            const blue = imageData.data[index + 2];
                            const color = `rgb(${red}, ${green}, ${blue})`;
                            particles.push(new Particle(x, y, color));
                        }
                    }
                }
                animate();
            };

            image.onerror = () => {
                // Fallback Text "Smart Home"
                ctx.font = 'bold 60px Inter, sans-serif';
                ctx.fillStyle = '#2563EB'; // Blue-600
                ctx.textAlign = 'center';
                ctx.fillText('SmartHome', width / 2, height / 2 + 20);

                const imageData = ctx.getImageData(0, 0, width, height);
                ctx.clearRect(0, 0, width, height);

                for (let y = 0; y < height; y += 4) {
                    for (let x = 0; x < width; x += 4) {
                        const index = (y * width + x) * 4;
                        if (imageData.data[index + 3] > 128) {
                            particles.push(new Particle(x, y, `rgba(37, 99, 235, ${Math.random()})`));
                        }
                    }
                }
                animate();
            }
        };

        const animate = () => {
            // Trail effect (optional, maybe clearRect is cleaner)
            // ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
            // ctx.fillRect(0,0,width,height);
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].draw();
                particles[i].update();
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        init();

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseenter', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseenter', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [imageSrc, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="block mx-auto cursor-pointer"
        />
    );
};

export default ParticleLogo;
