import streamlit as st
import cv2
import numpy as np

import pandas as pd
from datetime import datetime

st.set_page_config(page_title="Face Recognition Attendance System", layout="centered")

st.title("🎓 Face Recognition Attendance System")
st.write("Upload an image to recognize a face and mark attendance.")

uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Convert the uploaded file to an image array
    file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
    img = cv2.imdecode(file_bytes, 1)
    st.image(img, channels="BGR", caption="Uploaded Image")

    # Example: fake face recognition logic (replace with your model)
    st.success("✅ Face recognized successfully!")
    now = datetime.now()
    st.info(f"Attendance marked at {now.strftime('%H:%M:%S')}")

    # Save to CSV (attendance record)
    df = pd.DataFrame({"Name": ["Person 1"], "Time": [now.strftime("%Y-%m-%d %H:%M:%S")]})
    df.to_csv("attendance.csv", mode="a", header=False, index=False)
