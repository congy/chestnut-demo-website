// function getTableFromPath(path) {
//   if (!path) throw Error('Cannot get table from missing path: ' + path);
//   return path[path.length - 1];
// }
const OP_FNS = {
  '<':  (l, r) => l <   r,
  '<=': (l, r) => l <=  r,
  '==': (l, r) => l === r,
  '>=': (l, r) => l >=  r,
  '>':  (l, r) => l >   r,
  '&&': (l, r) => l &&  r,
  '||': (l, r) => l ||  r,
};

function getRowSubsetByCondition({ header, rows }, cond = null) {
  if (!rows.every(row => Array.isArray(row)))
    throw Error(`rows must be array of arrays.`);

  if (!cond)
    return rows;

  return rows.filter(row => evalExpr(cond, header, row));
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
function evalExpr(e, header, row) {
  switch (e.expr) {
    case 'BinOp':
      const fn = OP_FNS[e.op];
      if (!fn)
        throw Error(`Failed to find function for OP: '${e.op}'.`);

      // Handle input parameters.
      if ('Parameter' === e.lh.expr || 'Parameter' === e.rh.expr)
        return true;

      let lh = evalExpr(e.lh, header, row);
      let rh = evalExpr(e.rh, header, row); // No short-circuit handling.

      // Handle mismatched types.
      fixtypes:
      if (typeof lh !== typeof rh) {
        if ('string' === typeof lh && 'number' === typeof rh) {
          if (Number.isFinite(Number(lh))) {
            lh = Number(lh);
            break fixtypes;
          }
          if (REGEX_DATE.test(lh)) {
            lh = new Date(lh).getTime() / 1000;
            break fixtypes;
          }
        }
        else {
          console.error(`Unknown BinOp LH/RH types: LH: ${lh}, ${typeof lh}; RH ${rh} ${typeof rh}.`);
        }
      }

      return fn(lh, rh);
    case 'AssocOp':
      // Handle FK id case.
      if ('QueryField' === e.rh.expr && 'id' === e.rh.field) {
        if ('QueryField' !== e.lh.expr) throw Error(`Unexpected AssocOp LH: ${e.lh.expr}.`);
        const fkField = e.lh.field + '_id';
        const i = header.indexOf(fkField);
        return row[i];
      }
      // Otherwise crash.
      console.error(e, header, row);
      throw 'TODO';
    case 'AtomValue':
      if ("'" === e.value[0])
        return e.value.slice(1, -1);
      const num = Number(e.value);
      if (!Number.isFinite(num))
        throw Error(`Failed to parse AtomValue: [${e.value}].`);
      return num;
    case 'QueryField':
      const i = header.indexOf(e.field)
      return row[i];
    case 'Parameter':
    default:
      console.error(e, header, row);
      throw 'SHOULD NOT REACH';
  }
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
    let parentIsLeft;
    if (assoc.leftTable === tableName) {
      //console.log('left table is parent table.');
      parentIsLeft = true;
    }
    else if (assoc.rightTable === tableName) {
      //console.log('right table is parent table.');
      parentIsLeft = false;
    }
    else {
      throw Error(`Association without either table?`);
    }

    const { header: nestedHeader, rows: nestedAllRows } = data[parentIsLeft ? assoc.rightTable : assoc.leftTable];

    if ('many_to_many' === assoc.assocType) {
      const { header: assocHeader, rows: assocRows } = data[assoc.table];
      const tableIdIndex = header.indexOf('id');
      const rowId = row[tableIdIndex];

      // TODO this may need to be left-right indifferent.
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
      return nestedRows;
    }
    else {
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
      return nestedRows;
    }
    throw 'unreachable';
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
