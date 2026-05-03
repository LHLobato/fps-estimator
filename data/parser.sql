-- GPU
COPY gpus (brand, name, shading_units, boost_clock, game_clock, gpu_clock, fp32,
           mem_bandwidth, vram, mem_type, mem_bus, rops, tmus, pixel_rate, texture_rate,
           architecture, process, release_date, tdp, rt_cores, tensor_cores,
           dx, vulkan, cuda, fp16, transistors, embeddings)
FROM '/tmp/gpu_renamed.csv'
CSV HEADER;

-- CPU
COPY cpus (name, date, socket, category, speed, turbo, cores, threads, l1_cache, l2_cache, l3_cache, embeddings)
FROM '/tmp/cpu_renamed.csv'
CSV HEADER;

-- Games
COPY games (name, embeddings)
FROM '/tmp/gamenames.csv'
CSV HEADER;
