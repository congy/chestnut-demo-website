import sys, os, argparse

parser = argparse.ArgumentParser(description = 'Run Chestnut Scripts for Kandan.')
parser.add_argument('--single_query', type = int, default = -1,
        help = 'Run ILP on a single query (omit for all)')
parser.add_argument('--queries', type = str,
        help = 'Run ILP on a weighted subset of queries.')
parser.add_argument('--scale', type = float, default = 0, # TODO?
        help = 'Data scale for TSV (optional).')
parser.add_argument('--membound_factor', type = float, default = 1.7,
        help = 'Membound factor, should be greater than 1. Default: 1.7')
parser.add_argument('--gen_cpp', action = 'store_true')
parser.add_argument('--vvv', action = 'store_true')

args = parser.parse_args()

# TODO gen_tsv: single files on filesystem not thread safe.
# should print in json instead.

# HACK: Pass scale to env vars.
if args.scale is not None:
    os.environ['CHESTNUT_SCALE'] = str(args.scale)


# Setup quiet
old_stdout = sys.stdout
devnull = open(os.devnull, 'w')
if not args.vvv:
    sys.stdout = devnull

# Load kandan and run.
from repo.benchmark.kandan import kandan
kandan.run(single_query = args.single_query,
    queries = args.queries,
    gen_tsv = False, gen_cpp = args.gen_cpp,
    membound_factor = args.membound_factor,
    run_test_read_overall = False, output = old_stdout)

sys.stdout = old_stdout
devnull.close()