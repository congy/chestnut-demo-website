class PlanContext {

  constructor(qpInfo, allDs, localDs = null) {
    this.qpInfo = qpInfo;
    this.allDs = allDs;

    this.localDs = localDs || new Map(Object.values(allDs).map(ds => [ ds.id, ds ]));

    this.parent = null;

    this.output = [];
    this.depth = 0;
    this.loopVar = null;
    this.outVar = null;

    // Mapping from known variables to their names.
    this.vars = new Map();
    // Set of names, possibly including anonymous "unknown" variables.
    this.names = new Set();
  }

  writeLine(...lines) {
    this.output.push(...lines.map(l => [ this.depth, l ]));
  }

  static _varKey(v) {
    // Handle parameter expr.
    if ('Parameter' === v.expr)
      return `param#${v.type}#${v.symbol}`;
    // Handle "EnvXXXVariable".
    return `${v.atom ? 'atom' : 'coll'}#${v.type}#${v.name}`;
  }

  // Get anonymous variable
  // Cannot be reused elsewhere unless it is the loopVar or outVar or something.
  makeAnonVar(pref = 'anon') {
    for (let i = 0; this.names.has(pref); i++)
      pref = `${pref}_${i}`;

    this.names.add(pref);
    return pref;
  }

  // Get var name helper.
  _getVar(key, pref) {
    // Already defined.
    if (this.vars.has(key))
      return this.vars.get(key);
    // Not defined.
    const name = this.makeAnonVar(pref);
    this.vars.set(key, name);
    return name;
  }

  // Get var name for an "env" (normal) variable.
  // EnvXXXVariable: { "atom": false, "name": "result_activity", "type": "activity", "fields": [] }
  getEnvVar({ atom, name, type }, pref = null) {
    const key = `evar#${atom ? 'atom' : 'coll'}#${type}#${name}`;
    return this._getVar(key, pref || name);
  }

  // Get var name for a parameter.
  // Parameter: { "expr": "Parameter", "symbol": "channel_id", "type": "oid" }
  getParamVar({ type, symbol }, pref = null) {
    const key = `param#${type}#${symbol}`;
    return this._getVar(key, pref || ('param_' + symbol));
  }

  // Get actual DS json from ID. Only applies to in-scope.
  getDs(dsId) {
    return this.localDs.get(dsId);
  }

  // Get var name for a datastructure ID.
  getDsVar(dsId, pref = null) {
    const key = `ds#${dsId}`;
    if (!pref) {
      const ds = this.getDs(dsId);
      // .slice(-1) to get last, deepest nested table type.
      pref = `${ds.type.toLowerCase()}_${ds.table.slice(-1)[0]}`;
    }
    return this._getVar(key, pref);
  }

  // // Gets the name for a variable and writes a line to define it if not yet defined.
  // defineEnvVar(v, value = undefined, pref = null) {
  //   if (undefined == value) value = v.init;
  //   if (undefined == value) value = '????'; // TODO? Throw error?
  //   const key = this.constructor._varKey(v);
  //   const define = !this.vars.has(key);
  //   const name = this.getEnvVar(v, pref);
  //   if (define) {
  //     this.writeLine(`${name}: ${v.type} = ${value}`);
  //   }
  //   return name;
  // }

  exprToString(e, out = []) {
    switch (e.expr) {
      case 'BinOp': {
        out.push('(');
        this.exprToString(e.lh, out);
        out.push(' ', e.op, ' ');
        this.exprToString(e.rh, out);
        out.push(')');
        break;
      }
      case 'AssocOp': {
        // // Handle FK id case.
        // if ('QueryField' === e.rh.expr && 'id' === e.rh.field) {
        //   if ('QueryField' !== e.lh.expr) throw Error(`Unexpected AssocOp LH: ${e.lh.expr}.`);
        //   const fkField = e.lh.field + '_id';
        //   const i = header.indexOf(fkField);
        //   return row[i];
        // }
        // Otherwise crash.
        console.error(e, header, row);
        throw 'TODO';
      }
      case 'AtomValue':
        out.push(e.value);
        break;
      case 'QueryField':
        out.push(`${this.loopVar}.${e.field}`);
        break;
      case 'Parameter':
        out.push(this.getParamVar(e));
        break;
      default:
        console.error(e, header, row);
        throw 'SHOULD NOT REACH';
    }
    return out.join('');
  }

  sub(newVals = {}) {
    const d = new PlanContext(this.qpInfo, this.allDs, new Map(this.localDs));
    d.parent = this;

    d.output = this.output;
    d.depth = this.depth + 1;
    d.loopVar = this.loopVar;
    d.outVar = this.outVar;

    d.vars = new Map(this.vars);
    d.names = new Set(this.names);

    Object.assign(d, newVals);
    return d;
  }

  toString(indent = 4) {
    return this.output
      .map(([ depth, str ]) => ' '.repeat(depth * indent) + str)
      .join('\n');
  }
}

function qpToSteps(step, context) {
  switch (step.type) {
    case "ExecQueryStep": {
      if (0 !== context.depth) throw Error(`ExecQueryStep not root step, found at depth ${context.depth}.`);

      const qpInfo = context.qpInfo;
      const out = qpInfo.output;
      context.outVar = context.getEnvVar(out, 'result');

      const inputs = [];
      for (const inp of qpInfo.inputs) {
        const name = context.getParamVar(inp);
        inputs.push(`${name}: ${inp.type}`);
      }
      const outType = out.atom ? out.type : `List[${out.type}]`;
      context.writeLine(`def query_${qpInfo.qid}(${inputs.join(', ')}) -> ${outType}:`);

      const subContext = context.sub();
      subContext.writeLine(`${context.outVar}: ${outType} = ${out.atom ? 'null' : '[]'}`);

      qpToSteps(step.value.steps, subContext);

      subContext.writeLine(`return ${context.outVar}`);
      break;
    }
    case "ExecStepSeq": {
      step.value.forEach(subStep => qpToSteps(subStep, context));
      break;
    }
    case "ExecScanStep": {
      const thisDs = context.getDs(step.value.idx);
      if (!thisDs) throw Error(`Missing DS IDX ${step.value.idx}.`);
      const thisDsElType = thisDs.table.slice(-1)[0];

      // Get nested datastructures.
      let targetDs = thisDs;
      // If this is a ptr index we need to follow the pointer.
      if ('Index' === thisDs.type && 'ptr' === thisDs.value.type) {
        targetDs = context.getDs(thisDs.value.target);
        if (!targetDs) throw Error(`Missing Index target IDX ${thisDs.value.target}`);
      }
      const nestedDses = targetDs.value.nested;

      // Create subContext.
      const loopVar = context.makeAnonVar(`${thisDsElType}`);
      const subContext = context.sub({ loopVar });
      // Assign nested.
      for (const nestedDs of nestedDses)
        subContext.localDs.set(nestedDs.id, nestedDs);

      // Get nested datastructures back for the for-loop.
      const nestedDsVars = nestedDses.map(nestedDs => subContext.getDsVar(nestedDs.id,
        `${thisDsElType}_${nestedDs.table.slice(-1)[0]}`));

      // Print the for-loop line.
      context.writeLine(`for ${[ loopVar, ...nestedDsVars ].join(', ')} in ${context.getDsVar(step.value.idx)}:`);

      // Recurse.
      qpToSteps(step.value.steps, subContext);
      break;
    }
    case "ExecSetVarStep": {
      let localContext = context;
      if (step.value.cond) {
        context.writeLine(`if ${context.exprToString(step.value.cond)}:`);
        localContext = context.sub();
      }
      if (step.value.var.atom) {
        // Value is an "atom", meaning several things:
        // - It is a single value (not a collection).
        // - It is not a output result.
        // - ??
        // TODO?
        const aVar = localContext.getEnvVar(step.value.var);
        this.writeLine(`${aVar}: ${step.value.var.type} = ${step.value.expr.value}`);
      }
      else {
        // Value is NOT an "atom", it is a collection (EnvCollectionVariable).
        // - It may be a result?
        // - ??
        // TODO: make this actually use brain.
        // const locVar = step.value.var.type
        if (step.value.var.init) throw Error(`Collection variable had init value: ${step.value.var.init}.`);

        const newOutVar = localContext.makeAnonVar(`result_${step.value.var.type}`);
        localContext.writeLine(
          `${newOutVar}: ${step.value.var.type} = ${localContext.loopVar}.clone()`,
          `${localContext.outVar}.add_${step.value.var.type}(${newOutVar})`);
        localContext.outVar = newOutVar;
      }
      break;
    }
    case "ExecSortStep": {
      context.writeLine(`sort(${step.value.var.name} by ${step.value.order.map(o => o.field).join(', ')})`);
      break;
    }
    default: {
      console.error(step, context);
      throw new Error(`Unknown: ${step.type} from ${step}.`);
    }
  }
  return context;
}

function qpToString(qpInfo, allDs, indent = 4) {
  if (qpInfo.inputs.some(inp => 'Parameter' !== inp.expr))
    throw Error(`QP Input not of type parameter.`);

  const context = qpToSteps(qpInfo.plan, new PlanContext(qpInfo, allDs));
  return context.toString(indent);
}
