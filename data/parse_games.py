import pandas as pd

df = pd.read_csv("games.xls", index_col=False)


print(df.columns)
df = df[['Name', 'Header image']]
df.to_csv("gamenames.csv", index=False)
