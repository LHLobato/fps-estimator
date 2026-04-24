import pandas as pd
import time

data_dir = "data/"

cpu1 = pd.read_csv(f"{data_dir}data_cleaned.csv", index_col=False)
cpu2 = pd.read_csv(f"{data_dir}tpu_cpus_normalized_dates.csv", index_col=False)
gpu = pd.read_csv(f"{data_dir}gpu_1986-2026_normalized_dates.csv", index_col=False)

cpu1['date'] = pd.to_datetime(cpu1['date'])
cpu2['Normalized_Release_Date'] = pd.to_datetime(cpu2['Normalized_Release_Date'])
gpu['Normalized_Release_Date'] = pd.to_datetime(gpu['Normalized_Release_Date'])

print(cpu1.date.describe())
print(cpu2['Normalized_Release_Date'].describe())
print(gpu['Normalized_Release_Date'].describe())

print(len(cpu1[cpu1['date'].dt.year >=2008]))
print(len(cpu2[cpu2['Normalized_Release_Date'].dt.year >=2008]))
print(len(gpu[gpu['Normalized_Release_Date'].dt.year >=2008]))
