class PointInPolygon {
  static pointInPolygon(point, vs, start, end) {
    if (vs.length > 0 && Array.isArray(vs[0])) {
      return this.pointInPolygonNested(point, vs, start, end);
    } else {
      return this.pointInPolygonFlat(point, vs, start, end);
    }
  }

  static pointInPolygonFlat(point, vs, start, end) {
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

  static pointInPolygonNested(point, vs, start, end) {
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
