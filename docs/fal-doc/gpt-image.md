# GPT Image 2 API

> GPT Image 2, OpenAI's latest image model, is capable of creating extremely detailed images with fine typography.


## Overview

- **Endpoint**: `https://fal.run/openai/gpt-image-2`
- **Model ID**: `openai/gpt-image-2`
- **Category**: text-to-image
- **Kind**: inference
**Tags**: gpt-image-2, openai, typography, chatgpt-images-2



## Pricing

Text tokens (per 1M): **$5.00** input, **$1.25** cached, **$10.00** output.
Image tokens (per 1M): **$8.00** input, **$2.00** cached, **$30.00** output. Changing the **quality** parameter significantly affects cost; by default we use **high**. Adjust it to your preference.
See the description at the bottom of this page for more details on how much canonical image sizes cost. Token cost is ceiled to the closest cent.

For more details, see [fal.ai pricing](https://fal.ai/pricing).

## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The prompt for image generation
  - Examples: "create a realistic image taken with iphone at these coordinates 41°43′32″N 49°56′49″W 15 April 1912"

- **`image_size`** (`ImageSize | Enum`, _optional_):
  The size of the generated image. Supports preset names, explicit {width, height}, or 'auto' to let the model pick the best size. Concrete sizes must have both dimensions as multiples of 16, max edge 3840px, aspect ratio <= 3:1, total pixels between 655,360 and 8,294,400. Default value: `landscape_4_3`
  - Default: `"landscape_4_3"`
  - One of: ImageSize | Enum

- **`quality`** (`QualityEnum`, _optional_):
  Quality for the generated image. Use 'auto' to let the model pick the best quality for the prompt. Default value: `"high"`
  - Default: `"high"`
  - Options: `"auto"`, `"low"`, `"medium"`, `"high"`

- **`num_images`** (`integer`, _optional_):
  Number of images to generate Default value: `1`
  - Default: `1`
  - Range: `1` to `4`
  - Examples: 1

- **`output_format`** (`OutputFormatEnum`, _optional_):
  Output format for the images Default value: `"png"`
  - Default: `"png"`
  - Options: `"jpeg"`, `"png"`, `"webp"`

- **`sync_mode`** (`boolean`, _optional_):
  If `True`, the media will be returned as a data URI and the output data won't be available in the request history.
  - Default: `false`



**Required Parameters Example**:

```json
{
  "prompt": "create a realistic image taken with iphone at these coordinates 41°43′32″N 49°56′49″W 15 April 1912"
}
```

**Full Example**:

```json
{
  "prompt": "create a realistic image taken with iphone at these coordinates 41°43′32″N 49°56′49″W 15 April 1912",
  "image_size": "landscape_4_3",
  "quality": "high",
  "num_images": 1,
  "output_format": "png"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<ImageFile>`, _required_):
  The generated images.
  - Array of ImageFile
  - Examples: [{"url":"https://v3b.fal.media/files/b/0a869129/EnWrO3XWjPE0nxBDpaQrj.png","height":1024,"content_type":"image/png","width":1024,"file_name":"EnWrO3XWjPE0nxBDpaQrj.png"}]



**Example Response**:

```json
{
  "images": [
    {
      "url": "https://v3b.fal.media/files/b/0a869129/EnWrO3XWjPE0nxBDpaQrj.png",
      "height": 1024,
      "content_type": "image/png",
      "width": 1024,
      "file_name": "EnWrO3XWjPE0nxBDpaQrj.png"
    }
  ]
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/openai/gpt-image-2 \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "create a realistic image taken with iphone at these coordinates 41°43′32″N 49°56′49″W 15 April 1912"
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "openai/gpt-image-2",
    arguments={
        "prompt": "create a realistic image taken with iphone at these coordinates 41°43′32″N 49°56′49″W 15 April 1912"
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("openai/gpt-image-2", {
  input: {
    prompt: "create a realistic image taken with iphone at these coordinates 41°43′32″N 49°56′49″W 15 April 1912"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/openai/gpt-image-2)
- [API Documentation](https://fal.ai/models/openai/gpt-image-2/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=openai/gpt-image-2)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)