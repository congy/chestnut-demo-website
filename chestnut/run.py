import argparse

parser = argparse.ArgumentParser(description = 'Run Chestnut Scripts for Kandan.')
parser.add_argument('--single_query', type = int, default = -1,
                    help = 'Run ILP on a single query (omit for all)')

args = parser.parse_args()

from repo.benchmark.kandan import kandan
kandan.run(single_query = args.single_query, run_test_read_overall = False, quiet = True)
