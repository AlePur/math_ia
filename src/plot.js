export default (fn, range, canvas) => {
  const ctx = canvas.getContext("2d");
  let width = canvas.width;
  let height = canvas.height;
  let widthScale = (width / (range[1] - range[0]))
  let heightScale = (height / (range[3] - range[2]))
  let first = true;
      
  ctx.beginPath();
      
  for (let x = 0; x < width; x++) {
    let xFnVal = (x / widthScale) - range[0],
      yGVal = (fn(xFnVal) - range[2]) * heightScale;
          
    yGVal = height - yGVal; // 0,0 is top-left
          
    if (first) {
      ctx.moveTo(x, yGVal);
      first = false;
    }
    else {
      ctx.lineTo(x, yGVal);
    }
  }
      
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2;
  ctx.stroke(); 
}