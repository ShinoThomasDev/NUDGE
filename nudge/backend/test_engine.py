# test_engine.py — run to verify scores
from database import SessionLocal, engine, Base
from models import *
from impulsivity_engine import compute_score

Base.metadata.create_all(bind=engine)
db = SessionLocal()

result = compute_score('user_shinothomas_demo', 'HDFCBANK', db)
print(f'Score: {result["score"]} ({result["level"]})')
for name, sig in result['signals'].items():
    print(f'  {name}: {sig["score"]} pts — {sig["label"]}')
db.close()
