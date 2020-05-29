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

        // One-letter abbreviations.
        const tableAbrv = {};
        (() => {
            const abrvs = new Set();
            outer:
            for (const table of Object.keys(data)) {
                for (let i = 0; i < table.length; i++) {
                    const letter = table[i].toUpperCase();
                    if (!abrvs.has(letter)) {
                        abrvs.add(letter)
                        tableAbrv[table] = letter;
                        continue outer;
                    }
                }
                // Default: use full table name.
                tableLetters[table] = table;
            }
        })();

        // Build tables.
        const allTableVis = this.allTableVis = {};
        for (const [ table, { header, rows } ] of Object.entries(data)) {
            const idIndex = header.indexOf('id');
            const color = getColorFromTable(table);

            const allRecordVis = [];
            for (const row of rows) {
                const recordVis = new VisRecord(tableAbrv[table] + row[idIndex], color, { table, row });
                allRecordVis.push(recordVis);
            }

            const tableVis = new VisStack(allRecordVis);
            allTableVis[table] = tableVis;
        }

        // Table of Contents.
        const toc = getColorTable();
        const tocItems = Object.entries(toc)
            .map(([ tableName, color ]) => new VisRecord(`${tableName} (${tableAbrv[tableName]})`, color));

        const tocDiskRows = Object.values(allTableVis).map((disk, i) => new VisStack([ tocItems[i], disk ], false, 20, 120));
        const tocDiskVis = new VisStack([ new VisElem(createTextEl('Tables (On Disk)')), ...tocDiskRows ], true, 20);
        const tocDiskBox = new VisBox(tocDiskVis, 'rgba(0, 0, 0, 0.05)', 20);

        const chestnutVis = new VisStack([ new VisElem(createTextEl('Chestnut (In-Memory)')) ], true, 20);
        const chestnutBox = new VisBox(chestnutVis, 'rgba(0, 0, 0, 0.05)', 20); // TODO find out color order.
        this.chestnutVis = chestnutVis;

        // QUERY VIS START
        this.qpVis = new VisStack([], false, 20);
        // QUERY VIS END

        this.root = new VisSvg(
                new VisStack([ tocDiskBox, chestnutBox, this.qpVis ], true, 20));
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
