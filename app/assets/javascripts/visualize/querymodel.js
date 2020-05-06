// "Model" (read: visualization) for Chestnut's query plans & execution.

class QueryPlanModel {
  constructor(qpInfo, data) {
    this.qpInfo = qpInfo;
    this.data = data;
  }
  // Clone items. ("bind" to existing.)
  // NOTE: binds everything at once, which may be annoying for the query plan execution.
  bind(svg, chestnutModel) {
    console.log(chestnutModel.tlds);
    this.chestnutModel = chestnutModel;
    
    // const DS17 = chestnutModel.tlds[3];
    // const REC = DS17.records[0];

    // this.ARR = new Arrow();
    // this.ARR.setTail(REC.recordVis);

    // this.recordVis = REC.recordVis.clone(svg, REC.dotted);
  }
  // Form items into new DS.
  async form(qpInfo, qpContext, svg, qpVis, chestnutModel, delayFn) {
    // await delayFn();
    // qpVis.push(this.recordVis);

    // await delayFn();
    // this.ARR.setHead(this.recordVis);

    // this.ARR.attach(svg);
    // console.error(this.ARR);

    const visContext = new VisContext(svg, qpVis, chestnutModel, delayFn, this.data);
    await qpExec(qpInfo.plan, qpContext, visContext);
  }
}

class VisContext {
  constructor(svg, qpVis, chestnutModel, delayFn, data) {
    this.svg = svg;
    this.qpVis = qpVis;
    this.chestnutModel = chestnutModel;
    this.delayFn = delayFn;
    // Tabular data.
    this.data = data;

    // Variable data during query exection. Changes whenever a variable changes.
    this.varDict = new Map();
  }

  _getVar(name) {
    return this.varDict.get(name);
  }
  getVar(name) {
    const varData = this._getVar(name);
    if (undefined === varData) throw Error(`Cannot get value for undefined var: ${name}.`);
    return varData;
  }
  getVarValue(name) {
    return this.getVar(name).value;
  }

  _setVar(name, valVis, value, requireNew = false) {
    let nameAndVarVis;

    if (this.varDict.has(name)) {
      if (requireNew) throw Error(`Cannot create var that already exists: "${name}".`);
      nameAndVarVis = this.varDict.get(name).nameAndVarVis;
      nameAndVarVis.pop();
      nameAndVarVis.push(valVis);
    }
    else {
      nameAndVarVis = new VisStack([ new VisElem(createTextEl(name)), valVis ], false, 20);
      const { x, y } = this.qpVis.loc();
      nameAndVarVis.attach(this.svg, x - 500, y);
      this.qpVis.push(nameAndVarVis);
    }
    this.varDict.set(name, { valVis, nameAndVarVis, value });
  }
  createAtomVar(name, value = null) {
    // Should be just a int, string, or null. So JSON.stringify can be (ab)used.
    const valVis = new VisElem(createTextEl(JSON.stringify(value)));
    this._setVar(name, valVis, value, true);
  }
  createListVar(name) {
    // Can be a list of values (kinda like a BasicArray) or just a single value; both are handled as lists.
    const valVis = new VisStack([], false, 0);
    this._setVar(name, valVis, [], true);
  }
  createPtrVar(name) {
    // TODO
    throw 'NOT IMPLEMENTED';
  }

  // Clears and sets a list to a single record.
  setListVar(name, record) {
    const { valVis, value: _oldValue } = this._getVar(name);
    // This needs to be a list (VisStack).
    valVis.clear();
    valVis.push(record.recordVis.clone(this.svg));

    // Set value. Also sets varVis to itself.
    const value = [ { header: record.header, row: record.row } ]; // Must be a list
    this._setVar(name, valVis, value);
  }
  pushListVar(name) {
    throw 'TODO'; // TODO.
  }

  // Push the `valName` var to `listName` list var.
  pushToListVar(listName, valName) {
    const { valVis: lValVis, value: lValue } = this.getVar(listName);
    const { valVis: vValVis, value: vValue } = this.getVar(valName);

    lValue.push(vValue); // Clone?
    lValVis.push(vValVis.items[0].clone(this.svg));

    // TODO: Something here?
  }
}

// visContext = { svg, qpVis, chestnutModel, delayFn }
async function qpExec(step, qpContext, visContext) {
  const { svg, qpVis, chestnutModel, delayFn } = visContext;

  switch (step.type) {
    case "ExecQueryStep": {
      // TOOD?
      const outInfo = qpContext.qpInfo.output;
      const [ outName, isNew ] = qpContext.getEnvVar(outInfo);
      if (isNew) throw 'NEW VARIABLE CREATED!!'; // TODO REMOVE
      visContext.createListVar(outName);

      for (const inpInfo of qpContext.qpInfo.inputs) {
        const [ inpName, inpIsNew ] = qpContext.getParamVar(inpInfo);
        if (inpIsNew) throw 'NEW VARIABLE CREATED!!'; // TODO REMOVE

        const { header: cHead, rows: cRows } = visContext.data['channel']; // TODO THIS IS TEMP HACK.
        const value = cRows[(cRows.length * Math.random()) | 0][cHead.indexOf('name')];
        visContext.createAtomVar(inpName, value);
      }

      await qpExec(step.value.steps, qpContext.subs[0], visContext);
      break;
    }
    case "ExecStepSeq": {
      for (const subStep of step.value) {
        await qpExec(subStep, qpContext, visContext);
        await delayFn();
      }
      break;
    }
    case "ExecScanStep": {
      const idx = step.value.idx;
      // JSON datastructure representation.
      const thisDs = qpContext.getDs(idx);
      // model2.js datastructure model.

      // TODO: this needs to be grabbed from some context. TODO TODO TODO TODO TODO.
      const dsModel = visContext.chestnutModel.tlds.find(tlds => idx === tlds.id);

      // Error checking.
      if (!thisDs) throw Error(`QP Context missing DS IDX ${idx}.`);
      if (!dsModel) throw Error(`Chestnut model missing DS IDX ${idx}.`);

      // // TODO
      // // If this is a ptr index we need to follow the pointer.
      // if ('Index' === thisDs.type && 'ptr' === thisDs.value.type) {
      //   const targetDs = qpContext.getDs(thisDs.value.target);
      //   if (!targetDs) throw Error(`QP Context missing Index target IDX ${thisDs.value.target}`);
      //   break; // TODO do something here.
      // }

      const loopContext = qpContext.subs[0];
      const loopVar = loopContext.loopVar;
      console.log(`Loop context with loop var: ${loopVar}`);
      visContext.createListVar(loopVar); // Added.

      // // TODO: handle index bounds.
      // if (step.value.exact) {

      // }
      // else if (step.value.lower) {
        
      // }
      // else {}
      for (let i = 0; i < dsModel.records.length; i++) {
        const recordModel = dsModel.records[i];
        console.log(`Set loop var: ${loopVar} = ID ${recordModel.recordId}`);

        visContext.setListVar(loopVar, recordModel);
        await delayFn();

        qpExec(step.value.steps, loopContext, visContext);
      }

      // TODO
      break;
    }
    case "ExecSetVarStep": {
      let localContext = qpContext;
      if (step.value.cond) {
        // TODO EVAL CONDITION!
        const { header, row } = visContext.getVarValue(qpContext.loopVar)[0]; // Get first/only val from list.
        const condEval = evalExpr(step.value.cond, header, row, { qpContext, visContext });
        console.log(`CONDITION: ${condEval}.`);
        if (false === condEval) // No set if cond is false.
          break;

        localContext = qpContext.subs[0];
      }

      if (step.value.var.atom) {
        // Value is an "atom", meaning several things:
        // - It is a single value (not a collection).
        // - It is not a output result.
        throw 'TODO'; // TODO.
        // const [ aVar, isNew ] = localContext.getEnvVar(step.value.var);
        // if ('count()' == step.value.expr) {
        //   if (isNew) throw Error('ExecSetVarStep with expr count() cannot be new.');
        //   localContext.writeLine(`${aVar} += 1`)
        // }
        // else if (isNew)
        //   localContext.writeLine(`${aVar}: ${step.value.var.type} = ${step.value.expr.value}`);
        // else
        //   localContext.writeLine(`${aVar} = ${step.value.expr.value}`);
      }
      else {
        // Value is NOT an "atom", it is a collection (EnvCollectionVariable).
        // - It may be a result? Yes I think it has to be a result (outVar).
        // - ??
        if (step.value.var.init) throw Error(`Collection variable had init value: ${step.value.var.init}.`);

        // Schema: qpContext.parent.outVar .push( localContext.loopVar )
        visContext.pushToListVar(localContext.parent.outVar, localContext.loopVar);
      }

      // TODO
      break;
    }
    case "ExecSortStep": {
      // TODO
      break;
    }
    default: {
      console.error(step, qpContext, visContext);
      throw new Error(`Unknown: ${step.type} from ${step}.`);
    }
  }
}

class VariableModel {

}
