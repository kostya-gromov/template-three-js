import "../css/global.css";

import "../scss/global.scss";

import Three from "./three";

document.addEventListener("DOMContentLoaded", () => {});

window.addEventListener("load", () => {
  let canvas2D = document.createElement("canvas");

  if (canvas2D) {
    new Three(canvas2D);

    document.body.appendChild(canvas2D);
  }
});
