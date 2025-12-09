from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import cv2
import numpy as np
import os
import requests
from typing import List
import json

app = FastAPI()

# Add CORS middleware to allow requests from the frontend (localhost:5173 or similar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Face Matching Service (dlib) is running"}

def load_image_from_url(url: str):
    try:
        resp = requests.get(url, stream=True)
        if resp.status_code == 200:
            arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            return img
    except Exception as e:
        print(f"Error loading {url}: {e}")
    return None

@app.post("/detect-faces/")
async def detect_faces(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    face_locations = face_recognition.face_locations(rgb_img)
    
    return {
        "face_count": len(face_locations),
        "locations": face_locations
    }

import concurrent.futures

# ... (Previous code remains the same up to load_image_from_url)

def process_single_candidate(candidate, target_encoding):
    url = candidate.get("url")
    photo_id = candidate.get("id")
    
    if not url:
        return None
        
    # Download candidate image
    candidate_img = load_image_from_url(url)
    if candidate_img is None:
        return None
        
    try:
        rgb_candidate = cv2.cvtColor(candidate_img, cv2.COLOR_BGR2RGB)
        candidate_encodings = face_recognition.face_encodings(rgb_candidate)
        
        if not candidate_encodings:
            return None
            
        # Check if any face in the candidate image matches the target
        face_distances = face_recognition.face_distance(candidate_encodings, target_encoding)
        
        # Find the best match (smallest distance)
        best_match_index = np.argmin(face_distances)
        best_distance = face_distances[best_match_index]
        
        if best_distance < 0.5: # Strict threshold
            candidate["distance"] = float(best_distance)
            return candidate
            
    except Exception as e:
        print(f"Error matching candidate {photo_id}: {e}")
        
    return None

@app.post("/match-face/")
async def match_face(
    target: UploadFile = File(...),
    candidates_json: str = Form(...) 
):
    results = []
    
    # 1. Process Target Image
    try:
        content = await target.read()
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        target_encodings = face_recognition.face_encodings(rgb_img)
        if not target_encodings:
            return {"error": "No face found in reference photo"}
            
        target_encoding = target_encodings[0]
    except Exception as e:
        return {"error": f"Failed to process reference photo: {str(e)}"}

    # 2. Parse Candidates
    try:
        candidates = json.loads(candidates_json)
    except Exception as e:
        return {"error": f"Invalid candidates JSON: {str(e)}"}

    # 3. Parallel Processing
    # We use threads because the bottleneck is likely Network I/O (downloading images)
    # CPU usage for face_encoding is high, but waiting for 100 images sequentially is worse.
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_candidate = {
            executor.submit(process_single_candidate, candidate, target_encoding): candidate 
            for candidate in candidates
        }
        
        for future in concurrent.futures.as_completed(future_to_candidate):
            try:
                result = future.result()
                if result:
                    results.append(result)
            except Exception as exc:
                print(f"Candidate processing generated an exception: {exc}")

    # Sort results by distance (confidence), ascending
    results.sort(key=lambda x: x.get("distance", 1.0))

    return {
        "matches": results,
        "match_count": len(results)
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
