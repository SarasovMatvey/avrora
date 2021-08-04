const WIDTH = 900;
const HEIGHT = 'auto';
const SPACE_BORDER_WIDTH = 5;
const SPACE_BORDER_BUSY = '#bb2124';
const SPACE_BORDER_AVAILABLE = '#22bb33';
const SPACE_FILL_BUSY = 'rgba(187, 33, 36, 0.5)';
const SPACE_FILL_AVAILABLE = 'rgba(34, 187, 51, 0.5)';
const DEFAULT_FLOOR_INDEX = 0;
const ORGANIZATION_LOGO_WIDTH = 25;
const ORGANIZATION_LOGO_BACKGROUND_COLOR = 'rgba(0, 0, 0, 0.3)';
const ORGANIZATION_LOGO_BACKGROUND_RADIUS = 20;

class FloorsScheme {
  constructor(wrapper, data) {
    this.wrapper = $(wrapper);
    this.data = data;
    this.dpiWrapperWidth = this.wrapper.width() * 2;
    this.dpiWrapperHeight = this.wrapper.height() * 2;
    this.currentFloorIndex = DEFAULT_FLOOR_INDEX;
  }

  initialize() {
    this.canvas = $('<canvas class="floor-scheme"></canvas>');
    this.wrapper.append(this.canvas[0]);
    this.spaceCard = $(`
      <div class="space-card hidden">
        <h2 class="space-card-title"></h2>
        <ul class="space-card-info"></ul>
      </div>
    `);
    this.wrapper.append(this.spaceCard);
    this.floorSelect = $(`
      <div class="space-floor-select">
        <div class="space-floor-select-controls">
          <button class="prev-floor">-</button>
          <button class="next-floor">+</button>
        </div>
        <select>
        ${
          this.data.map((floor, index) => `<option value="${index}">Этаж - ${floor.floorNumber}</option>`)
        }
        </select>
      </div>
    `);
    this.wrapper.append(this.floorSelect);


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

    this.changeActiveFloor(DEFAULT_FLOOR_INDEX);

    this._bindEventListeners();
  }

  _bindEventListeners() {
    this.canvas.on('mousemove', ({ pageX, pageY }) => {
      const space = this._getSpaceByCoords(pageX, pageY);
      const organizationInfo = space.organizationInfo;

      if (space) {
        this._showSpaceCard({
          title: organizationInfo.name,
          fields: [
            {key: 'Площадь', value: organizationInfo.area},
          ]
        });
      } else {
        this._hideSpaceCard();
      }
    });

    this.wrapper.find('.prev-floor').on('click', () => {
      this.prevFloor()
      this.wrapper.find('.space-floor-select select').val(this.currentFloorIndex);
    });
    this.wrapper.find('.next-floor').on('click', () => {
      this.nextFloor()
      this.wrapper.find('.space-floor-select select').val(this.currentFloorIndex);
    });
    this.wrapper.find('.space-floor-select select').on('change', e => this.changeActiveFloor($(e.currentTarget).val()))
  }

  changeActiveFloor(floorIndex) {
    const floorImage = this.wrapper.find(
      `.floor-image[data-index="${floorIndex}"]`
    );
    this.wrapper.find('.floor-image').attr('hidden', true);
    floorImage.attr('hidden', false);

    this._updateCanvasSizes();
    this._showFloorSpaces(floorIndex);
    floorImage.on(
      'load',
      function () {
        this._updateCanvasSizes();
        this._showFloorSpaces(floorIndex);
      }.bind(this)
    );

    this.currentFloorIndex = floorIndex;
  }

  nextFloor() {
    const floorsCount = this.data.length;
    
    if (this.currentFloorIndex + 1 <= floorsCount - 1) {
      this.currentFloorIndex++;
      this.changeActiveFloor(this.currentFloorIndex);
    }
  }

  prevFloor() {
    if (this.currentFloorIndex - 1 >= 0) {
      this.currentFloorIndex--;
      this.changeActiveFloor(this.currentFloorIndex);
    }
  }

  _updateCanvasSizes() {
    this.dpiWrapperWidth = this.wrapper.width() * 2;
    this.dpiWrapperHeight = this.wrapper.height() * 2;
    this.canvas.attr('width', this.dpiWrapperWidth + 'px');
    this.canvas.attr('height', this.dpiWrapperHeight + 'px');
  }

  _getSpaceByCoords(x, y) {
    const spacesInfo = this.data[this.currentFloorIndex].spacesInfo;

    for (const space of spacesInfo) {
      const pointInSpace = this.pointInPolygon(
        [x, y],
        this._spaceCoordsToPageRelative(space.spaceCoords)
      );

      if (pointInSpace) return space;
    }

    return false;
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
      if (organizationInfo.autocenter) {
        this._drawLogo(organizationInfo.logo, coords, true);
      } else {
        this._drawLogo(organizationInfo.logo, organizationInfo.logoCoords);
      }
    }
  }

  _drawLogo(logo, coords, autocenter = false) {
    const logoImage = new Image();
    logoImage.src = logo;
    const [x, y] = coords;

    logoImage.onload = () => {
      const scaleFactor = logoImage.width / ORGANIZATION_LOGO_WIDTH;
      let realX;
      let realY;

      if (autocenter) {
        let spaceMinX;
        let spaceMaxX;
        let spaceMinY;
        let spaceMaxY;

        coords.forEach(([x, y]) => {
          if (!spaceMinX) spaceMinX = x;
          if (!spaceMaxX) spaceMaxX = x;
          if (!spaceMinY) spaceMinY = y;
          if (!spaceMaxY) spaceMaxY = y;

          if (x < spaceMinX) spaceMinX = x;
          if (x > spaceMaxX) spaceMaxX = x;
          if (y < spaceMinY) spaceMinY = y;
          if (y > spaceMaxY) spaceMaxY = y;
        });

        realX =
          (spaceMinX + (spaceMaxX - spaceMinX) / 2) * 2 -
          ORGANIZATION_LOGO_WIDTH;
        realY =
          this.dpiWrapperHeight -
          (spaceMinY + (spaceMaxY - spaceMinY) / 2) * 2 -
          logoImage.height / scaleFactor;
      } else {
        realX = x * 2 - ORGANIZATION_LOGO_WIDTH;
        realY = this.dpiWrapperHeight - y * 2 - logoImage.height / scaleFactor;
      }

      const backgroundCenterX = realX + ORGANIZATION_LOGO_WIDTH;
      const backgroundCenterY = realY + logoImage.height / scaleFactor;

      this.ctx.beginPath();
      this.ctx.arc(
        backgroundCenterX,
        backgroundCenterY,
        ORGANIZATION_LOGO_BACKGROUND_RADIUS * 2,
        0,
        2 * Math.PI,
        false
      );
      this.ctx.fillStyle = ORGANIZATION_LOGO_BACKGROUND_COLOR;
      this.ctx.fill();

      this.ctx.drawImage(
        logoImage,
        0,
        0,
        logoImage.width,
        logoImage.height,
        realX,
        realY,
        ORGANIZATION_LOGO_WIDTH * 2,
        (logoImage.height / scaleFactor) * 2
      );
    };
  }

  _showFloorSpaces(floorIndex) {
    this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());

    for (const spaceInfo of this.data[floorIndex].spacesInfo) {
      this._addSpace(
        spaceInfo.spaceCoords,
        spaceInfo.spaceType,
        spaceInfo.organizationInfo
      );
    }
  }

  _spaceCoordsToPageRelative(coords) {
    const result = coords.map(([x, y]) => {
      return [
        this.canvas.offset().left + x,
        this.canvas.offset().top + (this.wrapper.height() - y),
      ];
    });

    return result;
  }

  _showSpaceCard(data) {
    this.spaceCard.toggleClass('hidden', false);

    this.spaceCard.find('.space-card-title').text(data.title);

    const spaceCardInfo = this.spaceCard.find('.space-card-info');
    spaceCardInfo.empty();
    for (const dataField of data.fields) {
      spaceCardInfo.append(`<li><strong>${dataField.key}:</strong><span>${dataField.value}</span></li>`);
    }
  }

  _hideSpaceCard() {
    this.spaceCard.toggleClass('hidden', true);
  }

  // TODO: move to lib

  pointInPolygon(point, vs, start, end) {
    if (vs.length > 0 && Array.isArray(vs[0])) {
      return this.pointInPolygonNested(point, vs, start, end);
    } else {
      return this.pointInPolygonFlat(point, vs, start, end);
    }
  }

  pointInPolygonFlat(point, vs, start, end) {
    let x = point[0],
      y = point[1];
    let inside = false;
    if (start === undefined) start = 0;
    if (end === undefined) end = vs.length;
    let len = (end - start) / 2;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      let xi = vs[start + i * 2 + 0],
        yi = vs[start + i * 2 + 1];
      let xj = vs[start + j * 2 + 0],
        yj = vs[start + j * 2 + 1];
      let intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  pointInPolygonNested(point, vs, start, end) {
    let x = point[0],
      y = point[1];
    let inside = false;
    if (start === undefined) start = 0;
    if (end === undefined) end = vs.length;
    let len = end - start;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      let xi = vs[i + start][0],
        yi = vs[i + start][1];
      let xj = vs[j + start][0],
        yj = vs[j + start][1];
      let intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
