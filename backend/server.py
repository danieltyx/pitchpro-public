from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from livekit import api

from static_data import livekit_api_key, livekit_secret_key

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/token")
def get_token():
    token = api.AccessToken(api_key=livekit_api_key, api_secret=livekit_secret_key) \
        .with_identity("pitchpro_front") \
        .with_name("PitchPro-Web") \
        .with_grants(api.VideoGrants(
        room_join=True,
        room="deck",
    )).to_jwt()

    return {
        "token": token
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=6768)
