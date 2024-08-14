	precision highp float;

		attribute vec3 position;
		attribute vec2 source;
		attribute vec2 target;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		uniform float size;
		uniform float blend;
		uniform sampler2D sourceTex;
		uniform sampler2D targetTex;
		uniform vec2 dimensions;

		varying vec3 vColor;



		const float PI = 3.14159265359;

		void main() {

			
			float pBlend = clamp( blend, 0., 1. );

			vec3 origin = vec3(source, 0.);
			vec3 destination = vec3(target, 0.);

			vec3 p = mix( origin, destination, pBlend );
			vec3 d = ( destination - origin );
			float r = length(d);

			p.xy = mix(origin.xy,destination.xy,pBlend);
			p.z = .5 * r * sin(pBlend*PI);
			p.xy -= .5 * dimensions;
			
			p *= 1. / dimensions.x;

			vec2 uvSource = source / dimensions.x;
			vec2 uvTarget = target / dimensions.x;
			vColor = mix( texture2D(sourceTex, uvSource).rgb, texture2D(targetTex,uvTarget).rgb, pBlend );

			float scale = 1.;
			p.y *= -1.;
			vec4 mvPosition = modelViewMatrix * vec4( p, 1. );
			gl_PointSize = size * ( scale / - mvPosition.z );
			gl_Position = projectionMatrix * mvPosition;

		}