// Overall controller for animations.

class VisualizerController {
    constructor(svg) {
        this.svg = svg;
    }
    load(data) {
        // const res = await fetch('/api/tsv');
        // const json = await res.json();
        this.data = data; //json;
    }
    draw() {
        const svg = this.svg;
        const data = this.data;

        // Remove anything existing.
        // while (svg.firstChild) {
        //     svg.removeChild(svg.firstChild);
        // }
        svg.innerHTML = `\
<defs>
    <marker id="head" orient="auto" markerHeight="4" refX="3.5" refY="2" markerWidth="4">
        <path fill="black" d="M0,0 V4 L4,2 Z"></path>
    </marker>
</defs>`;

        // Build tables.
        const allTableVis = this.allTableVis = {};
        for (const [ table, { header, rows } ] of Object.entries(data)) {
            const idIndex = header.indexOf('id');
            const color = getColorFromTable(table);

            const allRecordVis = [];
            for (const row of rows) {
                const recordVis = new VisRecord(table.slice(0, 1).toUpperCase() + row[idIndex], color, { table, row });
                allRecordVis.push(recordVis);
            }

            const tableVis = new VisStack(allRecordVis);
            allTableVis[table] = tableVis;
        }

        // Table of Contents.
        const toc = getColorTable();
        const tocItems = Object.entries(toc).map(([ tableName, color ]) => new VisRecord(`${tableName} (${tableName.slice(0, 1).toUpperCase()})`, color));
        const tocVis = new VisStack([ new VisElem(createTextEl('Tables (On Disk)')), ...tocItems ], true, 20);
        const tocBox = new VisBox(tocVis, 'rgba(0, 0, 0, 0.05)', 20);

        const diskVis = new VisStack([ new VisElem(createTextEl('Records')), ...Object.values(allTableVis) ], true, 20);
        const diskBox = new VisBox(diskVis, 'rgba(0, 0, 0, 0.05)', 20); // TODO find out color order.

        const tocDiskVis = new VisStack([ tocBox, diskBox ], false, -1);

        const chestnutVis = new VisStack([ new VisElem(createTextEl('Chestnut (In-Memory)')) ], true, 20);
        const chestnutBox = new VisBox(chestnutVis, 'rgba(0, 0, 0, 0.05)', 20); // TODO find out color order.
        this.chestnutVis = chestnutVis;

        // QUERY VIS START
        this.qpVis = new VisStack([], false, 20);
        // QUERY VIS END

        this.root = new VisSvg(
                new VisStack([ tocDiskVis, chestnutBox, this.qpVis ], true, 20));
        this.root.attach(svg);
    }
    clearPlans() {
        this.qpVis.clear();
    }
    _makeAQpVis() {
        const aQpVis = new VisStack([ new VisElem(createTextEl('Query Execution')) ], true, 20);
        const qpBox = new VisBox(aQpVis, 'rgba(0, 0, 0, 0.05)', 20);
        qpBox.attach(this.svg, -200, 1000);

        this.qpVis.push(qpBox);
        return aQpVis;
    }
    async play(model) {
        this.chestnutModel = new ChestnutModel(model, this.data);
        this.chestnutModel.bind(this.svg, this.allTableVis);
        await this.chestnutModel.form(this.svg, this.chestnutVis, () => Promise.resolve()); //delay(0)); // TODO set to 50.
    }
    async playQp(qpInfo, qpContext, delayer = null) {
        if (!delayer)
            delayer = (s = 1) => delay(s * 400);

        this.qpModel = new QueryPlanModel(qpInfo, this.data);
        // this.qpModel.bind(this.svg, this.chestnutModel);
        // await this.qpModel.form(this.svg, this.qpVis, () => delay(100))

        // TODO
        // Delay needs to match or be greater than css transition speed.
        this.qpModel.form(qpInfo, qpContext, this.svg, this._makeAQpVis(), this.chestnutModel, delayer);
    }
}
