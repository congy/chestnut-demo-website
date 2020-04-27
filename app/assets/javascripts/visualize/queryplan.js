function qpToSteps(step, output = [], depth = 0, loopVar = null) {
  switch (step.type) {
    case "ExecQueryStep":
      output.push(...step.value.variables
        .map(({ atom, name, type, init, /* fields */ }) => 
          [
            depth, atom
              ? `${name}: ${type} = ${init}`
              : `${name}: [${type}] = []`
          ]
        ));
        qpToSteps(step.value.steps, output = output, depth = depth);
      break;
    case "ExecStepSeq":
      step.value.forEach(subStep => qpToSteps(subStep, output = output, depth = depth, loopVar = loopVar));
      break;
    case "ExecScanStep":
      loopVar = `$v${step.value.idx}`;
      output.push([
        depth, `for ${loopVar} in ds${step.value.idx}:`
      ]);
      qpToSteps(step.value.steps, output = output, depth = depth + 1, loopVar = loopVar);
      break;
    case "ExecSetVarStep":
      if (step.value.cond) {
        output.push([
          depth, `if ${step.value.cond_str}:`
        ]);
        depth++;
      }
      output.push([
        depth, step.value.var.atom
          ? `${step.value.var.name} = ${step.value.var.init || loopVar}`
          : `${step.value.var.name}.append(${step.value.var.init || loopVar})`
      ]);
      break;
    case "ExecSortStep":
      output.push([
        depth, `sort(${step.value.var.name} by ${step.value.order.map(o => o.field).join(', ')})`
      ]);
      break;
    default:
      throw `Unknown: ${step.type} from ${step}.`;
  }
  return output;
}

function qpToString(qp_info, indent = 4) {
  if (qp_info.inputs.some(inp => 'Parameter' !== inp.expr))
    throw Error(`QP Input not of type parameter.`);
  const inputs = qp_info.inputs.map(inp => `${inp.symbol}: ${inp.type}`);
  const def = `def query_${qp_info.qid}(${inputs.join(', ')}) -> ${qp_info.output.type}:`;
  const lines = [
    def,
    ...qpToSteps(qp_info.plan).map(([ depth, str ]) => ' '.repeat((1 + depth) * indent) + str),
  ];
  return lines.join('\n');
}
