precision mediump float;

uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUV;

void main() {
    // Normalize coordinates
    vec2 st = vUV;

    // Create a moving color gradient
    float color = 0.5 + 0.5 * sin(uTime + st.x * 10.0) * sin(uTime + st.y * 10.0);

    gl_FragColor = vec4(vec3(color, 0.5, 1.0 - color), 1.0);
}
