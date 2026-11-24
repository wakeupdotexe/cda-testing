import {
  Application,
  Assets,
  Graphics,
  Point,
  RenderTexture,
  Sprite,
  BlurFilter,
} from 'pixi.js';

(async () => {
  // Create a new application
  const app = new Application();
  const blur = new BlurFilter();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // prepare circle texture, that will be our brush
  const brush = new Graphics().circle(0, 0, 50).fill({ color: 0xffffff });
  let lineColor = 0xffffff;
  const con = 750;
  const eraser = new Graphics().rect(0, 0, con*1.2, con*1.2).fill({ color: 0x000000 });

  // Create a line that will interpolate the drawn points
  const line = new Graphics();

  // Load the textures
  await Assets.load([
    'https://pixijs.com/assets/bg_grass.jpg'
  ]);

  const stageSize = { 
    x: 0,
    y: 0,
    width: con,
    height: con,
  };

  const background = Object.assign(
    Sprite.from('https://pixijs.com/assets/bg_grass.jpg'),
    stageSize,
  );

  background.filters = [blur];
  const imageToReveal = Object.assign(
    Sprite.from('https://pixijs.com/assets/bg_grass.jpg'),
    stageSize,
  );

  const renderTexture = RenderTexture.create(stageSize);
  const renderTextureSprite = new Sprite(renderTexture);

  imageToReveal.mask = renderTextureSprite;

  app.stage.addChild(background, imageToReveal, renderTextureSprite);

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage
    .on('pointerdown', pointerDown)
    .on('pointerup', pointerUp)
    .on('pointerupoutside', pointerUp)
    .on('pointermove', pointerMove);

  let dragging = false;
  let lastDrawnPoint = null;

  const uiContainer = document.createElement('div');
  uiContainer.style.position = 'fixed';
  uiContainer.style.top = '0px';
  uiContainer.style.right = '0px';
  uiContainer.style.padding = '10px';
  uiContainer.style.background = 'white';
  uiContainer.style.border = '3px solid #ccc';
  uiContainer.style.fontFamily = 'sans-serif';
  uiContainer.innerHTML = `
    <h4>Adjust Brush</h4>
    <button id="blur">Blur</button>
    <button id="unblur">Unblur</button>
    <h4>Upload Image</h4>
    <input id="fileInput" type="file" accept="image/*"></input>
  `;
  document.body.appendChild(uiContainer);
  const blurButton = document.getElementById('blur');
  const unblurButton = document.getElementById('unblur');
  const getFile = document.getElementById('fileInput');
  let img = new Image();

  blurButton.addEventListener('click', () => {
    lineColor = 0x000000;
    brush.circle(0, 0, 50).fill({ color: lineColor });
  });

  unblurButton.addEventListener('click', () => {
    lineColor = 0xffffff;
    brush.circle(0, 0, 50).fill({ color: lineColor });
  });

  getFile.addEventListener("change", function(){
    const newFile = getFile.files[0];
    const reader = new FileReader();

    reader.addEventListener("load", () => {
    // convert image file to base64 string
    addImage(reader.result);
    });

    if (newFile) {
      reader.readAsDataURL(newFile);
    }
    })

  async function addImage(url){
    if(url != img.src){
      img = new Image()
      img.src = url;
      let scale;
      img.onload = function(){
        scale = ratio(img.width, img.height);
        img.width *= scale;
        img.height *= scale;
        setScale(background);
        setScale(imageToReveal);
        renderTexture.resize(img.width, img.height);
        setScale(renderTextureSprite);
        eraser.stroke();
        app.renderer.render({
          container: eraser,
          target: renderTexture,
          clear: false,
        });
      }
      const tex = await Assets.load(url);
      background.texture = tex;
      imageToReveal.texture = tex;
    }
  }


  function setScale(obj){
    obj.width = img.width;
    obj.height = img.height;
  }

  function pointerMove({ global: { x, y } }) {
    if (dragging) {
      brush.position.set(x, y);
      app.renderer.render({
        container: brush,
        target: renderTexture,
        clear: false,
      });
      // Smooth out the drawing a little bit to make it look nicer
      // this connects the previous drawn point to the current one
      // using a line
      if (lastDrawnPoint) {
        line
          .clear()
          .moveTo(lastDrawnPoint.x, lastDrawnPoint.y)
          .lineTo(x, y)
          .stroke({ width: 100, color: lineColor });
        app.renderer.render({
          container: line,
          target: renderTexture,
          clear: false,
        });
      }
      lastDrawnPoint = lastDrawnPoint || new Point();
      lastDrawnPoint.set(x, y);
    }
  }

  function pointerDown(event) {
    dragging = true;
    pointerMove(event);
  }

  function pointerUp() {
    dragging = false;
    lastDrawnPoint = null;
  }

  function ratio(x, y){
    return(Math.min((stageSize.width/x),(stageSize.height/y)));
  }
})();
