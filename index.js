fetch("chart_data.json")
    .then(response => response.json())
    .then(parsed => buildCharts(parsed));

function buildCharts(data) {
    data.forEach(chartData => {
        new Chart(chartData);
    });
}

class Chart {
    constructor(chartData) {
        this.chartData = chartData;
        this.chartLines = {};
        this.showingLines = [];
        this.chartsWidth = 500;
        this.sliderWidth = this.chartsWidth / 2;
        this.sliderPosition = 0;

        this.parseInput();
        console.log(this);
        this.xDiff = this.xPoints[this.xPoints.length - 1] - this.xPoints[0];
        this.minX = this.xPoints[0];
        this.maxX = this.xPoints[0] + (this.sliderPosition + this.sliderWidth) / this.chartsWidth * this.xDiff;
        this.buildChartElements();
        this.initInfoPanel();

        this.renderDetailedCanvas();
        this.renderObservingCanvas();

        this.onSliderMouseMove = this.onSliderMouseMove.bind(this);
        this.onLeftSliderBorderMouseMove = this.onLeftSliderBorderMouseMove.bind(this);
        this.onRightSliderBorderMouseMove = this.onRightSliderBorderMouseMove.bind(this);

        this.rerenderDetailedCanvas = throttle(this.renderDetailedCanvas.bind(this), 5);
    }

    parseInput() {
        this.chartData.columns.forEach(column => {
            if (column[0] === 'x') {
                this.xPoints = column.slice(1);
            } else {
                this.chartLines[column[0]] = {
                    points: column.slice(1)
                }
            }
        });
        for (let key in this.chartLines) {
            this.chartLines[key].color = this.chartData.colors[key];
            this.chartLines[key].name = this.chartData.names[key];
            this.showingLines.push(key);
        }
    }

    buildChartElements() {
        const container = document.createElement('div');
        container.className = 'chartContainer';

        this.detailedCanvas = document.createElement('canvas');
        this.detailedCanvas.className = 'detailedCanvas';
        this.detailedCanvas.width = this.chartsWidth;
        this.detailedCanvas.height = 500;

        this.observingCanvas = document.createElement('canvas');
        this.observingCanvas.className = 'observingCanvas';
        this.observingCanvas.width = this.chartsWidth;
        this.observingCanvas.height = 50;

        this.controllingContainer = document.createElement('div');
        this.controllingContainer.className = 'controllingContainer';

        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'infoPanel';
        this.infoPanelLine = document.createElement('div');
        this.infoPanelLine.className = 'infoPanelLine';
        this.infoPanel.appendChild(this.infoPanelLine);

        this.leftPlaceHolder = document.createElement('div');
        this.leftPlaceHolder.className = 'placeholder';
        this.rightPlaceHolder = document.createElement('div');
        this.rightPlaceHolder.className = 'placeholder';
        this.slider = document.createElement('div');
        this.sliderLeftBorder = document.createElement('div');
        this.sliderLeftBorder.className = 'slider-border';
        this.sliderRightBorder = document.createElement('div');
        this.sliderRightBorder.className = 'slider-border';
        this.slider.className = 'slider';

        this.leftPlaceHolder.style.width = `${this.sliderPosition}px`;
        this.rightPlaceHolder.style.width = `${this.sliderPosition + this.sliderWidth}px`;
        this.rightPlaceHolder.style.left = `${this.chartsWidth - this.sliderPosition - this.sliderWidth}px`;
        this.slider.style.width = `${this.chartsWidth / 2}px`;
        this.slider.style.left = `${this.sliderPosition}px`;
        this.sliderLeftBorder.style.left = `${this.sliderPosition}px`;
        this.sliderRightBorder.style.left = `${this.sliderPosition + this.sliderWidth - 5}px`;
        this.slider.addEventListener('mousedown', this.onSliderMouseDown.bind(this));
        container.addEventListener('mouseup', this.onSliderMouseUp.bind(this));
        this.sliderLeftBorder.addEventListener('mousedown', this.onLeftSliderBorderMouseDown.bind(this));
        container.addEventListener('mouseup', this.onLeftSliderBorderMouseUp.bind(this));
        this.sliderRightBorder.addEventListener('mousedown', this.onRightSliderBorderMouseDown.bind(this));
        container.addEventListener('mouseup', this.onRightSliderBorderMouseUp.bind(this));
        this.detailedCanvas.addEventListener('mouseover', this.onDetailedCanvasMouseOver.bind(this));
        this.detailedCanvas.addEventListener('mousemove', this.onDetailedCanvasMouseMove.bind(this));
        this.detailedCanvas.addEventListener('mouseout', this.onDetailedCanvasMouseOut.bind(this));

        this.slider.appendChild(this.sliderLeftBorder);
        this.slider.appendChild(this.sliderRightBorder);
        this.controllingContainer.appendChild(this.leftPlaceHolder);
        this.controllingContainer.appendChild(this.slider);
        this.controllingContainer.appendChild(this.rightPlaceHolder);
        container.appendChild(this.detailedCanvas);
        container.appendChild(this.observingCanvas);
        container.appendChild(this.controllingContainer);
        container.appendChild(this.infoPanel);
        document.body.appendChild(container);
        this.chartContainer = container;
    }

    initInfoPanel() {
        t
    }

    onSliderMouseDown() {
        this.chartContainer.addEventListener('mousemove', this.onSliderMouseMove);
    }
    onSliderMouseMove(e) {
        if (this.sliderPosition + e.movementX < 0
            || this.sliderPosition + this.sliderWidth + e.movementX > this.chartsWidth) {
            return;
        }
        this.sliderPosition += e.movementX;
        this.slider.style.left = `${this.sliderPosition}px`;
        this.leftPlaceHolder.style.width = `${this.sliderPosition}px`;
        this.rightPlaceHolder.style.width = `${this.chartsWidth - this.sliderWidth 
            - this.sliderPosition}px`;
        this.rightPlaceHolder.style.left = `${this.sliderWidth + this.sliderPosition}px`;
        this.minX = this.xPoints[0] + (this.sliderPosition / this.chartsWidth * this.xDiff);
        this.maxX = this.xPoints[0] + ((this.sliderPosition + this.sliderWidth) / this.chartsWidth * this.xDiff);

        this.rerenderDetailedCanvas();
    }
    onSliderMouseUp() {
        this.chartContainer.removeEventListener('mousemove', this.onSliderMouseMove);
    }

    onLeftSliderBorderMouseDown(e) {
        e.stopPropagation();
        this.chartContainer.addEventListener('mousemove', this.onLeftSliderBorderMouseMove);
    }
    onLeftSliderBorderMouseUp() {
        this.chartContainer.removeEventListener('mousemove', this.onLeftSliderBorderMouseMove);
    }
    onLeftSliderBorderMouseMove(e) {
        if (this.sliderWidth - e.movementX <= 10
            || this.sliderPosition + e.movementX < 0) {
            return;
        }

        this.sliderWidth -= e.movementX;
        this.sliderPosition += e.movementX;
        this.minX = this.xPoints[0] + this.sliderPosition / this.chartsWidth * this.xDiff;

        this.leftPlaceHolder.style.width = `${this.sliderPosition}px`;
        this.slider.style.left = `${this.sliderPosition}px`;
        this.slider.style.width = `${this.sliderWidth}px`;
        this.sliderRightBorder.style.left = `${this.sliderWidth - 5}px`;

        this.rerenderDetailedCanvas();
    }

    onRightSliderBorderMouseDown(e) {
        e.stopPropagation();
        this.chartContainer.addEventListener('mousemove', this.onRightSliderBorderMouseMove);
    }
    onRightSliderBorderMouseUp() {
        this.chartContainer.removeEventListener('mousemove', this.onRightSliderBorderMouseMove);
    }
    onRightSliderBorderMouseMove(e) {
        if (this.sliderWidth + e.movementX <= 10
            || this.sliderPosition + this.sliderWidth + e.movementX > this.chartsWidth) {
            return;
        }

        this.sliderWidth += e.movementX;
        this.maxX = this.xPoints[0] + (this.sliderPosition + this.sliderWidth) / this.chartsWidth * this.xDiff;

        this.rightPlaceHolder.style.width = `${this.chartsWidth - this.sliderPosition - this.sliderWidth}px`;
        this.rightPlaceHolder.style.left = `${this.sliderPosition + this.sliderWidth}px`;
        this.slider.style.width = `${this.sliderWidth}px`;
        this.sliderRightBorder.style.left = `${this.sliderWidth - 5}px`;

        this.rerenderDetailedCanvas();
    }

    onDetailedCanvasMouseOver() {
        this.infoPanel.style.display = 'block';
    }
    onDetailedCanvasMouseMove(e) {
        const xPosition = e.layerX;
        const x = this.minX + (this.maxX - this.minX) * xPosition / this.chartsWidth;
        const xText = new Date(x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const minXIndex = this.getMinXIndex(x);
        const maxXIndex = this.getMaxXIndex(x);
        const minX = this.xPoints[minXIndex];
        const maxX = this.xPoints[maxXIndex];
        this.infoPanel.style.left = `${e.clientX - 30}px`;
        this.infoPanel.style.top = '50px';

        const height = this.detailedCanvasHeight - 100;
        this.showingLines.forEach(lineName => {
            const prevY = this.chartLines[lineName].points[minXIndex];
            const nextY = this.chartLines[lineName].points[maxXIndex];
            const y = this.getY(x, prevY, minX, nextY, maxX);
            console.log(y);
            console.log(y / (this.detailedCanvasHeight - 100));
            this.infoPanelLinePoints[lineName].style.top =
                `${26 + height - y / this.maxY * height }px`;
            this.infoPanelList[lineName].innerText = `${y}`;
        })
    }
    onDetailedCanvasMouseOut() {
        this.infoPanel.style.display = 'none';
    }

    initInfoPanel() {
        this.infoPanelLinePoints = {};
        this.infoPanelList = {};
        this.showingLines.forEach(lineName => {
            const yPoint = document.createElement('div');
            yPoint.className = 'line-point';
            yPoint.style.color = this.chartLines[lineName].color;
            const ySpan = document.createElement('span');
            this.infoPanelLinePoints[lineName] = yPoint;
            this.infoPanelList[lineName] = ySpan;
            this.infoPanelLine.appendChild(yPoint);
            this.infoPanel.appendChild(ySpan);
        });

        // this.infoPanel.innerText = xText;
    }
    renderDetailedCanvas() {
        const canvas = this.detailedCanvas;
        const context = canvas.getContext('2d');
        const { minX, maxX } = this;
        const shiftY = 100;
        this.detailedCanvasWidth = canvas.width;
        this.detailedCanvasHeight = canvas.height;
        context.clearRect(0, 0, this.detailedCanvasWidth, this.detailedCanvasHeight);

        this.maxY = 0;
        const minXIndex = this.getMinXIndex(minX);
        const maxXIndex = this.getMaxXIndex(maxX);

        for (let i = 0; i < this.showingLines.length; i++) {
            const { points } = this.chartLines[this.showingLines[i]];
            const startingY = this.getY(minX, points[minXIndex],
                minX, points[minXIndex + 1], this.xPoints[minXIndex + 1]);
            const endingY = this.getY(maxX, points[maxXIndex - 1],
                this.xPoints[maxXIndex - 1], points[maxXIndex], maxX);
            const y = this.getMaxY(points, minXIndex, maxXIndex , startingY, endingY);
            if (y > this.maxY) {
                this.maxY = y;
            }
        }

        context.beginPath();
        context.strokeStyle = '#f1f1f2';
        context.fillStyle = '#96a2aa';
        context.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const y = (this.detailedCanvasHeight - shiftY - 50) / 5 * i + 50;
            const x = (this.chartsWidth - 50) / 5 * i;
            const yText = this.maxY * (this.detailedCanvasHeight - shiftY - y) / (this.detailedCanvasHeight - shiftY);
            const xText = new Date(minX + (maxX - minX) * x / this.chartsWidth)
                .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            context.font = "italic 1em \"Fira Sans\", serif";
            context.fillText(`${yText}`, 0, y - 10);
            context.fillText(`${xText}`, x, this.detailedCanvasHeight - shiftY + 20);
            context.moveTo(0, y);
            context.lineTo(this.chartsWidth, y);
        }
        context.stroke();

        this.showingLines.forEach(lineName => {
            this.renderLine(context, this.chartLines[lineName], this.maxY, this.minX, this.maxX, shiftY);
        });
    }

    renderObservingCanvas() {
        const canvas = this.observingCanvas;
        const context = canvas.getContext('2d');
        this.observingCanvasWidth = canvas.width;
        this.observingCanvasHeight = canvas.height;
        context.clearRect(0, 0, this.observingCanvasWidth, this.observingCanvasHeight);
        let maxY = 0;
        for (let i = 0; i < this.showingLines.length; i++) {
            const { points } = this.chartLines[this.showingLines[i]];
            const minXIndex = 0;
            const maxXIndex = this.xPoints.length - 1;
            const startingY = points[minXIndex];
            const endingY = points[maxXIndex];
            const y = this.getMaxY(points, minXIndex, maxXIndex , startingY, endingY);
            if (y > maxY) {
                maxY = y;
            }
        }
        this.showingLines.forEach(lineName => {
            this.renderLine(context, this.chartLines[lineName], maxY)
        })
    }

    renderLine(ctx, line, maxY, minX = this.xPoints[0], maxX = this.xPoints[this.xPoints.length - 1], shiftY) {
        const minXIndex = this.getMinXIndex(minX);
        const maxXIndex = this.getMaxXIndex(maxX);
        const startingY = this.getY(minX, line.points[minXIndex],
            this.xPoints[minXIndex], line.points[minXIndex + 1], this.xPoints[minXIndex + 1]);

        const xDiff = maxX - minX;
        const yDiff = maxY;
        const height = shiftY ? ctx.canvas.height - shiftY : ctx.canvas.height;
        const xFactor = xDiff / ctx.canvas.width;
        const yFactor = yDiff / height;
        ctx.beginPath();
        ctx.moveTo(0, height - startingY / yFactor);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1;
        for (let i = minXIndex + 1; i <= maxXIndex; i++) {
            ctx.lineTo((this.xPoints[i] - minX) / xFactor, height - line.points[i] / yFactor);
        }
        ctx.stroke();
    }

    getMinXIndex(minX) {
        for (let i = 0; i < this.xPoints.length; i++) {
            if (this.xPoints[i] > minX) {
                return i - 1;
            }
        }
    }

    getMaxXIndex(maxX) {
        for (let i = this.xPoints.length - 1; i >= 0; i--) {
            if (this.xPoints[i] < maxX) {
                return i + 1;
            }
        }
    }

    getY(x, prevY, prevX, nextY, nextX) {
        if (x === prevX) {
            return prevY;
        }
        const diffX = nextX - prevX;
        const diffY = nextY - prevY;
        const proportion = diffX / (x - prevX);
        return prevY + diffY / proportion;
    }

    getMaxY(yPoints, minXIndex, maxXIndex, startingY, endingY) {
        let maxY = startingY > endingY ? startingY : endingY;
        for(let i = minXIndex + 1; i < maxXIndex; i++) {
            if (yPoints[i] > maxY) {
                maxY = yPoints[i];
            }
        }
        return maxY;
    }

}

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit)
        }
    }
};
