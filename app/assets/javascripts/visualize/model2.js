// "Model" (read: visualization) for chestnut's in-memory data layout, but not
// for query plans/execution.

class ChestnutModel {
    constructor(model, data) {
        // Top level data structures.
        this.model = model;
        this.tlds = model.map(x => {
            const { header: _header, rows } = data[x.tableType];
            return getDS(x, data, rows);
        });
    }
    // Clone items. ("bind" to existing.)
    bind(svg, allTableVis) {
        this.tlds.map(ds => ds.bind(svg, allTableVis));
    }
    // Form items into new DS.
    async form(svg, chestnutVis, delayFn) {
        for (let i = 0; i < this.tlds.length; i++) {
            const ds = this.tlds[i];
            const dsModel = this.model[i];

            await delayFn();

            const labelRow = new VisStack([], false, 20, 220);
            labelRow.attach(svg, -100, 100);
            makeLabel(svg, dsModel, labelRow);
            chestnutVis.push(labelRow);

            await ds.form(svg, labelRow, delayFn);
        }
    }
}

function makeLabel(svg, model, parentVis) {
    let text = dsVarName(model);

    const sortFields = [];
    for (const { key } of (model.keys || [])) {
        if ('QueryField' === key.expr)
            sortFields.push(key.field);
        else if ('AssocOp' === key.expr) {
            if ('QueryField' !== key.rh.expr || 'id' !== key.rh.field) throw Error(`Unexpected AssocOp RH: ${key.rh.expr}.`);
            if ('QueryField' !== key.lh.expr) throw Error(`Unexpected AssocOp LH: ${key.lh.expr}.`);
            sortFields.push(key.lh.field + '_id');
        }
        else
            throw Error(`Unexpected expr: ${key.expr}.`);
    }
    if (sortFields.length) {
        text += ` (${sortFields.join(', ')})`;
        // const el = new VisElem(createTextEl(`(${sortFields.join(', ')})`));
        // el.attach(svg, -100, 100);
        // label.push(el);
    }

    const label = new VisRecord(text, getColorFromTable(model.tableType));
    label.attach(svg, -100, 100);
    parentVis.push(label);

    for (const nestedModel of (model.value && model.value.nested || []))
        makeLabel(svg, nestedModel, label);
}

function getDS(model, data, rows, parentTableName = null) {
    if ('Index' === model.type) return new IndexDS(model, data, rows, parentTableName);
    if ('BasicArray' === model.type) return new ArrayDS(model, data, rows, parentTableName);
    throw new Error(`Unknown type: '${model.type}'`);
}

class DS {
    constructor(model, data, rows, parentTableName = null) {
        if (!Array.isArray(rows)) throw Error(`ROWS NOT ARRAY: ${rows}.`);
        if (!rows.every(row => Array.isArray(row))) throw Error(`INDIVIDUAL ROW(S) NOT ARRAY: ${rows}.`);

        this.type  = model.type;
        this.path  = model.table;
        this.id    = model.id
        this.value = model.value;

        this.table = determineTableType(data, model, parentTableName);

        this.color = getColorFromTable(this.table);

        this.condition = model.condition;
        this.conditionStr = model.condition_str;

        let { header, rows: _allRows } = data[this.table];
        this.rows = getRowSubsetByCondition({ header, rows }, model.condition);
        if ('Index' === model.type)
            sortIndexRows({ header, rows: this.rows }, model.keys);

        console.log(`${model.id}: ${this.type}[${this.path}]: ${this.rows.length}/${data[this.table].rows.length} rows.`);

        this.records = this.rows.map(row => new Record(model, data, row, parentTableName));

        this.dsVis = new VisStack();
        //dsVis.attach(svg, 0, 0); // Doesn't really matter where/if it is attached.
    }
    bind(svg, allTableVis) {
        this.records.map(record => record.bind(svg, allTableVis));
    }
    async form(svg, chestnutVis, delayFn) {
        chestnutVis.push(this.dsVis);

        for (const record of this.records) {
            await delayFn();
            await record.form(svg, this.dsVis, delayFn);
        }
    }
}
class ArrayDS extends DS {
  // constructor(model, data, rows) {
  //   super(model, data, rows);
  // }
}
class IndexDS extends DS {
  // constructor(model, data, rows) {
  //   super(model, data, rows);
  // }
}


// ONLY RECORDS IN CHESTNUT NESTED DATA STRUCTURE. NOT IN QUERY PLAN EXECUTION.
class Record {
    constructor(model, data, row, parentTableName = null) {
        this.row = row;
        this.path = model.table;
        this.recordVis = null;

        this.table = determineTableType(data, model, parentTableName);

        const { header, rows: _allRows } = data[this.table];
        this.header = header; // TODO remove me? Used by query execution.

        this.recordId = row[header.indexOf('id')];
        if (this.recordId < 0) throw new Error(`Bad recordId: ${this.recordId}.`);

        this.nested = (model.value && model.value.nested || [])
            .map(nestedModel => {
                const nestedRows = getNestedRows(data, model, header, row, nestedModel);
                return getDS(nestedModel, data, nestedRows, this.table);
            });

        // Make pointer index dotted.
        this.dotted = 'Index' === model.type && 'ptr' === model.value.type;
    }
    bind(svg, allTableVis) {
        const tableVis = allTableVis[this.table];
        if (!tableVis) throw Error(`Failed to find table "${this.table}" from tables ${Object.keys(allTableVis)}.`);
        const recordVisToClone = tableVis.get(this.recordId - 1);
        if (!recordVisToClone) return; // SHIELD against invalid FK constraint.

        this.recordVis = recordVisToClone.clone(svg, this.dotted);

        this.nested.forEach(nest => nest.bind(svg, allTableVis));
    }
    async form(svg, dsVis, delayFn) {
        if (!this.recordVis) return; // SHIELD.

        dsVis.push(this.recordVis);

        for (const nest of this.nested) {
            await delayFn();
            await nest.form(svg, this.recordVis, delayFn);
        }
    }
}
