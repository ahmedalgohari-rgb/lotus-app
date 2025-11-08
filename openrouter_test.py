import os
from openai import OpenAI

# ✅ This correctly reads your API key from the environment variable
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY")
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Write a haiku about the moon."}
    ]
)

print(response.choices[0].message.content)
