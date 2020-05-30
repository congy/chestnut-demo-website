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

    const codemark = document.getElementById('codemark');
    codemark.innerHTML = '';
    const pre = document.createElement('pre');
    pre.className = 'prettyprint lang-py linenums';
    pre.innerText = qpContext.toString();
    codemark.appendChild(pre);

    PR.prettyPrint();

    function markLinesFn(lines) {
      const lis = pre.querySelectorAll('li');
      for (let i = 0, j = 0; i < lis.length; i++) {
        const li = lis[i];
        if (lines[j] <= i) {
          j++;
          li.style['background-color'] = '#FFC';
        }
        else
          li.style.removeProperty('background-color');
      }
    }

    this.qpContext = qpContext;
    this.visContext = new VisContext(svg, qpVis, chestnutModel, delayFn, this.data, markLinesFn);
    await qpExec(qpInfo.plan, qpContext, this.visContext);
  }
}

class VisContext {
  constructor(svg, qpVis, chestnutModel, delayFn, data, markLinesFn) {
    this.svg = svg;
    this.qpVis = qpVis;
    this.chestnutModel = chestnutModel;
    this.delayFn = delayFn;
    // Tabular data.
    this.data = data;

    // Available datastructures. (TODO: removing variables when they go out of scope).
    this.availDs = new Map(Object.values(chestnutModel.tlds).map(ds => [ ds.id, ds ]));

    // Variable data during query exection. Changes whenever a variable changes.
    this.varDict = new Map();

    // Deferred result pushes.
    this.deferredResultPushes = [];

    this.markLinesFn = markLinesFn;
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
      const oldValVis = nameAndVarVis.pop();
      // Detach if not self-replacement.
      if (oldValVis && oldValVis !== valVis) oldValVis.detach();
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
  varExists(name) {
    return this.varDict.has(name);
  }
  createAtomVar(name, value = null) {
    // Should be just a int, string, or null. So JSON.stringify can be (ab)used.
    const valVis = new VisElem(createTextEl(JSON.stringify(value)));
    this._setVar(name, valVis, value, true);
  }
  setAtomVar(name, value) {
    const oldData = this._getVar(name);
    if (oldData) {
      const { valVis, value: _oldValue } = oldData;
      valVis.elem.textContent = JSON.stringify(value);
      this._setVar(name, valVis, value, false);
      valVis.reflow();
    }
    else {
      const valVis = new VisElem(createTextEl(JSON.stringify(value)));
      this._setVar(name, valVis, value, true);
    }
  }
  incrementAtomVar(name) {
    let { valVis, value } = this._getVar(name);
    value++;
    valVis.elem.textContent = JSON.stringify(value);
    this._setVar(name, valVis, value, false);
    valVis.reflow();
  }

  createListVar(name) {
    // Can be a list of values (kinda like a BasicArray) or just a single value; both are handled as lists.
    const valVis = new VisStack([], false, 0);
    this._setVar(name, valVis, [], false);
    return valVis;
  }
  // deleteVar(name) {
  //   const { valVis, nameAndVarVis, value } = this.getVar(name);
  //   const i = this.qpVis.items.indexOf(nameAndVarVis);
  //   this.qpVis.remove(i);
  // }
  // createPtrVar(name) {
  //   // TODO
  //   throw 'NOT IMPLEMENTED';
  // }

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

  deferPushToResultVar(listName, valName) {
    this.deferredResultPushes.push([ listName, valName ]);
  }

  pushToResultVar(listName, valName) {
    // TODO? How to determine which "row" inside the result to go in?
    const { valVis: lValVis, value: lValue } = this.getVar(listName);
    const { valVis: vValVis, value: vValue } = this.getVar(valName);

    const item = vValVis.pop(); //[0].clone(this.svg);
    if (0 === lValVis.items.length)
      lValVis.push(item);
    else {
      const recordVis = lValVis.items[0];

      // Hacky, which row?
      let rowVis = recordVis.stack.items[1];
      if (!rowVis) {
        rowVis = new VisStack();
        recordVis.push(rowVis);
      }
      rowVis.push(item);
    }
  }
}

// visContext = { svg, qpVis, chestnutModel, delayFn }
async function qpExec(step, qpContext, visContext) {  
  visContext.markLinesFn(qpContext.localOutputs.get(step));

  let continu = true;
  const { svg, qpVis, chestnutModel, delayFn } = visContext;

  switch (step.type) {
    case "ExecQueryStep": {
      // TOOD?
      const outInfo = qpContext.qpInfo.output;
      const [ outName, isNew ] = qpContext.getEnvVar(outInfo);
      if (isNew) throw 'NEW VARIABLE CREATED!!'; // TODO REMOVE

      const outStack = visContext.createListVar(outName);
      // Special for result variable: add an empty "result" record.
      const resRec = new VisRecord('', color = '#CCC');
      resRec.attach(visContext.svg, -100, 0);
      outStack.push(resRec);

      const paramValues = getSuitableParamValues(qpContext.qpInfo, visContext.data);

      for (let i = 0; i < qpContext.qpInfo.inputs.length; i++) {
        const inpInfo = qpContext.qpInfo.inputs[i];
        const inpValue = paramValues[inpInfo.symbol];

        const [ inpName, inpIsNew ] = qpContext.getParamVar(inpInfo);
        if (inpIsNew) throw 'NEW VARIABLE CREATED!!'; // TODO REMOVE

        visContext.createAtomVar(inpName, inpValue);
      }

      await delayFn(2);
      await qpExec(step.value.steps, qpContext.subs[0], visContext);
      break;
    }
    case "ExecStepSeq": {
      const initDefLen = visContext.deferredResultPushes.length;

      let localContinue;
      let localContext = qpContext;
      for (const subStep of step.value) {
        ({ continu: localContinue, qpContext: localContext } = await qpExec(subStep, localContext, visContext));
        if (!localContinue) break;
        // await delayFn();
      }
      // Bad abstraction break.
      while (visContext.deferredResultPushes.length > initDefLen) {
        const [ listName, valName ] = visContext.deferredResultPushes.pop();
        visContext.pushToResultVar(listName, valName);
        await delayFn(2);
      }
      // TODO delay?

      // // Clear locally scoped variables.
      // console.log(`Delete var: ${qpContext.loopVar}.`);
      // visContext.deleteVar(qpContext.loopVar);

      break;
    }
    case "ExecScanStep": {
      let idx = step.value.idx;
      // If this is a ptr index we need to follow the pointer.
      // JSON datastructure representation.
      const leedDsModel = visContext.availDs.get(idx);
      const leedDs = qpContext.getDs(idx);
      if ('Index' === leedDs.type && 'ptr' === leedDs.value.type)
        idx = leedDs.value.target;

      // Grab DS Model from **VIS** context.
      const mainDsModel = visContext.availDs.get(idx);
      //const dsModel = visContext.chestnutModel.tlds.find(tlds => idx === tlds.id);
      if (!mainDsModel)
        throw Error(`Chestnut model missing DS IDX ${idx}, ` +
        `available: ${Array.from(visContext.availDs.keys())}.`);

      const loopContext = qpContext.subs[0];
      if (!loopContext) throw Error('Failed to get loop context.');

      const loopVar = loopContext.loopVar;
      console.log(`Loop context with loop var: ${loopVar} (out var: ${loopContext.outVar}).`);
      visContext.createListVar(loopVar);

      for (let i = 0; i < leedDsModel.records.length; i++) {
        const { recordId } = leedDsModel.records[i];
        const recordModel = mainDsModel.records.find(rm => recordId === rm.recordId);
        if (!recordModel) throw Error('Failed to find indexed record.');
        console.log(`Set loop var: ${loopVar} = ID ${recordModel.recordId}`);

        if (leedDs.condition) {
          const condEval = evalExpr(leedDs.condition, recordModel.header, recordModel.row, { qpContext, visContext });
          console.log(`Index condition eval: ${condEval} (skipping if false).`);
          // Skip if index condition is not met.
          if (!condEval) continue;
        }

        visContext.setListVar(loopVar, recordModel);

        // Assign nested DS to visContext.
        for (const nested of recordModel.nested) {
          console.log('Set DS w/ ID: ' + nested.id);
          visContext.availDs.set(nested.id, nested);
        }
      
        await delayFn();
        await qpExec(step.value.steps, loopContext, visContext);
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
        console.log('CONDITION:', condEval);
        if (false === condEval) { // No set if cond is false.
          continu = false;
          break;
        }

        localContext = qpContext.subs[0];
      }

      if (step.value.var.atom) {
        // Value is an "atom", meaning several things:
        // - It is a single value (not a collection).
        // - It is not a output result.
        const [ aVar, _isNew ] = localContext.getEnvVar(step.value.var);
        if ('count()' == step.value.expr) {
          visContext.incrementAtomVar(aVar);
        }
        else
          visContext.setAtomVar(aVar, JSON.parse(step.value.expr.value));
      }
      else {
        // Value is NOT an "atom", it is a collection (EnvCollectionVariable).
        // - It may be a result? Yes I think it has to be a result (outVar).
        // - ??
        if (step.value.var.init) throw Error(`Collection variable had init value: ${step.value.var.init}.`);

        // // Schema: qpContext.parent.loopVar .push( localContext.loopVar )
        // // Ignore outVar since it is temp for clones.
        // console.warn('lc.lv', localContext.loopVar, 'lc.ov', localContext.outVar);
        // console.warn('qpc.lv', qpContext.loopVar, 'qpc.ov', qpContext.outVar);
        // console.warn('lc.p.lv', localContext.parent.loopVar, 'lc.p.ov', localContext.parent.outVar);
        // console.warn('lc.p.p.ov', localContext.parent.parent.loopVar);

        // console.warn('Options:', parentContext.outVar, parentContext.loopVar);
        // console.warn('New options:', qpContext.parent.outVar, qpContext.parent.loopVar);
        // console.warn('Chosen:', targetVar, localContext.loopVar);

        const parentContext = qpContext.parent; // Ignore localContext due to conditions.
        let targetVar = parentContext.outVar;
        if (!visContext.varExists(targetVar))
          targetVar = parentContext.loopVar;

        //visContext.pushToListVar(targetVar, localContext.loopVar);
        visContext.deferPushToResultVar(targetVar, localContext.loopVar);
      }
      qpContext = localContext;
      //await delayFn();
      break;
    }
    case "ExecSortStep": {
      // TODO
      // const [ varToSort, isNew ] = context.getEnvVar(step.value.var);
      // if (isNew) throw Error(`ExecSortStep cannot sort new variable: "${varToSort}".`);

      // const value = visContext.getVarValue(varToSort);
      // console.error(step, value);

      // throw 'exec sort step not implemented';
      break;
    }
    default: {
      console.error(step, qpContext, visContext);
      throw new Error(`Unknown: ${step.type} from ${step}.`);
    }
  }
  return { continu, qpContext };
}

class VariableModel {

}
