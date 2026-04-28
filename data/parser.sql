COPY Games(name)
FROM 'gamenames.csv'
DELIMITER ','
CSV HEADER; 

--COPY Gpus(shading_units, boost_clock, game_clock, gpu_clock, fp32, mem_bandwidth, vram, mem_type, mem_bus, rops, tmus, pixel_rate, texture_rate, architecture, process, tdp, rt_cores, tensor_cores, dx, vulkan, cuda, fp16, transistors)
--FROM 'gpu_cleanead.csv'
--DELIMITER ','
--CSV HEADER; 

--COPY Cpus(cores, threads, base_clock, boost_clock, tdp, category, benchmark_rank)
--FROM 'tpu_cpus_enriched.csv'
--DELIMITER ','
--CSV HEADER; 
