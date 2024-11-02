let scene, camera, renderer, plane, composer;
let uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() }
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;

    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('glCanvas'),
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2.0,
        0.55,
        0.25
    );
    composer.addPass(bloomPass);

    const geometry = new THREE.PlaneGeometry(2, 2);
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

            // Color palette from index shader
            const vec3 color1 = vec3(0.611765, 0.262745, 0.996078);
            const vec3 color2 = vec3(0.298039, 0.760784, 0.913725);
            const vec3 color3 = vec3(0.062745, 0.078431, 0.600000);

            float sdSphere(vec3 pos, float size) {
                return length(pos) - size;
            }

            float sdBox(vec3 pos, vec3 size) {
                pos = abs(pos) - vec3(size);
                return max(max(pos.x, pos.y), pos.z);
            }

            float sdOctahedron(vec3 p, float s) {
                p = abs(p);
                float m = p.x+p.y+p.z-s;
                vec3 q;
                     if( 3.0*p.x < m ) q = p.xyz;
                else if( 3.0*p.y < m ) q = p.yzx;
                else if( 3.0*p.z < m ) q = p.zxy;
                else return m*0.57735027;
                
                float k = clamp(0.5*(q.z-q.y+s),0.0,s); 
                return length(vec3(q.x,q.y-s+k,q.z-k)); 
            }

            float sdPlane(vec3 pos) {
                return pos.y;
            }

            mat2 rotate(float a) {
                float s = sin(a);
                float c = cos(a);
                return mat2(c, s, -s, c);
            }

            vec3 repeat(vec3 pos, vec3 span) {
                return abs(mod(pos, span)) - span * 0.5;
            }

            float getDistance(vec3 pos, vec2 uv) {
                vec3 originalPos = pos;

                for(int i = 0; i < 3; i++) {
                    pos = abs(pos) - 4.5;
                    pos.xz *= rotate(1.0);
                    pos.yz *= rotate(1.0);
                }

                pos = repeat(pos, vec3(4.0));

                float d0 = abs(originalPos.x) - 0.1;
                float d1 = sdBox(pos, vec3(0.8));

                pos.xy *= rotate(mix(1.0, 2.0, abs(sin(iTime))));
                float size = mix(1.1, 1.3, (abs(uv.y) * abs(uv.x)));
                float d2 = sdSphere(pos, size);
                float dd2 = sdOctahedron(pos, 1.8);
                float ddd2 = mix(d2, dd2, abs(sin(iTime)));
              
                return max(max(d1, -ddd2), -d0);
            }

            void mainImage(out vec4 fragColor, in vec2 fragCoord) {
                vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

                vec3 cameraOrigin = vec3(0.0, 0.0, -10.0 + iTime * 4.0);
                vec3 cameraTarget = vec3(cos(iTime) + sin(iTime / 2.0) * 10.0, exp(sin(iTime)) * 2.0, 3.0 + iTime * 4.0);
                vec3 upDirection = vec3(0.0, 1.0, 0.0);
                vec3 cameraDir = normalize(cameraTarget - cameraOrigin);
                vec3 cameraRight = normalize(cross(upDirection, cameraOrigin));
                vec3 cameraUp = cross(cameraDir, cameraRight);
                vec3 rayDirection = normalize(cameraRight * p.x + cameraUp * p.y + cameraDir);
                
                float depth = 0.0;
                float ac = 0.0;
                vec3 rayPos = vec3(0.0);
                float d = 0.0;

                for(int i = 0; i < 80; i++) {
                    rayPos = cameraOrigin + rayDirection * depth;
                    d = getDistance(rayPos, p);

                    if(abs(d) < 0.0001) {
                        break;
                    }

                    ac += exp(-d * mix(5.0, 10.0, abs(sin(iTime))));        
                    depth += d;
                }
                
                // Color mixing using the violet palette
                vec3 baseColor = mix(color1, color2, abs(sin(iTime * 0.5)));
                baseColor = mix(baseColor, color3, abs(sin(iTime * 0.3)));
                
                ac *= 1.2 * (iResolution.x/iResolution.y - abs(p.x));
                vec3 finalCol = baseColor * ac * 0.06;
                
                // Add subtle pulsing glow
                float pulse = 1.0 + sin(iTime * 2.0) * 0.2;
                finalCol *= pulse;
                
                fragColor = vec4(finalCol, 1.0 - depth * 0.1);
            }

            void main() {
                mainImage(gl_FragColor, vUv * iResolution.xy);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });

    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
}

function animate() {
    requestAnimationFrame(animate);
    uniforms.iTime.value += 0.01;
    composer.render();
}

init();
