# Base image: Miniconda with CUDA
FROM nvidia/cuda:11.7.1-cudnn8-runtime-ubuntu20.04

# Environment settings
ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/opt/conda/bin:$PATH"
ENV PYOPENGL_PLATFORM=egl

# System dependencies (combined RUN to reduce layers)
RUN apt-get update && apt-get install -y \
    build-essential wget curl git vim \
    libncurses5-dev libreadline-dev libssl-dev \
    libffi-dev liblzma-dev zlib1g-dev \
    python3 python3-pip python3-dev python3-venv \
    libgl1-mesa-dev libegl1-mesa-dev libgles2-mesa-dev \
    libglu1-mesa-dev libosmesa6-dev freeglut3-dev \
    xvfb mesa-utils bash && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Miniconda
RUN wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh && \
    bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/conda && \
    rm Miniconda3-latest-Linux-x86_64.sh

# Initialize conda for bash
RUN /opt/conda/bin/conda init bash

# Create conda environment and install dependencies in one step
RUN /opt/conda/bin/conda create --name talkshow python=3.7 -y && \
    /opt/conda/bin/conda run -n talkshow pip install \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu117 && \
    /opt/conda/bin/conda run -n talkshow pip install \
    torchvideo opencv-python-headless pyrender && \
    /opt/conda/bin/conda run -n talkshow pip install -r /workspace/TalkSHOW/requirements.txt

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt /workspace/TalkSHOW/requirements.txt

# Copy the rest of the repository (after environment setup)
COPY . /workspace/TalkSHOW

# Set the working directory
WORKDIR /workspace/TalkSHOW

# Expose ports (adjust if needed)
EXPOSE 8088

# Entry point to use Xvfb for headless rendering
ENTRYPOINT ["xvfb-run", "--server-args=-screen 0 800x600x24", "conda", "run", "-n", "talkshow"]

# Default command
CMD ["python", "scripts/demo.py", "--config_file", "./config/LS3DCG.json", "--infer", "--audio_file", "./demo_audio/Recording.wav", "--body_model_name", "s2g_LS3DCG", "--body_model_path", "experiments/2022-10-19-smplx_S2G-LS3DCG/ckpt-99.pth", "--id", "0"]
