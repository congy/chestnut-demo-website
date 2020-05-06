// SVG utilities, basic Vis classes.

const delay = (d) => new Promise(resolve => setTimeout(resolve, d));
//const frame = () => new Promise(resolve => window.requestAnimationFrame(resolve));
//const delayFrame = (d) => Promise.all([ delay(d), frame() ]).then(() => {});


function moveEl(el, x, y) {
    if (typeof x !== 'number' || typeof y !== 'number')
        throw Error('x, y must be numeric.');
    //el.setAttribute('transform', `translate(${x}, ${y})`);
    el.setAttribute('style', `transform: translate(${x}px, ${y}px)`);
}

// function createGroupEl() {
//     const el = document.createElementNS(xmlns, "g");
//     return el;
// }

function createTextEl(text) {
    const el = document.createElementNS(xmlns, "text");
    el.textContent = text;
    el.setAttribute('dominant-baseline', 'text-before-edge');
    return el;
}

function createRectEl() {
    const el = document.createElementNS(xmlns, "rect");
    el.setAttribute('fill', 'white');
    el.setAttribute('stroke', 'black');
    return el;
}

function createPathEl() {
    const el = document.createElementNS(xmlns, "path");
    el.setAttribute('stroke', 'black');
    el.setAttribute('marker-end', 'url(#head)');
    el.setAttribute('stroke-width', '2');
    return el;
}

class Vis {
    constructor() {
        this.parent = null;
        this.watchers = [];
    }
    setParent(parent) {
        if (null === parent)
            throw Error('set parent null.');
        this.parent = parent;
    }
    reflowParent() {
        // console.log(`reflow ${this.constructor.name} -> parent ${this.parent && this.parent.constructor.name}`);
        if (null !== this.parent)
            this.parent.reflow(this);
    }
}

class VisElem extends Vis {
    constructor(elem) {
        super();
        this.elem = elem;
    }
    reflow(_child) {
        this.reflowParent();
    }
    move(x, y) {
        moveEl(this.elem, x, y);
    }
    size() {
        if (!this.elem.parentNode)
            throw Error('Cannot call size() before attach()');
        return this.elem.getBBox();
    }
    loc() {
        throw 'Not Implemented';
    }
    attach(svg, x, y) {
        this.move(x, y);
        svg.appendChild(this.elem);

        this.elem.getBBox(); // HACK: makes browser position element.
    }
    detach() {
        this.elem.remove();
    }
    clone(svg) {
        throw 'Not Implemented';
        // // this.x, this.y not defined.
        // const copy = new VisElem(elem.cloneNode(true));
        // copy.attach(svg, this.x, this.y);
        // return copy;
    }
}

class VisBox extends Vis {
    constructor(item, color = 'white', pad = 0, dotted = false) {
        super();

        this.item = item;
        this.item.setParent(this);

        this.color = color;
        this.rect = createRectEl();
        this.rect.setAttribute('fill', color);
        if (dotted)
            this.rect.setAttribute('stroke-dasharray', '6 4');

        this.pad = pad;
        this.width = 0;
        this.height = 0;

        this.x = null;
        this.y = null;
    }
    // Returns true if size changed.
    _update() {
        let { width, height } = this.item.size();
        width  += 2 * this.pad;
        height += 2 * this.pad;

        if (this.width === width && this.height === height)
            return false;

        this.rect.setAttribute('width',  width);
        this.rect.setAttribute('height', height);

        this.width  = width;
        this.height = height;

        return true;
    }
    reflow(child) {
        if (this._update())
            this.reflowParent();
    }
    move(x, y) {
        if (this.x === x && this.y === y)
            return;

        this.x = x;
        this.y = y;

        this.item.move(x + this.pad, y + this.pad);
        moveEl(this.rect, x, y);
    }
    size() {
        return { width: this.width, height: this.height };
    }
    loc() {
        return { x: this.x, y: this.y };
    }
    attach(svg, x, y) {
        this.x = x;
        this.y = y;

        moveEl(this.rect, x, y);
        svg.appendChild(this.rect);
        this.item.attach(svg, x + this.pad, y + this.pad);

        this._update();

        this.rect.getBBox(); // HACK: makes browser position element.
    }
    detach() {
        this.rect.remove();
        this.item.detach();
    }
    clone(svg) {
        throw new Error('NOT IMPLEMENTED.');
        const copy = new VisBox(this.item.clone(svg), this.color, this.pad);
        copy.attach(svg, this.x, this.y);
        return copy;
    }
}

const vrPad = 5;
const vrSpacing = 5;
class VisRecord extends Vis {

    constructor(label, color = 'rgba(255, 0, 0, 0.1)', data = null, boxDotted = false) {
        super();
        this.label = label;
        this.data = data;

        this.text = createTextEl(label);
        // this.box = createRectEl();
        // this.box.setAttribute('fill', color);

        this.stack = new VisStack([ new VisElem(this.text) ], true, vrSpacing);
        // this.stack.setParent(this);

        this.color = color;
        this.box = new VisBox(this.stack, color, vrPad, boxDotted);
        this.box.setParent(this);

        this.width = 0;
        this.height = 0;

        this.x = null;
        this.y = null;
    }
    reflow(child) {
        let { width, height } = this.box.size();

        if (this.width === width && this.height === height)
            return;

        // this.box.setAttribute('width',  nw);
        // this.box.setAttribute('height', nh);

        this.width  = width;
        this.height = height;

        this.reflowParent();
    }
    move(x, y) {
        if (this.x === x && this.y === y)
            return;

        this.x = x;
        this.y = y;
        // moveEl(this.text, x + VisRecord.pad, y + VisRecord.pad);
        // this.stack.move(x + VisRecord.pad, y + VisRecord.pad);
        // moveEl(this.box, x, y);
        this.box.move(x, y);
    }
    size() {
        return { width: this.width, height: this.height };
    }
    loc() {
        return { x: this.x, y: this.y };
    }
    attach(svg, x, y) {
        this.x = x;
        this.y = y;

        this.box.attach(svg, x, y);
        const { width, height } = this.box.size();

        this.width = width;
        this.height = height;
    }
    detach() {
        this.box.detach();
        this.stack.detach();
    }
    clone(svg, boxDotted = false) {
        // Note: boxDotted not cloned.
        const copy = new VisRecord(this.label, this.color, JSON.parse(JSON.stringify(this.data)), boxDotted);
        copy.attach(svg, this.x, this.y);
        return copy;
    }

    // Add sub-DS.
    push(item) {
        this.stack.push(item);
    }
}

class VisStack extends Vis {
    constructor(items = [], isVert = false, pad = 0) {
        super();

        this.items = items;
        this.items.forEach(item => item.setParent(this));

        this.pad = pad;
        this.width = 0;
        this.height = 0;
        this.isVert = isVert;

        this.x = null;
        this.y = null;
    }
    _update(triggerIndex = -1, attachSvg = null) {
        let x = this.x;
        let y = this.y;

        let w = 0;
        let h = 0;

        if (this.items.length) {
            for (let i = 0; i < this.items.length; i++) {
                const item = this.items[i];
                if (attachSvg)
                    item.attach(attachSvg, x, y);
                else if (i > triggerIndex)
                    item.move(x, y);
                const { width, height } = item.size();

                if (this.isVert) {
                    w = Math.max(w, width);
                    h += height + this.pad;
                    y += height + this.pad;
                }
                else {
                    h = Math.max(h, height);
                    w += width + this.pad;
                    x += width + this.pad;
                }
            }

            if (this.isVert) {
                h -= this.pad;
                y -= this.pad;
            }
            else {
                w -= this.pad;
                x -= this.pad;
            }
        }

        if (this.width === w && this.height === h)
            return false;

        this.width = w;
        this.height = h;
        return true;
    }
    reflow(child) {
        if (this._update(this.items.indexOf(child)))
            this.reflowParent(this);
    }
    move(x, y, attachSvg = null) {
        if (this.x === x && this.y === y)
            return;

        this.x = x;
        this.y = y;

        this._update(-1, attachSvg);
    }
    size() {
        return { width: this.width, height: this.height };
    }
    loc() {
        return { x: this.x, y: this.y };
    }
    attach(svg, x, y) {
        this.move(x, y, svg);
    }
    // Does not actually detach stack since the stack does
    // not exist in the DOM. It is only a list/container.
    detach() {
        // TODO animate?
        this.items.forEach(x => x.detach());
    }
    clone(svg) {
        throw Error('Cannot clone VisStack (yet).');
    }

    length() {
        return this.items.length;
    }
    push(item) {
        this.items.push(item);
        item.setParent(this);

        this.reflow(); // TODO could make this more efficient (?).
    }
    // TODO: clear() detaches but pop() does not.
    clear() {
        if (!this.items.length) return;
        // Only really detaches children.
        this.detach();
        // Reset items.
        this.items = [];
        this.reflow(); // TODO could make this more efficient (?).
    }
    // TODO: clear() detaches but pop() does not.
    pop() {
        if (!this.items.length) return;
        this.items.pop(); //.detach();
        this.reflow(); // TODO could make this more efficient (?).
    }
    get(i) {
        return this.items[i];
    }
}

class Arrow {
    constructor(tail = null, head = null) {
        this.tail = { x: 0, y: 0 };
        this.head = { x: 0, y: 0 };
        this.el = createPathEl();

        if (tail) this.setTail(tail);
        if (head) this.setHead(head);
    }
    _update() {
        this.el.setAttribute('d', `M ${this.tail.x} ${this.tail.y} L ${this.head.x} ${this.head.y}`);
    }
    _getLoc(vis) {
        const { width, height } = vis.size();
        let { x, y } = vis.loc();
        x += width / 2;
        y += height / 2;
        return { x, y };
    }

    attach(svg) {
        svg.appendChild(this.el);
    }
    detach() {
        this.el.remove();
    }

    setTail(vis) {
        this.tail = this._getLoc(vis);
        this._update();
    }
    setHead(vis) {
        this.head = this._getLoc(vis);
        this._update();
    }

    remove() {
        this.el.remove();
    }
}
