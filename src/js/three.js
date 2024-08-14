import * as T from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import gsap from "gsap";

import fragment from "../shaders/fragment.glsl";
import vertex from "../shaders/vertex.glsl";

import img1 from "../assets/img/1.jpg";
import img2 from "../assets/img/2.jpg";

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio,
};

export default class Three {
  obj = [];
  positions = [];
  w = 0;
  h = 0;
  images = [img1, img2];

  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new T.Scene();

    this.camera = new T.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new T.WebGLRenderer();
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.clock = new T.Clock();

    this.images.forEach((img) => {
      this.obj.push({ file: img });
    });

    let ctx = this.canvas.getContext("2d", { willReadFrequently: true });

    this.loadImages(this.images, (images) => {
      this.obj.forEach((image, i) => {
        let img = images[i];

        this.canvas.width = img.naturalWidth;
        this.canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        this.canvas.classList.add("image");

        let data = ctx.getImageData(
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        let rgb = [];
        let color = new T.Color();
        let buffer = data.data;

        for (let i = 0; i < buffer.length; i = i + 4) {
          color.setRGB(buffer[i], buffer[i + 1], buffer[i + 2]);
          rgb.push({ color: color.clone(), id: i / 4 });
        }

        this.results = new Float32Array(img.width * img.height * 2);
        let j = 0;

        const context = this;

        rgb.sort(function (a, b) {
          return context.getHSL(a.color).s - context.getHSL(b.color).s;
        });

        rgb.forEach((e) => {
          this.results[j] = e.id % img.width;
          this.results[j + 1] = Math.floor(e.id / img.height);

          j = j + 2;
        });

        this.obj[i].image = img;
        this.obj[i].texture = new T.Texture(img);
        this.obj[i].buffer = this.results;
        this.obj[i].texture.needsUpdate = true;
        this.obj[i].texture.flipY = false;
      });

      this.w = images[0].width;
      this.h = images[0].height;

      this.positions = new Float32Array(this.w * this.h * 3);
      let index = 0;

      for (let i = 0; i < this.w; i++) {
        for (let j = 0; j < this.h; j++) {
          this.positions[index * 3] = j;
          this.positions[index * 3 + 1] = i;
          this.positions[index * 3 + 2] = 0;

          index++;
        }
      }

      this.init();

      var container = document.querySelector(".flex");
      container.appendChild(this.renderer.domElement);

      const tl = gsap.timeline();

      const context = this;
      document.body.addEventListener("click", function () {
        console.log(context.planeMaterial);

        tl.to(context.planeMaterial.uniforms.blend, 3, { value: 1 }, 0);
        // tl.reverse();
      });
    });

    this.init();
  }

  init() {
    this.setLights();
    this.setGeometry();
    this.render();
    this.setResize();
  }

  getHSL(color) {
    // Extract the RGB values
    const { r, g, b } = color;
    // let r = parseInt(color.slice(1, 3), 16) / 255;
    // let g = parseInt(color.slice(3, 5), 16) / 255;
    // let b = parseInt(color.slice(5, 7), 16) / 255;

    // Find the maximum and minimum values of R, G and B.
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);

    // Calculate lightness
    let l = (max + min) / 2;

    let h, s;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return { s, h, l };
  }

  setLights() {
    this.ambientLight = new T.AmbientLight(new T.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  loadImages(paths, whenLoaded) {
    var imgs = [];
    paths.forEach(function (path) {
      var img = new Image();
      img.onload = function () {
        imgs.push(img);
        if (imgs.length === paths.length) whenLoaded(imgs);
      };
      img.src = path;
    });
  }

  setGeometry() {
    this.planeGeometry = new T.BufferGeometry();

    console.log("this.positions", this.positions);

    this.planeGeometry.setAttribute(
      "position",
      new T.BufferAttribute(this.positions, 3)
    );

    this.planeGeometry.setAttribute(
      "source",
      new T.BufferAttribute(this.obj[0].buffer, 2)
    );

    this.planeGeometry.setAttribute(
      "target",
      new T.BufferAttribute(this.obj[1].buffer, 2)
    );

    this.planeMaterial = new T.RawShaderMaterial({
      side: T.DoubleSide,
      wireframe: true,
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        sourceTex: { type: "t", value: this.obj[0].texture },
        targetTex: { type: "t", value: this.obj[1].texture },
        blend: { type: "f", value: 0 },
        size: { type: "f", value: 2.1 }, //window.devicePixelRatio },
        dimensions: { type: "v2", value: new T.Vector2(656, 656) },
      },
    });

    this.planeMesh = new T.Points(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.planeMesh);
  }

  render() {
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener("resize", this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
