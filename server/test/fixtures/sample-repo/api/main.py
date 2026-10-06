from fastapi import FastAPI, APIRouter

app = FastAPI()
router = APIRouter(prefix="/items")

@router.get("/")
def list_items():
    return []

@router.post("/{item_id}")
def create_item(item_id: int):
    return {}

@app.get("/ping")
def ping():
    return "pong"
