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
        this.sliderWidth = this.chartsWidth / 5;
        this.sliderPosition = 0;
        this.isDayModeEnabled = true;

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
        // this.rerenderDetailedCanvas = this.renderDetailedCanvas.bind(this);
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

        this.nightModeContainer = document.createElement('div');
        this.nightModeContainer.innerText = 'Switch to Night Mode';
        this.nightModeContainer.className = 'nightModeContainer';

        this.linesSelectorContainer = document.createElement('div');
        this.linesSelectorContainer.className = 'linesSelectorContainer';

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
        this.rightPlaceHolder.style.width = `${this.chartsWidth - this.sliderWidth
        - this.sliderPosition}px`;
        this.rightPlaceHolder.style.left = `${this.sliderWidth + this.sliderPosition}px`;
        this.slider.style.width = `${this.sliderWidth}px`;
        this.slider.style.left = `${this.sliderPosition}px`;
        this.sliderLeftBorder.style.left = `${this.sliderPosition}px`;
        this.sliderRightBorder.style.left = `${this.sliderPosition + this.sliderWidth - 5}px`;
        this.slider.addEventListener('mousedown', this.onSliderMouseDown.bind(this));
        container.addEventListener('mouseup', this.onSliderMouseUp.bind(this));
        this.sliderLeftBorder.addEventListener('mousedown', this.onLeftSliderBorderMouseDown.bind(this));
        container.addEventListener('mouseup', this.onLeftSliderBorderMouseUp.bind(this));
        this.sliderRightBorder.addEventListener('mousedown', this.onRightSliderBorderMouseDown.bind(this));
        container.addEventListener('mouseup', this.onRightSliderBorderMouseUp.bind(this));
        container.addEventListener('mouseleave', this.onContainerMouseLeave.bind(this));
        this.detailedCanvas.addEventListener('mouseover', this.onDetailedCanvasMouseOver.bind(this));
        this.detailedCanvas.addEventListener('mousemove', this.onDetailedCanvasMouseMove.bind(this));
        this.detailedCanvas.addEventListener('mouseout', this.onDetailedCanvasMouseOut.bind(this));
        this.nightModeContainer.addEventListener('click', this.toggleDayMode.bind(this));

        this.slider.appendChild(this.sliderLeftBorder);
        this.slider.appendChild(this.sliderRightBorder);
        this.controllingContainer.appendChild(this.leftPlaceHolder);
        this.controllingContainer.appendChild(this.slider);
        this.controllingContainer.appendChild(this.rightPlaceHolder);
        container.appendChild(this.detailedCanvas);
        container.appendChild(this.observingCanvas);
        container.appendChild(this.controllingContainer);
        container.appendChild(this.infoPanel);
        container.appendChild(this.linesSelectorContainer);
        container.appendChild(this.nightModeContainer);
        document.body.appendChild(container);
        this.chartContainer = container;
    }

    onSliderMouseDown(e) {
        e.stopPropagation();
        this.chartContainer.addEventListener('mousemove', this.onSliderMouseMove);
        this.mouseMoving = true;
    }
    onSliderMouseMove(e) {
        e.preventDefault();
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
        this.mouseMoving = false;
    }

    onLeftSliderBorderMouseDown(e) {
        e.stopPropagation();
        this.chartContainer.addEventListener('mousemove', this.onLeftSliderBorderMouseMove);
        this.mouseMoving = true;
    }
    onLeftSliderBorderMouseUp() {
        this.chartContainer.removeEventListener('mousemove', this.onLeftSliderBorderMouseMove);
        this.mouseMoving = false;
    }
    onLeftSliderBorderMouseMove(e) {
        e.preventDefault();
        e.stopPropagation();
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
        this.mouseMoving = true;
    }
    onRightSliderBorderMouseUp() {
        this.chartContainer.removeEventListener('mousemove', this.onRightSliderBorderMouseMove);
        this.mouseMoving = false;
    }
    onRightSliderBorderMouseMove(e) {
        e.preventDefault();
        e.stopPropagation();
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
        const xText = new Date(x).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });

        const minXIndex = this.getMinXIndex(x);
        const maxXIndex = this.getMaxXIndex(x);
        const minX = this.xPoints[minXIndex];
        const maxX = this.xPoints[maxXIndex];
        this.infoPanel.style.left = `${e.clientX - 40}px`;
        const infoPanelHeight = getComputedStyle(this.infoPanel).height;
        this.infoPanel.style.top = `${122 - infoPanelHeight.slice(0, -2)}px`;

        const height = this.detailedCanvasHeight - 50;

        this.infoPanelXvalue.innerText = `${xText}`;
        this.showingLines.forEach(lineName => {
            const { points, color } = this.chartLines[lineName];
            const prevY = points[minXIndex];
            const nextY = points[maxXIndex];
            const y = this.getY(x, prevY, minX, nextY, maxX);
            this.infoPanelLinePoints[lineName].style.top =
                `${30 + height - y / this.maxY * height }px`;
            this.infoPanelList[lineName].style.color = color;
            this.infoPanelList[lineName].innerHTML = `${Math.round(y)}<br>${lineName}`;
        })
    }
    onDetailedCanvasMouseOut(e) {
        if (e.layerY < 0) {
            return;
        }
        this.infoPanel.style.display = 'none';
    }
    onContainerMouseLeave() {
        this.infoPanel.style.display = 'none';
    }

    initInfoPanel() {
        this.infoPanelLinePoints = {};
        this.infoPanelList = {};

        this.infoPanelXvalue = document.createElement('div');
        this.infoPanelYList = document.createElement('div');
        this.infoPanelXvalue.className = 'infoPanelXvalue';
        this.infoPanelYList.className = 'infoPanelYList';
        this.infoPanel.appendChild(this.infoPanelXvalue);
        this.infoPanel.appendChild(this.infoPanelYList);
        this.showingLines.forEach(lineName => {
            const yPoint = document.createElement('div');
            const yCheckboxContainer = document.createElement('label');
            const yCheckboxContainerMark = document.createElement('span');
            const yCheckbox = document.createElement('input');
            yCheckboxContainer.className = 'yCheckboxContainer';
            yCheckboxContainerMark.className = 'yCheckboxContainerMark';
            yCheckbox.className = 'yCheckbox';
            yCheckbox.type = 'checkbox';
            yCheckbox.checked = true;
            yCheckboxContainerMark.style.backgroundColor = this.chartLines[lineName].color;
            yCheckbox.style.background = true;
            yPoint.className = 'line-point';

            yPoint.style.color = this.chartLines[lineName].color;
            const yInfo = document.createElement('div');
            this.infoPanelLinePoints[lineName] = yPoint;
            this.infoPanelList[lineName] = yInfo;
            yCheckboxContainer.innerText = lineName;
            yCheckbox.style.color = this.chartLines[lineName].color;
            yCheckbox.onclick = (e) => {
                if (e.target.checked) {
                    this.showingLines.push(lineName);
                    this.infoPanelLinePoints[lineName].style.display = 'block';
                    this.infoPanelList[lineName].style.display = 'block';
                }
                else {
                    const index = this.showingLines.findIndex(name => name === lineName);
                    this.showingLines.splice(index, 1);
                    this.infoPanelLinePoints[lineName].style.display = 'none';
                    this.infoPanelList[lineName].style.display = 'none';
                }

                this.renderDetailedCanvas();
                this.renderObservingCanvas();
            };

            this.infoPanelLine.appendChild(yPoint);
            this.infoPanelYList.appendChild(yInfo);

            yCheckboxContainer.appendChild(yCheckbox);
            yCheckboxContainer.appendChild(yCheckboxContainerMark);
            this.linesSelectorContainer.appendChild(yCheckboxContainer);
        });
    }

    renderDetailedCanvas() {
        if (this.animationing) {
            return;
        }
        const canvas = this.detailedCanvas;
        const context = canvas.getContext('2d');
        const { minX, maxX } = this;
        const shiftY = 50;
        this.detailedCanvasWidth = canvas.width;
        this.detailedCanvasHeight = canvas.height;

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
        if (!this.prevMaxY) {
            this.prevMaxY = this.maxY
        }
        const yChange = this.prevMaxY - this.maxY;
        const render = (temporaryMaxY, topShift = 0) => {
            context.clearRect(0, 0, this.detailedCanvasWidth, this.detailedCanvasHeight);
            context.beginPath();
            context.strokeStyle = this.isDayModeEnabled ? '#f1f1f2' : '#313d4d';
            context.fillStyle = this.isDayModeEnabled ? '#96a2aa' : '#546778';
            context.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const y = (this.detailedCanvasHeight - shiftY - 50) / 5 * i + 50;
                const x = (this.chartsWidth - 60) / 5 * i;
                const yText = temporaryMaxY * (this.detailedCanvasHeight - shiftY - y) / (this.detailedCanvasHeight - shiftY);
                const xText = new Date(minX + (maxX - minX) * (x + 20) / this.chartsWidth)
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                context.font = "19px \"Fira Sans\", serif";
                context.fillText(`${Math.round(yText)}`, 0, y - 10);
                context.fillText(`${xText}`, x, this.detailedCanvasHeight - shiftY + 20);
                context.moveTo(0, y);
                context.lineTo(this.chartsWidth, y);
            }
            context.stroke();

            this.showingLines.forEach(lineName => {
                this.renderLine(context, this.chartLines[lineName], this.maxY, this.minX, this.maxX, shiftY, topShift);
            });
        };
        const skipAnimation = this.mouseMoving || (yChange === 0);
        if (skipAnimation) {
            render(this.maxY);
        } else {
            const yGrow = yChange / 20;
            for (let j = 0; Math.abs(j) <= Math.abs(yChange / yGrow); j++) {
                const timer = 400 / 30 * j;
                const temporaryMaxY = this.prevMaxY - j * yGrow;
                setTimeout(() => {
                    this.animationing = true;
                    render(temporaryMaxY, yChange - j * yGrow);
                    this.animationing = false;
                }, timer);
            }
        }
        this.prevMaxY = this.maxY;
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

    renderLine(ctx, line, maxY, minX = this.xPoints[0], maxX = this.xPoints[this.xPoints.length - 1], shiftY = 0, topShift = 0) {
        const minXIndex = this.getMinXIndex(minX);
        const maxXIndex = this.getMaxXIndex(maxX);
        const startingY = this.getY(minX, line.points[minXIndex],
            this.xPoints[minXIndex], line.points[minXIndex + 1], this.xPoints[minXIndex + 1]);

        const animationShift = maxY / (maxY + topShift) ;
        const xDiff = maxX - minX;
        const yDiff = maxY;
        const height = ctx.canvas.height - shiftY;
        const xFactor = xDiff / ctx.canvas.width;
        const yFactor = yDiff / height / animationShift;
        ctx.beginPath();
        ctx.moveTo(0, height - startingY / yFactor);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2;
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

    toggleDayMode() {
        this.chartContainer.classList.toggle('nightMode');
        this.isDayModeEnabled = !this.isDayModeEnabled;
        this.nightModeContainer.innerText = this.isDayModeEnabled ?
            'Switch to Night Mode'
            : 'Switch to Day Mode';
        this.renderDetailedCanvas();
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
