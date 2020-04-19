import os, argparse

parser = argparse.ArgumentParser(description = 'Run Chestnut Scripts for Kandan.')
parser.add_argument('--single_query', type = int, default = -1,
                    help = 'Run ILP on a single query (omit for all)')
parser.add_argument('--scale', type = float, help = 'Data scale for TSV (optional).')

args = parser.parse_args()

# TODO gen_tsv: single files on filesystem not thread safe.
# should print in json instead.

# Pass scale to env vars.
if args.scale is not None:
    os.environ['CHESTNUT_SCALE'] = str(args.scale)

# Load kandan and run.
from repo.benchmark.kandan import kandan
kandan.run(single_query = args.single_query,
    gen_tsv = True,
    run_test_read_overall = False, quiet = True)
