const WIDTH = 900;
const HEIGHT = 'auto';
const SPACE_BORDER_WIDTH = 2;
const SPACE_BORDER_BUSY = '#bb2124';
const SPACE_BORDER_AVAILABLE = '#22bb33';
const SPACE_FILL_BUSY = 'rgba(187, 33, 36, 0.5)';
const SPACE_FILL_AVAILABLE = 'rgba(34, 187, 51, 0.5)';
const ACTIVE_FLOOR_INDEX = 0;
const ORGANIZATION_LOGO_WIDTH = 900;
const ORGANIZATION_LOGO_BACKGROUND_COLOR = '#bbbbbb';
const ORGANIZATION_LOGO_BACKGROUND_RADIUS = '#bbbbbb';

class FloorsScheme {
  constructor(wrapper, data) {
    this.wrapper = $(wrapper);
    this.data = data;
    this.dpiWrapperWidth = this.wrapper.width() * 2;
    this.dpiWrapperHeight = this.wrapper.height() * 2;
  }

  initialize() {
    this.canvas = $('<canvas class="floor-scheme"></canvas>');
    this.wrapper.append(this.canvas[0]);

    this.wrapper.css('position', 'relative');
    this.wrapper.css('width', WIDTH);
    this.wrapper.css('height', HEIGHT);
    this.canvas.css('zIndex', '1');
    
    console.log(this.wrapper.height());
    
    this.ctx = this.canvas[0].getContext('2d');
    
    for (let i = 0; i < this.data.length; i++) {
      const floorImage = this.data[i].floorImage;
      this.wrapper.append(
        `<img class="floor-image" src="${floorImage}" data-index="${i}" hidden/>`
        );
    }

    this.changeActiveFloor(ACTIVE_FLOOR_INDEX);
  }

  changeActiveFloor(floorIndex) {
    const floorImage = this.wrapper.find(
      `.floor-image[data-index="${floorIndex}"]`
    );
    this.wrapper.find('.floor-image').attr('hidden', true);
    floorImage.attr('hidden', false);


    floorImage.on('load', function () {
      this.dpiWrapperWidth = this.wrapper.width() * 2;
      this.dpiWrapperHeight = this.wrapper.height() * 2;
      this.canvas.attr('width', this.dpiWrapperWidth + "px");
      this.canvas.attr('height', this.dpiWrapperHeight + "px");
      this._showFloorSpaces(floorIndex);
    }.bind(this));
  }

  _addSpace(coords, type, organizationInfo) {
    this.ctx.beginPath();

    this.ctx.setLineDash([7, 7]);
    this.ctx.lineWidth = SPACE_BORDER_WIDTH;
    switch (type) {
      case 'busy':
        this.ctx.strokeStyle = SPACE_BORDER_BUSY;
        this.ctx.fillStyle = SPACE_FILL_BUSY;
        break;
      case 'available':
        this.ctx.strokeStyle = SPACE_BORDER_AVAILABLE;
        this.ctx.fillStyle = SPACE_FILL_AVAILABLE;
        break;
      default:
        this.ctx.strokeStyle = SPACE_BORDER_BUSY;
        this.ctx.fillStyle = SPACE_FILL_BUSY;
        break;
    }

    for (const [x, y] of coords) {
      this.ctx.lineTo(x * 2, this.dpiWrapperHeight - y * 2);
    }
    this.ctx.stroke();
    this.ctx.fill();

    if (type === 'busy') {
      this._drawLogo(organizationInfo.logo, organizationInfo.logoCoords);
    }
  }
  
  _drawLogo(logo, coords) {
    let logoImage = new Image();
    logoImage.src = logo;
    const [x, y] = coords;
    logoImage.onload = () => {
      let realX = x * 2;
      let realY = this.dpiWrapperHeight - y * 2;
      let scaleFactor = logoImage.width / ORGANIZATION_LOGO_WIDTH;
      this.ctx.drawImage(logoImage, 0, 0, logoImage.width, logoImage.height, realX, realY, ORGANIZATION_LOGO_WIDTH * 2, logoImage.height / scaleFactor);
    }
  }

  _showFloorSpaces(floorIndex) {
    this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());

    for (const spaceInfo of this.data[floorIndex].spacesInfo) {
      this._addSpace(spaceInfo.spaceCoords, spaceInfo.spaceType, spaceInfo.organizationInfo);
    }
  }
}
