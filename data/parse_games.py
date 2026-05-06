import pandas as pd


"""
df = pd.read_csv("games.csv", index_col=False)

df = df['Name']
print(df.head())

"""

names = pd.read_csv("gamenames.csv", index_col=False)
names = names.drop(columns=["Unnamed: 0"])

names.to_csv("gamenames.csv", index=False)
