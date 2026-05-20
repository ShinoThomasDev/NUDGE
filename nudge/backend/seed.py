from database import SessionLocal, engine, Base
from models import User, Holding
from datetime import datetime, timedelta

# Create all tables if they don't exist yet
Base.metadata.create_all(bind=engine)

DEMO_HOLDINGS = [
    # (ticker, name, qty, avg_buy_price, hold_days)
    ('ZOMATO',    'Zomato',              50,  182.0,  45),
    ('ADANIENT',  'Adani Enterprises',   10, 2840.0,  12),
    ('INFY',      'Infosys',             20, 1530.0,  90),
    ('HDFCBANK',  'HDFC Bank',           15, 1620.0, 200),
    ('TATAMOTORS','Tata Motors',         30,  920.0,   7),
]

def seed():
    db = SessionLocal()
    try:
        # Idempotent: skip if already seeded
        if db.query(User).filter(User.id == 'user_shinothomas_demo').first():
            print('Already seeded — skipping.')
            return

        user = User(id='user_shinothomas_demo', name='Shinothomas')
        db.add(user)

        for ticker, name, qty, price, hold_days in DEMO_HOLDINGS:
            holding = Holding(
                user_id       = 'user_shinothomas_demo',
                ticker        = ticker,
                stock_name    = name,
                quantity      = qty,
                avg_buy_price = price,
                buy_date      = datetime.utcnow() - timedelta(days=hold_days),
            )
            db.add(holding)

        db.commit()
        print('Seeded user_shinothomas_demo with 5 holdings.')
    finally:
        db.close()

if __name__ == '__main__':
    seed()
