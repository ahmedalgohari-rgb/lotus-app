from anthropic import Anthropic
import os

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

models = client.models.list()

for model in models.data:
    print(model.id)
