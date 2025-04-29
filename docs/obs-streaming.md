# OBS Streaming Guide

This guide provides detailed instructions for artists to set up and use OBS Studio for streaming on the Haus platform. Open Broadcaster Software (OBS) is a free, open-source streaming solution that offers professional-quality broadcasting capabilities.

## Why Use OBS?

While Haus offers a built-in browser-based streaming solution, OBS provides several advantages:

- **Advanced Scene Composition**: Create complex layouts with multiple sources
- **Higher Quality**: Access to advanced encoding settings for better quality
- **Multiple Inputs**: Combine cameras, screen captures, and other media
- **Effects and Filters**: Apply visual effects, color correction, and audio processing
- **Greater Control**: Fine-tune every aspect of your stream

## System Requirements

For optimal streaming performance, we recommend:

- **CPU**: Quad-core (4 cores), 2.8GHz or higher
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: DirectX 10 compatible
- **OS**: Windows 10, macOS 10.13+, or Linux
- **Internet**: Upload speed of at least 5Mbps (check at [speedtest.net](https://speedtest.net))
- **Webcam**: 1080p capable webcam (for visual artists)
- **Microphone**: Quality microphone for clear audio

## Installation

1. **Download OBS Studio**:
   - Visit [obsproject.com](https://obsproject.com)
   - Download the appropriate version for your operating system
   - Run the installer and follow the prompts

2. **Run Auto-Configuration Wizard**:
   - When you first launch OBS, select "Yes" to run the auto-configuration wizard
   - Choose "Optimize for streaming"
   - Select 1920x1080 as your base resolution
   - Choose 30 or 60 FPS based on your computer's capabilities
   - Let the wizard test your settings

## Basic Setup

### Configuring Stream Settings

1. **Open Settings**:
   - Click on "Settings" in the bottom right corner

2. **Stream Settings**:
   - Select "Stream" from the left sidebar
   - For "Service", select "Custom..."
   - For "Server", enter: `rtmp://streaming.haus.art/live`
   - For "Stream Key", enter your unique stream key from the Haus platform
     (You can find this in your event dashboard after creating an event)

3. **Output Settings**:
   - Select "Output" from the left sidebar
   - Set "Output Mode" to "Advanced" for more control
   - Under the "Streaming" tab:
     - Encoder: Choose "x264" (CPU) or "NVENC" (NVIDIA GPU) or "AMF" (AMD GPU)
     - Rate Control: CBR
     - Bitrate: 4000-6000 Kbps (depending on your upload speed)
     - Keyframe Interval: 2
     - CPU Usage Preset: "veryfast" (adjust based on your CPU power)
     - Profile: high
     - Tune: zerolatency

4. **Video Settings**:
   - Select "Video" from the left sidebar
   - Base Resolution: 1920x1080 (or your screen resolution)
   - Output Resolution: 1920x1080 (or 1280x720 for lower-end systems)
   - Downscale Filter: Lanczos
   - FPS: 30 or 60

5. **Audio Settings**:
   - Select "Audio" from the left sidebar
   - Sample Rate: 48kHz
   - Channels: Stereo
   - Global Audio Devices:
     - Desktop Audio: Default
     - Mic/Auxiliary Audio: Your microphone

6. **Save Settings**:
   - Click "Apply" then "OK"

## Setting Up Scenes and Sources

### Creating a Basic Scene

1. **Add a Scene**:
   - In the Scenes box (bottom left), click the "+" button
   - Name your scene (e.g., "Main Scene")

2. **Add Video Source**:
   - Select your scene, then in the Sources box, click the "+" button
   - For webcam: Select "Video Capture Device"
   - For screen capture: Select "Display Capture" or "Window Capture"
   - Name your source and click "OK"
   - Configure the source in the properties window that appears

3. **Add Audio Sources**:
   - In the Sources box, click the "+" button
   - Select "Audio Input Capture" for microphones
   - Select "Audio Output Capture" for computer sounds
   - Configure as needed

4. **Arrange Sources**:
   - Click and drag sources in the preview window to position them
   - Resize by dragging the red corners
   - Reorder sources in the Sources list to change layering

### Creating Multiple Scenes

For more complex streams, create multiple scenes:

1. **Create Additional Scenes**:
   - "Starting Soon" scene with text and background
   - "Main Performance" scene with your primary content
   - "Break" scene for intermissions
   - "Ending" scene for closing the stream

2. **Switch Between Scenes**:
   - Click on the scene name in the Scenes box
   - For smooth transitions, use Studio Mode (bottom right)

## Advanced Features

### Adding Text and Graphics

1. **Text Source**:
   - In Sources, click "+" and select "Text (FreeType 2)"
   - Enter your text and format as desired

2. **Images and Logos**:
   - In Sources, click "+" and select "Image"
   - Browse to select your image file

3. **Browser Source** (for dynamic content):
   - In Sources, click "+" and select "Browser"
   - Enter URL or local file path
   - Set dimensions and FPS

### Using Filters

Enhance your sources with filters:

1. **Right-click** on any source and select "Filters"
2. **Click the "+" button** under Effect Filters
3. **Choose from options** like:
   - Color Correction
   - Image Mask/Blend
   - Chroma Key (for green screens)
   - Noise Suppression (for audio)

### Setting Up Alerts

For a more interactive stream, set up alerts for tips:

1. **Create a Browser Source** for alerts
2. **Use the Haus API** to trigger alerts
   (Documentation available in your artist dashboard)

## Streaming Workflow

### Pre-Stream Checklist

1. **Test Stream**:
   - Conduct a private test stream before your event
   - Record a short segment locally to check quality

2. **Prepare Your Space**:
   - Ensure good lighting
   - Minimize background noise
   - Arrange your workspace for the performance

3. **Equipment Check**:
   - Test all cameras and microphones
   - Ensure stable internet connection
   - Close unnecessary applications

### Starting Your Stream

1. **Open OBS** and confirm your settings
2. **Start your event** on the Haus platform
3. **Click "Start Streaming"** in OBS
4. **Confirm** your stream is live on the Haus platform

### During the Stream

1. **Monitor your stream** on a separate device if possible
2. **Keep an eye on the audio levels** in OBS
3. **Interact with viewers** through the Haus chat
4. **Switch scenes** as needed for different parts of your performance

### Ending Your Stream

1. **Conclude your performance**
2. **Switch to an "Ending" scene** if you have one
3. **Click "Stop Streaming"** in OBS
4. **Finalize your event** on the Haus platform

## Troubleshooting

### Common Issues and Solutions

1. **Dropped Frames**:
   - Reduce output resolution or bitrate
   - Close other applications using internet bandwidth
   - Connect to ethernet instead of Wi-Fi if possible

2. **CPU Overload**:
   - Lower the CPU Usage Preset (e.g., from "medium" to "veryfast")
   - Reduce FPS from 60 to 30
   - Simplify your scenes (fewer sources)

3. **Audio Issues**:
   - Check correct audio device is selected
   - Add Noise Suppression filter to reduce background noise
   - Use headphones to prevent echo

4. **Stream Not Connecting**:
   - Verify stream key is entered correctly
   - Check server URL is correct
   - Ensure firewall is not blocking OBS

### Getting Help

If you encounter issues not covered here:

1. **Haus Support**: Contact support@haus.art
2. **OBS Forums**: Visit [obsproject.com/forum](https://obsproject.com/forum)
3. **Community Discord**: Join our artist community for peer support

## Best Practices

### Optimizing Performance

1. **Use Game Mode** on Windows 10/11
2. **Close unnecessary applications**
3. **Update graphics drivers** regularly
4. **Monitor system performance** during streams

### Creating Engaging Content

1. **Plan your performance** with a clear structure
2. **Interact with viewers** regularly
3. **Use scene transitions** to maintain visual interest
4. **Consider your framing and composition**

### Technical Quality

1. **Ensure good lighting** (3-point lighting recommended)
2. **Use a quality microphone** with proper positioning
3. **Check your background** for distractions or privacy concerns
4. **Test all equipment** before each stream

## Conclusion

OBS Studio provides powerful tools for creating professional-quality streams on the Haus platform. While there is a learning curve, the flexibility and control it offers can significantly enhance your performances and help you create more engaging RTAs.

Remember that the quality of your stream directly impacts the perceived value of your RTAs. Investing time in optimizing your OBS setup can lead to higher engagement, more tips, and greater success on the platform.

For additional support or questions about streaming on Haus, please contact our artist support team at artists@haus.art.
