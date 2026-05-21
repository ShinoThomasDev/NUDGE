from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = 'users'
    id         = Column(String, primary_key=True)   # e.g. 'user_shinothomas_demo'
    name       = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Holding(Base):
    __tablename__ = 'holdings'
    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(String, ForeignKey('users.id'), nullable=False)
    ticker        = Column(String, nullable=False)   # e.g. 'ZOMATO'
    stock_name    = Column(String, nullable=False)   # e.g. 'Zomato'
    quantity      = Column(Integer, nullable=False)
    avg_buy_price = Column(Float, nullable=False)
    buy_date      = Column(DateTime, nullable=False) # used in Signal 4

class SellAttempt(Base):
    __tablename__ = 'sell_attempts'
    id           = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(String, nullable=False)
    ticker       = Column(String, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    nudge_fired  = Column(Boolean, default=False)

class Nudge(Base):
    __tablename__ = 'nudges'
    id           = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(String, nullable=False)
    ticker       = Column(String, nullable=False)
    score        = Column(Integer, nullable=False)   # 0-100
    level        = Column(String, nullable=False)    # low/medium/high
    message      = Column(Text, nullable=False)      # LLM-generated nudge
    signals_json = Column(Text, nullable=False)      # JSON blob of signal breakdown
    heeded       = Column(Boolean, nullable=True)    # NULL until user responds
    created_at   = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

class Trade(Base):
    __tablename__ = 'trades'
    id           = Column(Integer, primary_key=True, autoincrement=True)
    user_id      = Column(String, nullable=False)
    ticker       = Column(String, nullable=False)
    action       = Column(String, default='sell')    # always 'sell' for now
    quantity     = Column(Integer, nullable=False)
    price        = Column(Float, nullable=False)     # price at time of trade
    nudge_id     = Column(Integer, ForeignKey('nudges.id'), nullable=True)
    heeded_nudge = Column(Boolean, nullable=True)    # did they hold after nudge?
    executed_at  = Column(DateTime, default=datetime.utcnow)

class JournalEntry(Base):
    __tablename__ = 'journal_entries'
    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(String, ForeignKey('users.id'), nullable=False)
    ticker     = Column(String, nullable=True)           # optional: tied to a stock
    entry_type = Column(String, default='reflection')    # pre_sell, post_sell, reflection
    content    = Column(Text, nullable=False)
    mood       = Column(String, nullable=True)           # calm, anxious, confident, uncertain
    created_at = Column(DateTime, default=datetime.utcnow)

class BehavioralProfile(Base):
    __tablename__ = 'behavioral_profiles'
    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(String, ForeignKey('users.id'), unique=True, nullable=False)
    profile_type    = Column(String, nullable=False)     # panic_seller, reactive_trader, etc.
    heed_rate       = Column(Float, default=0.0)
    avg_hold_days   = Column(Float, default=0.0)
    sell_frequency  = Column(Float, default=0.0)         # sells per week
    health_score    = Column(Integer, default=50)        # 0-100
    last_computed   = Column(DateTime, default=datetime.utcnow)
