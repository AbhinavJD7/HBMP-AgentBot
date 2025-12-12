# Testing Rich Outputs Implementation

## ✅ Implementation Status

All frontend components have been created and integrated:
- ✅ Chart component (`Chart.tsx`)
- ✅ Video component (`Video.tsx`)
- ✅ Chart detection in `LogContent.tsx`
- ✅ Chart detection in `ExecuteCode.tsx`
- ✅ Video detection in `Attachment.tsx`
- ✅ Dependencies installed (`plotly.js-dist-min`, `chart.js`)

## 🧪 How to Test

### 1. Start the Development Server

```bash
cd client
npm run dev
```

### 2. Test Chart Rendering

#### Test Case 1: Plotly Chart via Code Execution

Run this Python code in a chat with code execution enabled:

```python
import plotly.graph_objects as go
import json

# Create a simple bar chart
fig = go.Figure(data=go.Bar(x=['A', 'B', 'C'], y=[1, 3, 2]))
fig.update_layout(title="Test Chart")

# Output chart data in the format the frontend expects
chart_data = {
    "type": "plotly",
    "data": fig.to_dict()["data"],
    "layout": fig.to_dict()["layout"]
}
print(json.dumps(chart_data))
```

**Expected Result:** An interactive Plotly chart should render in the chat output.

#### Test Case 2: Chart.js Chart

Run this Python code:

```python
import json

chart_data = {
    "type": "chartjs",
    "data": {
        "labels": ["Red", "Blue", "Yellow"],
        "datasets": [{
            "label": "My Dataset",
            "data": [12, 19, 3],
            "backgroundColor": ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(255, 205, 86)"]
        }]
    },
    "options": {
        "responsive": True,
        "plugins": {
            "title": {
                "display": True,
                "text": "Test Chart.js Chart"
            }
        }
    }
}
print(json.dumps(chart_data))
```

**Expected Result:** A Chart.js pie/bar chart should render.

#### Test Case 3: Chart in Markdown Code Block

The chart detection also works if the output is in a markdown code block:

```python
print("""
```json
{"type": "plotly", "data": [{"x": [1,2,3], "y": [4,5,6], "type": "scatter"}], "layout": {"title": "Test"}}
```
""")
```

### 3. Test Video Rendering

#### Test Case 1: Video File Generation

Run Python code that generates a video file:

```python
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip

# Create a simple text video
clip = TextClip("Hello from HBMP AgentBot!", fontsize=70, color='white', duration=3)
clip = clip.set_position('center').set_size((640, 480))

# Write video file
clip.write_videofile("test_output.mp4", fps=24, codec='libx264')
print("Video generated: test_output.mp4")
```

**Expected Result:** The video file should appear as an attachment and render inline with video controls.

#### Test Case 2: Animated GIF

```python
from PIL import Image
import imageio

# Create animated GIF
images = []
for i in range(10):
    # Create simple frames
    img = Image.new('RGB', (200, 200), color=(i*25, 100, 150))
    images.append(img)

imageio.mimsave('animation.gif', images, duration=0.5)
print("GIF created: animation.gif")
```

**Expected Result:** Animated GIF should render as a video with controls.

### 4. Test Combined Outputs

Run code that generates both charts and videos:

```python
import plotly.graph_objects as go
import json
from moviepy.editor import TextClip

# Generate chart
fig = go.Figure(data=go.Scatter(x=[1,2,3], y=[4,5,6]))
chart_data = {"type": "plotly", "data": fig.to_dict()["data"], "layout": fig.to_dict()["layout"]}
print(json.dumps(chart_data))

# Generate video
clip = TextClip("Chart Analysis Complete", duration=2)
clip.write_videofile("analysis.mp4")
```

**Expected Result:** Both chart and video should render in the output.

## 🔍 Verification Checklist

- [ ] Chart component loads without errors
- [ ] Plotly charts render interactively
- [ ] Chart.js charts render correctly
- [ ] Video files render with controls
- [ ] Video controls work (play, pause, mute, fullscreen)
- [ ] Charts are detected from code execution outputs
- [ ] Videos are detected from file attachments
- [ ] Multiple charts/videos can be displayed in one message
- [ ] Dark mode styling works correctly
- [ ] Responsive design works on mobile

## 🐛 Troubleshooting

### Charts not rendering?

1. **Check browser console** for errors loading Plotly/Chart.js
2. **Verify JSON format** - Chart data must be valid JSON
3. **Check detection regex** - Ensure output contains `"type": "plotly"` or `"type": "chartjs"`
4. **Verify dependencies** - Run `npm list plotly.js-dist-min chart.js` in client directory

### Videos not rendering?

1. **Check file extension** - Must be `.mp4`, `.webm`, `.mov`, etc.
2. **Verify filepath** - Attachment must have valid `filepath` property
3. **Check browser console** - Look for video loading errors
4. **Verify CORS** - Video files must be accessible from the frontend

### Dependencies not found?

```bash
cd client
npm install plotly.js-dist-min@^2.27.0 chart.js@^4.4.0
```

## 📊 Test Data Examples

### Simple Plotly Line Chart
```json
{
  "type": "plotly",
  "data": [{
    "x": [1, 2, 3, 4],
    "y": [10, 11, 12, 13],
    "type": "scatter",
    "mode": "lines+markers"
  }],
  "layout": {
    "title": "Sample Line Chart"
  }
}
```

### Simple Chart.js Bar Chart
```json
{
  "type": "chartjs",
  "data": {
    "labels": ["January", "February", "March"],
    "datasets": [{
      "label": "Sales",
      "data": [65, 59, 80],
      "backgroundColor": "rgba(54, 162, 235, 0.2)",
      "borderColor": "rgba(54, 162, 235, 1)",
      "borderWidth": 1
    }]
  },
  "options": {
    "responsive": true,
    "scales": {
      "y": {
        "beginAtZero": true
      }
    }
  }
}
```

## 🎯 Next Steps After Testing

1. **Backend Integration**: Add automatic chart detection from matplotlib/plotly outputs
2. **More Chart Types**: Add support for D3.js, Recharts
3. **Chart Export**: Allow users to download charts as images
4. **Performance**: Optimize chart loading for large datasets
5. **Error Handling**: Improve error messages for invalid chart data






