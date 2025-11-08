from anthropic import Anthropic
import os

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

message = client.messages.create(
    model="claude-4-5-sonnet-latest",
    max_tokens=200,
    messages=[
        {"role": "user", "content": "Hello Claude! Can you confirm if this setup is working?"}
    ]
)

print(message.content[0].text)
