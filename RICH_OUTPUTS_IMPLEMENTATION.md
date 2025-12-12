# Rich Outputs Implementation

## Overview
This document describes the implementation of rich output rendering capabilities in HBMP AgentBot, enabling the display of charts, graphs, videos, and other rich media directly in chat messages - similar to ChatGPT Plus and Perplexity.

## ✅ Completed Features

### 1. Chart & Graph Rendering
**Location:** `client/src/components/Chat/Messages/Content/Parts/Chart.tsx`

**Features:**
- Support for Plotly.js charts (interactive charts, 3D plots, etc.)
- Support for Chart.js charts (bar, line, pie, etc.)
- Automatic detection of chart data in code execution outputs
- Image-based chart fallback
- JSON data display fallback

**Usage:**
Charts are automatically detected when code execution outputs contain:
- Plotly JSON format: `{"type": "plotly", "data": [...], "layout": {...}}`
- Chart.js format: `{"type": "chartjs", "data": {...}, "options": {...}}`
- Inline JSON chart data in markdown code blocks

**Example Python code that generates charts:**
```python
import plotly.graph_objects as go
import json

fig = go.Figure(data=go.Bar(x=['A', 'B', 'C'], y=[1, 3, 2]))
chart_data = {
    "type": "plotly",
    "data": fig.to_dict()["data"],
    "layout": fig.to_dict()["layout"]
}
print(json.dumps(chart_data))
```

### 2. Video Rendering
**Location:** `client/src/components/Chat/Messages/Content/Parts/Video.tsx`

**Features:**
- Support for MP4, WebM, OGG, MOV, AVI, MKV, FLV, WMV, M4V, 3GP, and animated GIFs
- Custom video controls (play/pause, mute, fullscreen)
- Automatic video detection from code execution outputs
- Responsive video player with hover controls
- Poster image support

**Usage:**
Videos are automatically rendered when:
- Code execution generates video files (e.g., `.mp4`, `.webm`)
- Attachments contain video file types
- Video filepaths are included in tool call outputs

**Example Python code that generates videos:**
```python
from moviepy.editor import VideoFileClip, TextClip
# ... video generation code ...
# Video file is automatically detected and rendered
```

### 3. Enhanced Attachment System
**Location:** `client/src/components/Chat/Messages/Content/Parts/Attachment.tsx`

**Updates:**
- Video file detection and rendering
- Improved attachment grouping (videos, images, files)
- Better visual organization of rich media outputs

### 4. LogContent Enhancement
**Location:** `client/src/components/Chat/Messages/Content/Parts/LogContent.tsx`

**Updates:**
- Chart data detection from code execution outputs
- Video attachment rendering
- Improved output parsing for rich content

## 📦 Dependencies Added

Added to `client/package.json`:
- `plotly.js-dist-min`: ^2.27.0 - For Plotly chart rendering
- `chart.js`: ^4.4.0 - For Chart.js chart rendering

## 🔄 How It Works

### Flow:
1. **Code Execution** → User runs Python/R script
2. **Output Detection** → Backend detects chart/video outputs
3. **Data Processing** → Chart data or video files are attached
4. **Frontend Rendering** → Chart/Video components render the content
5. **User Interaction** → Users can interact with charts (zoom, pan) and videos (play, pause)

### Chart Detection:
- Automatically scans code execution output for JSON chart data
- Supports multiple formats (Plotly, Chart.js, inline JSON)
- Falls back to image rendering if chart data is invalid

### Video Detection:
- Detects video file extensions in attachments
- Renders videos inline with custom controls
- Supports all common video formats

## 🚀 Next Steps (Backend Integration)

To fully enable these features, backend updates are needed:

### 1. Chart Output Detection (Backend)
**File:** `api/server/services/Files/Code/process.js`

Add logic to detect chart outputs from Python/R scripts:
- Detect Plotly figure exports
- Detect matplotlib/seaborn chart saves
- Convert charts to JSON format for frontend
- Include chart metadata in tool call responses

### 2. Video Output Detection (Backend)
**File:** `api/server/services/Files/Code/process.js`

Add logic to:
- Detect video file generation
- Process video metadata (duration, dimensions)
- Include video files in attachments
- Support video streaming for large files

### 3. Enhanced Tool Call Response
**File:** `api/server/controllers/tools.js`

Update tool call responses to include:
- Chart data in structured format
- Video file metadata
- Rich content type indicators

## 📝 Usage Examples

### Generating a Plotly Chart:
```python
import plotly.graph_objects as go
import json

# Create chart
fig = go.Figure(data=go.Scatter(x=[1,2,3], y=[4,5,6]))
fig.update_layout(title="My Chart")

# Output in format that frontend can detect
chart_json = {
    "type": "plotly",
    "data": fig.to_dict()["data"],
    "layout": fig.to_dict()["layout"]
}
print(json.dumps(chart_json))
```

### Generating a Video:
```python
from moviepy.editor import VideoFileClip, TextClip

# Create video
clip = TextClip("Hello World", duration=2)
clip.write_videofile("output.mp4")
# Video file is automatically detected and rendered
```

## 🎨 UI Features

### Charts:
- Interactive Plotly charts with zoom, pan, hover
- Responsive Chart.js visualizations
- Dark mode support
- Loading states

### Videos:
- Custom video controls
- Fullscreen support
- Mute/unmute toggle
- Play/pause controls
- Responsive design

## 🔧 Configuration

No additional configuration needed. Charts and videos are automatically detected and rendered when:
- Code execution outputs contain chart data
- Attachments include video files
- Tool calls return rich content

## 📚 Related Files

- `client/src/components/Chat/Messages/Content/Parts/Chart.tsx` - Chart component
- `client/src/components/Chat/Messages/Content/Parts/Video.tsx` - Video component
- `client/src/components/Chat/Messages/Content/Parts/LogContent.tsx` - Output rendering
- `client/src/components/Chat/Messages/Content/Parts/Attachment.tsx` - Attachment handling
- `client/src/components/Chat/Messages/Content/Parts/ExecuteCode.tsx` - Code execution UI

## 🐛 Known Limitations

1. Chart libraries are loaded dynamically (may cause slight delay on first render)
2. Large video files may take time to load
3. Chart data must be in specific JSON format (can be extended)
4. Backend chart detection not yet implemented (manual format required)

## 🎯 Future Enhancements

1. **Backend Chart Detection**: Automatically detect and convert matplotlib/plotly outputs
2. **More Chart Types**: Add support for D3.js, Recharts, etc.
3. **Chart Export**: Allow users to export charts as images
4. **Video Streaming**: Support streaming for large video files
5. **Interactive Graphs**: Support for interactive network graphs, flowcharts
6. **3D Visualizations**: Enhanced 3D chart support
7. **Real-time Updates**: Progressive chart rendering as data streams in






