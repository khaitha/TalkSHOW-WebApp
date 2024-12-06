# TalkSHOW-WebApp
 This is a Front-End and Back-End implementation for the TalkSHOW GitHub to allow a user interface for live interaction.

Steps to sucessfully use this code:
- Since this repository had issues running on the Windows terminals. I ran this on Ubuntu 22.04.05 LTS. You can install this on Windows APP.
- After installing the Ubuntu. Clone this GitHub repository.
- Then follow the steps below
- 1. cd TalkSHOW
  2. conda create --name talkshow python=3.7
  3. conda activate talkshow
  4. pip install -r requirements.txt
  5. conda install pytorch==1.10.1 torchvision==0.11.2 torchaudio==0.10.1 cudatoolkit=11.3 -c pytorch -c conda-forge
  6. Download the pretrained weights : https://drive.google.com/file/d/1bC0ZTza8HOhLB46WOJ05sBywFvcotDZG/view
  7. The pretrained weights should be located in TalkSHOW/. (TalkSHOW/experiments). Make sure its not in this format: TalkSHOW/experiments/experiments
  8. Download the mesh data : https://drive.google.com/file/d/1Ly_hQNLQcZ89KG0Nj4jYZwccQiimSUVn/view.
  9. The mesh file should be located in : TalkSHOW/visualise/smplx/
- From this repository, move the server.py into TalkSHOW/file-here
- Now run the server.py via the Ubuntu Terminal: python server.py
- And then on your local IDE run the web-app and the code should be functioning.
- 
https://github.com/user-attachments/assets/33e4f3bb-7a0e-42db-ae38-82d281739704
