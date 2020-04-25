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
          depth, `if ${step.value.cond}:`
        ]);
        depth++;
      }
      output.push([
        depth, step.value.var.atom
          ? `${step.value.var.name} = ${step.value.expr || loopVar}`
          : `${step.value.var.name}.append(${step.value.expr || loopVar})`
      ]);
      break;
    case "ExecSortStep":
      output.push([
        depth, `sort(${step.value.var.name} by ${step.value.order.join(', ')})`
      ]);
      break;
    default:
      throw `Unknown: ${step.type} from ${step}.`;
  }
  return output;
}

function qpToString(step, indent = 4) {
  return qpToSteps(step)
    .map(([ depth, str ]) => ' '.repeat(depth * indent) + str)
    .join('\n');
}
