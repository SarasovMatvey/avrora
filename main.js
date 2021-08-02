const WIDTH = 2;
const HEIGHT = 2;
const SPACE_BORDER_WIDTH = 2;
const SPACE_BORDER_WIDTH = 2;
const SPACE_BUSY = '#bb2124';
const SPACE_AVAILABLE = '#22bb33';

class FloorsScheme {
  
  constructor(wrapper, data) {
    this.wrapper = wrapper;
    this.ctx = canvas.getContext('2d');
    this.data = data;
  }
  
  initialize() {
    this.canvas = $('<canvas></canvas>')
    $(this.wrapper).append(this.canvas);
    this.ctx = $('#scheme')[0].getContext('2d');
    this._drawRect(10, 10, 200, 200, this.SPACE_BUSY);
  }

  _drawRect(x, y, width, height, color) {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.SPACE_BORDER_WIDTH;
    this.ctx.strokeStyle = color;
    this.ctx.rect(x, y, width, height);
    this.ctx.stroke();
    this.ctx.closePath();
  }
}
