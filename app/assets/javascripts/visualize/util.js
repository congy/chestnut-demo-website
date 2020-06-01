// Utilities for filtering rows, joins, and evaluating expressions.

// function getTableFromPath(path) {
//   if (!path) throw Error('Cannot get table from missing path: ' + path);
//   return path[path.length - 1];
// }
const OP_FNS = {
  '<':  (l, r) => l <   r,
  '<=': (l, r) => l <=  r,
  '==': (l, r) => l === r,
  '!=': (l, r) => l !== r,
  '>=': (l, r) => l >=  r,
  '>':  (l, r) => l >   r,
  '&&': (l, r) => l &&  r,
  '||': (l, r) => l ||  r,
  'like': (val, pat) => val.includes(pat),
};

function getRowSubsetByCondition({ header, rows }, cond = null, allData) {
  if (!rows.every(row => Array.isArray(row)))
    throw Error(`rows must be array of arrays.`);

  if (!cond)
    return rows;

  return rows.filter(row => evalExpr(cond, header, row, null, allData));
}

// Sorts in-place.
function sortIndexRows({ header, rows }, keys) {
  function cmp(rowA, rowB) {
    for (const { key } of keys) {
      const valA = evalExpr(key, header, rowA);
      const valB = evalExpr(key, header, rowB);
      if (valA > valB) return +1;
      if (valA < valB) return -1;
    }
    return 0;
  }
  rows.sort(cmp);
}

const REGEX_DATE = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/;
// Evaluate a expression from chestnut, represented in a JSON tree.
// contexts = { qpContext, visContext }
// If contexts is null, we ignore any parameters and exists constraints.
// If contexts is not null we evaluate them.
function evalExpr(e, header, row, contexts = null, allData = null) {
  if (!header || !row)
    throw Error(`Header or row is invalid!\nHeader: ${header && JSON.stringify(header)}\nRow: ${row && JSON.stringify(row)}`);

  switch (e.expr) {
    case 'BinOp': {
      const fn = OP_FNS[e.op];
      if (!fn)
        throw Error(`Failed to find function for OP: '${e.op}'.`);

      // Handle input parameters.
      if (!contexts && ('Parameter' === e.lh.expr || 'Parameter' === e.rh.expr))
        return true;

      let lh = evalExpr(e.lh, header, row, contexts, allData);
      let rh = evalExpr(e.rh, header, row, contexts, allData); // No short-circuit handling.

      // NaN to propegate false.
      if (Number.isNaN(lh) || Number.isNaN(rh))
        return Number.NaN;

      // Handle mismatched types.
      if (typeof lh !== typeof rh) {
        if ('string' === typeof lh) {
          if ('number' === typeof rh) {
            if (Number.isFinite(Number(lh)))
              lh = Number(lh);
            if (REGEX_DATE.test(lh))
              lh = new Date(lh).getTime() / 1000;
          }
          // Bools are represented as 1 or 0.
          else if ('boolean' === typeof rh) {
            lh = Number(lh);
            rh = Number(rh);
          }
        }
      }
      if (typeof lh !== typeof rh)
        console.warn(`Unknown BinOp LH/RH types: LH: ${lh} (${typeof lh}); RH ${rh} (${typeof rh}).`);

      return fn(lh, rh);
    }
    case 'SetOp': {
      // LH exists in RH (I think).
      let lh = evalExpr(e.lh, header, row, contexts, allData);
      if (!lh) // NaN case
        return lh;

      if (!lh.rows) {
        console.error(e, header, row, contexts, allData);
        console.error('LH', lh);
        throw Error('SetOp invalid LHS.');
      }

      const exitBool = 'EXIST' == e.op // EXISTS -> true, FORALL -> false;
      for (const relRow of lh.rows) {
        let val = evalExpr(e.rh, lh.header, relRow, contexts, allData);
        if (exitBool === val)
          return exitBool;
      }
      return !exitBool;
      // console.error(lh);
      // let rh = evalExpr(e.rh, header, row, contexts, allData);
      // console.error(rh);
      // throw 'TODO: Need to eval RH completely from top.';
    }
    case 'AssocOp': {
      // Handle FK id case.
      if ('QueryField' === e.rh.expr && 'id' === e.rh.field) {
        if ('QueryField' !== e.lh.expr) throw Error(`Unexpected AssocOp LH: ${e.lh.expr}.`);
        const fkField = e.lh.field + '_id';
        const i = header.indexOf(fkField);
        return row[i];
      }
      // "Normal" case.
      const lh = evalExpr(e.lh, header, row, contexts, allData);
      if (undefined == lh) {
        console.error(e, header, row, contexts, allData);
        throw Error(`AssocOp LHS evaluated to undefined.`);
      }
      if (!lh.header) {
        console.error('lh', lh);
        throw Error(`AssocOp missing LHS.`);
      }
      ({ header, row } = lh);
      // Check if FK constraint violated.
      if (undefined === row) {
        console.warn('FK constraint violated, returning NaN.');
        return Number.NaN;
      }

      return evalExpr(e.rh, header, row, contexts, allData);
    }
    case 'AtomValue':
      if ("'" === e.value[0])
        return e.value.slice(1, -1);
      if ('true' === e.value.toLowerCase())
        return true;
      else if ('false' === e.value.toLowerCase())
        return false;
      const num = Number(e.value);
      if (Number.isFinite(num))
        return num;
      throw Error(`Failed to parse AtomValue: <<${e.value}>>.`);
    case 'QueryField':
      // FK row case.
      if (e.assoc) {
        const out = getJoinRows(header, row, e.assoc, allData);
        console.log('QueryField FK result:', out);
        return out;
        // const fkIndex = header.indexOf(e.fkField);
        // const relTable = allData && allData[e.fkTable];
        // if (!relTable || 0 > fkIndex) {
        //   console.error(e, header, row, contexts, allData);
        //   throw Error(`QueryField field not found: ${e.field}`);
        // }
        // const fk = row[fkIndex];
        // const { header: relHeader, rows: relRows } = relTable;
        // const idIndex = relHeader.indexOf('id'); // TODO hardcoded?
        // if (0 > idIndex) throw Error('Failed to do QueryField FK join, target missing ID.');
        // const relRow = relRows.find(row => fk === row[idIndex]);
        // const out = { header: relHeader, row: relRow };
        // console.warn('QueryField FK Result:', out);
        // return out;
      }
      // Normal case.
      const i = header.indexOf(e.field);
      if (0 <= i)
        return row[i];
      // Fail.
      console.error(e, header, row, contexts, allData);
      throw Error('Unknown QueryField case.');
    case 'Parameter': {
      if (!contexts) throw Error('Attempting to evaluate paramter without contexts.');
      const { qpContext, visContext } = contexts;
      const [ paramName, isNew ] = qpContext.getParamVar(e);
      if (isNew) throw Error(`Cannot create new (parameter) var when evaluating: ${paramName}.`);
      const paramValue = visContext.getVarValue(paramName);
      // console.log(`Eval param, name: ${paramName}, value: ${paramValue}.`);
      return paramValue;
    }
    case '_var': {
      if (!contexts) throw Error('Attemping to evaluate _var without contexts.');
      const { qpContext: _qpContext, visContext } = contexts;
      const val = visContext.getVarValue(e.name);
      // Convert singleton list to single item.
      return (1 === val.length) ? val[0] : val;
    }
    default:
      console.error(e, header, row);
      throw 'SHOULD NOT REACH';
  }
}

// { qid, inputs, outputs, pred, pid, plan } = qpInfo
function getSuitableParamValues(qpInfo, data) {
  const out = {};

  const { header, rows } = data[qpInfo.output.type];
  const row = rows[(Math.random() * rows.length) | 0];

  const stack = [];
  if (qpInfo.pred) stack.push(qpInfo.pred);
  while (stack.length) {
    const e = stack.pop(); 
    if ('BinOp' !== e.expr) {
      console.error(e);
      throw Error(`Encountered non-binary op searching for param value: ${e.expr}.`);
    }
    let param, expr;
    if ('Parameter' === e.lh.expr) {
      if ('Parameter' === e.rh.expr) throw Error('BinOp has two parameters.')
      param = e.lh;
      expr = e.rh;
    }
    else if ('Parameter' === e.rh.expr) {
      param = e.rh;
      expr = e.lh;
    }
    else {
      // Neither is param so we don't really care about the value.
      stack.push(e.lh, e.rh);
      continue;
    }

    let val = evalExpr(expr, header, row);
    if ('oid' === param.type || 'uint' === param.type)
      val = Number(val)
    else if ('like' === e.op) {
      const words = val.split(/\W+/);
      val = words[(Math.random() * words.length) | 0];
    }
    out[param.symbol] = val;
  }

  return out;
}

function getRowById(header, rows, id) {
  const i = header.indexOf('id');
  return rows.find(row => id === row[i]);
}

function determineTableType(_data, model, _parentTableName = null) {
  return model.tableType;

  // let name = model.tableType;
  // if (data[name]) return name;
  // console.error('Unknown table type: ' + name, model);

  // const assoc = model.association;

  // if (parentTableName && assoc) {
  //   if (!data[parentTableName]) throw Error(
  //     `Cannot find child table when parent table with name ${parentTableName} doesn't exist.`);
  //   if (assoc.leftTable === parentTableName)
  //     return assoc.rightTable;
  //   if (assoc.rightTable === parentTableName)
  //     return assoc.leftTable;
  //   throw Error(`Failed to determine name for nested table: ${model.table}, parent: ${parentTableName}`);
  // }
  // else {
  //   let name = getTableFromPath(model.table);
  //   if (!data[name]) name = name.slice(0, -1);
  //   if (!data[name]) throw Error(`Failed to determine name for table: ${model.table}`);
  //   return name;
  // }
}

function getJoinRows(header, row, assoc, data) {
  let parentIsLeft;
  if (header === data[assoc.leftTable].header)
    parentIsLeft = true;
  else if (header === data[assoc.rightTable].header)
    parentIsLeft = false;
  else
    throw Error(`Association without either table?`);

  const { header: nestedHeader, rows: nestedAllRows } = data[parentIsLeft ? assoc.rightTable : assoc.leftTable];

  if ('many_to_many' === assoc.assocType) {
    const { header: assocHeader, rows: assocRows } = data[assoc.table];
    const tableIdIndex = header.indexOf('id');
    const rowId = row[tableIdIndex];

    const assocTableFkIndex = assocHeader.indexOf(parentIsLeft ? assoc.leftFkField : assoc.rightFkField);
    const assocNestedFkIndex = assocHeader.indexOf(parentIsLeft ? assoc.rightFkField : assoc.leftFkField);

    const nestedRows = [];
    for (const assocRow of assocRows) {
      const assocTableFk = assocRow[assocTableFkIndex];
      const assocNestedFk = assocRow[assocNestedFkIndex];
      if (rowId === assocTableFk) {
        nestedRows.push(getRowById(nestedHeader, nestedAllRows, assocNestedFk));
      }
    }
    //if (!nestedRows.length) debugger;
    return {
      header: nestedHeader,
      rows: nestedRows,
      row: nestedRows[0],
    };
  }
  else if ('one_to_many' === assoc.assocType) {
    // console.log(assoc);

    const parentTableKeyField = parentIsLeft ? 'id' : assoc.rightFkField;
    const parentTableKeyIndex = header.indexOf(parentTableKeyField);
    if (parentTableKeyIndex < 0) throw Error(`Failed to find field "${parentTableKeyField}" in table "${tableName}", header: ${header}`);

    const nestedTableKeyField = parentIsLeft ? assoc.rightFkField : 'id';
    const nestedTableKeyIndex = nestedHeader.indexOf(nestedTableKeyField);
    if (nestedTableKeyIndex < 0) throw Error(`Failed to find field "${nestedTableKeyField}" in table "${nestedName}", header: ${nestedHeader}`);

    const key = row[parentTableKeyIndex];

    const nestedRows = [];
    for (const nestedRow of nestedAllRows) {
      if (key === nestedRow[nestedTableKeyIndex]) {
        nestedRows.push(nestedRow);
      }
    }
    // if (!nestedRows.length) debugger;
    return {
      header: nestedHeader,
      rows: nestedRows,
      row: nestedRows[0],
    };
  }
  throw Error(`Unknown assocType: ${assoc.assocType}`);
}

function getNestedRows(data, model, header, row, nestedModel) {
  const tableName = model.tableType;
  const nestedName = nestedModel.tableType;

  // let tableName = getTableFromPath(model.table);                  // Activities
  // if (!data[tableName]) tableName = tableName.slice(0, -1);       // Activitie
  // if (!data[tableName]) tableName = tableName.slice(0, -2) + 'y'; // Activity
  // if (!data[tableName]) throw Error(`Failed to find table: "${tableName}" from tables ${Object.keys(data)}.`);
  // const nestedName = getTableFromPath(nestedModel.table);

  // // const keyManyToOne = nestedName + '_id';
  // // const keyOneToMany = tableName + '_id';

  const assoc = nestedModel.association;

  if (assoc) {
    return getJoinRows(header, row, assoc, data).rows;
    // let parentIsLeft;
    // if (assoc.leftTable === tableName) {
    //   //console.log('left table is parent table.');
    //   parentIsLeft = true;
    // }
    // else if (assoc.rightTable === tableName) {
    //   //console.log('right table is parent table.');
    //   parentIsLeft = false;
    // }
    // else {
    //   throw Error(`Association without either table?`);
    // }

    // const { header: nestedHeader, rows: nestedAllRows } = data[parentIsLeft ? assoc.rightTable : assoc.leftTable];

    // if ('many_to_many' === assoc.assocType) {
    //   const { header: assocHeader, rows: assocRows } = data[assoc.table];
    //   const tableIdIndex = header.indexOf('id');
    //   const rowId = row[tableIdIndex];

    //   // TODO this may need to be left-right indifferent.
    //   const assocTableFkIndex = assocHeader.indexOf(parentIsLeft ? assoc.leftFkField : assoc.rightFkField);
    //   const assocNestedFkIndex = assocHeader.indexOf(parentIsLeft ? assoc.rightFkField : assoc.leftFkField);

    //   const nestedRows = [];
    //   for (const assocRow of assocRows) {
    //     const assocTableFk = assocRow[assocTableFkIndex];
    //     const assocNestedFk = assocRow[assocNestedFkIndex];
    //     if (rowId === assocTableFk) {
    //       nestedRows.push(getRowById(nestedHeader, nestedAllRows, assocNestedFk));
    //     }
    //   }
    //   //if (!nestedRows.length) debugger;
    //   return nestedRows;
    // }
    // else if ('one_to_many' === assoc.assocType) {
    //   // console.log(assoc);

    //   const parentTableKeyField = parentIsLeft ? 'id' : assoc.rightFkField;
    //   const parentTableKeyIndex = header.indexOf(parentTableKeyField);
    //   if (parentTableKeyIndex < 0) throw Error(`Failed to find field "${parentTableKeyField}" in table "${tableName}", header: ${header}`);

    //   const nestedTableKeyField = parentIsLeft ? assoc.rightFkField : 'id';
    //   const nestedTableKeyIndex = nestedHeader.indexOf(nestedTableKeyField);
    //   if (nestedTableKeyIndex < 0) throw Error(`Failed to find field "${nestedTableKeyField}" in table "${nestedName}", header: ${nestedHeader}`);

    //   const key = row[parentTableKeyIndex];

    //   const nestedRows = [];
    //   for (const nestedRow of nestedAllRows) {
    //     if (key === nestedRow[nestedTableKeyIndex]) {
    //       nestedRows.push(nestedRow);
    //     }
    //   }
    //   // if (!nestedRows.length) debugger;
    //   return nestedRows;
    // }
    // throw Error(`Unknown assocType: ${assoc.assocType}`);
  }

  // INDICES FROM HERE ON?

  // slice is HACK for trailing 's'.
  let tableData = data[nestedName];
  // if (!tableData) tableData = data[nestedName.slice(0, -1)];
  // if (!tableData) tableData = data[nestedName.slice(0, -3) + 'y'];
  // if (!tableData) throw Error(`Unknown table: ${nestedName}.`);
  const { header: nestedHeader, rows: nestedAllRows } = tableData;

  console.log('!TODO!', nestedModel.association);
  //return [];
  return nestedAllRows;
  throw Error(`Failed to join: ${tableName}: ${header}, nested ${nestedName}: ${nestedHeader}.`);
}

const dsShortNames = {
  'BasicArray': 'arr',
  'Index': 'idx',
}
function dsVarName(ds) {
  return `${dsShortNames[ds.type]}_${ds.tableType}_${ds.id}`;
}
