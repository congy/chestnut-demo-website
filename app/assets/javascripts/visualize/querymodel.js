// "Model" (read: visualization) for Chestnut's query plans & execution.

class QueryPlanModel {
    constructor(qpInfo, data) {
        this.qpInfo = qpInfo;
    }
    // Clone items. ("bind" to existing.)
    // NOTE: binds everything at once, which may be annoying for the query plan execution.
    bind(svg, chestnutModel) {
        console.log(chestnutModel.tlds);
        
        const DS17 = chestnutModel.tlds[3];
        const REC = DS17.records[0];

        this.ARR = new Arrow();
        this.ARR.setTail(REC._recordVis);

        this._recordVis = REC._recordVis.clone(svg, REC.dotted);
    }
    // Form items into new DS.
    async form(svg, chestnutVis, delayFn) {
        await delayFn();
        chestnutVis.push(this._recordVis);

        await delayFn();
        this.ARR.setHead(this._recordVis);

        this.ARR.attach(svg);
        console.error(this.ARR);
        // for (const ds of this.tlds) {
        //     await delayFn();
        //     await ds.form(svg, chestnutVis, delayFn);
        // }
    }
}
