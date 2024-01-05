/*
 Copyright (C) 2014 ju.
 
 This library is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
 
 This library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 
 You should have received a copy of the GNU Lesser General Public
 License along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 MA 02110-1301  USA
 */

window.onload = function() {
    var si = new ShortImage(512, 512);
    var sip = new ShortImagePanel('imgPanel', si);

    var pre = null;
    document.addEventListener('mousemove', function(e) {
        e = e || window.event;
        var cur = {
            x: e.clientX,
            y: e.clientY
        };
        if (pre !== null) {
            si.changeWinCenterWidth(pre.x, pre.y, cur.x, cur.y);
            sip.repaint();
        }
        pre = {
            x: cur.x,
            y: cur.y
        };
    }, false);

    var lastPt = null;
    sip.canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var cur = {
            x: e.touches[0].pageX,
            y: e.touches[0].pageY
        };
        if (lastPt !== null) {
            si.changeWinCenterWidth(lastPt.x, lastPt.y, cur.x, cur.y);
            sip.repaint();
        }
        lastPt = {
            x: cur.x,
            y: cur.y
        };
    }, false);
    sip.canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        lastPt = null;
    }, false);
};

function ShortImagePanel(imgDiv, si) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = si.width;
    this.canvas.height = si.height;
    document.getElementById(imgDiv).appendChild(this.canvas);

    var _ctx = this.canvas.getContext('2d');
    _ctx.font = 'bold 18px sans-serif';

    var _imageData = _ctx.createImageData(si.width, si.height);
    var _buf = new ArrayBuffer(_imageData.data.length);
    var _buf8 = new Uint8ClampedArray(_buf);
    var _data32 = new Uint32Array(_buf);
    for (var y = 0; y < si.height; y++) {
        for (var x = 0; x < si.width; x++)
            _data32[y * si.width + x] = (255 << 24) | (128 << 16) | (128 << 8) | 128;
    }
    _imageData.data.set(_buf8);
    _ctx.putImageData(_imageData, 0, 0);

    var lastLoop = new Date();
    this.repaint = function() {
        si.updateDisplayBuffer(_data32);
        _imageData.data.set(_buf8);
        _ctx.putImageData(_imageData, 0, 0);

        var thisLoop = new Date();
        var fps = 1000 / (thisLoop - lastLoop);
        lastLoop = thisLoop;

        _ctx.fillStyle = 'red';
        _ctx.fillText('FPS = ' + (fps | 0), 0, 18);
        _ctx.fillStyle = 'green';
        _ctx.fillText('centerWidth = [' + (si.winCenter | 0) + ',' + (si.winWidth | 0) + ']', 0, 36);
    };
}

function ShortImage(width, height) {
    this.width = width;
    this.height = height;
    var _pixelMax = -65535;
    var _pixelMin = 65535;

    var _pixelArray = new Array();
    for (var y = 0; y < height; y++)
        for (var x = 0; x < width; x++) {
            var v = 0.1 * y * x * Math.random() & 0xfff;
            _pixelArray[(width * y) + x] = v;
            if (v > _pixelMax)
                _pixelMax = v;
            if (v < _pixelMin)
                _pixelMin = v;
        }

    var step = (_pixelMax - _pixelMin) * 0.001;
    this.winCenter = (_pixelMax - _pixelMin) >> 1 + _pixelMin;
    this.winWidth = (_pixelMax - _pixelMin) >> 2;
    this.changeWinCenterWidth = function(preX, preY, curX, curY) {
        var c = this.winCenter - (preX - curX) * step;
        var w = this.winWidth - (preY - curY) * step;

        this.winWidth = (w < 1) ? 1 : (w > (_pixelMax - _pixelMin) * 2) ? (_pixelMax - _pixelMin) * 2 : w;
        this.winCenter = (c <= _pixelMin) ? _pixelMin : (c >= _pixelMax) ? _pixelMax : c;
    };

    this.updateDisplayBuffer = function(data32) {
        var windowMin = this.winCenter - (this.winWidth / 2);
        var windowMax = this.winCenter + (this.winWidth / 2);
        var displayMin = 0;
        var displayMax = 255;
        var imgMin = (windowMin >= _pixelMin) ? windowMin : _pixelMin;
        var imgMax = (windowMax <= _pixelMax) ? windowMax : _pixelMax;
        var displayRatio = (displayMax - displayMin) / (imgMax - imgMin);
        for (var i = 0; i < _pixelArray.length; i++) {
            var v = _pixelArray[i];
            var out = (v < imgMin) ? displayMin : (v > imgMax) ? displayMax : (v - imgMin) * displayRatio;
            data32[i] = (255 << 24) | (out << 16) | (out << 8) | out;
        }
    };
}