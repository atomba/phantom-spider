#!//usr/bin/bash

MEMORY_SIZE=16384

node --max_old_space_size=$MEMORY_SIZE --optimize_for_size --max_executable_size=$MEMORY_SIZE --stack_size=$MEMORY_SIZE "$@"
