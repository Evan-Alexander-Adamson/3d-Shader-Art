let scene, camera, renderer, sphere;
let uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() }
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;

    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('glCanvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.PlaneGeometry(2.5, 2.5);
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float iTime;
            uniform vec3 iResolution;
            varying vec2 vUv;
            
            #define BG_COLOR (vec3(sin(iTime)*0.5+0.5) * 0.0 + vec3(0.0))
            #define time iTime
            const vec3 color1 = vec3(0.811765, 0.262745, 0.996078);
            const vec3 color2 = vec3(0.498039, 0.260784, 0.913725);
            const vec3 color3 = vec3(0.362745, 0.078431, 0.800000);

            float opSmoothUnion( float d1, float d2, float k ) {
                float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
                return mix( d2, d1, h ) - k*h*(1.0-h);
            }

            float sdSphere( vec3 p, float s ) {
                return length(p)-s;
            } 

            float map(vec3 p) {
                float d = 2.0;
                for (int i = 0; i < 16; i++) {
                    float fi = float(i);
                    float time = iTime * (fract(fi * 412.531 + 0.513) - 0.5) * 2.0;
                    d = opSmoothUnion(
                        sdSphere(p + sin(time + fi * vec3(52.5126, 64.62744, 632.25)) * vec3(2.0, 2.0, 0.8), mix(0.5, 1.0, fract(fi * 412.531 + 0.5124))),
                        d,
                        0.4
                    );
                }
                return d;
            }

            vec3 calcNormal( in vec3 p ) {
                const float h = 1e-5;
                const vec2 k = vec2(1,-1);
                return normalize( k.xyy*map( p + k.xyy*h ) + 
                                k.yyx*map( p + k.yyx*h ) + 
                                k.yxy*map( p + k.yxy*h ) + 
                                k.xxx*map( p + k.xxx*h ) );
            }

            float light1(float intensity, float attenuation, float dist) {
                return intensity / (1.0 + dist * attenuation);
            }

            float light2(float intensity, float attenuation, float dist) {
                return intensity / (1.0 + dist * dist * attenuation);
            }

            void main() {
                vec2 uv = vUv * 2.0 - 1.0;
                uv.x *= iResolution.x/iResolution.y;
                
                vec3 rayOri = vec3(uv * vec2(iResolution.x/iResolution.y, 2.5) / 0.66, 2.0);
                vec3 rayDir = vec3(0.0, 0.0, -1.0);
                
                float depth = 0.0;
                vec3 p;
                
                for(int i = 0; i < 64; i++) {
                    p = rayOri + rayDir * depth;
                    float dist = map(p);
                    depth += dist;
                    if (dist < 1e-6) {
                        break;
                    }
                }
                
                depth = min(6.0, depth);
                vec3 n = calcNormal(p);
                float b = max(0.0, dot(n, vec3(0.577)));

                // Enhanced color mixing with glow
                float colorMix = sin(iTime * 0.5) * 0.5 + 0.5;
                vec3 baseColor = mix(color1, color2, colorMix);
                baseColor = mix(baseColor, color3, b * 0.6);
                
                // Add glow effect
                float glow = exp(-depth * 1.0) * 1.5;
                float pulse = sin(iTime * 2.0) * 0.5 + 1.5;
                vec3 glowColor = mix(color1, color2, sin(iTime) * 0.5 + 0.5) * glow * pulse;
                
                // Add specular highlight
                float specular = pow(max(0.0, dot(n, normalize(vec3(1.0, 1.0, 1.0)))), 150.0);
                vec3 specColor = vec3(1.0) * specular * 0.5;
                
                vec3 col = baseColor * (0.85 + b * 0.35);
                col += glowColor * 0.5;  // Add glow
                col += specColor;        // Add specular
                col *= exp(-depth * 0.15);
                
                // Add rim lighting
                float rim = 1.0 - max(0.0, dot(n, -rayDir));
                rim = pow(rim, 3.0);
                col += color1 * rim * 0.00;
                
                gl_FragColor = vec4(col, 1.0 - (depth - 0.5) / 2.0);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });

    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
}

function animate() {
    requestAnimationFrame(animate);
    uniforms.iTime.value += 0.01;
    renderer.render(scene, camera);
}

init();
